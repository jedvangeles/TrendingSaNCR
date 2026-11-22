import {randomUUID} from 'node:crypto';

export async function activityStore(db,enqueue){
  await db.exec('CREATE TABLE IF NOT EXISTS processing_activity (id VARCHAR(64) PRIMARY KEY, created_at VARCHAR(32) NOT NULL, actor_id VARCHAR(64) NOT NULL, actor_name VARCHAR(160) NOT NULL, actor_role VARCHAR(24) NOT NULL, operation VARCHAR(100) NOT NULL, subject VARCHAR(255) NOT NULL, outcome VARCHAR(100) NOT NULL)');
  async function start(actor,operation,subject){
    const id=randomUUID();
    await enqueue(()=>db.exec('INSERT INTO processing_activity VALUES(?,?,?,?,?,?,?,?)',[id,new Date().toISOString(),actor.id,actor.name,actor.role,operation,String(subject).slice(0,255),'Requested']));
    return async (code,result)=>{
      const statuses={running:'Running',ready:'Ready',imported:'Imported',failed:'Failed',canceled:'Canceled',cancelled:'Canceled',unconfirmed:'Awaiting confirmation',idle:'Idle',cleared:'Cleared',starting:'Starting',submitting:'Submitting'};
      const outcome=code>=400?'Failed':statuses[result?.status]||'Completed';
      await enqueue(()=>db.exec('UPDATE processing_activity SET outcome=? WHERE id=?',[outcome,id]));
    };
  }
  function list(actor){
    const admin=actor.role==='Administrator';
    return db.all('SELECT created_at,actor_name,actor_role,operation,subject,outcome FROM processing_activity'+(admin?'':' WHERE actor_id=?')+' ORDER BY created_at DESC,id DESC',admin?[]:[actor.id]);
  }
  return {start,list};
}
