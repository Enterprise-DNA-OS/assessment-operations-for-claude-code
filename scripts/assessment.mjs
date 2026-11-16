#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import {createHash,randomUUID} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {getDb,REPO_ROOT} from './lib/db.mjs';
import {parseCsv,pick} from './lib/csv.mjs';
import {table as textTable} from './lib/format.mjs';
import {page,table,writeOut} from './lib/render.mjs';

export const reads={
 'programmes':'select code,name,owner,validation_due,risk_note from programmes order by code',
 'questions':'select code,name,topic,revision,max_score,review_due,readiness from question_status order by code',
 'review-queue':"select code,name,topic,revision,review_due,readiness from question_status where readiness<>'Ready' order by review_due,code",
 'assessments':'select code,name,programme,due_date,questions,question_gaps,missing_marks,blueprint_topics from assessment_readiness order by due_date,code',
 'blueprint':'select assessment,topic,min_marks,available_marks,missing_marks from blueprint_coverage order by assessment,topic',
 'participants':'select code,name,cohort from participants order by code',
 'results':'select code,assessment,participant,cohort,percent,score_band,moderation from result_board order by finished_at,code',
 'moderation-queue':"select code,assessment,participant,percent,score_band,moderation from result_board where moderation<>'accepted' order by finished_at,code",
 'validation-due':"select code,name,due_date,decision,risk_note from validation_status where due_date<=current_date+30 or decision<>'accepted' or risk_note<>'' order by due_date,code",
 'actions':"select a.code,a.name,p.code programme,a.owner,a.due_date,a.status from actions a join programmes p on p.id=a.programme_id order by a.due_date,a.code",
 'attention':"select code,name,owner,due_date from actions where status='open' and due_date<current_date order by due_date,code",
 'cohort-results':"select assessment,cohort,count(*) attempts,round(avg(percent),2) mean_percent,count(*) filter(where moderation<>'accepted') awaiting_review from result_board group by assessment,cohort order by assessment,cohort",
 'repeat-attempts':"select assessment,participant,count(*) attempts,min(percent) lowest_percent,max(percent) highest_percent from result_board group by assessment,participant having count(*)>1 order by assessment,participant",
 'assessment-risk':"select a.code,a.programme,a.question_gaps,a.missing_marks,(select count(*) from result_board r where r.assessment=a.code and r.moderation<>'accepted') results_to_review from assessment_readiness a order by a.code",
 'owner-workload':"select owner,count(*) open_actions,count(*) filter(where due_date<current_date) overdue from actions where status='open' group by owner order by overdue desc,owner",
 'compliance':'select rule,record,issue from compliance_findings order by rule,record',
 'import-history':'select id,filename,row_count,created_at from import_batches order by created_at',
 'audit':'select entity,record_id,operation,actor,old_row,new_row,created_at from audit_log order by created_at,id'
};
export const mutations={
 'add-programme':['code','name','owner','due'],
 'add-question':['code','name','topic','prompt','rubric','marks','author','due'],
 'revise-question':['question','prompt','rubric','due'],
 'review-question':['question','decision','evidence'],
 'add-assessment':['code','name','programme','threshold','due'],
 'add-item':['assessment','question','position'],
 'set-blueprint':['assessment','topic','marks'],
 'add-participant':['code','name','cohort'],
 'record-result':['code','assessment','participant','finished','score','maximum'],
 'moderate-result':['attempt','decision','validity','sufficiency','authenticity','currency','evidence'],
 'validate-programme':['programme','decision','credentials','evidence','due'],
 'flag-risk':['programme','note'],
 'add-action':['code','name','programme','owner','due'],
 'close-action':['action','note']
};
export const commands=[...Object.keys(reads),...Object.keys(mutations),'import','export','draft-paper','draft-moderation','weekly-review','help'];
export const collections=['programmes','questions','question_reviews','assessments','assessment_items','blueprints','participants','attempts','moderations','validations','actions','import_batches','audit_log'];
const required=(o,k)=>{const v=o[k];if(v===undefined||String(v).trim()==='')throw Error(`Required --${k}`);return String(v).trim();};
const numeric=(v,name,min=0,max=1e8)=>{if(!/^\d+(\.\d{1,2})?$/.test(String(v))||!Number.isFinite(Number(v))||Number(v)<min||Number(v)>max)throw Error(`Invalid ${name}`);return Number(v);};
const date=v=>{if(!/^\d{4}-\d{2}-\d{2}$/.test(v)||!Number.isFinite(Date.parse(v))||new Date(v).toISOString().slice(0,10)!==v)throw Error('Expected a real YYYY-MM-DD date');return v;};
const timestamp=v=>{if(!/^\d{4}-\d\d-\d\dT\d\d:\d\d(?::\d\d(?:\.\d+)?)?(Z|[+-]\d\d:\d\d)$/.test(v)||!Number.isFinite(Date.parse(v)))throw Error('Timestamp requires an explicit timezone offset');date(v.slice(0,10));return new Date(v).toISOString();};
const bool=v=>{if(!['true','false'].includes(v))throw Error('Evidence checks require true or false');return v==='true';};
const allowed=(v,vs)=>{if(!vs.includes(v))throw Error(`Choose ${vs.join(', ')}`);return v;};
export async function resolve(db,entity,value){
 if(!['programmes','questions','assessments','participants','attempts','actions'].includes(entity))throw Error('Unknown record type');
 const rows=await db.query(`select * from ${entity} where lower(code)=lower($1) or id::text=$1`,[value]);
 if(rows.length===1)return rows[0];
 const matches=await db.query(`select * from ${entity} where starts_with(id::text,$1) or position(lower($1) in lower(code))>0 ${entity==='attempts'?'':'or position(lower($1) in lower(name))>0'} order by code`,[value]);
 if(matches.length!==1)throw Error(`${matches.length?'Ambiguous':'No match'} ${entity}: ${value}\n${matches.map(r=>`${r.id} ${r.code} ${r.name||''}`).join('\n')}`);
 return matches[0];
}
async function insert(db,entity,fields){const keys=Object.keys(fields);return (await db.query(`insert into ${entity}(${keys.join(',')}) values(${keys.map((_,i)=>'$'+(i+1)).join(',')}) returning *`,Object.values(fields)))[0];}
async function transact(db,actor,fn,dry=false){await db.exec('BEGIN');try{await db.query("select set_config('app.actor',$1,true)",[actor]);const out=await fn();await db.exec(dry?'ROLLBACK':'COMMIT');return out;}catch(e){await db.exec('ROLLBACK');throw e;}}
export async function run(db,command,o={},args=[]){
 if(command==='help')return commands.map(c=>({command:c,arguments:mutations[c]?.map(x=>'--'+x+'=...').join(' ')||''}));
 if(reads[command])return db.query(reads[command]);
 if(command==='export'){
  const dest=path.resolve(required(o,'out'));if(fs.existsSync(dest))throw Error('Export destination must be new');
  const all={};await db.exec('BEGIN READ ONLY');try{for(const c of collections)all[c]=await db.query(`select * from ${c} order by id`);}finally{await db.exec('ROLLBACK');}
  fs.mkdirSync(dest,{recursive:true,mode:0o700});const counts={};for(const [c,rows] of Object.entries(all)){fs.writeFileSync(path.join(dest,c+'.json'),JSON.stringify(rows,null,2)+'\n',{mode:0o600});counts[c]=rows.length;}
  fs.writeFileSync(path.join(dest,'manifest.json'),JSON.stringify({version:1,exported_at:new Date().toISOString(),counts},null,2),{mode:0o600});return [{directory:dest,collections:collections.length}];
 }
 if(['draft-paper','draft-moderation','weekly-review'].includes(command)){
  const sections=[];let label=command;
  await db.exec('BEGIN READ ONLY');try{
   if(command==='weekly-review'){for(const c of ['assessments','moderation-queue','validation-due','attention'])sections.push({title:c,html:table(await db.query(reads[c]))});}
   else{
    const a=await resolve(db,'assessments',required(o,'assessment'));label+='-'+a.code;
    const ready=await db.query('select * from assessment_readiness where id=$1',[a.id]);sections.push({title:'Readiness',note:'Draft for staff review. Not an issued examination or certificate.',html:table(ready)});
    if(command==='draft-paper')sections.push({title:'Candidate questions',html:table(await db.query('select i.position,q.prompt,q.max_score from assessment_items i join questions q on q.id=i.question_id where i.assessment_id=$1 order by i.position',[a.id]))});
    else sections.push({title:'Results requiring a decision',html:table(await db.query('select code,participant,percent,score_band,moderation from result_board where assessment=$1 order by code',[a.code]))});
   }
  }finally{await db.exec('ROLLBACK');}
  const file=writeOut('drafts',label.toLowerCase().replace(/[^a-z0-9-]/g,'-')+'-'+randomUUID(),page({title:label,subtitle:'Draft. Fictional data when using the demo.',sections}));return [{file}];
 }
 if(command==='import')return importResults(db,o,args);
 if(!mutations[command])throw Error(`Unknown command ${command}`);
 for(const k of mutations[command])required(o,k);
 const actor=required(o,'actor');
 return transact(db,actor,async()=>{
  let row;
  if(command==='add-programme')row=await insert(db,'programmes',{code:o.code,name:o.name,owner:o.owner,validation_due:date(o.due)});
  if(command==='add-question')row=await insert(db,'questions',{code:o.code,name:o.name,topic:o.topic,prompt:o.prompt,rubric:o.rubric,max_score:numeric(o.marks,'marks',0.01),author:o.author,review_due:date(o.due)});
  if(command==='revise-question'){
   const q=await resolve(db,'questions',o.question);row=(await db.query('update questions set prompt=$1,rubric=$2,review_due=$3,revision=revision+1 where id=$4 returning *',[o.prompt,o.rubric,date(o.due),q.id]))[0];
  }
  if(command==='review-question'){
   const q=await resolve(db,'questions',o.question);row=await insert(db,'question_reviews',{question_id:q.id,revision:q.revision,reviewer:actor,decision:allowed(o.decision,['approved','revise']),evidence:o.evidence});
  }
  if(command==='add-assessment')row=await insert(db,'assessments',{code:o.code,name:o.name,programme_id:(await resolve(db,'programmes',o.programme)).id,pass_percent:numeric(o.threshold,'threshold',0,100),due_date:date(o.due)});
  if(command==='add-item'){
   const a=await resolve(db,'assessments',o.assessment),q=await resolve(db,'questions',o.question);const pos=numeric(o.position,'position',1);if(!Number.isInteger(pos))throw Error('Position must be an integer');
   row=(await db.query('insert into assessment_items(assessment_id,question_id,position,question_revision) values($1,$2,$3,$4) on conflict(assessment_id,question_id) do update set position=excluded.position,question_revision=excluded.question_revision returning *',[a.id,q.id,pos,q.revision]))[0];
  }
  if(command==='set-blueprint')row=(await db.query('insert into blueprints(assessment_id,topic,min_marks) values($1,$2,$3) on conflict(assessment_id,topic) do update set min_marks=excluded.min_marks returning *',[(await resolve(db,'assessments',o.assessment)).id,o.topic,numeric(o.marks,'marks',0.01)]))[0];
  if(command==='add-participant')row=await insert(db,'participants',{code:o.code,name:o.name,cohort:o.cohort});
  if(command==='record-result'){
   const a=await resolve(db,'assessments',o.assessment);row=await insert(db,'attempts',{code:o.code,assessment_id:a.id,participant_id:(await resolve(db,'participants',o.participant)).id,finished_at:timestamp(o.finished),score:numeric(o.score,'score'),max_score:numeric(o.maximum,'maximum',0.01),pass_percent:a.pass_percent});
  }
  if(command==='moderate-result')row=await insert(db,'moderations',{attempt_id:(await resolve(db,'attempts',o.attempt)).id,reviewer:actor,decision:allowed(o.decision,['accepted','follow-up']),validity:bool(o.validity),sufficiency:bool(o.sufficiency),authenticity:bool(o.authenticity),currency:bool(o.currency),evidence:o.evidence});
  if(command==='validate-programme'){
   const p=await resolve(db,'programmes',o.programme);if(actor.toLowerCase().trim()===p.owner.toLowerCase().trim())throw Error('Independent validation lead required');
   const due=date(o.due);const today=new Date().toISOString().slice(0,10);const maximum=new Date();maximum.setUTCFullYear(maximum.getUTCFullYear()+5);
   if(due<today||due>maximum.toISOString().slice(0,10))throw Error('Next validation must be within five years and not in the past');
   row=await insert(db,'validations',{programme_id:p.id,reviewer:actor,credentials:o.credentials,evidence:o.evidence,decision:allowed(o.decision,['accepted','follow-up']),next_due:due});
  }
  if(command==='flag-risk')row=(await db.query('update programmes set risk_note=$1 where id=$2 returning *',[o.note,(await resolve(db,'programmes',o.programme)).id]))[0];
  if(command==='add-action')row=await insert(db,'actions',{code:o.code,name:o.name,programme_id:(await resolve(db,'programmes',o.programme)).id,owner:o.owner,due_date:date(o.due)});
  if(command==='close-action')row=(await db.query("update actions set status='closed',closure_note=$1 where id=$2 returning *",[o.note,(await resolve(db,'actions',o.action)).id]))[0];
  return [row];
 });
}
const defaultMapping={code:'Result ID',assessment:'Assessment ID',participant:'Participant ID',finished:'Date/Time finished',score:'Total score',maximum:'Maximum score',outcome:'Outcome label'};
async function importResults(db,o,args){
 if(args[0]!=='questionmark')throw Error('Use import questionmark <results.csv>');
 if(!args[1])throw Error('CSV path required');const bytes=fs.readFileSync(args[1]);const text=new TextDecoder('utf-8',{fatal:true}).decode(bytes);const rows=parseCsv(text);if(!rows.length)throw Error('CSV has no data rows');
 const mapping=o.mapping?JSON.parse(fs.readFileSync(o.mapping,'utf8')):defaultMapping;
 for(const k of ['code','assessment','participant','finished','score','maximum'])if(!mapping[k]||!Object.keys(rows[0]).some(h=>h.toLowerCase()===mapping[k].toLowerCase()))throw Error(`Missing export column for ${k}; provide --mapping`);
 const fingerprint=createHash('sha256').update(bytes).update(JSON.stringify(mapping)).digest('hex');
 const previous=await db.query('select id,row_count from import_batches where fingerprint=$1',[fingerprint]);if(previous.length)return [{status:'skipped',rows:previous[0].row_count}];
 const actor=required(o,'actor');
 return transact(db,actor,async()=>{
  const batch=await insert(db,'import_batches',{fingerprint,filename:path.basename(args[1]),original_base64:bytes.toString('base64'),mapping:JSON.stringify(mapping),row_count:rows.length});
  for(const [i,source] of rows.entries()){
   const get=k=>pick(source,mapping[k]||'');
   try{
    const a=await resolve(db,'assessments',required({assessment:get('assessment')},'assessment'));
    const p=await resolve(db,'participants',required({participant:get('participant')},'participant'));
    await insert(db,'attempts',{code:required({code:get('code')},'code'),assessment_id:a.id,participant_id:p.id,finished_at:timestamp(get('finished')),score:numeric(get('score'),'score'),max_score:numeric(get('maximum'),'maximum',0.01),pass_percent:a.pass_percent,source_outcome:get('outcome'),batch_id:batch.id,original_row:JSON.stringify(source)});
   }catch(e){throw Error(`CSV row ${i+2}: ${e.message}`);}
  }
  return [{status:o['dry-run']?'dry-run':'imported',rows:rows.length}];
 },Boolean(o['dry-run']));
}
export function parseArgs(argv){const opts={},args=[];for(let i=0;i<argv.length;i++){const a=argv[i];if(a.startsWith('--')){const eq=a.indexOf('=');if(eq>0)opts[a.slice(2,eq)]=a.slice(eq+1);else if(['json','dry-run'].includes(a.slice(2)))opts[a.slice(2)]=true;else {if(!argv[i+1]||argv[i+1].startsWith('--'))throw Error(`Value needed for ${a}`);opts[a.slice(2)]=argv[++i];}}else args.push(a);}return {opts,args};}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){
 let db;try{const {opts,args}=parseArgs(process.argv.slice(2));const command=args.shift()||'help';db=await getDb();const rows=await run(db,command,opts,args);if(opts.json)console.log(JSON.stringify(rows,null,2));else console.log(textTable(rows,Object.keys(rows[0]||{}).map(key=>({key,label:key,width:key==='issue'?75:40,format:v=>v&&typeof v==='object'?JSON.stringify(v):v}))));}catch(e){console.error(e.message);process.exitCode=1;}finally{if(db)await db.close();}
}
