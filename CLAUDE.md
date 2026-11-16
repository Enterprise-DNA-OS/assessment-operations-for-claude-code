# Assessment Operations for Claude Code

For the assessment office: question review, paper assembly, imported results, moderation, validation and follow-up. Ask the operator for business context when it is missing. Never infer an assessment judgement from a score.

Read data with npm run assessment -- <command> --json. All actions use the single CLI. Read before writing. Named actors are audit labels, not authenticated identities. A human supplies evidence and owns every decision.

| Recurring job | Recipe |
|---|---|
| programmes | /programmes |
| questions | /questions |
| review-queue | /review-queue |
| assessments | /assessments |
| blueprint | /blueprint |
| participants | /participants |
| results | /results |
| moderation-queue | /moderation-queue |
| validation-due | /validation-due |
| actions | /actions |
| attention | /attention |
| cohort-results | /cohort-results |
| repeat-attempts | /repeat-attempts |
| assessment-risk | /assessment-risk |
| owner-workload | /owner-workload |
| compliance | /compliance |
| import-history | /import-history |
| audit | /audit |
| add-programme | /add-programme |
| add-question | /add-question |
| revise-question | /revise-question |
| review-question | /review-question |
| add-assessment | /add-assessment |
| add-item | /add-item |
| set-blueprint | /set-blueprint |
| add-participant | /add-participant |
| record-result | /record-result |
| moderate-result | /moderate-result |
| validate-programme | /validate-programme |
| flag-risk | /flag-risk |
| add-action | /add-action |
| close-action | /close-action |
| import | /import |
| export | /export |
| draft-paper | /draft-paper |
| draft-moderation | /draft-moderation |
| weekly-review | /weekly-review |
| Custom changes | /customise |
| New view | /new-view |

## Rules

- Draft only. Never send, publish, proctor, issue qualifications or change a live customer system.
- Never delete evidence. Reviews and results are append-only. A new review supersedes an earlier decision.
- Never guess at ambiguous names, missing identifiers or export columns.
- Read docs/compliance.md before making a compliance statement.
- Candidate papers exclude the marking rubric. Marking guides stay with staff.
- Keep originals, exports, generated papers and credentials out of Git.
- Use numbered SQL migrations in supabase/migrations, the CLI in scripts/assessment.mjs and the single workflow library in .claude/commands.
- Run npm test after changes, then verify the affected command. Never seed a working database.

Postgres is used only when DATABASE_URL is set. Otherwise the embedded PGlite database lives in .data/db. Agent runtimes share the same commands. Read docs/replace-questionmark.md before import.

Built and operated by Omni by Enterprise DNA. https://enterprisedna.co/omni/book/?offer=replace-software&utm_campaign=questionmark
