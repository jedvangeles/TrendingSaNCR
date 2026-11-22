import {randomBytes,randomUUID,scrypt,timingSafeEqual} from 'node:crypto';
import {promisify} from 'node:util';
const derive=promisify(scrypt);
const lifetime=8*60*60*1000;
const roles=['Administrator','Analyst','Guest'];
const roster=[
  ['James Edward Angeles','angelesjamesedwarddanielle_bsit@plmun.edu.ph','Administrator','Active'],
  ['Julianna Emana','emanajulianna_bsit@plmun.edu.ph','Analyst','Active'],
  ['Jerome Ricamata','ricamatajerome_bsit@plmun.edu.ph','Analyst','Active'],
  ['Guest','guest_sample@gmail.com','Guest','Inactive']
];
async function passwordHash(password){
  if(typeof password!=='string'||password.length<6||password.length>256)throw Error('Use a password between 6 and 256 characters.');
  const salt=randomBytes(16).toString('hex');
  return salt+':'+(await derive(password,salt,64)).toString('hex');
}
const publicFields='id, name, email, role, status';
const reject=(status,msg)=>Object.assign(Error(msg),{httpStatus:status});
export async function accountStore(db){
  await db.exec('CREATE TABLE IF NOT EXISTS team_accounts (id VARCHAR(64) PRIMARY KEY, name VARCHAR(160) NOT NULL, email VARCHAR(254) NOT NULL UNIQUE, role VARCHAR(24) NOT NULL, status VARCHAR(16) NOT NULL, password_hash VARCHAR(200))');
  if(!(await db.all('SELECT id FROM team_accounts LIMIT 1')).length){
    const password=process.env.INITIAL_ADMIN_PASSWORD||randomBytes(18).toString('base64url');
    const hash=await passwordHash(password);
    await db.begin();
    try{
      for(const row of roster)await db.exec('INSERT INTO team_accounts VALUES(?,?,?,?,?,?)',[randomUUID(),...row,row[2]==='Administrator'?hash:null]);
      await db.commit();
    }catch(e){await db.rollback();throw e;}
    if(!process.env.INITIAL_ADMIN_PASSWORD)console.log('First administrator sign-in ('+roster[0][1]+'). Password: '+password+'\nSave this password privately. Change it in User Management.');
  }
  const sessions=new Map(),attempts=new Map();
  const dummy=await passwordHash(randomBytes(16).toString('hex'));
  const tokenOf=req=>/(?:^|;\s*)trends_session=([a-f0-9]{64})(?:;|$)/.exec(req.headers.cookie||'')?.[1];
  function prune(map){const now=Date.now();for(const [key,entry] of map)if(entry.until<=now)map.delete(key);}
  function cookie(req,res,token,seconds){
    res.setHeader('Set-Cookie','trends_session='+token+'; HttpOnly; Path=/; SameSite=Strict; Max-Age='+seconds+((req.secure||process.env.COOKIE_SECURE==='true')?'; Secure':''));
  }
  async function current(req){
    const token=tokenOf(req),s=sessions.get(token);
    if(!s)return null;
    if(s.until<=Date.now()){sessions.delete(token);return null;}
    return (await db.all('SELECT '+publicFields+" FROM team_accounts WHERE id=? AND status='Active'",[s.id]))[0]||null;
  }
  async function login(req,res,data){
    prune(attempts);prune(sessions);
    const ip=req.socket.remoteAddress;
    const tries=attempts.get(ip)||{count:0,until:Date.now()+600000};
    if(tries.count>=10)throw reject(429,'Too many sign-in attempts. Try again in 10 minutes.');
    tries.count++;attempts.set(ip,tries);
    const email=String(data.email||'').trim().toLowerCase(), password=data.password;
    const [user]=await db.all('SELECT * FROM team_accounts WHERE email=?',[email]);
    const [salt,hash]=(user?.password_hash||dummy).split(':');
    if(typeof password!=='string'||password.length>256||!timingSafeEqual(await derive(password,salt,64),Buffer.from(hash,'hex'))||!user?.password_hash||user.status!=='Active')throw reject(401,'Email or password is incorrect, or the account is inactive.');
    attempts.delete(ip);sessions.delete(tokenOf(req));
    const token=randomBytes(32).toString('hex');sessions.set(token,{id:user.id,until:Date.now()+lifetime});cookie(req,res,token,lifetime/1000);
    return {id:user.id,name:user.name,role:user.role};
  }
  function logout(req,res){sessions.delete(tokenOf(req));cookie(req,res,'',0);}
  async function change(id,data){
    const [old]=id?await db.all('SELECT * FROM team_accounts WHERE id=?',[id]):[];
    if(id&&!old)throw Error('The account no longer exists.');
    if(old?.role==='Administrator'&&old.status==='Active'&&!(data?.role==='Administrator'&&data?.status==='Active')){
      const active=await db.all("SELECT id FROM team_accounts WHERE role='Administrator' AND status='Active'");
      if(active.length<=1)throw Error('Keep at least one active administrator.');
    }
    if(data===null){await db.exec('DELETE FROM team_accounts WHERE id=?',[id]);}
    else{
      const name=String(data.name||'').trim(),email=String(data.email||'').trim().toLowerCase();
      if(!name||name.length>160||email.length>254||!/^\S+@[^\s@]+\.[^\s@]+$/.test(email)||!roles.includes(data.role)||!['Active','Inactive'].includes(data.status))throw Error('Check the account details.');
      if((await db.all('SELECT id FROM team_accounts WHERE email=?',[email])).some(r=>r.id!==id))throw Error('This email is already registered.');
      const hash=data.password?await passwordHash(data.password):old?.password_hash;
      if(!hash&&data.status==='Active')throw Error('Set a password to activate this account.');
      const values=[name,email,data.role,data.status,hash||null];
      if(id)await db.exec('UPDATE team_accounts SET name=?,email=?,role=?,status=?,password_hash=? WHERE id=?',[...values,id]);
      else await db.exec('INSERT INTO team_accounts VALUES(?,?,?,?,?,?)',[randomUUID(),...values]);
    }
    for(const [token,s] of sessions)if(s.id===id)sessions.delete(token);
  }
  return {login,logout,current,change,list:()=>db.all('SELECT '+publicFields+' FROM team_accounts ORDER BY name')};
}
