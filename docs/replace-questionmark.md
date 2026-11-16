# Move your Questionmark assessment office

The free base replaces the record work around question review, assessment papers, imported results, moderation and validation planning. It does not deliver online exams, authenticate candidates, proctor sessions, issue qualifications, scan answer sheets, execute QML/Qpack content or reproduce Questionmark's psychometric engine.

## Export and map

Questionmark's [platform page](https://www.questionmark.com/platform/) confirms exportable results. Its [reporting introduction](https://www.questionmark.com/app/uploads/2023/01/Intro-to-Questionmark.pdf) lists Results Export. The supplier's [service description](https://www.applytosupply.digitalmarketplace.service.gov.uk/g-cloud/services/143658958369899) describes CSV and spreadsheet exports. Its [documented data model](https://questionmark.github.io/qm-oap-docs/data_model.html) distinguishes content, delivery and results. Read the current help for your edition and obtain an authorised Results Export CSV.

Keep the original file. Export layouts vary. The fixture in examples is synthetic, not a vendor-certified sample. Set examples/results-mapping.json to your exact column headings. A result key must identify one attempt, not one person. Create the assessments and participants first, using source identifiers as codes. The importer deliberately fails for unknown or ambiguous records instead of guessing.

Required columns: attempt/result identifier, assessment identifier, participant identifier, completion timestamp with timezone, numeric score and maximum score. Optional source outcome is retained without approving it. Decimal values use a dot. Timestamps without an offset need a documented timezone conversion before import. QML, Qpack, XLSX, question response matrices and automatic question-bank migration are not accepted by this importer. Map question content separately with the coding agent and retain its provenance.

```bash
npm run assessment -- import questionmark examples/questionmark-results.csv --mapping=examples/results-mapping.json --actor="Import operator" --dry-run
npm run assessment -- import questionmark examples/questionmark-results.csv --mapping=examples/results-mapping.json --actor="Import operator"
npm run assessment -- results
npm run assessment -- moderation-queue
npm run assessment -- export --out=exports/reconciled-copy
```

The mapped CSV import is one command. Mapping and reconciliation are a separate, necessary step. Compare source attempt counts, learner identifiers, dates and totals before switching. Same file and mapping skip on a repeated import. Conflicting attempt identifiers fail the entire import. A malformed or invalid row rolls back every row. Dry-run rolls back all changes. Original bytes, source columns and mapping are retained privately in the database and included in export.

Imports preserve the vendor outcome but calculate a separate threshold band using the assessment's recorded threshold at import time. They never become accepted moderation evidence. Record each later review with the underlying work reference. A repeated result uses a new attempt code; do not rewrite historical results.

JSON export includes all thirteen collections and a count manifest. It is an archive, not a restore command. Back up and test restoration of the underlying database separately. Keep live data, exports and credentials out of Git.

Enterprise DNA maps the export, sets the assessment rules and runs the resulting system through Omni by Enterprise DNA. One setup fee, then a retainer. [Book a call](https://enterprisedna.co/omni/book/?offer=replace-software&utm_campaign=questionmark).
