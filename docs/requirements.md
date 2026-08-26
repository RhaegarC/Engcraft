# Pronoun Trainer — Requirements Specification

**Status:** Draft (shared understanding reached via `/grill-me`; pending user review of content)
**Date:** 2026-08-25

---

## 1. Overview

A simple, playful static web app — **"Pronoun Trainer"** — that gives Chinese-speaking children practice with English **personal** and **possessive** pronouns. It is used in a classroom/tutoring setting on iPhones/iPads and ships as a **PWA**: installable to the home screen and fully usable offline.

## 2. Audience & Context

| Aspect | Value |
|---|---|
| Learners | Chinese-speaking kids (L1 = Chinese), ages 7–11, EFL |
| Usage context | Classroom / tutoring, teacher-led |
| Devices | iPhone and iPad (iOS Safari) |
| Interface language | English-only UI; **Chinese appears only in the 24 spelling prompts** |
| Competition context | Not a public product; purpose-built for a tutor's classes |

## 3. Scope

### 3.1 In scope

- One-page static site with a **2×2 grid of four activity cards**:
  1. Personal pronouns — Spelling
  2. Personal pronouns — Usage
  3. Possessive pronouns — Spelling
  4. Possessive pronouns — Usage
- Word lists, practice rounds, scoring and feedback
- Runtime TTS audio (Web Speech API, `speechSynthesis`)
- PWA: manifest, offline-first service worker, app icons, iOS standalone meta tags

### 3.2 Out of scope (explicitly excluded)

- No accounts, login, or cross-session progress tracking
- No timers, streaks, levels, or gamification beyond an end-of-round score + confetti
- No extra pronoun sets or grammar topics (object-role usage is exercised inside the personal module, not as a separate module)
- No backend, database, framework, or build tooling

## 4. Content

### 4.1 Word lists

**Module 1 — Personal pronouns** (12 words):

```
I, me, you, he, him, she, her, it, we, us, they, them
```

**Module 2 — Possessive pronouns** (adjectives + pronouns, 12 words):

```
my, mine, your, yours, his, her, hers, its, our, ours, their, theirs
```

Notes:

- `you` and `it` are the same word in subject and object roles.
- The source list repeated `your, yours` (2nd-person singular and plural are the same words) — treated as **one pair, 12 distinct words**.
- The possessive module deliberately mixes adjective (`my`) and pronoun (`mine`) forms so usage exercises can contrast them.
- Each word carries a **`forms` tag** in the data: personal words are `sub` / `obj` / `sub/obj`; possessive words are `poss-adj` (used before a noun) or `poss-pron` (stands alone). This records the subject/object and adjective/pronoun contrast explicitly, per word.

### 4.2 Spelling prompts

- Each of the 24 words has a **Chinese translation** prompt (e.g. 我 → I / me, 我的 → my / mine, 她的 → her / hers).
- The prompt is **Chinese text + spoken English (TTS)** together; the child types the exact English word they hear.
- Chinese resolves meaning; audio resolves which word in a same-meaning pair (我 = I *or* me).
- Translations are drafted by the authoring agent and **reviewed by the user** before release.

### 4.3 Usage sentences

- English sentences with a blank per pronoun, answered via multiple choice.
- Personal module exercises **subject vs object** roles (e.g. "___ am a student." → *I*; "This is for ___." → *me*).
- Possessive module exercises **adjective vs pronoun** contrast (e.g. "This is ___ book." → *my*; "This book is ___." → *mine*).
- Sentences are drafted by the authoring agent and **reviewed by the user**; simple, age-appropriate, class-safe.
- The usage sentence bank is **larger than one-per-word**: the personal module has 21 sentences and the possessive module has 22, so each round's 10 sentences vary. Every sentence records its grammatically-valid alternates in `alsoCorrect` so the runtime keeps them out of the four options (exactly one correct option).

## 5. Functional Requirements

### FR-1 Site structure

- **FR-1.1** A single page shows a 2×2 grid of four activity cards (module × feature), each tappable.
- **FR-1.2** Starting any activity is **one tap**; no multi-level navigation.

### FR-2 Spelling activity (both modules)

- **FR-2.1** Prompt = Chinese translation + spoken English via TTS.
- **FR-2.2** The English word is **never shown before answering** (retrieval from memory).
- **FR-2.3** Input is free typing with `autocorrect="off"`, `autocapitalize="off"`, `spellcheck="false"`.
- **FR-2.4** Immediate feedback: correct = green; incorrect = red + the correct spelling is revealed.
- **FR-2.5** Matching is case-insensitive; leading/trailing whitespace trimmed.

### FR-3 Usage activity (both modules)

- **FR-3.1** A sentence with a blank + 3–4 pronoun options; tap to answer.
- **FR-3.2** Immediate feedback; incorrect answers show a short "why" (e.g. *me* is for receiving, *I* is for doing).

### FR-4 Rounds & scoring

- **FR-4.1** Each round draws **10 random items** from the module's pool, shuffled: spelling draws from the module's 12 words; usage draws from the module's usage-sentence bank (personal: 21 sentences, possessive: 22).
- **FR-4.2** End-of-round: score ("You got 8/10!") + a **review missed** button that re-runs missed items.
- **FR-4.3** Confetti on round completion.

### FR-5 Audio (Web Speech API)

- **FR-5.1** Use `speechSynthesis` to speak words in English.
- **FR-5.2** iOS handling: speech is triggered by an explicit tap (satisfies the user-gesture requirement).
- **FR-5.3** Pick the best available English voice; implement a workaround for the iOS utterance-stopping bug.
- **FR-5.4** If no English voice is available, show a friendly message directing the user to download the English voice; the rest of the app remains usable.

### FR-6 PWA

- **FR-6.1** Web App Manifest (`name`, icons 192/512, `display: standalone`, theme/bg colors).
- **FR-6.2** Service worker with **offline-first** caching of all app assets; the app runs fully offline after first load.
- **FR-6.3** iOS meta tags: `apple-touch-icon`, `apple-mobile-web-app-capable`, `apple-mobile-web-app-status-bar-style`.
- **FR-6.4** App icon generated to match the playful & bright visual style (replaceable later).

## 6. Non-Functional Requirements

- **NFR-1** Devices: iOS Safari on iPhone and iPad; touch-first, **≥48px tap targets**.
- **NFR-2** Visual: **playful & bright** — rounded cards, emoji, friendly colors, large readable type.
- **NFR-3** Simplicity: plain HTML/CSS/JS; no framework, no build step.
- **NFR-4** Performance: static assets, fast first paint, **no external runtime dependencies**.
- **NFR-5** Offline: fully functional after first visit (service worker).
- **NFR-6** Hosting: deployed over **HTTPS** (required for service workers) — GitHub Pages, Netlify, or Cloudflare Pages.
- **NFR-7** Maintainability: one shared stylesheet; reusable **spelling** and **usage** widgets driven by a word-data structure; all content (words, translations, sentences) kept as data, separate from code.

## 7. Technical Approach

- **Structure:** single `index.html` + shared CSS + a small JS bundle, plus `manifest.json`, `sw.js`, and icon assets.
- **Widgets:** two reusable components — `SpellingWidget` and `UsageWidget` — parameterized by a word list; both modules reuse the same code.
- **Data:** word lists, Chinese translations, usage sentences, and multiple-choice distractors defined as data structures.
- **Audio:** native `speechSynthesis`; no audio assets.
- **Offline:** service worker caches the app shell and all assets on first load.

## 8. Accepted Risks (signed off during design)

1. **Free-typing on iOS:** despite `autocorrect="off"`, iOS autocorrect and a Chinese Pinyin IME can still interfere. Mitigation: the tutor keeps devices on an English-capable keyboard.
2. **Runtime TTS on iOS:** voices depend on what is downloaded to the device; offline only downloaded voices work, and some devices may lack a clear English voice. Mitigation: voice check + friendly fallback message.

## 9. Acceptance Criteria (definition of done)

- [ ] Four activity cards render in a 2×2 grid on iPhone portrait and iPad.
- [ ] Spelling: shows Chinese + speaks the word; typing the correct word marks green; a miss marks red and reveals the spelling.
- [ ] Usage: sentence-with-blank; tapping the correct pronoun marks green; wrong answers show an explanation.
- [ ] Each round serves exactly 10 randomly-shuffled words from the module; score + review-missed works; confetti on completion.
- [ ] All 24 words respond with clear, correct English TTS; a missing-voice fallback message appears when no English voice exists.
- [ ] PWA installs via Add to Home Screen with a matching icon, launches standalone, and works fully offline after first load (airplane-mode test).
- [ ] No console errors; autocorrect attributes present on every spelling input.
- [ ] The 24 Chinese translations and the usage sentences have been reviewed and approved by the user.

## 10. Open Items

- [ ] User review of drafted usage sentences and Chinese translations.
- [ ] Hosting target selection (any free HTTPS static host).
- [ ] App icon approval.

---

## Decision log (from the `/grill-me` session)

| # | Decision | Choice |
|---|----------|--------|
| 1 | Learner type | EFL — non-native, Chinese L1 |
| 2 | Age range | 7–11 |
| 3 | Context | Classroom / tutoring |
| 4 | Interface language | English-only; Chinese only in spelling prompts |
| 5 | Site shape | Single page, 2×2 grid of four activity cards |
| 6 | Modules | Personal pronouns (12) + Possessive pronouns (12) |
| 7 | Spelling interaction | Free typing |
| 8 | Usage interaction | Multiple choice |
| 9 | Spelling prompt | Chinese text + spoken audio (disambiguates 我 → I/me) |
| 10 | Audio strategy | Runtime TTS (`speechSynthesis`) |
| 11 | Devices | iPhone / iPad |
| 12 | Rounds | Random 10 of 12, shuffled |
| 13 | Feedback | Instant green/red; reveal on miss; score + retry-missed; confetti |
| 14 | Visual style | Playful & bright |
| 15 | Content authoring | Agent drafts, user reviews |
| 16 | PWA | Required — offline-first, installable, HTTPS hosting |
