# Instructions — How to Start and Build Any New Project (Master Protocol)

> **How to use this file:** Give this file to Claude at the start of a
> new project, along with your idea/description of what you want to
> build. This file tells Claude the full process to follow — from
> turning your idea into real docs, all the way through systematic,
> verified, deployed implementation — the same way
> [the wildfire risk platform project](/home/shaikhfardin/Final%20Year%20Project)
> was built.
>
> Companion files (in this same `~/templates/` folder):
> - `docs/PRD_template.md`
> - `docs/architecture_template.md`
> - `docs/api-docs_template.md`
> - `docs/tech-stack_template.md`
> - `docs/CONTEXT_template.md`
> - `docs/TEST_template.md`
> - `systematic-build-template.md` — the detailed phase-by-phase
>   checklist referenced in Stage 2 below

---

## Stage 0 — Receive the Idea

When the user gives an idea, do not start writing code. First:

1. Restate the idea back in your own words to confirm understanding.
2. Ask only the clarifying questions that would materially change the
   architecture or scope (target platform, who it's for, any hard
   constraints like budget/timeline, any tech the user already wants).
   Don't over-ask — a handful of sharp questions, not twenty.
3. Once scope is reasonably clear, move to Stage 1.

## Stage 1 — Turn the Idea Into Real Docs (before any code)

Create a `docs/` folder in the new project and produce these files, in
this order, each one informing the next. Use the matching template file
from this `~/templates/docs/` folder as the starting structure — fill
in every bracketed placeholder with real content derived from the idea
and the clarifying answers, don't leave any section generic/empty.

1. **`docs/PRD.md`** (from `PRD_template.md`) — the idea becomes
   concrete features, users, goals, non-goals, and a first list of
   external data sources/dependencies this will need (not yet verified
   — that's Stage 2).
2. **`docs/architecture.md`** (from `architecture_template.md`) —
   decide the component shape and a rough DB schema.
3. **`docs/api-docs.md`** (from `api-docs_template.md`, if the project
   has an API/backend) — define the full contract, endpoints and
   response shapes, before writing any implementation.
4. **`docs/tech-stack.md`** (from `tech-stack_template.md`) — pick real
   technologies with real reasoning tied to the PRD's actual
   constraints, not defaults picked out of habit.
5. **`CONTEXT.md`** (from `CONTEXT_template.md`, at the project root) —
   the living status file. Create it now even though almost every
   section will say "not started yet" — it's the file every future
   session reads first.
6. **`TEST.md`** (from `TEST_template.md`, at the project root) — even
   mostly empty at this point, this is where verified commands will
   accumulate as the project is built.

Do not proceed to Stage 2 until all of these exist and the user has
had a chance to review/correct them — cheap to fix a doc, expensive to
fix code built on a wrong assumption.

## Stage 2 — Build It Systematically

Now follow `systematic-build-template.md`'s phases in order, using the
just-created docs as the source of truth for what to build:

- Phase 0 is already done (you just did it in Stage 1).
- Phase 1: verify every external dependency listed in the PRD/tech-stack
  with a real call — update those docs with ✅/❌ based on what's
  actually confirmed, not assumed. This can change the architecture —
  that's fine, update the docs again if so.
- Phases 2 onward: build the skeleton, deploy early, set up real
  infrastructure, build incrementally, handle the "smart"/complex part
  properly, build the UI with real visual verification, deploy
  everything, verify production.

For **every single change**, however small, follow the **Per-Change
Loop** exactly as defined in `systematic-build-template.md`:
write → test directly → commit with a real message → push → deploy →
verify in production → loop back immediately if verification finds a
problem.

## Stage 3 — Keep Everything in Sync, Continuously

This is not a one-time step — do this throughout the entire project,
after every real change:

1. Update `CONTEXT.md`'s "Last worked on" line and relevant checklists
   the moment something becomes real (not "written" — verified).
2. Update `docs/api-docs.md` the moment an endpoint's actual response
   shape changes from what was documented (including "this field is
   still a placeholder" notes, and removing them once real).
3. Update `docs/tech-stack.md` the moment a dependency's status changes
   (planned → verified → live).
4. Add a row to `TEST.md`'s failure-points table every time a real bug
   is found and fixed, and add its real verified command elsewhere in
   the file the first time it's actually run successfully.
5. If a limitation is discovered (e.g. a model that doesn't generalize
   the way first assumed, a data source that turns out incomplete),
   write it down explicitly in `CONTEXT.md` — don't let it become a
   silent, undocumented gap.

## Stage 4 — Continuing Work in a Later Session

When picking this project back up later (new session, possibly a
different Claude instance):

1. Read `CONTEXT.md` first, in full — especially "Last worked on" and
   "Current WIP & Bugs."
2. Read `docs/instructions.md` if the project has one (a project-specific
   history doc, distinct from this master template — see note below).
3. Resume at Stage 2 (systematic build), continuing the Per-Change Loop
   for every new change, and continuing Stage 3's sync habits.

---

## Note: Two Different "instructions.md" Files

- **This file** (`~/templates/instructions.md`) is the **generic master
  protocol** — reusable across any project, contains no project-specific
  details.
- Each individual project should end up with its own
  **`docs/instructions.md`** — a **project-specific history** document
  (what was actually built, in what order, what real bugs were found and
  fixed, with that project's real names/tools/APIs). Create this file
  early in the project (can start as a stub in Stage 1, or wait until
  meaningful history exists) and keep appending to it as work happens —
  don't write it all at once at the end from memory, since details get
  lost. It becomes valuable both as documentation and as raw material for
  a report/thesis if one is needed.
