# Add a read-only view

Read CLAUDE.md and views.json. Translate the requested question into a read-only query on existing views. Use a numbered migration if a new database view is needed, with security_invoker=true and no public grant. Add a section in views.json. Run npm run view and inspect the generated HTML, including empty results. Do not create an action button or public page.
