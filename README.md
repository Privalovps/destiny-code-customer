# Customer-only release preparation

The current public configuration uses the 38-value free reading and fixed complete Sample Report for 1991-12-09. Arbitrary complete readings/PDFs require server-verified purchased access. Local preview/simulation tools are denied in hosted environments. One product remains $12.90 USD; real checkout is unavailable. No owner staging bypass is included.

See [release audit and exact file manifest](docs/CUSTOMER_RELEASE_AUDIT.md) and [GitHub/Vercel/domain setup](docs/VERCEL_DEPLOYMENT.md). Not deployed. Public launch requires the approved framework security patch and a successful cloud build/manual QA. Before accepting payments, complete verified provider/email integration and durable new-report version binding; historical purchaser editions are preserved.

Safe local preview, started manually: `npm run dev -- --hostname 127.0.0.1` (Webpack). Customer sample: `http://127.0.0.1:3000/report/demo`.

## Earlier records (historical)

# Owner-only local full-report preview

An independent unpaid preview is available at /dev/report-preview. It uses the complete shared engine and both PDF editions without orders or entitlements. Start one loopback-bound Webpack process manually:

    DESTINY_CODE_LOCAL_REPORT_PREVIEW=1 APP_ORIGIN=http://127.0.0.1:3000 npm run dev -- --hostname 127.0.0.1

Open http://127.0.0.1:3000/dev/report-preview. [Setup, direct URLs, disabling and exact files](docs/LOCAL_REPORT_PREVIEW.md). Production/hosted access fails closed; existing paid authorization, $12.90 and the content freeze are unchanged.

## Earlier records

# Grammar freeze — content 2.1.1

The approved expanded report received grammar-only fixes: agreement, duplicated verbs/articles and repeated sentence fragments. Substantive content, methodology, price, payment access, chart and design are unchanged. Approved 2.1.0 remains available for rollback.

[Corrections, exact files and validation](docs/GRAMMAR_QA_FREEZE.md) · [Current freeze](docs/CONTENT_FREEZE.json). Content is frozen for launch preparation; no production approval or deployment is implied. Manual Webpack preview: `npm run dev -- --hostname 127.0.0.1`, then `/report/demo`.

## Earlier records

# Final editorial review candidate — 2.1.0

The expanded C reading is frozen for product-owner review. Method `dc-symbolic-1.0.0-proposed` / `C-family-center-v1` is unchanged. The sample retains 12,630 narrative words versus the approved 12,673; all interpretation profiles, position occurrences, ten chapters, combinations and examples remain. The 2.0.0 composer is archived and reproducible. No production activation.

See [quality summary, exact files and before/after examples](docs/FINAL_EDITORIAL_REVIEW.md), [content freeze](docs/CONTENT_FREEZE.json), and [implementation status](docs/IMPLEMENTATION_STATUS.md). Manually run Webpack with `npm run dev -- --hostname 127.0.0.1` and review `/report/demo` plus its Light/Dark downloads. Existing pricing, payments, entitlements, chart, design and themes are unchanged.

## Earlier content records

# Numerology-first interpretation refinement

The local candidate now leads every position with its Arcana, documented role, constructive expression and shadow expression; examples and concise guidance follow supported combination readings. All 22 symbols use a shared original domain library. The fixed sample, authorized candidate reading and Light/Dark PDFs use the same publication model. See [actual example, checks and exact changed files](docs/NUMEROLOGY_FIRST.md). Calculations, payment access, price, design and production hold are unchanged.

## Previous editorial records

# Latest editorial refinement

The expanded research-based reading now uses role-specific transitions and connected channel paragraphs, with awkward imperative joins and repeated commentary removed. The fixed sample retains 10,771 narrative words; documented interpretations and examples remain intact. See [editorial changes, exact files and before/after examples](docs/EDITORIAL_QUALITY.md). Calculations, payment protection, design, Webpack and production hold are unchanged.

## Earlier release records

# Content depth edition 2

The local research candidate now has expanded role-specific and ordered-channel interpretation. The 1991-12-09 sample contains 10,918 narrative words (excluding orientation, formulas and layout). All 38 calculations and numbering remain unchanged. Web, fixed sample and Light/Dark PDF use the same model. Production remains held; historical purchases retain v4.

See [depth audit and five-date counts](docs/REPORT_DEPTH_AUDIT.md), [exact files](docs/REPORT_DEPTH_FILES.md) and [content rollback](docs/METHODOLOGY_MIGRATION.md). Manual preview: `npm run dev -- --hostname 127.0.0.1`, then `/report/demo`. No server or build was started automatically. Actual PDF text completeness was checked for one Light sample; visual layout and Dark output require manual review.

## Prior release notes

# Research-package implementation — local candidate

Local development now selects `dc-symbolic-1.0.0-proposed` / `C-family-center-v1`: 38 calculated values, Justice VIII, Strength XI, ten thematic chapters and a technical appendix. Production remains on historical v4 pending review. Existing purchases retain the historical engine; no database records were migrated. The fixed public sample uses the same active generator and renderer as authorized reports.

See [implementation and manual checks](docs/RESEARCH_C_IMPLEMENTATION.md), [exact changed files](docs/RESEARCH_C_FILES.md), [methodology](docs/METHODOLOGY.md), [migration / rollback](docs/METHODOLOGY_MIGRATION.md), and [three-date audit](docs/REPORT_TRACEABILITY_AUDIT.md). The sample contains 3,225 body/detail words; no old filler was retained to meet a length target. No runtime browser or PDF pagination verification is claimed.

## Historical release notes

# Interpretation release 4.0

The active professional reading now uses a structured, source-aware 22-Arcana library with all nine position-specific editorial rules, eight rewritten chapters, constructive/shadow distinctions and traceable calculations. The public **complete fixed sample** at `/report/demo` uses the same report generator and server renderer as an authorized purchased reading; it cannot select a different birth date. No sample PDF endpoint was added. Paid Light/Dark PDFs use the same report data and source notes through the existing protected endpoint.

The active convention remains `dc-nine-digit-sum-v1`: Strength VIII, Justice XI, Fool XXII. This is **not a claim to implement the complete Ladini system**. The source audit identified an eighth-code discrepancy and inaccessible primary calculation chapters, so no calculator migration was made. See [professional methodology](docs/PROFESSIONAL_METHODOLOGY.md), [migration decisions](docs/METHODOLOGY_MIGRATION.md), [three-date traceability audit](docs/REPORT_TRACEABILITY_AUDIT.md) and [exact changed files](docs/CONTENT_REFINEMENT_FILES.md).

Payment/access code, all API handlers, the paid PDF authorization route, canonical $12.90 price, chart, CSS/themes and Webpack scripts are unchanged. The full-reading page retains its exact authorization prefix and delegates rendering only. No server, build, browser or PDF rendering was launched for this release.

For a manual public preview, run `npm run dev -- --hostname 127.0.0.1` yourself and open `http://127.0.0.1:3000/report/demo`. Stop that process before using `npm run dev:preview` to exercise the existing authorized local test order and PDF flow. Detailed notes expand without a new onboarding mode. Verify both themes, chapter navigation, all nine chart interactions and PDF source appendix manually.

---

# DESTINY CODE

Existing Next.js 16.2.0 App Router application: nine-position symbolic Destiny Matrix, free results, deterministic eight-chapter readings, interactive chart, dual screen themes and explicit Light/Dark PDF downloads. Numerology is entertainment and self-reflection, not science or prediction. No numerical formulas, reading content, PDF styling or theme behavior changed during commerce preparation.

## Safe development

```sh
cd ~/Desktop/Isoteric
npm run dev -- --hostname 127.0.0.1
```

Webpack is explicit in `dev` and `build`. Never start multiple servers. Turbopack previously caused severe memory exhaustion on this Mac. Servers, builds and browser automation must be started manually, not by an agent.

- Landing: http://127.0.0.1:3000/
- Free result: http://127.0.0.1:3000/result?date=1993-04-17
- Public fictional excerpt: http://127.0.0.1:3000/report/demo
- Single offer/disabled checkout: http://127.0.0.1:3000/checkout?date=1993-04-17
- Recovery (email unavailable): http://127.0.0.1:3000/access/recover
- Purchased library: http://127.0.0.1:3000/readings

## One product

**Destiny Code — Complete Personal Reading: $12.90 USD, one-time payment. No subscription.** Canonical server definition: `src/lib/server/product.ts`, 1290 USD cents. Includes the complete nine-position matrix, all eight chapters, online return access, Light & Dark PDF editions and personalized reflection exercises. No other tier, compatibility add-on, promotion, launch quota, reservation or future price exists.

Purchasing is disabled. No payment provider or transactional email provider is connected. Environment variables alone cannot enable live checkout. Supabase migrations and provider-independent interfaces are prepared; no remote database was changed. Follow [payment architecture/setup](docs/PAYMENT_ARCHITECTURE.md), including limitations and remaining launch requirements. Legal pages remain operator-review templates, not a compliance claim.

## Local entitlement simulation

Stop any existing server, then manually run:

```sh
npm run dev:preview
```

Open http://127.0.0.1:3000/dev/checkout?date=1993-04-17 . Create a pending order (access denied), grant an **unpaid test** entitlement, confirm its one-use verification link and open `/readings`. The full report URL is `/report/<generated-order-uuid>`, and its two explicit downloads are `/report/<uuid>/pdf?edition=light` and `?edition=dark`. Revoke and confirm access is denied. State is bounded, volatile and lost on restart. This is not a real payment or provider-webhook test. A birth-date URL never authorizes premium access. Production ignores simulator flags.

## Checks

No dev server, production build, browser automation or PDF batch was run during commerce preparation. Resource-limited checks can be run sequentially:

```sh
NODE_OPTIONS=--max-old-space-size=384 npm run typecheck
NODE_OPTIONS=--max-old-space-size=384 npx vitest run src/lib/server/payments.test.ts src/lib/report-route.test.ts --maxWorkers=1 --no-file-parallelism
```

See [QA](docs/QA.md), [calculation methodology](docs/METHODOLOGY.md) and [implementation status](docs/IMPLEMENTATION_STATUS.md). The validated 1993-04-17 fixture and exactly nine documented formulas remain unchanged. All 22 archetype interpretations remain original, deterministic symbolic writing. No accounts/passwords, analytics, external AI or trackers were added. Birth dates remain calendar strings rather than timestamps.
