# Barnabas Road Ministries Studio

A separate, neutral nonprofit site editor for Brian Craighead. The former Astro example was replaced; the original template remains in Git history.

- Public: https://barnabasroadministries.org (.com redirects here)
- Editor: https://editor.barnabasroadministries.org
- Repository: https://github.com/brianRcraighead/barnabasroadministries

## Editing and publishing

Sign in as Bcraighead with the initial password supplied separately. Change password is available in the sidebar (new passwords need 12 characters). Click page text to edit, hover a button for its own link/remove controls, and hover a section for section controls. Internal links use a page/section picker; external links accept a URL. The section library and freeform canvas support individual layouts. Save creates a revision; Publish builds that saved snapshot, keeping later draft edits separate. Versions restore prior drafts without replacing the live site until another publication.

The starter deliberately contains no invented ministry activities, people, contact details, payment address or stock photos. Add approved content before inviting visitors. Classic appearance comparison keeps current content; the pre-change checkpoint and revision history remain available.

## Architecture and automation

The editor runs on the barnabas-studio Cloudflare Worker. Its own D1 database stores project JSON, revisions, media, users, encrypted settings and deployment metadata. Public visitors receive static Astro HTML and assets from the barnabasroadministries Worker. No visitor JavaScript or database reads are required. Local Node or this computer is not needed for later publication.

The browser sends an authenticated Publish request; the Worker freezes the saved revision and encrypted destination configuration, then dispatches publish-astro.yml on main. The GitHub runner uses BUILD_CALLBACK_SECRET to retrieve that snapshot, builds Astro, deploys static assets and posts status back. The transient build configuration is erased on completion. GitHub stores no drafts or uploaded media in commits. The runner workspace is disposable and is never uploaded as an artifact. Check runs on push/PR; publication runs only on demand. Both use bounded Linux jobs, no scheduled jobs and no Actions caches/artifacts.

## Secure publishing credentials

The initial setup used a short-lived Cloudflare token only on the setup machine. It is not a live Worker secret or a GitHub secret. The Cloudflare publishing token is configured. Ongoing publication also requires the administrator to open **Deployment & API** and supply the GitHub publishing credential below:

1. Cloudflare publishing API token. Configured on November 26, 2026: `Barnabas Studio - public website publishing`, with Individual Workers Editor restricted to the existing `barnabasroadministries` Worker and Workers Metadata Read-Only for account-level subdomain discovery. No scheduled expiry. It has no DNS, billing, D1, or API-token-management grants, and cannot access the editor Worker code. A static deployment with this exact token passed. The value lives only encrypted in D1; revoke or rotate it through the account API Tokens dashboard, then update Deployment & API.
2. GitHub fine-grained token for this repository only with Actions Read and Write and Metadata Read, authorized by its owner. It dispatches the publishing workflow; it does not need code-write permission.

Both tokens can be saved separately. They are encrypted with AES-GCM in D1, keyed from SESSION_SECRET. The API returns configured flags only, never saved token values. Restrict administrator access. Dashboard links contain public account/resource IDs, no authentication tokens.

Persistent secrets: SESSION_SECRET on the studio Worker, and the same BUILD_CALLBACK_SECRET on the studio Worker and repository Actions secrets. Keep SESSION_SECRET stable; rotating it invalidates sessions and requires reentering encrypted publishing settings. Callback-secret rotation must update both services together. Account setup passwords and temporary API tokens must never enter Git, frontend assets, screenshots or logs.

## Development

Node 24: npm ci; npm test; npm run check; npm run build:site.

For local editor: node scripts/configure-local.mjs; npm run db:local; node scripts/provision-accounts.mjs --local; npx wrangler dev --config wrangler.local.jsonc. The generated local password lives only in ignored .env.accounts. The smoke helper rejects non-local targets.

Public deployment: npm run build:site then npm run deploy. Editor deployment: npm run deploy:studio. Remote D1 migrations: npm run db:remote. Use an account-scoped token through environment variables, never command arguments. The public and studio Wrangler configs are intentionally separate. Preserve existing custom domains, .com redirect Worker, and email DNS.

## Cost and privacy

A public repository keeps standard GitHub-hosted runner compute free. This project deliberately uploads no Actions artifacts or caches; public repositories do not make every storage/product free. Keep paid-product budgets at zero if a strict no-overage policy is wanted. Cloudflare usage remains subject to the account plan and its quotas. Credentials and private data belong in the Worker/D1, not repository files. Making this repository private is optional; that changes runner billing and is not a substitute for secret hygiene.

## Recovery and boundaries

Export project JSON and retain D1 backups before destructive work. Revisions and the custom-layout checkpoint support content rollback. Worker deployments support code rollback. Only publish-astro.yml publishes content; ordinary code checks do not deploy the studio. An existing Cloudflare Git integration may separately deploy the public Worker from main, so review that integration before pushing unrelated code. Never reuse Pathway of Hope account IDs, tokens, people, media or production data. This deployment is isolated.
