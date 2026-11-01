import type { Env } from './types';
import { readSession, cookie, constantEqual, allowedEmail } from './security';
import { authRoot,authAudience,authScope,hashSecret,hmac,randomSecret,escapeHtml,authPage,decodeBase64 } from './oauth-utils';
import { findClient } from './oauth-register';

type Pending = { client_id:string;redirect_uri:string;state:string;challenge:string;
  resource:string;scope:string;email:string;expires:number };
const base64=(s:string)=>{
  const bytes=new TextEncoder().encode(s);
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
};
export async function authorize(req:Request,env:Env):Promise<Response> {
  const url=new URL(req.url),p=url.searchParams;
  const id=p.get('client_id')||'', redirect=p.get('redirect_uri')||'';
  const state=p.get('state')||'',challenge=p.get('code_challenge')||'';
  const scope=p.get('scope')||authScope, resource=p.get('resource')||authAudience(env);
  if(p.get('response_type')!=='code'||p.get('code_challenge_method')!=='S256'||
     !/^[A-Za-z0-9_-]{43}$/.test(challenge)||state.length>2048||!state||
     resource!==authAudience(env)||!scope.split(/\s+/).includes(authScope)||
     !await findClient(env,id,redirect))
    return authPage('<h1>Invalid authorization request</h1><p>OAuth client, PKCE or redirect URI was rejected.</p>',400);
  let email=await readSession(req,env);
  if(email){const row=await env.DB.prepare('SELECT email FROM accounts WHERE email=?')
    .bind(email).first();if(!row)email=null;}
  if(!email) {
    const res=new Response(null,{status:302,headers:{Location:authRoot(env)+'/auth/google','Cache-Control':'no-store'}});
    // Resume only this validated same-origin OAuth request after Google login.
    res.headers.append('Set-Cookie',cookie('mcpgsc_oauth_next',url.pathname+url.search,req,600));
    return res;
  }
  const pending:Pending={client_id:id,redirect_uri:redirect,state,challenge,
    resource:authAudience(env),scope:authScope,email,expires:Date.now()+600000};
  const encoded=base64(JSON.stringify(pending)),signed=encoded+'.'+await hmac(encoded,env);
  return authPage('<h1>MCPGSC Global</h1><p>บัญชี <strong>'+escapeHtml(email)+
    '</strong> กำลังเชื่อมต่อ ChatGPT เพื่ออ่านข้อมูล Google Search Console</p>'+
    '<p>การอนุญาตนี้เป็นแบบอ่านอย่างเดียว ไม่สามารถเปลี่ยนแปลงเว็บไซต์ได้</p>'+
    '<form method="post" action="/oauth/approve"><input type="hidden" name="request" value="'+
    escapeHtml(signed)+'"><button type="submit" name="action" value="allow">อนุญาต</button>'+
    '<button type="submit" name="action" value="deny">ยกเลิก</button></form>');
}
export async function approve(req:Request,env:Env):Promise<Response> {
  if(req.headers.get('Origin')!==new URL(authRoot(env)).origin)
    return authPage('<h1>Invalid form origin</h1>',403);
  const email=await readSession(req,env);
  if(!email||!allowedEmail(email,env))return authPage('<h1>Login required</h1>',401);
  const form=await req.formData(),signed=String(form.get('request')||'');
  const parts=signed.split('.');
  if(parts.length!==2||parts[0].length>8000||
     !constantEqual(parts[1],await hmac(parts[0],env)))
    return authPage('<h1>Invalid authorization request</h1>',400);
  let data:Pending;
  try{data=JSON.parse(decodeBase64(parts[0])) as Pending;}
  catch{return authPage('<h1>Invalid authorization request</h1>',400);}
  if(data.email!==email||data.expires<Date.now()||data.resource!==authAudience(env)||
     data.scope!==authScope||!await findClient(env,data.client_id,data.redirect_uri))
    return authPage('<h1>Request expired or unauthorized</h1>',400);
  const url=new URL(data.redirect_uri);
  url.searchParams.set('state',data.state);
  url.searchParams.set('iss',authRoot(env));
  if(form.get('action')!=='allow'){
    url.searchParams.set('error','access_denied');
  } else {
    const code=randomSecret();
    await env.DB.prepare('INSERT INTO oauth_codes (code_hash,client_id,email,redirect_uri,challenge,resource,scope,expires_at) VALUES (?,?,?,?,?,?,?,?)')
      .bind(await hashSecret(code),data.client_id,email,data.redirect_uri,data.challenge,
        data.resource,data.scope,Date.now()+300000).run();
    url.searchParams.set('code',code);
  }
  return new Response(null,{status:302,headers:{Location:url.toString(),'Cache-Control':'no-store'}});
}
