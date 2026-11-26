# Repository instructions

This is Brian Craighead's isolated Barnabas Road Ministries deployment. Do not modify Pathway resources. Both domain roots lead to the public Worker; editor.barnabasroadministries.org leads to barnabas-studio. Preserve email DNS and the .com redirect.

Never commit credentials, project drafts, private photos, .env*, .dev.vars, local D1 state, generated build snapshots or artifacts. Do not copy account credentials from another deployment. Keep the setup token out of permanent configuration. Secure publishing settings live encrypted in D1. Do not print token values.

Run npm test, npm run check, and npm run build:site after code changes. Tests must cover actual features and isolation. Public output is static Astro. Keep GitHub workflows Linux-only, on-demand for publication, with timeouts and no artifact uploads, scheduled jobs, or caches unless explicitly approved. Only main is dispatched by the live editor. Never use pull_request_target with untrusted checkout.

Read README.md for topology, credentials, publishing callbacks and recovery. Use separate public/studio Wrangler configs. Always verify the Cloudflare account before deployment. Document any operational changes without putting secrets in documentation.
