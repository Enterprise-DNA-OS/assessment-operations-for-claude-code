do $$ declare p uuid; q1 uuid; q2 uuid; a uuid; person uuid; attempt uuid;
begin
 if exists(select 1 from programmes where code='DEMO-OPS') then return; end if;
 if exists(select 1 from programmes) then raise exception 'Seed requires an empty demo database'; end if;
 perform set_config('app.actor','fictional demo seed',true);
 insert into programmes(code,name,owner,validation_due,risk_note) values('DEMO-OPS','Operations induction','Mara Chen',current_date-14,'New operating procedure requires a validation review') returning id into p;
 insert into questions(code,name,topic,prompt,rubric,max_score,author,review_due) values('Q-SAFE','Isolation checks','Safety','Describe the checks before isolating equipment.','Identify the equipment, authorisation and verification steps.',5,'Leo Singh',current_date+60) returning id into q1;
 insert into question_reviews(question_id,revision,reviewer,decision,evidence) values(q1,1,'Mara Chen','approved','Fictional review record REV-01');
 insert into questions(code,name,topic,prompt,rubric,max_score,author,review_due) values('Q-REPORT','Incident reporting','Reporting','What would you record after a near miss?','Record the event, immediate response and follow-up owner.',5,'Leo Singh',current_date-7) returning id into q2;
 insert into assessments(code,name,programme_id,pass_percent,due_date) values('OPS-01','Operations knowledge check',p,80,current_date+7) returning id into a;
 insert into assessment_items(assessment_id,question_id,position,question_revision) values(a,q1,1,1),(a,q2,2,1);
 insert into blueprints(assessment_id,topic,min_marks) values(a,'Safety',5),(a,'Reporting',10);
 insert into participants(code,name,cohort) values('DEMO-001','Aroha Example','November intake') returning id into person;
 insert into attempts(code,assessment_id,participant_id,finished_at,score,max_score,pass_percent,source_outcome) values('DEMO-R1',a,person,now()-interval '3 days',8,10,80,'Pass') returning id into attempt;
 insert into attempts(code,assessment_id,participant_id,finished_at,score,max_score,pass_percent) values('DEMO-R2',a,person,now()-interval '1 day',9,10,80);
 insert into moderations(attempt_id,reviewer,decision,validity,sufficiency,authenticity,currency,evidence) values(attempt,'Mara Chen','follow-up',true,true,false,true,'Fictional oral follow-up still needed');
 insert into actions(code,name,programme_id,owner,due_date) values('ACT-01','Review incident question',p,'Leo Singh',current_date-3),('ACT-02','Sample reassessment evidence',p,'Mara Chen',current_date+2);
end $$;
