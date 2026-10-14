# Brisa Dash — Build Log

Running record of how this project was built with Claude Code. "I" is the developer; Claude Code is named in the third person.

## Part 1 — Decisions locked so far

- Project framing: a fictional-client exercise for "Brisa Café" (owner "Lucía", invented). The scope is a self-directed prototype, not an approved commission. Source of truth: `docs/BRIEF_brisa-dash.md` (directed, brief).
- Goal: a branded, genuinely 3D endless runner with 30–60-second runs that a first-time player can control without explanation, ending with a score and link they can copy or share (directed, brief).
- Platform: Three.js + HTML5/CSS in the browser, mobile portrait (9:16), WebGL2-capable iOS/Android browsers, no install, account or backend. Phaser is not used (directed, brief).
- Core loop: swipe between exactly three fixed lanes on a low-poly seaside promenade, collect coffee pickups, dodge approaching obstacles, score, retry immediately (directed, brief).
- Gameplay scope: one static character or simple pawn, one obstacle type, one coffee collectible, gradual speed increase. Collisions are lane-plus-distance checks, not a physics engine. Out of scope: jumping, free movement, rigs or animation, physics, procedural levels, post-processing, dynamic lighting, multiple environments or levels, sign-in, analytics, prizes (directed, brief).
- Scene: fixed perspective camera looking down the track, flat colours and ambient lighting, one short repeating stretch of track. Objects are recycled; no infinite world is built (directed, brief).
- UI: HTML/CSS overlay for the start screen, gesture hint, score, game over, one-tap retry, a text logo and a visible Credits link on the start and end screens (directed, brief).
- Sharing: Web Share API when available, otherwise copy text plus link. No leaderboard (directed, brief).
- Engineering: canvas and camera resize for portrait phones, capped device pixel ratio, few draw calls, keyboard arrows for desktop testing, HTTPS deployment. Target is smooth play near 30 FPS on the tested phone, reported honestly (directed, brief).
- Assets: verified CC0 low-poly 3D packs only, preferably glTF/GLB. Candidates are Kenney Nature Kit, Food Kit and Blocky Characters; use one primary pack plus at most one supporting pack. Code-built primitives are allowed as fallbacks. No AI-generated art. Only assets actually used get recorded in `CREDITS.md` (directed, brief).
- Branding: an assumed palette in `docs/brisa-cafe-brand-palette.md`: Brisa Turquoise `#168F9C` (primary/CTA), Deep Ocean `#174B64` (text/HUD), Sunlit Sand `#F3DFBB` (environment), Sunset Coral `#E87F63` (coffee pickups/highlights), Sea Salt White `#FCFAF4` (panels) (directed, brief).
- Nice-to-haves, only once the core game is finished: a device-local best score and a second obstacle configuration. Cut first: extra scenery, best score, extra patterns (directed, brief).
- Time box: at most 3 focused days. Day 1 is the scene, camera, CC0 pack, swipes and lanes. Day 2 is obstacles, pickups, collisions, scoring and the overlay. Day 3 is styling, sharing, portrait QA, deployment and credits (directed, brief).
- Agent process: the rules in `CLAUDE.md` → "Agent Behavior": surgical edits, verify through CLI output before claiming a fix, simplicity over abstraction, ask instead of guessing, present 2–3 options with trade-offs when several patterns are valid (directed, Session 1).
- Build log: lives at `docs/buildlog.md` in attributed voice and replaces the old `docs/build-log-template.md` (proposed → accepted, Session 1).

## Part 2 — Sessions

### Open issues

(Keep current; every session updates this list.)

- Nothing committed yet (Session 1): `main` has no commits. `CLAUDE.md` and everything in `docs/` are untracked. Close it with a first commit when I ask for one.
- No toolchain or test command yet (Session 1): the brief doesn't say whether to use a bundler (e.g. Vite) or plain ES modules with an import map, nor how to run tests. Under the CLAUDE.md "Surface Trade-offs" rule, present options before scaffolding. Then fill in the test command in the CLAUDE.md build-log block.
- CC0 pack not chosen (Session 1): the brief lists Kenney Nature Kit, Food Kit and Blocky Characters as candidates. Choose on Day 1, verify the CC0 licence on the pack page and start `CREDITS.md`.
- Hosting not chosen (Session 1): the brief requires HTTPS deployment but names no host. Decide by Day 3.

### Session 1 — Wednesday 14 October 2026 — Agent rules and build log set up

- **Goal:** Before any code, give Claude Code project-wide working rules and set up a build log, both at my request.
- **Direction given:** I asked Claude Code to "add these guidelines to this project" and pasted five rules: Surgical Edits, Verification First, Simplicity Over Architecture, No Guessing, Surface Trade-offs. I then ran `/build-log init`, chose the attributed voice and had the old `docs/build-log-template.md` deleted.
- **Course corrections:** None.
- **What was built:** (1) `CLAUDE.md` at the repo root with an "Agent Behavior" section that holds the five rules word for word. (2) `docs/buildlog.md`, with Part 1 seeded from `docs/BRIEF_brisa-dash.md` and `docs/brisa-cafe-brand-palette.md`. (3) A "Build log" block appended to `CLAUDE.md`, so every session starts and ends with the log. (4) `docs/build-log-template.md` deleted.
- **Decisions:**
  - The rules go in a root `CLAUDE.md`, which Claude Code loads automatically every session, rather than in a doc file it would have to be told to read. [Claude's call]
  - Attributed voice. Anonymous was the alternative, but nothing in the project needs it. [proposed → accepted]
  - Delete the old template rather than keep two formats, since the new entry format covers all its fields. [proposed → accepted]
  - Log path `docs/buildlog.md`, next to the brief. [Claude's call]
- **What broke or was wrong:** None.
- **Hand edits:** None this session. `docs/BRIEF_brisa-dash.md` and `docs/brisa-cafe-brand-palette.md` were already in the repo before the session started.
- **Testing / playtest notes:** None. No code exists yet.
- **Learned:** Writing the working rules and the brief down before the first line of code gives every later session the same starting point. Without them, each session would have to infer the rules again.
- **Where things stand / next step:** Branch `main` has no commits; `CLAUDE.md` and `docs/` are uncommitted. No code, toolchain or tests yet. Next is Day 1 of the brief: present toolchain options (see Open issues), then set up the Three.js scene and camera, pick and import one CC0 pack, and add swipe and arrow-key switching between three fixed lanes.
- **Showcase line:** Before writing any game code, I gave Claude Code standing rules (small edits, verify before claiming, ask instead of guessing) and set up a build log, so every session starts from the brief and the last session's notes.

### Session 2 — Wednesday 14 October 2026 — (in progress)

- [direction] "lets build a game. please find the BRIEF in the docs. read it and ask questions. first lets create a game design document (gdd), which I will review, then based on that gdd we will create an execution plan." — sets the order: questions → GDD for my review → execution plan.
- [decision] "the game will be hosted on Cloudflare Pages and the code on is on GitHub (already have the repo setup)" — closes the hosting open issue.
- [correction] Claude Code offered one-hit / 3 hearts / fixed 60 s timer as the fail rule; I answered "Use a Stumble Mechanic instead." Then chose: first hit = stumble, a second hit within the stumble window ends the run.
- [decision] GDD lives at docs/GDD.md; score = distance + coffee bonus; English only; runner = Kenney Blocky Character; obstacles = beach umbrellas/chairs (all accepted from Claude Code's recommended options).
- [decision] Audio: a few CC0 SFX, muted by default — I picked this over Claude Code's recommended "no audio" (adds scope beyond the brief).
- [decision] Claude Code drafted docs/GDD.md for my review; execution plan waits until the GDD is approved.
- [decision] GDD review answers: "use 3 packs" (Blocky Characters + Food Kit + Nature Kit; I turned down Claude Code's suggestion to keep the brief's two-pack limit); share link "will go with default" (*.pages.dev); runner stays a barista — "customer chasing order would not send the right message"; stumble 5 s / 70% accepted — "i will adjust later based on results"; test phones "older iphone like iphone 14 and/or a Samsung s20fe".
- [direction] "once done with the gdd update please do an initial commit"
