# CLI reference

Node 22.13 or later. Run npm run assessment -- <command>. Add --json for machine output. Options accept --key=value or --key value. Mutations require --actor. Dates use YYYY-MM-DD. Result timestamps need an explicit UTC offset. Identifiers match exact code, UUID prefix or case-insensitive name. Ambiguity lists candidates and exits 1.

- **programmes** Read the corresponding records.
- **questions** Read the corresponding records.
- **review-queue** Read the corresponding records.
- **assessments** Read the corresponding records.
- **blueprint** Read the corresponding records.
- **participants** Read the corresponding records.
- **results** Read the corresponding records.
- **moderation-queue** Read the corresponding records.
- **validation-due** Read the corresponding records.
- **actions** Read the corresponding records.
- **attention** Read the corresponding records.
- **cohort-results** Read the corresponding records.
- **repeat-attempts** Read the corresponding records.
- **assessment-risk** Read the corresponding records.
- **owner-workload** Read the corresponding records.
- **compliance** Run the check and explain the relevant rule in docs/compliance.md. These are recorded-field checks. Never certify compliance or infer credentials.
- **import-history** Read the corresponding records.
- **audit** Read the corresponding records.
- **add-programme** --code --name --owner --due --actor
- **add-question** --code --name --topic --prompt --rubric --marks --author --due --actor
- **revise-question** --question --prompt --rubric --due --actor
- **review-question** --question --decision --evidence --actor
- **add-assessment** --code --name --programme --threshold --due --actor
- **add-item** --assessment --question --position --actor
- **set-blueprint** --assessment --topic --marks --actor
- **add-participant** --code --name --cohort --actor
- **record-result** --code --assessment --participant --finished --score --maximum --actor
- **moderate-result** --attempt --decision --validity --sufficiency --authenticity --currency --evidence --actor
- **validate-programme** --programme --decision --credentials --evidence --due --actor
- **flag-risk** --programme --note --actor
- **add-action** --code --name --programme --owner --due --actor
- **close-action** --action --note --actor
- **import** Run a dry-run of the mapped Questionmark Results Export CSV. Reconcile counts and identifiers before the real import. Read docs/replace-questionmark.md. Never infer an unknown learner or approve imported outcomes.
- **export** Write all records to a new private directory with --out. Check the manifest counts. Never commit the export or claim it is a database restore.
- **draft-paper** Read the assessment, review-queue and blueprint first. Create the candidate draft with --assessment. Check that no rubric is present. Resolve content gaps before a human issues it.
- **draft-moderation** Read results and moderation-queue for the assessment. Draft with --assessment. A score is not evidence of competence. Never send or issue qualifications.
- **weekly-review** Generate the review from assessments, moderation-queue, validation-due and attention. Present decisions and named owners. Draft only.
- **help** Read the corresponding records.

review-question accepts approved or revise. moderate-result and validate-programme accept accepted or follow-up. The four moderation checks accept true or false. Evidence is a reference plus a review note, never a fabricated assertion. set-blueprint sets the minimum marks for one topic. add-item inserts a question or deliberately adopts its current revision for that assessment.

Every generated document is a draft. CLI drafts use a unique filename. npm run docs regenerates working papers; archive an issued copy separately. Use --assessment for draft-paper and draft-moderation. weekly-review takes no options.

Imports: import questionmark <file.csv> --mapping=<file.json> --actor=<name> [--dry-run]. Export: export --out=<new-directory>.
