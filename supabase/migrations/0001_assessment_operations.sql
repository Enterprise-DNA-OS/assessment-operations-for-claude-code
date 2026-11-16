-- Assessment office. All demo data is fictional. Local operator access only.
create function touch_updated_at() returns trigger language plpgsql as $$ begin new.updated_at=clock_timestamp(); return new; end $$;
create table programmes (id uuid primary key default gen_random_uuid(), created_at timestamptz not null default clock_timestamp(), updated_at timestamptz not null default clock_timestamp(), code text not null unique, name text not null, owner text not null, validation_due date not null, risk_note text not null default '');
alter table programmes enable row level security;
revoke all on programmes from public;
create trigger touch before update on programmes for each row execute function touch_updated_at();
create table questions (id uuid primary key default gen_random_uuid(), created_at timestamptz not null default clock_timestamp(), updated_at timestamptz not null default clock_timestamp(), code text not null unique, name text not null, topic text not null, prompt text not null, rubric text not null, max_score numeric(10,2) not null check(max_score>0), author text not null, revision integer not null default 1 check(revision>0), review_due date not null);
alter table questions enable row level security;
revoke all on questions from public;
create trigger touch before update on questions for each row execute function touch_updated_at();
create table question_reviews (id uuid primary key default gen_random_uuid(), created_at timestamptz not null default clock_timestamp(), updated_at timestamptz not null default clock_timestamp(), question_id uuid not null references questions(id), revision integer not null, reviewer text not null, decision text not null check(decision in ('approved','revise')), evidence text not null check(length(trim(evidence))>0));
alter table question_reviews enable row level security;
revoke all on question_reviews from public;
create trigger touch before update on question_reviews for each row execute function touch_updated_at();
create table assessments (id uuid primary key default gen_random_uuid(), created_at timestamptz not null default clock_timestamp(), updated_at timestamptz not null default clock_timestamp(), code text not null unique, name text not null, programme_id uuid not null references programmes(id), pass_percent numeric(5,2) not null check(pass_percent between 0 and 100), due_date date not null);
alter table assessments enable row level security;
revoke all on assessments from public;
create trigger touch before update on assessments for each row execute function touch_updated_at();
create table assessment_items (id uuid primary key default gen_random_uuid(), created_at timestamptz not null default clock_timestamp(), updated_at timestamptz not null default clock_timestamp(), assessment_id uuid not null references assessments(id), question_id uuid not null references questions(id), position integer not null check(position>0), question_revision integer not null, unique(assessment_id,question_id), unique(assessment_id,position));
alter table assessment_items enable row level security;
revoke all on assessment_items from public;
create trigger touch before update on assessment_items for each row execute function touch_updated_at();
create table blueprints (id uuid primary key default gen_random_uuid(), created_at timestamptz not null default clock_timestamp(), updated_at timestamptz not null default clock_timestamp(), assessment_id uuid not null references assessments(id), topic text not null, min_marks numeric(10,2) not null check(min_marks>0), unique(assessment_id,topic));
alter table blueprints enable row level security;
revoke all on blueprints from public;
create trigger touch before update on blueprints for each row execute function touch_updated_at();
create table participants (id uuid primary key default gen_random_uuid(), created_at timestamptz not null default clock_timestamp(), updated_at timestamptz not null default clock_timestamp(), code text not null unique, name text not null, cohort text not null);
alter table participants enable row level security;
revoke all on participants from public;
create trigger touch before update on participants for each row execute function touch_updated_at();
create table import_batches (id uuid primary key default gen_random_uuid(), created_at timestamptz not null default clock_timestamp(), updated_at timestamptz not null default clock_timestamp(), fingerprint text not null unique, filename text not null, original_base64 text not null, mapping jsonb not null, row_count integer not null check(row_count>=0));
alter table import_batches enable row level security;
revoke all on import_batches from public;
create trigger touch before update on import_batches for each row execute function touch_updated_at();
create table attempts (id uuid primary key default gen_random_uuid(), created_at timestamptz not null default clock_timestamp(), updated_at timestamptz not null default clock_timestamp(), code text not null unique, assessment_id uuid not null references assessments(id), participant_id uuid not null references participants(id), finished_at timestamptz not null, score numeric(10,2) not null check(score>=0), max_score numeric(10,2) not null check(max_score>0 and score<=max_score), pass_percent numeric(5,2) not null check(pass_percent between 0 and 100), source_outcome text not null default '', batch_id uuid references import_batches(id), original_row jsonb not null default '{}'::jsonb);
alter table attempts enable row level security;
revoke all on attempts from public;
create trigger touch before update on attempts for each row execute function touch_updated_at();
create table moderations (id uuid primary key default gen_random_uuid(), created_at timestamptz not null default clock_timestamp(), updated_at timestamptz not null default clock_timestamp(), attempt_id uuid not null references attempts(id), reviewer text not null, decision text not null check(decision in ('accepted','follow-up')), validity boolean not null, sufficiency boolean not null, authenticity boolean not null, currency boolean not null, evidence text not null check(length(trim(evidence))>0), check(decision<>'accepted' or (validity and sufficiency and authenticity and currency)));
alter table moderations enable row level security;
revoke all on moderations from public;
create trigger touch before update on moderations for each row execute function touch_updated_at();
create table validations (id uuid primary key default gen_random_uuid(), created_at timestamptz not null default clock_timestamp(), updated_at timestamptz not null default clock_timestamp(), programme_id uuid not null references programmes(id), reviewer text not null, credentials text not null check(length(trim(credentials))>0), evidence text not null check(length(trim(evidence))>0), decision text not null check(decision in ('accepted','follow-up')), next_due date not null, check(next_due>=created_at::date));
alter table validations enable row level security;
revoke all on validations from public;
create trigger touch before update on validations for each row execute function touch_updated_at();
create table actions (id uuid primary key default gen_random_uuid(), created_at timestamptz not null default clock_timestamp(), updated_at timestamptz not null default clock_timestamp(), code text not null unique, name text not null, programme_id uuid not null references programmes(id), owner text not null, due_date date not null, status text not null default 'open' check(status in ('open','closed')), closure_note text not null default '');
alter table actions enable row level security;
revoke all on actions from public;
create trigger touch before update on actions for each row execute function touch_updated_at();
create table audit_log (id uuid primary key default gen_random_uuid(), created_at timestamptz not null default clock_timestamp(), updated_at timestamptz not null default clock_timestamp(), entity text not null, record_id uuid not null, operation text not null, actor text not null, old_row jsonb, new_row jsonb);
alter table audit_log enable row level security;
revoke all on audit_log from public;
create trigger touch before update on audit_log for each row execute function touch_updated_at();
create function audit_change() returns trigger language plpgsql as $$ begin
 insert into audit_log(entity,record_id,operation,actor,old_row,new_row) values(TG_TABLE_NAME,coalesce(new.id,old.id),TG_OP,coalesce(nullif(current_setting('app.actor',true),''),'database operator'),case when TG_OP='INSERT' then null else to_jsonb(old) end,case when TG_OP='DELETE' then null else to_jsonb(new) end); return coalesce(new,old); end $$;
create function immutable_record() returns trigger language plpgsql as $$ begin raise exception 'Evidence records are append-only'; end $$;
create function review_guard() returns trigger language plpgsql as $$ declare q questions; begin
 select * into q from questions where id=new.question_id;
 if new.revision<>q.revision then raise exception 'Review must name the current revision'; end if;
 if lower(trim(new.reviewer))=lower(trim(q.author)) then raise exception 'Independent question reviewer required'; end if;
 return new; end $$;
create trigger review_guard before insert on question_reviews for each row execute function review_guard();
create trigger audit after insert or update or delete on programmes for each row execute function audit_change();
create trigger audit after insert or update or delete on questions for each row execute function audit_change();
create trigger audit after insert or update or delete on question_reviews for each row execute function audit_change();
create trigger immutable before update or delete on question_reviews for each row execute function immutable_record();
create trigger audit after insert or update or delete on assessments for each row execute function audit_change();
create trigger audit after insert or update or delete on assessment_items for each row execute function audit_change();
create trigger audit after insert or update or delete on blueprints for each row execute function audit_change();
create trigger audit after insert or update or delete on participants for each row execute function audit_change();
create trigger audit after insert or update or delete on import_batches for each row execute function audit_change();
create trigger immutable before update or delete on import_batches for each row execute function immutable_record();
create trigger audit after insert or update or delete on attempts for each row execute function audit_change();
create trigger immutable before update or delete on attempts for each row execute function immutable_record();
create trigger audit after insert or update or delete on moderations for each row execute function audit_change();
create trigger immutable before update or delete on moderations for each row execute function immutable_record();
create trigger audit after insert or update or delete on validations for each row execute function audit_change();
create trigger immutable before update or delete on validations for each row execute function immutable_record();
create trigger audit after insert or update or delete on actions for each row execute function audit_change();
create trigger immutable before update or delete on audit_log for each row execute function immutable_record();
create index question_reviews_lookup on question_reviews (question_id);
create index assessments_lookup on assessments (programme_id);
create index assessment_items_lookup on assessment_items (question_id);
create index attempts_lookup on attempts (assessment_id,participant_id);
create index moderations_lookup on moderations (attempt_id);
create index validations_lookup on validations (programme_id);
create index actions_lookup on actions (programme_id);
create index audit_log_lookup on audit_log (entity,record_id);

create view question_status with (security_invoker=true) as
 select q.*,r.decision,r.reviewer,case when r.id is null then 'Needs review' when r.decision<>'approved' then 'Revision requested' when q.review_due<current_date then 'Review expired' else 'Ready' end as readiness
 from questions q left join lateral (select * from question_reviews r where r.question_id=q.id and r.revision=q.revision order by created_at desc,id desc limit 1) r on true;
create view blueprint_coverage with (security_invoker=true) as
 select b.id,b.assessment_id,a.code assessment,b.topic,b.min_marks,coalesce(sum(q.max_score),0) available_marks,
 greatest(b.min_marks-coalesce(sum(q.max_score),0),0) missing_marks
 from blueprints b join assessments a on a.id=b.assessment_id
 left join assessment_items i on i.assessment_id=a.id
 left join questions q on q.id=i.question_id and lower(q.topic)=lower(b.topic)
 group by b.id,b.assessment_id,a.code,b.topic,b.min_marks;
create view assessment_readiness with (security_invoker=true) as
 select a.id,a.code,a.name,p.code programme,a.due_date,
 (select count(*) from assessment_items i where i.assessment_id=a.id) questions,
 (select count(*) from assessment_items i join question_status q on q.id=i.question_id where i.assessment_id=a.id and (q.readiness<>'Ready' or i.question_revision<>q.revision)) question_gaps,
 (select coalesce(sum(missing_marks),0) from blueprint_coverage b where b.assessment_id=a.id) missing_marks,
 (select count(*) from blueprints b where b.assessment_id=a.id) blueprint_topics
 from assessments a join programmes p on p.id=a.programme_id;
create view result_board with (security_invoker=true) as
 select t.id,t.code,a.code assessment,p.code participant,p.cohort,t.finished_at,t.score,t.max_score,round(t.score*100/t.max_score,2) percent,
 case when t.score*100/t.max_score>=t.pass_percent then 'At threshold' else 'Below threshold' end score_band,
 coalesce(m.decision,'unreviewed') moderation,m.reviewer,t.source_outcome
 from attempts t join assessments a on a.id=t.assessment_id join participants p on p.id=t.participant_id
 left join lateral (select * from moderations m where m.attempt_id=t.id order by created_at desc,id desc limit 1) m on true;
create view validation_status with (security_invoker=true) as
 select p.id,p.code,p.name,p.owner,coalesce(v.next_due,p.validation_due) due_date,coalesce(v.decision,'unreviewed') decision,p.risk_note,v.reviewer
 from programmes p left join lateral (select * from validations v where v.programme_id=p.id order by created_at desc,id desc limit 1) v on true;
create view compliance_findings with (security_invoker=true) as
 select 'Q01' rule,code record,readiness issue from question_status where readiness<>'Ready'
 union all select 'A01',code,'Assessment has missing, stale or unreviewed content' from assessment_readiness where questions=0 or question_gaps>0 or missing_marks>0 or blueprint_topics=0
 union all select 'R01',code,'Result evidence requires review' from result_board where moderation<>'accepted'
 union all select 'V01',code,'Validation overdue or incomplete' from validation_status where due_date<current_date or decision<>'accepted'
 union all select 'V02',code,'Risk flagged: reconsider validation date' from validation_status where length(trim(risk_note))>0;
revoke all on question_status,blueprint_coverage,assessment_readiness,result_board,validation_status,compliance_findings from public;
revoke all on function touch_updated_at(),audit_change(),immutable_record(),review_guard() from public;
