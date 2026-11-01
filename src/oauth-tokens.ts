import type { Env } from './types';
import { allowedEmail } from './security';
import { authAudience,authScope,hashSecret,randomSecret,oauthJson,oauthError } from './oauth-utils';

type RecordToken = { email:string;client_id:string;kind:string;resource:string;scope:string;expires_at:number };
type RecordCode = RecordToken & {redirect_uri:string;challenge:string};
async function issue(env:Env,email:string,clientId:string,resource:string,scope:string):Promise<Response>{
  const access=randomSecret(),refresh=randomSecret(),now=Date.now();
  await env.DB.batch([
    env.DB.prepare('INSERT INTO oauth_tokens (token_hash,email,client_id,kind,resource,scope,expires_at) VALUES (?,?,?,?,?,?,?)')
      .bind(await hashSecret(access),email,clientId,'access',resource,scope,now+3600000),
    env.DB.prepare('INSERT INTO oauth_tokens (token_hash,email,client_id,kind,resource,scope,expires_at) VALUES (?,?,?,?,?,?,?)')
      .bind(await hashSecret(refresh),email,clientId,'refresh',resource,scope,now+2592000000)
  ]);
  return oauthJson({access_token:access,token_type:'Bearer',expires_in:3600,
    refresh_token:refresh,scope});
}
export async function exchangeToken(req:Request,env:Env):Promise<Response>{
  if(Number(req.headers.get('Content-Length')||0)>12000)return oauthError('invalid_request','Too large');
  if(!(req.headers.get('Content-Type')||'').includes('application/x-www-form-urlencoded'))
    return oauthError('invalid_request','Expected form-url-encoded');
  const form=new URLSearchParams(await req.text());
  const grant=form.get('grant_type'),id=form.get('client_id')||'';
  const resource=form.get('resource')||authAudience(env);
  if(resource!==authAudience(env))return oauthError('invalid_target','Incorrect MCP resource');
  if(!id)return oauthError('invalid_client','Missing client ID',401);
  if(grant==='authorization_code'){
    const code=form.get('code')||'',verifier=form.get('code_verifier')||'';
    const redirect=form.get('redirect_uri')||'';
    if(!code||!/^[A-Za-z0-9._~-]{43,128}$/.test(verifier)||!redirect)
      return oauthError('invalid_grant','Invalid code or PKCE verifier');
    // DELETE ... RETURNING consumes the code atomically; it cannot be replayed.
    const row=await env.DB.prepare('DELETE FROM oauth_codes WHERE code_hash=? RETURNING *')
      .bind(await hashSecret(code)).first<RecordCode>();
    if(!row||row.expires_at<Date.now()||row.client_id!==id||
       row.redirect_uri!==redirect||row.resource!==resource||
       row.challenge!==await hashSecret(verifier))
      return oauthError('invalid_grant','Expired code or PKCE mismatch');
    const owner=await env.DB.prepare('SELECT email FROM accounts WHERE email=?')
      .bind(row.email).first();
    if(!owner)return oauthError('invalid_grant','Account no longer connected');
    return issue(env,row.email,id,resource,row.scope);
  }
  if(grant==='refresh_token'){
    const refresh=form.get('refresh_token')||'';
    if(!refresh)return oauthError('invalid_grant','Missing refresh token');
    const row=await env.DB.prepare("DELETE FROM oauth_tokens WHERE token_hash=? AND kind='refresh' RETURNING *")
      .bind(await hashSecret(refresh)).first<RecordToken>();
    if(!row||row.expires_at<Date.now()||row.client_id!==id||row.resource!==resource)
      return oauthError('invalid_grant','Expired or invalid refresh token');
    const owner=await env.DB.prepare('SELECT email FROM accounts WHERE email=?')
      .bind(row.email).first();
    if(!owner)return oauthError('invalid_grant','Account disconnected');
    return issue(env,row.email,id,resource,row.scope);
  }
  return oauthError('unsupported_grant_type','Unsupported grant type');
}
export async function oauthEmail(req:Request,env:Env):Promise<string|null>{
  const m=/^Bearer\s+([A-Za-z0-9_-]+)$/i.exec(req.headers.get('Authorization')||'');
  if(!m)return null;
  const row=await env.DB.prepare("SELECT email,client_id,resource,scope,expires_at FROM oauth_tokens WHERE token_hash=? AND kind='access'")
    .bind(await hashSecret(m[1])).first<RecordToken>();
  if(!row||row.expires_at<Date.now()||row.resource!==authAudience(env)||
     !row.scope.split(/\s+/).includes(authScope)||!allowedEmail(row.email,env))return null;
  const owner=await env.DB.prepare('SELECT email FROM accounts WHERE email=?')
    .bind(row.email).first();
  return owner?row.email:null;
}
export async function cleanOAuth(env:Env):Promise<void>{
  const now=Date.now();
  await env.DB.batch([
    env.DB.prepare('DELETE FROM oauth_codes WHERE expires_at < ?').bind(now),
    env.DB.prepare('DELETE FROM oauth_tokens WHERE expires_at < ?').bind(now)
  ]);
}
