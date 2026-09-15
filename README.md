# 🧠 Cognitive Model

> Collect what happened first. Interpret it later.

A personal research tool for collecting raw materials, observing people over time, and building evolving models of how they think.

**Online:** https://cognitivemodel.pages.dev  
**Source:** https://github.com/Zzx-LiU6/modeling

---

## Why I Built This

Most personality tools start with a theory:

> Take a test → assign a type → explain the person.

But real-world observation rarely works that way.

When studying a person, I may first encounter a conversation, an interview answer, a small behavioral detail, or something they said months ago. The meaning of that material may not be obvious at the time. Only after collecting more material can a pattern begin to emerge.

So Cognitive Model follows a different direction:

```text
Material → Observation → Pattern → Model → Theory
```

The archive comes first. The interpretation comes later.

---

## Design Principles

### Archive first

Not every material needs to become a research note.

Raw materials can simply be saved, tagged, associated with people, and revisited later.

### Interpretation comes later

The tool does not require a conclusion when a material is recorded.

A research note can begin with nothing more than several materials that seem worth looking at together.

### People and materials are many-to-many

A material can involve multiple people, while one person's profile can contain materials from many different sources.

### Research is independent from the archive

Materials are reusable source material. A research note can connect multiple materials without changing the original records.

### Theory is optional

Jungian cognitive functions are an explanatory framework, not a classification requirement.

The tool does not try to determine someone's MBTI type.

### Observation before theory

The intended direction is:

```text
Observation → Induction → Hypothesis → Theoretical explanation
```

rather than searching for evidence to confirm a predefined type.

---

## Design Tradeoffs

### Materials and research are separated

This prevents every saved material from becoming an "analysis" too early.

The cost is a more complex relationship between people, materials, and research notes.

### A research note can be incomplete

A user can save several materials together before knowing exactly what they mean.

The cost is that the system must treat an unfinished research note as a valid state rather than an error.

### People can be directly associated with materials

A material can be connected to everyone involved, independently of who is being analyzed.

This creates an important distinction:

```text
Material.personIds          → Who is involved in this material?
Analysis.subjectPersonId    → Who am I studying in this research?
```

### Jungian functions are calculated from research evidence

The cognitive-function model is derived from research records rather than being the primary data structure.

This keeps the archive useful even when the user is not thinking in terms of Jungian functions.

---

## Features

### 📚 Raw Material Archive

Save conversations, interviews, notes, and other source material without requiring an immediate interpretation.

### 👤 Person Profiles

Build individual research archives with basic information, related materials, research notes, and accumulated observations.

### 🔎 Material Library

Search and filter materials by title, source, tags, date, and related people.

### 🧩 Research Notes

Connect multiple materials and record observations, traits, excerpts, and optional theoretical interpretations.

### 🏷️ Tags & Relationships

Organize materials and connect one material to multiple people.

### 🧠 Cognitive Function Model

Optionally trace research evidence back to `Se / Si / Ne / Ni / Te / Ti / Fe / Fi`.

### 📈 Accumulated Person Model

Research findings are aggregated into an evolving model rather than a one-time personality result.

### 💾 Local Data Management

Data is stored locally and can be exported / imported as JSON.

---

## Screenshots

Screenshots will be added here.

In the meantime, you can try the live version: https://cognitivemodel.pages.dev

<!--
![Person Research Archive](./screenshots/person.png)
![Material Library](./screenshots/materials.png)
![Research Note](./screenshots/research.png)
-->

---

## Core Data Model

The core relationship is intentionally simple:

```text
Person
  │
  ├── related Materials
  │
  └── Research Notes
          │
          └── multiple Materials
```

The same material can belong to multiple people and multiple research notes.

```text
Material.personIds
    ↓
People involved in the material

Analysis.subjectPersonId
    ↓
Person being studied
```

This distinction allows the archive to preserve the original material while supporting different interpretations of it later.

---

## Tech Stack

- **Vite** — build tool
- **TypeScript** — type safety
- **Native DOM APIs** — UI rendering
- **Hash Router** — single-page routing
- **localStorage** — local persistence
- **JSON Import / Export** — backup and migration
- **Cloudflare Pages** — deployment

No React, Vue, backend, login, database, or external service is required.

---

## Project Structure

```text
src/
├── main.ts
├── router.ts
├── store.ts
├── vite-env.d.ts
│
├── types/
│   ├── enums.ts
│   └── model.ts
│
├── core/
│   ├── schema.ts
│   ├── calculations.ts
│   ├── storage.ts
│   ├── importExport.ts
│   └── migrations.ts
│
├── components/
│   ├── layout.ts
│   ├── modal.ts
│   ├── personCard.ts
│   ├── materialCard.ts
│   ├── analysisCard.ts
│   └── functionModel.ts
│
├── views/
│   ├── homeView.ts
│   ├── personFormView.ts
│   ├── personDetailView.ts
│   ├── functionDetailView.ts
│   ├── materialLibraryView.ts
│   ├── materialFormView.ts
│   ├── materialDetailView.ts
│   ├── researchFormView.ts
│   ├── researchDetailView.ts
│   └── addMaterialsView.ts
│
├── styles/
│   ├── base.css
│   ├── layout.css
│   └── components.css
│
└── utils/
    ├── id.ts
    ├── date.ts
    ├── escape.ts
    └── dom.ts
```

---

## Getting Started

```bash
# Clone the repository
git clone https://github.com/Zzx-LiU6/modeling.git
cd modeling

# Install dependencies
npm install

# Start the dev server
npm run dev
```

Build for production:

```bash
npm run build
```

---

## Known Limitations

### Raw material excerpts are still selected manually

Research notes currently require manually selecting or entering the relevant excerpt.

One direction is to let users select a fragment from the original material and create a citation from it directly.

### No automatic semantic linking

The system does not automatically discover relationships between materials.

A future direction is to assist with finding potentially related materials while keeping the final relationship under user control.

### No automatic personality typing

The current model does not attempt to infer MBTI or other personality types automatically.

Additional theoretical frameworks could be introduced later as optional analytical lenses.

### Local-first storage

Data currently lives in the browser's local storage.

Optional cloud synchronization or cross-device storage could be considered if it becomes necessary.

---

## Data & Privacy

Cognitive Model is designed as a local-first application.

Your research materials are stored in the browser rather than uploaded to a backend service.

You can export your data as JSON for backup or migration.

Because the data is stored locally, clearing browser storage will also remove the locally stored data unless it has been exported beforehand.

---

## Status

**V0.6.4 · Experimental**

The core workflow is implemented and is currently being tested with real research materials.

The project is intentionally evolving through actual use rather than trying to define the complete research workflow in advance.

---

## Philosophy

> You do not need to know what something means before you save it.

Sometimes the meaning only appears after the tenth conversation, the fifth interview, or a detail you almost forgot.

The archive comes first. The model comes later.

---

## License

MIT
