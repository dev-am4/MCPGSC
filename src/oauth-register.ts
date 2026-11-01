import type { Env } from './types';
import { authRoot, authAudience, authScope, safeRedirect, randomSecret, oauthJson, oauthError } from './oauth-utils';
export type ClientRecord = {client_id:string;redirect_uris:string};

export function authDiscovery(env:Env, resource=false):Response {
  const base=authRoot(env);
  if(resource) return oauthJson({resource:authAudience(env),authorization_servers:[base],scopes_supported:[authScope]});
  return oauthJson({
    issuer:base,authorization_endpoint:base+'/oauth/authorize',
    token_endpoint:base+'/oauth/token',registration_endpoint:base+'/oauth/register',
    response_types_supported:['code'],grant_types_supported:['authorization_code','refresh_token'],
    code_challenge_methods_supported:['S256'],scopes_supported:[authScope],
    token_endpoint_auth_methods_supported:['none'],
    authorization_response_iss_parameter_supported:true
  });
}
export const authChallenge=(env:Env) =>
  'Bearer resource_metadata="'+authRoot(env)+'/.well-known/oauth-protected-resource", scope="'+authScope+'"';

export async function findClient(env:Env,id:string,uri:string):Promise<boolean> {
  if(!safeRedirect(uri)||id.length>200) return false;
  const row=await env.DB.prepare('SELECT client_id,redirect_uris FROM oauth_clients WHERE client_id=?')
    .bind(id).first<ClientRecord>();
  if(!row)return false;
  try{const all=JSON.parse(row.redirect_uris);return Array.isArray(all)&&all.includes(uri);}
  catch{return false;}
}
export async function registerClient(req:Request,env:Env):Promise<Response>{
  if(req.method!=='POST')return oauthError('invalid_request','Use POST',405);
  if(Number(req.headers.get('Content-Length')||0)>12000)return oauthError('invalid_client_metadata','Too large');
  let input:Record<string,unknown>;
  try{input=await req.json() as Record<string,unknown>;}catch{return oauthError('invalid_client_metadata','Invalid JSON');}
  const uris=input.redirect_uris;
  if(!Array.isArray(uris)||!uris.length||uris.length>5||
     !uris.every(u=>typeof u==='string'&&safeRedirect(u)))
    return oauthError('invalid_redirect_uri','Only ChatGPT callback URIs accepted');
  if(input.token_endpoint_auth_method && input.token_endpoint_auth_method!=='none')
    return oauthError('invalid_client_metadata','Public client PKCE required');
  if(input.grant_types&&(!Array.isArray(input.grant_types)||
     !input.grant_types.every(g=>g==='authorization_code'||g==='refresh_token')))
    return oauthError('invalid_client_metadata','Invalid grant');
  const id='mcpgsc_'+randomSecret();
  await env.DB.prepare('INSERT INTO oauth_clients (client_id,redirect_uris,created_at) VALUES (?,?,?)')
    .bind(id,JSON.stringify(uris),Date.now()).run();
  return oauthJson({client_id:id,client_id_issued_at:Math.floor(Date.now()/1000),
    client_name:typeof input.client_name==='string'?input.client_name.slice(0,100):'ChatGPT MCPGSC',
    redirect_uris:uris,grant_types:['authorization_code','refresh_token'],
    response_types:['code'],token_endpoint_auth_method:'none'},201);
}
