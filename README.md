# Pronoun Trainer

A playful, offline-first **PWA** that gives Chinese-speaking kids (ages 7–11, EFL)
practice with English **personal** and **possessive** pronouns. Designed for
classroom/tutoring use on iPhones and iPads.

No framework, no build step, no backend — a plain static site that works fully
offline after the first visit and can be installed to the home screen.

## Activities

A single-page menu leads with a full-width **There Be** card, then a 2×2 grid of
four pronoun activities (module × skill):

|  | ✏️ Spelling | 💬 Usage |
|---|---|---|
| **There Be** 句型 | — | 🎯 Choice |
| **Personal** 人称代词 | Type the word you hear | Subject vs object in context |
| **Possessive** 物主代词 | Type the word you hear | Adjective vs pronoun in context |

The **Choice** card is a single-option grammar selection for "there be" sentences
(is/are, Is/Are, any/some, isn't/aren't, was/were).

- **Spelling** — shows a Chinese prompt (e.g. 我的) and speaks the English word;
  the child types it from memory. `Check ✓` turns into `Next →` after each answer.
  A miss shows the correct spelling in red.
- **Usage** — a sentence with a blank and four pronoun options. Exactly one option
  is grammatically correct (valid alternates are excluded at runtime); a wrong tap
  explains why.

Each round draws **10 random items** from the pool. On completion you get a score,
confetti, a full answer-by-answer **review summary** (wrong answers marked red with
the correct one), and a *try missed again* button.

## Features

- 🔊 **Spoken audio** via the Web Speech API (`speechSynthesis`), slowed down for
  young learners; works on iOS with the known voice quirks handled.
- 📴 **Offline-first** — a service worker caches every asset on first load; the app
  runs in airplane mode after one visit.
- 📱 **Installable** — manifest, app icons, and iOS standalone meta tags.
- ✏️ Case-insensitive spelling with autocorrect/capitalize/spellcheck disabled.
- 🎯 Exactly-one-correct multiple choice, guaranteed by per-sentence data.

## Getting started

This is a static site — just serve the `site/` folder:

```bash
# any static server, e.g.
npx serve site
# or just open site/index.html directly
```

HTTPS is needed for the service worker in production; see
[docs/deploy-azure.md](docs/deploy-azure.md) for the hosted setup.

## Project structure

```
.
├── site/                     # the whole app (this is what gets deployed)
│   ├── index.html            # single page shell
│   ├── app.js                # app logic (spelling/usage widgets, rounds, results)
│   ├── data.js               # ALL content: words, translations, usage sentences
│   ├── styles.css            # playful & bright, touch-first
│   ├── manifest.json         # PWA manifest
│   ├── sw.js                 # offline-first service worker
│   ├── icons/                # app icons (generated)
│   └── tools/                # dev-only (not deployed)
│       ├── make-icons.mjs    # Node icon generator (no Python)
│       └── smoke-test.mjs    # headless end-to-end smoke test
├── .github/workflows/
│   └── deploy-azure.yml      # auto-deploy to Azure Blob on PR merge
├── docs/
│   ├── requirements.md       # the spec
│   ├── content.md            # all drafted content, for review
│   └── deploy-azure.md       # Azure setup + GitHub Action wiring
└── README.md
```

## Content

All content lives in `site/data.js` as plain data:

- **24 words** — 12 personal (I, me, you, …) and 12 possessive (my, mine, your, …),
  each tagged with its grammatical **form** (`sub` / `obj` / `sub/obj` for personal;
  `PA` = possessive adjective, `PP` = possessive pronoun).
- **43 usage sentences** — 21 personal (subject vs object roles) and 22 possessive
  (adjective vs pronoun contrast), each with the answer, a short *why* for wrong
  taps, and an `alsoCorrect` list of grammatically-valid alternates that are kept
  out of the multiple-choice options.
- **40 there-be sentences** — is/are, Is/Are questions, isn't/aren't, any/some,
  was/were; each with its own 2-option word bank, so exactly one option is correct.

The Chinese translations and usage sentences are drafted content awaiting final
review by the tutor — see [docs/content.md](docs/content.md).

## Development

There is no build step. Two dev-only tools live in `site/tools/` (excluded from
deploys):

```bash
node site/tools/smoke-test.mjs   # launches headless Edge via CDP and checks 35 behaviors
node site/tools/make-icons.mjs   # regenerates the PNG app icons
```

The smoke test runs the real app from `file://`, plays through a full spelling and
usage round, and validates the data integrity rules (valid `forms` tags, exactly-one
correct option per usage sentence).

## Deployment

The site is hosted on **Azure Blob Storage** as a static website (`$web` container),
served over HTTPS from `*.web.core.windows.net`.

- **Automated:** [.github/workflows/deploy-azure.yml](.github/workflows/deploy-azure.yml)
  uploads `site/` to `$web` whenever a PR is merged into `master` or `develop`
  (a manual run is available in the Actions tab).
- **Manual:** `az storage blob upload-batch --account-name <name> --destination '$web' --source site --exclude-pattern 'tools/*'`

See [docs/deploy-azure.md](docs/deploy-azure.md) for the one-time Azure setup and
the required GitHub secret/variable.

## Documentation

- [docs/requirements.md](docs/requirements.md) — the full requirements specification
- [docs/content.md](docs/content.md) — all drafted content, for tutor review
- [docs/deploy-azure.md](docs/deploy-azure.md) — deployment guide
