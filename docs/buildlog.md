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
- Assets: verified CC0 low-poly 3D packs only, preferably glTF/GLB. Three Kenney packs are allowed: Blocky Characters, Food Kit and Nature Kit. This lifts the brief's limit of one primary plus one supporting pack. Code-built primitives are allowed as fallbacks. No AI-generated art. Only assets actually used get recorded in `CREDITS.md` (directed, Session 2).
- Design source: `docs/GDD.md`, reviewed 14 October 2026. Runner = a barista (Kenney Blocky Character); obstacle = a beach parasol or deckchair; English only (directed / proposed → accepted, Session 2).
- Models (packs checked 14 October 2026, all three CC0): runner = `character-f.glb` (teal shirt) with no apron for now; coffee pickup = `cup-coffee.glb` (Food Kit), with `frappe.glb` parked as a possible add-on; obstacle = a primitive parasol, because no pack has a parasol or deckchair; scenery = Nature Kit `tree_palm*` / `rock_*` (directed, Session 3).
- Node: `.nvmrc` pins Node 24 for the Cloudflare build (Vitest 5 needs Node ≥ 22.12) (Claude's call, Session 3).
- Fail rule: the stumble. The first hit slows the runner to 70% for a 5 s window; a second hit inside that window ends the run. Both numbers are starting points to tune (directed, Session 2).
- Scoring: distance plus a coffee bonus (+1 per metre, +10 per cup, both to tune) (proposed → accepted, Session 2).
- Audio: a few CC0 SFX, muted by default; first on the cut list (directed, Session 2).
- Hosting: Cloudflare Pages at the default `*.pages.dev` address, with the code on GitHub. No custom domain (directed, Session 2).
- Test devices: an iPhone 14 and/or a Samsung Galaxy S20 FE (directed, Session 2).
- Toolchain: Vite + `three` from npm + Vitest, in plain JavaScript. Test command `npm test`; build `npm run build` → `dist/` (directed, Session 2).
- Execution plan: `docs/execution-plan.md`, Phases 0–6, each ending in a committable, playable state. Game logic lives in pure `src/game/` modules with no Three.js or DOM imports, so it can be unit-tested (proposed → accepted, Session 2).
- Branding: an assumed palette in `docs/brisa-cafe-brand-palette.md`: Brisa Turquoise `#168F9C` (primary/CTA), Deep Ocean `#174B64` (text/HUD), Sunlit Sand `#F3DFBB` (environment), Sunset Coral `#E87F63` (coffee pickups/highlights), Sea Salt White `#FCFAF4` (panels) (directed, brief).
- Nice-to-haves, only once the core game is finished: a device-local best score and a second obstacle configuration. Cut first: extra scenery, best score, extra patterns (directed, brief).
- Time box: at most 3 focused days. Day 1 is the scene, camera, CC0 pack, swipes and lanes. Day 2 is obstacles, pickups, collisions, scoring and the overlay. Day 3 is styling, sharing, portrait QA, deployment and credits (directed, brief).
- Agent process: the rules in `CLAUDE.md` → "Agent Behavior": surgical edits, verify through CLI output before claiming a fix, simplicity over abstraction, ask instead of guessing, present 2–3 options with trade-offs when several patterns are valid (directed, Session 1).
- Build log: lives at `docs/buildlog.md` in attributed voice and replaces the old `docs/build-log-template.md` (proposed → accepted, Session 1).

## Part 2 — Sessions

### Open issues

(Keep current; every session updates this list.)

- Phase 0 phone check pending (Session 3): `740a757` is pushed and Cloudflare Pages is connected (build `npm run build`, output `dist`). I still need to confirm that the Cloudflare build succeeded and that the `*.pages.dev` URL shows the spinning turquoise cube in a 9:16 column on a phone. Claude Code asks before every push.
- Coffee cup readability (Session 3): `cup-coffee.glb` is a white ceramic cup, not the Sunset Coral the palette doc reserves for pickups, so it may not stand out on Sunlit Sand. Judge it on the phone in Phase 4. If it doesn't stand out, the options are the parked `frappe.glb`, a coral primitive, or a coral marker under the cup.
- Parked ideas (Session 3, mine): a Brisa Turquoise apron on the barista ("no apron for now, maybe later"; all of the character's colour comes from one texture, so it would need an overlay box or a recoloured torso), and `frappe.glb` as a takeaway-cup add-on ("keep frappe as a potential addon for later").
- Kenney pack downloads are outside the repo (Session 3): the extracted packs sit in a session scratchpad that won't persist. In Phase 4, download them again from the URLs in the Session 3 entry and copy only the chosen GLBs and their textures into `public/models/`.
- Tuning values unconfirmed (Session 2): stumble 5 s / 70%, start speed, acceleration, cap and spawn spacing are GDD starting points. They live in `src/game/config.js` from Phase 1. Judge them in Phase 2 playtests (a first run should last about 30–60 s) and on the test phones in Phase 5.

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

### Session 2 — Wednesday 14 October 2026 — GDD, first commit and phased execution plan

- **Goal:** Turn the brief into a reviewed GDD, then an execution plan, before any code. This came from me, following on from Session 1's next step.
- **Direction given:** I said "lets build a game. please find the BRIEF in the docs. read it and ask questions. first lets create a game design document (gdd), which I will review, then based on that gdd we will create an execution plan." I set hosting: "the game will be hosted on Cloudflare Pages and the code on is on GitHub (already have the repo setup)". After the review I asked: "once done with the gdd update please do an initial commit". Then: "have a look at the GDD and the project and lets formulate a plan of execution to build the game in phases (break down the plan into incremental features)."
- **Course corrections:**
  - Fail rule: Claude Code offered one hit, 3 hearts or a fixed 60 s timer. I answered "Use a Stumble Mechanic instead": the first hit is a stumble, and a second hit inside the stumble window ends the run.
  - Audio: Claude Code recommended no audio, since the brief doesn't mention it. I chose a few CC0 SFX, muted by default, and accepted the added scope.
  - Asset packs: Claude Code suggested keeping the brief's two-pack limit. I said "use 3 packs" (Blocky Characters + Food Kit + Nature Kit).
  - Runner: I kept the barista and turned down the customer-chasing-their-order idea: "customer chasing order would not send the right message".
- **What was built:** (1) `docs/GDD.md`, reviewed, with the review answers in §13. (2) The initial commit `39fdef4` on `main` (brief, palette, GDD, build log, `CLAUDE.md`). (3) `docs/execution-plan.md`: Phases 0–6 (scaffold and deploy pipeline → scene and lanes → core loop → screens and share → Kenney models and credits → polish and QA → nice-to-haves), each with steps and a verification check, mapped onto the brief's 3-day box. (4) Build log: Part 1 rewritten for this session's decisions, Open issues refreshed, and the CLAUDE.md test command set to `npm test`.
- **Decisions:**
  - Hosting on Cloudflare Pages at the default `*.pages.dev` address (my answer was "will go with default"), with the code on GitHub. [directed]
  - Stumble numbers start at 5 s and 70%: "i will adjust later based on results". [directed]
  - Test phones: "older iphone like iphone 14 and/or a Samsung s20fe". [directed]
  - Score = distance + coffee bonus; English only; runner = a Kenney Blocky Character; obstacles = beach parasols or deckchairs. [proposed → accepted]
  - Toolchain: Vite + `three` from npm + Vitest. The alternatives were plain ES modules with a CDN import map (no build step, but a runtime CDN dependency and no test runner) and Vite without tests. [proposed → accepted]
  - The plan is copied into `docs/execution-plan.md` and committed, since Claude Code's own plan file sits outside the repo and doesn't persist. The alternative was to keep the plan file only. [proposed → accepted]
  - Game logic in pure `src/game/` modules (lanes, speed, spawner, collision, stumble, score, run) with no Three.js or DOM imports, so Vitest can test them without WebGL. [Claude's call, in the approved plan]
  - The Kenney asset check comes in Phase 0, although models are only swapped in during Phase 4, because GDD §7 leaves several models unverified and the primitive fallbacks should be decided before gameplay tuning. [Claude's call, in the approved plan]
  - Phase 6 build order: best score → SFX → extra scenery → second arrangement (cheapest first), cutting in GDD §11 order if time runs short. [Claude's call, in the approved plan]
- **What broke or was wrong:** None.
- **Hand edits:** None seen. The working tree was clean (`git status`) before this session's planning edits.
- **Testing / playtest notes:** None. No code exists yet, and `npm test` was not run because the project isn't scaffolded.
- **Learned:** Asking which toolchain to use before writing the plan also fixed the test command, so each phase's verification step could name a real command instead of a placeholder.
- **Where things stand / next step:** `main` holds `39fdef4` plus this session's commit (`docs/execution-plan.md`, build log, `CLAUDE.md`), not pushed. No code yet. Next is Phase 0 of `docs/execution-plan.md`: scaffold Vite + `three` + Vitest, the 9:16 page with palette tokens, a renderer with the DPR cap and a placeholder cube, the Kenney pack check, and the Cloudflare Pages connection (mine). Done when `npm test` and `npm run build` pass and the `*.pages.dev` URL shows the cube on a phone.
- **Showcase line:** I had Claude Code turn a one-paragraph client email into a reviewed GDD, steering the fail rule to a forgiving "stumble" and keeping the runner a barista, then into a seven-phase execution plan where every phase ends playable and testable.

### Session 3 — Wednesday 14 October 2026 — (in progress)

- [direction] "lets continue with the execution, move to phase 0, i've already created the cloudflare pages with the npm run build command targeting the dist folder, waiting for actual things to build" — starts Phase 0; the Cloudflare Pages project is connected (build `npm run build`, output `dist`).
- [note] Phase 0 scaffold built: `package.json` (three 0.186.1, vite 8.3.4, vitest 5.0.4), `.nvmrc` (24), `.gitignore`, `index.html`, `src/style.css` (palette tokens, 9:16 column, `touch-action: none`), `src/render/scene.js` (WebGL2 check, DPR cap 2, placeholder cube), `src/main.js`, `tests/smoke.test.js`. `npm test`: 1 file, 1 test passed. `npm run build`: JS 528.51 kB (131.39 kB gzip), with Vite's over-500 kB warning left in place. `vite preview` served the page and the bundle with HTTP 200. Committed as `740a757` and pushed to `origin/main` after I chose "Push now".
- [note] Kenney check (subagent, downloads in the scratchpad only). Blocky Characters 2.0: 18 GLBs (the page says 20), one external texture per character, licence "Creative Commons Zero, CC0". Food Kit 2.0: 200 GLBs sharing `Textures/colormap.png`, CC0. Nature Kit 2.1: 329 GLBs with material colours and no textures, CC0. Download URLs: https://kenney.nl/media/pages/assets/blocky-characters/8369c0cf30-1749547469/kenney_blocky-characters_20.zip, https://kenney.nl/media/pages/assets/food-kit/83086fa91c-1719418518/kenney_food-kit.zip, https://kenney.nl/media/pages/assets/nature-kit/37ac38a37b-1677698939/kenney_nature-kit.zip. No parasol, deckchair or takeaway cup in any pack. Characters: 6 box meshes (72 triangles) with one shared material and a texture atlas, no skin, 27 rigid node animations (unused; the brief rules out an animation system).
- [decision] Runner = character f, picked from the four Claude Code offered (b, c, f, q), which was its recommended option.
- [decision] Apron: "no apron for now, maybe later". Claude Code had recommended a code-built overlay box.
- [decision] Coffee pickup: "use cup-coffee and keep frappe as a potential addon for later." Claude Code had recommended comparing a coral primitive with `frappe.glb` on the phone in Phase 4.
