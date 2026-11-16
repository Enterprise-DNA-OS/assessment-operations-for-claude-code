# Assessment Operations for Claude Code

Own the assessment office: question review, paper assembly, result moderation, validation evidence and overdue follow-up. MIT-licensed software from Enterprise DNA. Works with Claude Code, Codex, OpenCode or Cursor.

| Do it yourself | We customise it | We run it for you |
|---|---|---|
| Free source code. Install, map your export and run the office. | Your question types, review rules, papers and Questionmark records mapped across. [Get your version built](https://enterprisedna.co/omni/book/?offer=replace-software&utm_source=github&utm_campaign=questionmark). | Installed and operated through Omni by Enterprise DNA. One setup fee, then a retainer. [Book a call](https://enterprisedna.co/omni/book/?offer=replace-software&utm_source=github&utm_campaign=questionmark). |

## What this replaces

The weekly record work around an assessment programme: questions, independent review, topic coverage, draft papers, results, evidence decisions and validation follow-up. It is useful for a paper-based assessment office or for the review work around exported exam results.

Questionmark's [current platform page](https://www.questionmark.com/platform/) describes pricing based on assessment volume, modules and proctoring needs. Its supplier-authored [May 2024 G-Cloud schedule](https://assets.applytosupply.digitalmarketplace.service.gov.uk/g-cloud-14/documents/704357/143658958369899-pricing-document-2024-05-03-1543.pdf) lists EUR 22,945 a year for 2,500 named participants, excluding VAT. That is a historical benchmark, not a current quote or verified local customer invoice.

The base does not deliver online exams, authenticate candidates, proctor sessions, issue qualifications, send messages or reproduce Questionmark's psychometric engine. Enterprise DNA can scope the delivery interface and integrations for a custom version. Independent software, not affiliated with Questionmark or Learnosity.

## Quick start

Node 22.13 or later. No account or database server is required for the embedded demo.

```bash
git clone https://github.com/Enterprise-DNA-OS/assessment-operations-for-claude-code.git
cd assessment-operations-for-claude-code
npm install
npm test
npm run demo
npm run assessment -- assessments
npm run assessment -- moderation-queue
npm run assessment -- compliance
npm run view
npm run docs
```

All demo records are fictional. They include an unreviewed question, missing topic marks, unreviewed results, a risk flag and overdue follow-up. Seed is idempotent. Never seed a working database. Shared seed requires --demo-database explicitly.

Without DATABASE_URL, PGlite stores data under .data/db or DATA_DIR. With DATABASE_URL, the same migrations run on PostgreSQL 16 or newer. Access belongs to a trusted database operator. Row security is enabled on every table and public access revoked. Set controlled roles, private storage and tested backups before shared use. Named actors are audit labels, not authenticated identities.

## Five weekly rituals

- /review-queue shows questions that need a decision or have expired reviews.
- /blueprint compares each assessment's question marks with its topic requirements.
- /moderation-queue finds results that still need evidence reviewed by a person.
- /validation-due joins validation decisions, dates and recorded risks.
- /weekly-review drafts the week's assessment readiness, moderation, validation and overdue actions.

The single CLI has 38 commands with human output and --json. There are 39 slash-command recipes, including /customise and /new-view. Read [the CLI reference](docs/cli.md). UUID prefixes and case-insensitive names work. Ambiguity lists candidates and exits 1. Mutations require --actor. No command sends anything.

## Ten questions to ask

These joins and local rules work today. They are not a claim that Questionmark cannot offer similar reports.

1. Which papers combine stale question reviews with missing topic marks? assessments
2. Which topic is short of its required marks? blueprint
3. Which questions changed since the assessment selected them? assessments
4. Which results reached the score threshold but still need evidence reviewed? moderation-queue
5. Which cohorts have the most results awaiting review? cohort-results
6. Which learners have several attempts at the same assessment? repeat-attempts
7. Which assessments combine content gaps and unreviewed results? assessment-risk
8. Which validation plans have a risk flag despite a recorded decision? validation-due
9. Who owns the overdue follow-up? owner-workload
10. What did a question say before it changed, and who changed it? audit

## Your first hour: ten things to ask for

1. Put our name and colours in brand.json.
2. Show the fictional assessment week's gaps.
3. Explain the difference between a score and an evidence decision.
4. Draft the paper and its separate marking guide.
5. Add our first programme and validation date.
6. Add a question and assign an independent review.
7. Set the topic requirements for our first paper.
8. Inspect and map an authorised Questionmark Results Export.
9. Dry-run that import and reconcile identifiers, dates and counts.
10. Agree access roles, evidence retention and a tested database restore.

## Documents and views

Change brand.json once. npm run view writes two read-only dashboards. npm run docs writes four document types: candidate paper, confidential marking guide, moderation pack and validation record. Candidate papers omit the rubric. Drafts show readiness gaps and require staff review before issue.

/draft-paper, /draft-moderation and /weekly-review write unique files to drafts. Generated reports escape record text and are private working papers. No server or interactive front end is built. [What a screen would add](docs/why-no-front-end.md).

/customise writes the requested field or rule as a new migration and updates the CLI and reports. /new-view adds a read-only question to views.json. Every agent runtime uses the same database and commands.

## Evidence stays attached to the decision

Question reviews, result moderation and validation decisions are append-only. A later review can reopen an earlier acceptance. A question revision invalidates its review and flags every paper still using the earlier revision. Deliberately update the paper only after review. The change history retains both old and new wording and the named operator.

Imported scores never approve evidence. The threshold band uses the assessment's recorded threshold at import time, separately from the source outcome. A qualified person inspects the underlying work and records the decision. The [compliance checks](docs/compliance.md) support record review. They do not accredit a provider, verify a credential or certify a learner. Database owners can alter controls, so the history is not tamper-proof.

## Bring your records

Import a mapped Questionmark Results Export CSV in one command after creating the matching assessments and participants. A dry-run rolls back all writes, a bad row rejects the whole file and repeated identical imports skip. Original bytes, mapping and all source columns remain in the database. Changed existing attempt identifiers fail instead of overwriting history.

[Switching guide](docs/replace-questionmark.md). The fixture is synthetic; verify your edition's actual export headings. Question-bank migration, QML/Qpack content and response-level psychometrics need separate mapping or development. No real customer export has been tested in this build.

Export writes thirteen collections and a count manifest into a new private directory. This is a portable archive, not a restoration command. Back up and test restore of the underlying database separately. Never commit exports, learner records, marking guides or credentials.

## Validation

npm test uses a temporary database, clears inherited DATABASE_URL, migrates twice, seeds twice and exercises all 38 commands. It tests revision invalidation, later evidence decisions, rejected imports, full rollback, dry-runs, original bytes, source outcome separation, score boundaries, HTML escaping, candidate-paper privacy, export counts and ambiguous-name exits. The manual workflow runs Windows and Linux with Node 22 and 24, plus PostgreSQL 17. ASSESSMENT_TEST_POSTGRES_URL must deliberately name an empty disposable test store.

## Installed for you

Enterprise DNA maps your Questionmark records, adapts the assessment office and operates it through Omni by Enterprise DNA. One setup fee, then a retainer. [Book Sam's 30-minute call](https://enterprisedna.co/omni/book/?offer=replace-software&utm_source=github&utm_campaign=questionmark).

MIT. Copyright 2026 Enterprise DNA.
