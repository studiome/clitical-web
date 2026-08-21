# CLiTICAL

**C**hronic **Li**mb-**T**hreatening **I**schaemia **Cal**culator — a bilingual (English / 日本語) web app that predicts peri-procedural and mid-term outcomes of revascularisation for chronic limb-threatening ischaemia (CLTI).

[![Live app](https://img.shields.io/badge/live-clitical.web.app-2D6A7B)](https://clitical.web.app)
[![Angular](https://img.shields.io/badge/Angular-22-dd0031)](https://angular.dev)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

> [!IMPORTANT]
> This application is intended as a decision-support aid for healthcare professionals. It does not provide a diagnosis and must not replace clinical judgement. All predictions are statistical estimates derived from the published models cited below.

## Overview

The clinician enters patient data on a single form — demographics, nutritional markers, comorbidities, arterial lesion sites and Rutherford class — and the app returns four predicted outcomes plus a nutritional index. Everything is computed locally in the browser: **no patient data is transmitted, stored on a server, or persisted between sessions.**

### Predicted outputs

| Output | Description |
| --- | --- |
| **GNRI** | Geriatric Nutritional Risk Index, classified as no risk / low / moderate / major |
| **2-year OS** | Overall survival, classified as low / medium / high risk |
| **2-year AFS** | Amputation-free survival |
| **30-day death or amputation** | Early peri-procedural outcome |
| **30-day MALE** | Early major adverse limb events |

The two-year models are Cox-type predictors (`S₀^exp(Σβx)`); the 30-day models are logistic. Coefficients live in [`src/app/models/patient-risk.ts`](src/app/models/patient-risk.ts) and are transcribed directly from the source publications.

## References

The prediction models are published by Miyata T. et al. from the JCLIMB registry of the Japanese Society for Vascular Surgery:

1. [Risk prediction model for early outcomes of revascularization for chronic limb-threatening ischaemia](https://doi.org/10.1093/bjs/znab036). *Br J Surg.* 2022 Oct 14;109(11):1123.
2. [Prediction Models for Two Year Overall Survival and Amputation Free Survival After Revascularisation for Chronic Limb Threatening Ischaemia](https://doi.org/10.1016/j.ejvs.2022.05.038). *Eur J Vasc Endovasc Surg.* 2022 Jun 7;S1078-5884(22)00340-9.

## Features

- **Bilingual UI** — English and Japanese, auto-detected from the browser locale and overridable in Settings (persisted in `localStorage`; nothing else is).
- **Installable PWA** — service worker, web manifest and maskable icons; works offline once installed.
- **Local Excel batch processing** — download a validated template, calculate multiple
  patients in the browser, review row-level errors and export the results without
  uploading the workbook to a server. See [Batch Excel processing](docs/batch-excel.md).
- **Prerendered (SSR)** — every route is prerendered at build time for a fast first paint.
- **Accessible** — WCAG AA is a project requirement, enforced by automated axe-core checks in the test suite.
- **Light / dark themes** — follows the OS colour scheme, including the browser chrome tint.

## Tech stack

| Area | Choice |
| --- | --- |
| Framework | Angular 22 (standalone components, signals, native control flow) |
| UI | Angular Material |
| Forms | Signal Forms (`@angular/forms/signals`) |
| Rendering | Angular SSR with full prerendering                               |
| Testing | Vitest + jsdom, axe-core for accessibility |
| Hosting | Firebase Hosting, deployed by GitHub Actions |

State is held in signals: [`PatientDataStore`](src/app/services/patient-data-store.ts) owns the form data and the computed risk, and [`TranslationService`](src/app/services/translation.ts) owns the locale.

## Getting started

Requires Node.js 22+.

```bash
npm ci
```

Start the development server at `http://localhost:4200/`:

```bash
npm start
```

## Development

Run the test suite (Vitest, single run):

```bash
npm test
```

Build the production bundle into `dist/clitical-web/`:

```bash
npm run build
```

Scaffold a component with the Angular CLI:

```bash
ng generate component component-name
```

### Project structure

```
src/app/
├── models/            # PatientData and the risk prediction models
├── batch-processing/  # Local Excel template, validation and batch calculation
├── services/          # PatientDataStore (signals), TranslationService, i18n messages
├── question-form/     # Patient data entry (Signal Forms) with select/switch rows
├── risk-view/         # Predicted risk results
├── references/        # Source publications
├── settings/          # Language, terms, version
└── navigation/        # App shell and routing chrome
```

Routes are lazily loaded; see [`app.routes.ts`](src/app/app.routes.ts).

### Conventions

Contributor guidance lives in [`.claude/CLAUDE.md`](.claude/CLAUDE.md). In short: standalone components, `input()` / `output()` functions, signals for state, `inject()` over constructor injection, native control flow, and no `ngClass` / `ngStyle`. Accessibility regressions are treated as bugs.

## Deployment

Pushing to `main` triggers [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml), which runs the test suite and then deploys to Firebase Hosting at [clitical.web.app](https://clitical.web.app). Deployment requires the `FIREBASE_TOKEN` repository secret.

To deploy manually:

```bash
npm run deploy
```

## Related projects

CLiTICAL began as [clti_risk](https://studiome.github.io/clti_risk/), a Flutter application; this repository is the Angular web port and shares its prediction models and test cases.

## License

Released under the [MIT License](LICENSE).

Published by the Japanese Society for Vascular Surgery and the JCLIMB Committee; software by Kazuhiro Miyahara.
