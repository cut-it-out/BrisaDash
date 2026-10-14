# Brisa Dash — Build Log

Running record of how this project was built with Claude Code. "I" is the developer; Claude Code is named in the third person.

## Part 1 — Decisions locked so far

- Project framing: a fictional-client exercise for "Brisa Café" (owner "Lucía", invented). The scope is a self-directed prototype, not an approved commission. Source of truth: `docs/BRIEF_brisa-dash.md` (directed, brief).
- Goal: a branded, genuinely 3D endless runner with 30–60-second runs that a first-time player can control without explanation, ending with a score and link they can copy or share (directed, brief).
- Platform: Three.js + HTML5/CSS in the browser, mobile portrait (9:16), WebGL2-capable iOS/Android browsers, no install, account or backend. Phaser is not used (directed, brief).
- Core loop: swipe between exactly three fixed lanes on a low-poly seaside promenade, collect coffee pickups, dodge approaching obstacles, score, retry immediately (directed, brief).
- Gameplay scope: one static character or simple pawn, one obstacle type, coffee collectibles (the brief asked for one; three kinds since Session 8, see Pickups), gradual speed increase. Collisions are lane-plus-distance checks, not a physics engine. Out of scope: jumping, free movement, rigs or animation, physics, procedural levels, post-processing, dynamic lighting, multiple environments or levels, sign-in, analytics, prizes (directed, brief).
- Scene: fixed perspective camera looking down the track, flat colours and ambient lighting, one short repeating stretch of track. Objects are recycled; no infinite world is built (directed, brief).
- UI: HTML/CSS overlay for the start screen, gesture hint, score, game over, one-tap retry, a text logo and a visible Credits link on the start and end screens (directed, brief).
- Sharing: Web Share API when available, otherwise copy text plus link. No leaderboard (directed, brief).
- Engineering: canvas and camera resize for portrait phones, capped device pixel ratio, few draw calls, keyboard arrows for desktop testing, HTTPS deployment. Target is smooth play near 30 FPS on the tested phone, reported honestly (directed, brief).
- Assets: verified CC0 low-poly 3D packs, preferably glTF/GLB, plus one CC BY 4.0 exception, the takeaway cup (directed, Session 8; GDD §13 item 6). Three Kenney packs are allowed: Blocky Characters, Food Kit and Nature Kit. This lifts the brief's limit of one primary plus one supporting pack (directed, Session 2). City Kit (Suburban) and Watercraft Kit were added for houses and boats, and three Kenney CC0 sound packs (Interface Sounds, Impact Sounds, Digital Audio) for sound, making 9 credited packs (directed, Session 11). Code-built primitives are allowed as fallbacks. No AI-generated art. Only assets actually used get recorded in `CREDITS.md`.
- Design source: `docs/GDD.md`, reviewed 14 October 2026. Runner = a barista (Kenney Blocky Character); obstacle = a beach parasol or deckchair; English only (directed / proposed → accepted, Session 2).
- Models (all CC0 except the takeaway cup): runner = `character-f.glb` (teal shirt), 1.5 m, with no apron for now (directed, Session 3). Obstacles = three looks with one behaviour, picked per obstacle by `obstacleMix`: a primitive parasol over a lounger 50%, a code-built round café table with two stools in front 25%, a code-built café A-frame menu board 25%, each obstacle turned clockwise or counter-clockwise at random (parasol and table 20°, board 30°); obstacles are never coral, since coral means a pickup. The lounger's backrest leans back (fixed Session 12) (new looks directed, Session 11; table and board picked from mock-ups by me, Session 12). Scenery = 24 pieces repeating every 80 m: 6 Nature Kit palms, 4 sandy rocks, 6 `stone_*` tinted gray, 5 City Kit (Suburban) villas with terracotta roofs on the right, 3 Watercraft Kit boats on the sea; plus 4 code-built seagulls, `seagullCount` 0 turns them off (directed, Session 11; picks Claude's call).
- Pickups: `cup-coffee.glb` tinted Sunset Coral (0.3 m, +10), the CC BY takeaway cup recoloured with a Sunset Coral body and Sea Salt White lid (0.58 m, +10), and the rarer `frappe.glb` in its own colours (0.8 m, +20). Each cup line is one kind, split by `cupLineMix` (mug 40% / takeaway 40% / frappe 20%; shares are relative). Three pickups go beyond the brief's "one pickup" (directed, Session 8; takeaway and frappe heights set by me by hand, Session 10).
- Rendering: every model material becomes flat `MeshLambertMaterial`, because Kenney's PBR materials are metallic and render dark (Claude's call, Session 7). Obstacles, each cup kind, lane dashes and each scenery model are one `InstancedMesh` each; the track, kerbs and sea are static planes; about 25 draw calls before Phase 6, 40 with every Phase 6 model on screen (Claude's call, Sessions 4–11).
- Camera: FOV 70 at (0, 4.0, 4.5) looking at (0, 0, -8), for a closer runner and a longer view ahead (directed, Session 4).
- Node: `.nvmrc` pins Node 24 for the Cloudflare build (Vitest 5 needs Node ≥ 22.12) (Claude's call, Session 3).
- Fail rule: the stumble. The first hit slows the runner to 70% for a 5 s window; a second hit inside that window ends the run. Both numbers are starting points to tune (directed, Session 2).
- Scoring: distance plus pickup points: +1 per metre, +10 per coffee mug or takeaway cup, +20 per frappe, all to tune. Frappes count as coffees in the ☕ total and the share text (proposed → accepted, Session 2; frappe added, directed, Session 8).
- Audio: a few CC0 SFX, muted by default (directed, Session 2). Built in Session 11 with Web Audio: pickup clink, frappe chime, stumble thud, game-over tone, button click, as mono MP3s in `public/sounds/`; a top-right mute toggle remembered on the device (Claude's call, Session 11). All sounds at 40% through one gain node, `soundVolume` (directed, Session 12).
- Hosting: Cloudflare Pages at https://brisa-dash.pages.dev (confirmed Session 9), building `npm run build` → `dist` on every push to `main` of GitHub `cut-it-out/BrisaDash`. No custom domain. Claude Code asks before pushing; I've had docs and fixes ride along with the next phase's push (directed, Sessions 2–4).
- Test devices: an iPhone 14 and/or a Samsung Galaxy S20 FE (directed, Session 2).
- Toolchain: Vite + `three` from npm + Vitest, in plain JavaScript. Test command `npm test`; build `npm run build` → `dist/` (directed, Session 2).
- Execution plan: `docs/execution-plan.md`, Phases 0–6, each ending in a committable, playable state. Game logic lives in pure `src/game/` modules with no Three.js or DOM imports, so it can be unit-tested (proposed → accepted, Session 2).
- Screens and flow: start → playing ⇄ paused (`visibilitychange`) → game over (after 0.7 s) → Retry; a credits overlay from `src/credits.json`; the gesture hint returns each run until the first successful lane change; system font, no brand font (Claude's call, Session 6; font proposed → accepted, Session 9).
- Credits: `src/credits.json` is the single source for the in-game credits and `CREDITS.md` (`npm run credits`). `tests/credits.test.js` fails if they drift, if any file in `public/models` is uncredited, or if an asset is neither CC0 nor CC BY 4.0 with its changes stated (Claude's call, Session 7; CC BY rule, directed, Session 8).
- Balancing: tuned on the phone with `?debug&<configKey>=<value>` URL overrides (`src/game/overrides.js`), listed in the debug panel; the final values get written into `src/game/config.js` (proposed → accepted, Session 9). Current values, set by me by hand after phone tests and first-time testers both found it too easy: acceleration 0.25, maxSpeed 40, twoBlockedChance 0.55 (directed, Session 10). Row spacing no longer stays 1.2 s apart: rows start 9.6 m apart (`rowGapStart`) and the gap grows 0.5 m per m/s (`rowGapGrowth`), never under 0.5 s (`rowGapMinSeconds`); zigzag pairs leave exactly 0.5 s of running (`zigzagRunSeconds`) (directed, "Medium" chosen, Session 12).
- Link preview: Open Graph tags in `index.html` and `public/og-image.png` (1200×630, a real gameplay capture with the logo; the CC BY cup kept out of it). `og:url` and `og:image` point at https://brisa-dash.pages.dev (proposed → accepted, Session 9).
- Branding: an assumed palette in `docs/brisa-cafe-brand-palette.md`: Brisa Turquoise `#168F9C` (primary/CTA), Deep Ocean `#174B64` (text/HUD), Sunlit Sand `#F3DFBB` (environment), Sunset Coral `#E87F63` (coffee pickups/highlights), Sea Salt White `#FCFAF4` (panels) (directed, brief).
- Nice-to-haves, only once the core game is finished: a device-local best score and a second obstacle configuration. Cut first: extra scenery, best score, extra patterns (directed, brief). All built in Session 11: best score in `localStorage` ("Best: N" / "New best: N!"), and zigzag pairs as the second arrangement (`zigzagChance` 0.2: two two-lane rows with neighbouring free lanes, at least 0.5 s apart) (directed, Session 11).
- Time box: at most 3 focused days. Day 1 is the scene, camera, CC0 pack, swipes and lanes. Day 2 is obstacles, pickups, collisions, scoring and the overlay. Day 3 is styling, sharing, portrait QA, deployment and credits (directed, brief).
- Agent process: the rules in `CLAUDE.md` → "Agent Behavior": surgical edits, verify through CLI output before claiming a fix, simplicity over abstraction, ask instead of guessing, present 2–3 options with trade-offs when several patterns are valid (directed, Session 1).
- Build log: lives at `docs/buildlog.md` in attributed voice and replaces the old `docs/build-log-template.md` (proposed → accepted, Session 1).

## Part 2 — Sessions

### Open issues

(Keep current; every session updates this list.)

- Device details not recorded (Sessions 10–12), mine, small: Android plays at 110+ fps (118 FPS, 42 draw calls on my Session 11 screenshot) and its share sheet works; the iPhone 14 showed 60 FPS and 42 draw calls. Still missing for GDD §12: the Android phone model and browser version, and the iPhone's Safari version.
- Session 12 changes to judge on the phone, mine: the café table and menu board (`obstacleMix.*`), the sound at 40% (`soundVolume`), and the slower-growing row gap (`rowGapGrowth`; lower is harder). Log run lengths (target 30–60 s for a first-timer) and write any changes into `src/game/config.js`. The villas, boats, stones, seagulls and zigzag pairs were approved in Session 12 ("other not mentioned things look good").
- Deckchair model (Session 12), mine: I'm looking for a CC0 or CC BY deckchair model. When it's in `model-to-import/`, check its licence, credit it, and add it as an obstacle look; the code-built deckchair was rejected.
- Preview URL is hard-coded (Session 9): `og:url` and `og:image` in `index.html` name https://brisa-dash.pages.dev. If the Pages project is renamed or a custom domain is added, update both.
- Parked (Session 3, mine): a Brisa Turquoise apron on the barista ("no apron for now, maybe later"). All of the character's colour comes from one texture, so it would need a code-built overlay box or a recoloured torso.
- Unexplained test run (Session 7): once, `npm test` straight after `npm run credits` reported "9 failed, no tests"; it didn't reproduce in 4 runs (nor in Session 10). If it recurs, capture the full output.

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

*Sessions 3–9 were one continuous Claude Code conversation on Wednesday 14 October 2026. At my request ("could you please break the up the build-log to separate sessions for each phase?"), the log splits it into one session per phase. The pickup changes between Phases 4 and 5 get a session of their own.*

### Session 3 — Wednesday 14 October 2026 — Phase 0: scaffold, deploy pipeline and asset check

- **Goal:** Phase 0 of `docs/execution-plan.md`, the next step from Session 2, which I started.
- **Direction given:** "lets continue with the execution, move to phase 0, i've already created the cloudflare pages with the npm run build command targeting the dist folder, waiting for actual things to build". Asked before the first push, I chose "Push now".
- **Course corrections:**
  - Apron: Claude Code recommended a code-built overlay box. I answered "no apron for now, maybe later".
  - Coffee pickup: Claude Code recommended deciding in Phase 4 by comparing a coral primitive with `frappe.glb` on the phone. I chose "use cup-coffee and keep frappe as a potential addon for later."
- **What was built:**
  1. Scaffold:
     - `package.json` with three 0.186.1, vite 8.3.4 and vitest 5.0.4; `.nvmrc` (24); `.gitignore`.
     - `index.html` and `src/style.css`: palette tokens, a 9:16 column with turquoise letterboxing, `touch-action: none`.
     - `src/render/scene.js`: WebGL2 check, DPR cap 2, a spinning turquoise placeholder cube.
     - `src/main.js` and `tests/smoke.test.js`.
  2. Kenney check, done by a subagent; downloads stayed in the session scratchpad.
     - Blocky Characters 2.0: 18 GLBs (the page says 20), one texture each.
     - Food Kit 2.0: 200 GLBs sharing `Textures/colormap.png`.
     - Nature Kit 2.1: 329 GLBs coloured by their materials, no textures.
     - Licences: each `License.txt` says "Creative Commons Zero, CC0".
     - None of the packs has a parasol, deckchair or takeaway cup.
     - Each character is 6 box meshes (72 triangles) with one shared material and no skin. It also has 27 rigid node animations, which the game doesn't use.
     - Download URLs: https://kenney.nl/media/pages/assets/blocky-characters/8369c0cf30-1749547469/kenney_blocky-characters_20.zip, https://kenney.nl/media/pages/assets/food-kit/83086fa91c-1719418518/kenney_food-kit.zip, https://kenney.nl/media/pages/assets/nature-kit/37ac38a37b-1677698939/kenney_nature-kit.zip.
  3. GDD §7 and execution-plan Phase 4 updated with the model choices.
- **Decisions:**
  - Runner = character f (teal shirt, close to Brisa Turquoise), picked from a labelled sheet of the 18 characters. The other options offered were b, c and q. [proposed → accepted]
  - No apron for now. [directed]
  - Coffee pickup = `cup-coffee.glb`; `frappe.glb` parked. [directed]
  - Obstacle = a parasol built from primitives, since no pack has one (the GDD's fallback). [Claude's call]
  - `.nvmrc` pins Node 24 for Cloudflare, because Vitest 5 needs Node ≥ 22.12. [Claude's call]
  - The `credits` npm script waits for Phase 4, because a script that fails when run is worse than none. [Claude's call]
  - Vite's "chunk over 500 kB" warning left in place; the bundle is 131 kB gzipped, nearly all of it three.js. [Claude's call]
- **What broke or was wrong:** An advisor review caught that the plan's Phase 4 wording ("copy textures next to the GLBs") would break the GLBs' relative `Textures/` paths. It was reworded before any copying.
- **Hand edits:** None in the code. I created the Cloudflare Pages project in the dashboard myself (build `npm run build`, output `dist`).
- **Testing / playtest notes:**
  - `npm test`: 1 file, 1 test passed.
  - `npm run build`: JS 528.51 kB (131.39 kB gzip).
  - `vite preview` served the page and the bundle with HTTP 200.
  - My phone check of the deploy came at the start of Session 4: "everything looks good on cloudflare".
- **Learned:** Auditing the asset packs before writing any gameplay turned three "to verify" rows in the GDD into firm decisions (no pack has a parasol), so later phases never waited on assets.
- **Where things stand / next step:** `740a757` is pushed. `20b6603` and `2fe7bbb` (docs) are local and went up with Phase 1. Next: Phase 1.
- **Showcase line:** I connected Cloudflare Pages myself and had Claude Code scaffold Vite + three.js + Vitest and audit three Kenney packs. Then I picked the barista and the coffee cup from what the packs actually contain.

### Session 4 — Wednesday 14 October 2026 — Phase 1: scene, track, lanes and controls

- **Goal:** Phase 1, after I confirmed the Phase 0 deploy.
- **Direction given:**
  - "everything looks good on cloudflare, go ahead and continue. push the docs commits together with phase 1"
  - After trying it: "feels good, works well on both phone and desktop" and "you could even move the player closer to the camera a bit and angle a camera just a bit more to see more further".
  - On the result: "yes, this is much better."
- **Course corrections:** The camera change was my direction. Claude Code's first attempt moved the camera closer and lower; its own screenshot showed the horizon about 40% down and the far track squashed. It moved the camera closer and *higher* instead.
- **What was built:**
  1. `src/game/config.js` (every tune value from the GDD) and `src/game/lanes.js`: 0.12 s eased slide, one queued move, moves past the edge ignored, `effectiveLane` = the target lane.
  2. `src/render/palette.js`, `scene.js`, `world.js` and `entities.js`: sky, fog, the sea on the left, kerbs, scrolling lane dashes, and a Deep Ocean placeholder runner with a run bob.
  3. Input and overlays:
     - `src/ui/input.js`: a swipe fires at 30 px, once per touch; arrow keys and A/D work too.
     - The gesture hint in `src/ui/screens.js`.
     - `src/ui/debug.js`: `?debug` shows FPS and draw calls.
  4. Camera moved to (0, 4.0, 4.5), looking at (0, 0, -8); the hint moved to `bottom: 4%`.
- **Decisions:**
  - The track's planes stay still, and only the lane dashes move, recycled in one `InstancedMesh`: one draw call and no seams. The plan had pooled track segments; GDD §7 was updated. [Claude's call]
  - Colours not in the brand doc, to tune: sky `#cdeef0`, beach `#e8cf9f`, lane lines `#d6b98a`. Fog from 40 to 75 m hides objects as they appear. [Claude's call]
  - Camera closer and higher. [directed; the values were Claude's call]
  - Visual checks use headless Chrome screenshots before I'm asked to look. [Claude's call]
- **What broke or was wrong:**
  - An advisor review caught an input bug. A mouse pressed inside the column and released outside it left the gesture open, so every later swipe was ignored until a reload. `setPointerCapture` fixed it.
  - Headless Chrome won't go narrower than 500 px, which put a fake turquoise strip in the screenshots. That was a capture artefact, not a bug.
- **Hand edits:** None.
- **Testing / playtest notes:**
  - `npm test`: 2 files, 8 tests passed.
  - `npm run build`: JS 535 kB (133.7 kB gzip).
  - My check on the phone and on desktop passed.
- **Learned:** Taking a screenshot after each visual change let Claude Code judge the camera framing itself and bring me one good option instead of two to try.
- **Where things stand / next step:** `f8f4167` and `affe42a` are pushed. `1c870d8` (camera) is local and went up with Phase 2. Next: Phase 2.
- **Showcase line:** I tried the lanes on my phone and asked for the runner to be closer with a longer view ahead. Claude Code compared two camera setups in screenshots and kept the one that gave the track ahead a third of the screen.

### Session 5 — Wednesday 14 October 2026 — Phase 2: core gameplay loop

- **Goal:** Phase 2: obstacles, coffee, the stumble rule and scoring.
- **Direction given:**
  - "yes, this is much better. no need to push separately, can go with phase 2 go ahead and do phase2"
  - After playing: "everything is ok, I dont see what you were talking about (what e8ad98b should be fixing). does not matter for now. please go ahead with next phase".
- **Course corrections:** None.
- **What was built:**
  1. Pure logic:
     - `speed.js`: 8 m/s plus 0.15 m/s per second, capped at 18 m/s.
     - `stumble.js`: steady / stumbling / dead, with a 5 s meter.
     - `collision.js`: checks the whole step, so a long frame can't skip a hit.
     - `spawner.js`: rows 1.5 s apart and at least 12 m apart. 40% of rows block two lanes. 60% get a line of 3–5 cups in a lane that's free in the row the line leads into.
     - `score.js`, and `run.js`, whose `updateRun` returns coffee, stumble and gameOver events.
  2. Rendering:
     - The parasol-over-lounger obstacle and the cup are built from merged, vertex-coloured primitives, one `InstancedMesh` each.
     - The knock-aside: the hit obstacle tips over and slides out of the lane in 0.4 s.
     - Runner wobble, and a 0.35 s camera shake.
  3. UI: the HUD (score, ☕ count, coral stumble meter), a "+10" pop above the runner, and a temporary run-over panel.
- **Decisions:**
  - The starting numbers above, all in `config.js` to tune. [Claude's call]
  - The knock-aside runs on render time, so the obstacle that ends a run still tips over after the run freezes. [Claude's call]
  - New rows are spaced by the unslowed speed. [Claude's call, after an advisor review]
- **What broke or was wrong:**
  - Two test bugs on the first run (30/32 passed), both fixed in the tests:
    - The cup-overlap fuzz compared every cup with every obstacle and timed out.
    - The knock test read an obstacle that had already (correctly) despawned.
  - An advisor review caught a spacing bug. Rows spawned during a stumble were spaced by the slowed speed, so they arrived bunched up once the runner recovered. `e8ad98b` fixed it, and the new test fails on the old line.
  - Why I didn't notice it: Claude Code explained that `minRowGap` (12 m) hides the bug below about 11.5 m/s, roughly 23 s into a run. The build I played also didn't include the fix.
- **Hand edits:** None.
- **Testing / playtest notes:**
  - `npm test`: 7 files, 33 tests passed, including a fuzz of 5 seeds × 2 speeds × about 2000 rows.
  - `npm run build`: JS 547 kB (137.6 kB gzip).
  - My playtest: "everything is ok". Run length wasn't measured.
- **Learned:** A review pass caught a difficulty spike that neither the unit tests nor my playtest showed, because it only appears above a speed a short test run never reaches.
- **Where things stand / next step:** `81e4ac4` is pushed. `e8ad98b` is local and went up with Phase 3. Next: Phase 3.
- **Showcase line:** Claude Code built the obstacle, coffee and stumble rules as pure, tested logic (33 tests, including a fuzz of about 20,000 rows). A review caught a difficulty spike after every stumble before I ever met it in play.

### Session 6 — Wednesday 14 October 2026 — Phase 3: screens, flow and sharing

- **Goal:** Phase 3: the full start → play → game over → retry loop, plus pause and share.
- **Direction given:** "please go ahead with next phase" (at the end of Session 5).
- **Course corrections:** None.
- **What was built:**
  1. `src/ui/screens.js`:
     - Start screen: logo, "by Brisa Café", Play, Credits.
     - HUD, shown only during a run.
     - Game-over panel: score, metres, coffees, Retry, Share score, Credits.
     - Pause panel, and a credits panel that reads `src/credits.json`.
  2. `src/ui/share.js`:
     - Builds the GDD §9 share text, saying "1 coffee" for one.
     - Tries Web Share first; closing the share sheet does nothing.
     - On any other error, it copies the text and link ("Copied!"), or shows "Couldn't share" if there's no clipboard.
  3. `main.js`:
     - States: start → playing ⇄ paused (`visibilitychange`) → over → Retry.
     - Swipe input moved to the canvas, so taps on buttons never start a swipe.
     - An inline ☕ SVG favicon.
- **Decisions:**
  - The gesture hint comes back each run until the first successful lane change. [Claude's call]
  - The game-over panel waits 0.7 s so the final knock-over can be seen. [Claude's call]
  - The credits panel credits three.js (MIT) and says "Brisa Café is a fictional café made up for this prototype", following the brief's legal note. [Claude's call]
  - The mute toggle and best score stay in Phase 6, as the plan says. [Claude's call]
- **What broke or was wrong:** A scripted headless run caught three bugs:
  - The credits panel opened behind the game-over screen. Close was unreachable, and the invisible panel then blocked swipes after Retry.
  - The hint drew over the pause dimming.
  - The favicon returned a 404.

  Fixing the screen layering and adding the inline favicon solved all three.
- **Hand edits:** None.
- **Testing / playtest notes:**
  - `npm test`: 8 files, 40 tests passed.
  - Claude Code drove the built game in headless Chrome at 390×844 with touch on (puppeteer-core, installed in the scratchpad). It went through Play, pause and resume, game over (6.9 s when never moving), Share with the copy fallback, Credits, Retry and a swipe. The copied text was "I dashed 65 m and grabbed 0 coffees at Brisa Café — score 65! ☕🌊 Can you beat me? http://localhost:4173/". No console errors; 9 draw calls.
  - My phone check: "tested the share, it worked on iphone. still need to test later on android too. coffee emoji looked ok. pause when loosing focus works. retry and credits also work as need to."
- **Learned:** Driving the real build with a scripted browser found layering bugs that unit tests can't see. I would have met them as "swipes stop working after Retry".
- **Where things stand / next step:** `e059aa2` is pushed. Next: Phase 4.
- **Showcase line:** Claude Code scripted a phone-sized browser through the whole start → run → game over → share → credits → retry loop and fixed the overlay bugs it found; my iPhone test then passed first time.

### Session 7 — Wednesday 14 October 2026 — Phase 4: Kenney models, scenery and credits

- **Goal:** Phase 4: replace the placeholders with the Kenney models, add scenery, and make the credits real.
- **Direction given:** "feels a bit easy at the moment, but lets get back to this once all relevant phases are done. lets take a note to have a balancing in phase 5" and "go ahead with phase 4".
- **Course corrections:** None.
- **What was built:**
  1. `public/models/` (212 KB): `character-f.glb` and its texture; `cup-coffee.glb` and `colormap.png`; the palms `tree_palm`, `tree_palmBend` and `tree_palmTall`; the rocks `rock_smallA` and `rock_largeA`. Claude Code re-checked each pack's `License.txt` before copying.
  2. `src/render/models.js`:
     - Loads the models before Play is enabled; the button shows "Loading…" until then.
     - Scales each model to a target height and bakes it into an instanced mesh.
     - Falls back to the primitive shape if a model fails to load.
  3. The runner (1.5 m, turned to face down the track), the cup (0.4 m), and 14 palms and rocks in a layout that repeats every 80 m.
  4. Credits: `src/credits.json` → `npm run credits` → `CREDITS.md`. The in-game screen lists the packs, and `tests/credits.test.js` guards against drift.
  5. A balancing pass added to Phase 5 of `docs/execution-plan.md`.
- **Decisions:**
  - Balancing deferred to Phase 5. [directed]
  - Model materials converted to flat Lambert. [Claude's call]
  - Credits as one JSON source, with a generated `CREDITS.md` and a drift test. [Claude's call, following the plan]
- **What broke or was wrong:**
  - Dark models: the first screenshots showed dark grey palms and a dull character. Kenney's materials have `metallicFactor: 1`; the character's is unset, which glTF also treats as 1. Metallic surfaces render dark without an environment map. Converting the materials to Lambert on load fixed it.
  - Palms too tall: a near palm's leaves cut into the top of the screen. They were lowered from 5–5.8 m to 3.8–4.6 m and moved further from the track.
  - One unexplained `npm test` run reported "9 failed, no tests". Four later runs gave 44/44.
- **Hand edits:** None.
- **Testing / playtest notes:**
  - `npm test`: 9 files, 44 tests passed, 3 times in a row.
  - Both drift checks were broken on purpose (a stray edit to `CREDITS.md`, an uncredited GLB): 2 tests failed, then 4/4 passed after restoring.
  - `npm run build`: JS 634 kB (161 kB gzip).
  - `?debug`: 24 draw calls.
- **Learned:** Kenney's GLBs arrive with metalness set to 1, which only shows once they're rendered. Checking screenshots rather than trusting the loader caught it in one pass.
- **Where things stand / next step:** `4539e72` is pushed. Next: my look at the models on the phone, then Phase 5.
- **Showcase line:** Claude Code swapped every placeholder for a credited CC0 Kenney model, caught a material setting that made them render dark, and added a test that fails if any shipped model is uncredited.

### Session 8 — Wednesday 14 October 2026 — Pickup variety (Phase 4 follow-up)

- **Goal:** My requests to vary the coffee pickups after seeing Phase 4.
- **Direction given:**
  - "can you color the coffee cup to coral and make it a bit smaller? also would be nice to try the other kenney model too, could you include that also in the game so when the cups are put on the lane in batches, every set of cups would randomly choosen from model A or model B but model B (frappe) should be occuring less and should be worth a bit more points. summarize for me what would you do before executing, let me review it first"
  - "ok, go ahead. update the GDD to reflect two pickups"
  - "its better, but the frappes are too small compared to the mugs. I've also added a new model, with attribution CC in the model-to-import folder. could you please add those also ot the pool of collectables, same points as the mugs. the body of the cup should be recolored to match the palette"
  - "can you color the takeaway model's body to coral too? also please increate the size of the takeaway and the frappe a bit more? like by 0.05m maybe?"
- **Course corrections:**
  - Review first: I asked for a summary before any code. Claude Code proposed frappes on 20% of lines at +20, a 0.3 m mug, frappes in their own colours, and frappes counted as coffees. It also flagged that a second pickup goes beyond the brief's "one pickup". I approved it as written.
  - Frappe size: 0.45 m was "too small compared to the mugs", so it went to 0.65 m, then 0.7 m.
  - Takeaway body: I first accepted Claude Code's recommended Brisa Turquoise, then asked for Sunset Coral.
  - Licence: Claude Code flagged that the new model is CC BY 4.0, against the brief's CC0-only rule. I chose "Allow CC BY, credit it".
- **What was built:**
  1. Coffee mug and frappe:
     - The mug is tinted coral and 0.3 m tall; `frappe.glb` (22 KB) is 0.7 m.
     - Each line of cups is one kind.
     - `pickupValue` gives +10 per mug and +20 per frappe, and frappes count as coffees.
  2. Takeaway cup: "Low-Poly Takeaway Coffee Cup" by PickledCactusAlan (https://skfb.ly/oxqpp), whose page says "Modelled in Maya, textured in Photoshop".
     - Stored in `public/models/sketchfab/` (48.8 KB); 0.55 m tall, worth +10.
     - It requires the `KHR_materials_pbrSpecularGlossiness` material extension, which this three.js version only warns about. Registering the extension's name silences the warning.
     - `paintByUv` colours the cup by which half of its texture each part maps to: lid Sea Salt White, body Sunset Coral.
  3. Config and docs:
     - `cupLineMix` { coffee 0.4, takeaway 0.4, frappe 0.2 }.
     - Credits gained a `changes` field for CC BY.
     - GDD §6, §7, §8, §11, §12 and §13 item 6 updated.
  4. `model-to-import/` added to `.gitignore`.
- **Decisions:**
  - Pickup kinds, values, mix and sizes. [directed]
  - The CC BY exception, credited with title, author, source, licence and changes. [directed]
  - Recolour in code by texture half, instead of shipping an edited texture. [Claude's call]
  - Frappe kept in its own colours, and frappes counted as coffees. [proposed → accepted]
- **What broke or was wrong:** The credits test failed when `frappe.glb` was added before its credit, which is what it's for. My attribution note in `public/models/` failed the same test (see hand edits).
- **Hand edits:** I added `model-to-import/` with the GLB and its attribution `.txt`. I also copied the `.txt` into `public/models/sketchfab/`; after the test flagged it, I said "i moved it back to model-to-import. please add the folder to gitignore".
- **Testing / playtest notes:**
  - `npm test`: 9 files, 47 tests passed. They check that each line is one kind, that frappes make up 20% ± 4 points of 1000+ seeded lines, and that a frappe scores +20.
  - Screenshots from temporary builds that forced each kind checked colours and sizes. The config was restored and rebuilt each time.
- **Learned:** Making the licence rules a test (every shipped file credited; CC BY must state its changes) turned a late asset addition into a guided step instead of a compliance risk.
- **Where things stand / next step:** `05971a4`, `f7a7d9f` and `ac5b17c` are pushed. `ea39a81` (`.gitignore`) is local and went up with Phase 5. Next: Phase 5.
- **Showcase line:** I asked for more variety in the coffee pickups and brought in a CC BY takeaway cup. Claude Code flagged the clash with the brief's CC0 rule; once I approved an exception, it recoloured the model to the palette and credited it the way CC BY requires.

### Session 9 — Wednesday 14 October 2026 — Phase 5 build work and wrap-up

- **Goal:** The parts of Phase 5 that don't need the phones, then a wrap-up while I test.
- **Direction given:** "ok, go ahead with the next phase please". For the wrap-up: "oh yes, do a wrap up please. could you please break the up the build-log to separate sessions for each phase? in the meantime I'll do the testing".
- **Course corrections:** None.
- **What was built:**
  1. `src/game/overrides.js` and 4 tests:
     - With `?debug`, numeric config values can be overridden from the URL, including dotted `cupLineMix.*` keys.
     - Unknown keys, non-numbers, blanks and `laneCount` are ignored.
     - The debug panel lists the active overrides.
  2. Safe-area padding (`env(safe-area-inset-*)`) on the hint, the debug panel and every screen.
  3. Link preview: Open Graph and Twitter tags, plus `public/og-image.png` (1200×630, 111 KB), composed from a real headless gameplay capture with the logo text.
  4. `pickCupKind` treats the shares as relative, so overriding a single share from the URL behaves as expected.
  5. This log split into Sessions 3–9, with Part 1 and Open issues rewritten. The "Session 3" references in GDD §11 and §13, `docs/execution-plan.md` and `tests/credits.test.js` were renumbered, and the execution plan gained a progress line.
- **Decisions:**
  - Balancing by URL overrides on the phone. [proposed → accepted]
  - Keep the system font. [proposed → accepted]
  - A link preview card with a game screenshot. [proposed → accepted]
  - `og:url` and `og:image` point at https://brisa-dash.pages.dev, confirmed by fetching it and matching this build's files. [Claude's call]
  - The CC BY takeaway cup kept out of the preview image, so the image needs no attribution of its own. [Claude's call]
  - One build-log session per phase. [directed]
- **What broke or was wrong:** An advisor review caught that `pickCupKind` assumed the shares add up to 1, so overriding one share silently skewed the mix. Fixed; a test checks that `{ coffee: 1, frappe: 1 }` gives about 50/50.
- **Hand edits:** None.
- **Testing / playtest notes:**
  - `npm test`: 10 files, 52 tests passed.
  - `npm run build`: JS 637.17 kB (162.50 kB gzip).
  - A headless run with `?debug&twoBlockedChance=0.9&rowGapSeconds=1&cupLineMix.frappe=0.5&bogus=3` listed the three real overrides, ignored `bogus`, and showed mostly two-lane rows.
  - Device QA is mine and in progress.
- **Learned:** Making every gameplay number adjustable from the URL turns balancing from a commit-and-deploy loop into minutes on the device.
- **Where things stand / next step:**
  - `main` at `972e378` is pushed and deployed. This wrap-up is committed on top: docs, plus a comment in `tests/credits.test.js`.
  - Phase 5 device QA and the balancing pass are mine and in progress (see Open issues).
  - Next session: write my chosen balance values into `src/game/config.js`, record the device results and the first-time tester's words, and close Phase 5.
  - Then Phase 6, in the plan's order: best score → SFX + mute → extra scenery → a second obstacle arrangement.
- **Showcase line:** For the balancing pass I chose to tune on the phone, so Claude Code made every gameplay number adjustable from the URL. I can now try difficulty settings on the iPhone and S20 FE without a redeploy.

### Session 10 — Wednesday 14 October 2026 — Phase 5 device results and my balance changes

- **Goal:** Log my iPhone 14 results, the first-time testers' feedback and my hand edits from Phase 5 device QA, then wrap up before Phase 6 (from me; Session 9's next step).
- **Direction given:**
  - "it was too easy, I've updated the config, lets see in the next phase how it plays now."
  - "link preview card was also checked and ok, tick that one too"
  - "I'll do an android later, lets wrap this up, then I clear the session and move to phase 6"
- **Course corrections:** None.
- **What was built:** Claude Code wrote no code this session.
  1. `CREDITS.md` regenerated with `npm run credits` after my credit URL change.
  2. Cup heights updated to my values in GDD §6 and Part 1 (frappe 0.8 m, takeaway 0.58 m).
  3. The progress line in `docs/execution-plan.md`, this entry, Open issues and Part 1 (Pickups, Balancing).
- **Decisions:**
  - A harder balance, because my own phone tests and the first-time testers both found it too easy: acceleration 0.15 → 0.25, maxSpeed 18 → 40, rowGapSeconds 1.5 → 1.2, minRowGap 12 → 9, twoBlockedChance 0.4 → 0.55. Session 9's suggested starting set (0.55 / 1.3 / 10 / 0.2 / 20) was not taken as is; my values go further on row gap, acceleration and the speed cap. [directed]
  - Frappe 0.7 → 0.8 m and takeaway cup 0.55 → 0.58 m. [directed]
  - The takeaway cup credit uses the shortened Sketchfab link https://skfb.ly/oxqpp instead of the full model URL. [directed]
  - Move on to Phase 6 with the Android check still open, although the plan says Phase 6 starts "only once Phase 5 passes". Phase 5 passes on the iPhone 14. [directed]
- **What broke or was wrong:** After my credit URL change, `npm test` failed 1 of 52 tests: `CREDITS.md` is generated from `src/credits.json` and the drift check caught that it hadn't been regenerated. Claude Code ran `npm run credits`; `npm test` then passed 52/52.
- **Hand edits:** All three were mine, made between Sessions 9 and 10:
  - `src/game/config.js`: the balance values above.
  - `src/render/entities.js`: `FRAPPE_HEIGHT` 0.7 → 0.8, `TAKEAWAY_HEIGHT` 0.55 → 0.58.
  - `src/credits.json`: the takeaway cup's `url` shortened to https://skfb.ly/oxqpp.
- **Testing / playtest notes:**
  - iPhone 14: "iphone plays the game well, its almost continuously 60fps, sometimes it dips to ~58, but barely noticed it." and "everything else looks ok so far". The Safari version and the draw-call count were not recorded.
  - Link preview card: "checked and ok".
  - First-time testers: "first time testers liked it, but also go the feedback that it is too easy (confirmed my findings, thus the changes)".
  - GDD §12, against that evidence:
    1. Complete loop, readable in portrait: met on the iPhone 14.
    2. First-time tester: feedback recorded as given, above. Whether they found the swipe without help wasn't stated.
    3. Share and credits: link preview card checked; the credits test passes. The Android share sheet is not checked yet.
    4. Performance: about 60 fps on the iPhone 14 against a 30 fps target. Android not tested yet.
  - Run lengths with the new balance: not measured yet.
  - Claude Code pointed out two effects of the new values, with no change made: `minRowGap` 9 no longer has any effect (8 m/s × 1.2 s = 9.6 m is already larger), and maxSpeed 40 is only reached after 128 s, so a 60 s run ends at 23 m/s.
  - `npm test`: 10 files, 52 tests passed. `npm run build`: not run.
- **Learned:** A test that compares a generated file with its source turns a forgotten regeneration step into a failing test, not a stale credit on the live site.
- **Where things stand / next step:**
  - Committed on `main`, two commits ahead of `origin/main` (the Session 9 wrap-up and this one). Not pushed: a push deploys the harder balance to https://brisa-dash.pages.dev.
  - `npm test` 52/52.
  - Phase 5 passes on the iPhone 14. The Galaxy S20 FE check is mine, "later" (see Open issues).
  - Next session: Phase 6 in the plan's order: best score → SFX + mute → extra scenery → a second obstacle arrangement. Judge the new balance while playing it.
- **Showcase line:** My own iPhone tests and the first-time testers both said the game was too easy, so I raised the speed ramp, the row density and the two-lane blocks by hand. The iPhone 14 held close to 60 fps, against the brief's 30 fps target.

### Session 11 — Wednesday 14 October 2026 — Phase 6: best score, sound, villas, boats, seagulls, new obstacles

- **Goal:** Plan Phase 6 with my additions, then build all of it and push, so I can review it live (from me; Session 10's next step was Phase 6).
- **Direction given:**
  - "lets plan out phase 6 before we go about it. I would like to add some additional topics to phase6: add some boats/animals (seagull?) to the water side, add some building to the right side. also would like to see some gray rocks (from kenney's pack) to spice things up even more. some additional obstackle(s)"
  - Buildings: "low houses/villas (first option) but keep the palm trees also (on both sides) just maybe use a bit less".
  - Seagulls: "lets do seagulls too, but should have the option in config to switch them off easily if I dont like them".
  - After approving the plan: "continue implementation with all the steps in phase6, I will review and check everything at the end. once done, please commit everything to github so I can check live on cloudflare too".
- **Course corrections:**
  - Sourcing: Claude Code offered primitives only, a mix, or new Kenney packs; I chose "Add Kenney packs (Recommended)" for boats and houses.
  - Obstacles: Claude Code asked whether I meant new looks or a new arrangement; I chose "New obstacle looks". The plan's original arrangement step was kept as first to cut, and was built too, since I asked for "all the steps".
  - Because I handed over the picks, Claude Code chose the sounds and models itself from the audit sheets; they are listed below for my review.
- **What was built:**
  1. Best score (`src/ui/best.js`): `localStorage` behind try/catch, "Best: N" on the start screen once one exists, "Best: N" or "New best: N!" on the game-over panel. "New best" is not shown on a first run.
  2. Sound (`src/ui/audio.js`, `createMuteToggle` in `src/ui/screens.js`):
     - Web Audio, muted by default; the choice is remembered on the device.
     - The context is created or resumed by the unmute, Play, Retry and resume taps (iOS's "interrupted" state included).
     - Sounds, converted to mono MP3 with ffmpeg and levelled: `glass_002` (mug/takeaway), `confirmation_001` (frappe), `click_001` (taps) from Interface Sounds; `impactSoft_heavy_000` (stumble) from Impact Sounds; `lowDown` (game over) from Digital Audio. 40 KB in `public/sounds/`.
     - The mute button sits top-right over every screen.
  3. Model audit by a subagent: Watercraft Kit 2.1, City Kit (Suburban) 2.0, Nature Kit 2.1 and Food Kit 2.0, each `License.txt` quoting "Creative Commons Zero, CC0", with labelled contact sheets of houses, boats, stones and 26 obstacle candidates.
  4. Scenery (`src/render/world.js`): the layout went from 14 to 24 pieces per 80 m.
     - Palms 10 → 6, three per side.
     - The sandy rocks kept, plus six gray stones: `stone_smallA/largeA/smallH`, tinted `#8f969c` because Nature Kit's "stone" is pale cyan. Some sit in the shallows.
     - Five villas on the right at x 9–10, facing the track: `building-type-g/k/m/r`. The shared `colormap.png` has the green roof colours replaced by the pack's variation-b terracotta.
     - Three boats on the sea at x −8 to −11, bobbing and rolling: `boat-sail-a`, `boat-speed-j`, `boat-fishing-small`.
  5. Seagulls (`createSeagulls`): code-built gulls (white body, grey V wings with dark tips, coral beak) circling over the sea ahead of the runner, banking into the turn. Set by `seagullCount` (4; 0 = off; `?debug&seagullCount=0`).
  6. Obstacle looks: each obstacle gets a `kind` from `obstacleMix` (parasol 0.5 / tent 0.25 / barrel 0.25, dotted URL overrides work).
     - Nature Kit `tent_smallClosed` tinted Brisa Turquoise, 1.1 m; Food Kit `barrel` lying across the lane, 0.95 m.
     - One InstancedMesh per look; same hit rule and knock-aside.
     - `pickCupKind` renamed `pickKind`.
  7. Second arrangement: zigzag pairs (`zigzagChance` 0.2). Two two-lane rows `max(6 m, 0.7 s × speed)` apart, whose free lanes are neighbours.
  8. Credits: 9 packs in `src/credits.json` and `CREDITS.md`; `tests/credits.test.js` now also requires every file in `public/sounds` to be credited.
  9. Docs: Phase 6 rewritten in `docs/execution-plan.md`; GDD §6, §7, §8, §10, §11 and §13.
- **Decisions:**
  - New Kenney packs for boats and houses (5 model packs), rather than primitives. [directed]
  - Low villas, palms kept on both sides but fewer. [directed]
  - Code-built seagulls with a config switch. [directed]
  - New obstacle looks. [directed]
  - All of Phase 6 built in one go, with Claude Code making the asset picks, and pushed for my review. [directed]
  - Sounds chosen by name, length and loudness: Claude Code couldn't listen to them. [Claude's call]
  - The tent tinted turquoise, not coral: in this game coral means a cup to collect. A coral tent was tried first and changed after the screenshot. [Claude's call]
  - Keep the sandy rocks and add gray stones, rather than replace them, since I asked to "spice things up even more". [Claude's call]
  - Houses: terracotta roofs swapped into the shared City Kit texture for a Mediterranean look. Flat-roofed p/q were skipped because their upper floor is charcoal. [Claude's call, from the audit's suggestion]
  - Zigzag gap of at least 0.5 s between hit windows at every speed, checked by a test. [Claude's call]
  - Mute choice remembered on the device; "New best" not shown on a first run. [Claude's call]
- **What broke or was wrong:**
  - First seagull pass: the heading formula was off by 90° for clockwise circles. Claude Code caught it while checking the maths, before any screenshot.
  - In the first screenshot the gulls were specks behind the debug panel; they were scaled ×1.6 and brought lower and closer.
  - Adding the obstacle `kind` draw changed the seeded random sequence, so `tests/run.test.js` "spaces rows by the unslowed speed" met a zigzag pair and failed (12.6 m gap vs 21.6 m expected). The test now accepts either gap at the unslowed speed; it still tells slowed from unslowed spacing apart.
  - The audit found Nature Kit's "gray" stones are pale cyan in the files, and that each pack ships a different `Textures/colormap.png`. Each pack keeps its own folder.
  - An advisor review asked for the credits overlay to be checked after the list grew from 4 to 9 packs. It was 936 px tall in a 693 px view: the heading was cut off and Close was off-screen, and `touch-action: none` on the game column would have stopped a phone from scrolling to it. The panel now scrolls inside itself (`max-height: 100%`, `overflow-y: auto`, `touch-action: pan-y`); headless checks at 390×693 and 320×568 reached Close after a scroll. Touch scrolling on a real phone is still to check.
- **Hand edits:** None seen this session; the tree was clean at the start (`git status`).
- **Testing / playtest notes:**
  - `npm test`: 12 files, 68 tests passed (52 at the start of the session).
  - `npm run build`: JS 644.47 kB (164.90 kB gzip). `public/models` 840 KB, `public/sounds` 40 KB.
  - Headless Edge (SwiftShader, 390×693) through `vite preview`:
    - A stored best of 321 survived a 147-point run; a stored 10 became "New best: 58!" and was saved.
    - Nothing fetched while muted; after unmuting, all five MP3s returned 200 with no console warnings, and the choice survived a reload.
    - Screenshots checked the gulls, the scenery, tents only, and the default mix. 40 draw calls with every model on screen, up from 26.
  - Not yet done: listening to the sounds, phone FPS with the new scenery, run lengths with the Session 10 balance. All mine (see Open issues).
- **Learned:** A labelled contact sheet with sizes made model choices quick and reviewable. Checking the colour language in a screenshot caught a coral obstacle that would have looked like a pickup.
- **Where things stand / next step:**
  - Phase 6 built and committed on `main` in four commits, a credits-panel fix and this wrap-up. Pushed to GitHub together with the unpushed Session 9 and 10 wrap-ups, so the Session 10 balance goes live at the same time; Cloudflare Pages deploys it to https://brisa-dash.pages.dev.
  - `npm test` 68/68.
  - Next: my review on the iPhone 14 with `?debug`: FPS and draw calls, the sounds, the villas/boats/gulls/obstacle looks, and run lengths with the new balance and zigzag pairs. Tune with `seagullCount`, `obstacleMix.*`, `zigzagChance`, `zigzagGapSeconds` from the URL, then write any changes into `src/game/config.js`.
- **Showcase line:** I asked for a livelier seafront and more obstacle variety, chose new Kenney packs over primitives, and asked for a switch to turn the seagulls off. Claude Code audited four packs, picked villas, boats, stones, a tent and a barrel from labelled sheets, and shipped best score, sound and a zigzag row pattern in one Phase 6 build for me to review on the phone.

### Session 12 — Thursday 15 October 2026 — (in progress)

- [correction] "the barrels are not good, the color takes away the attention from the collectables" and "the tents are sort of ok, but I just don't like them, they dont really fit in here imho" — "give me alternative options. show me/tell me first before you make this change". From the four options Claude Code offered (striped deckchair, beach windbreak, surfboard rack, promenade planter), I picked the promenade planter and the striped deckchair.
- [direction] "the seagulls can stay, they are cool"
- [direction] "the sounds feel a bit intrusive, tune the volume down"
- [direction] "the balance of the game is better now, but the long play it still feels "easy". it has to do with the distance between obstacles: lets keep the initial obstacle distance but do not extend it that much to make the game harder by time" — I picked "Medium": the gap grows 0.5 m per 1 m/s of speed (17 m at 60 s instead of 27.6 m).
- [correction] "one of the rock on the right side sometimes placed that it is entering the play area. it does not interfere with gameplay, but it is disturbing and misleading if that lane is free or not" — from my iPhone and Android screenshots.
- [playtest] "other not mentioned things look good. android also plays fine, it has continuous 110+ fps" — my Android screenshot showed 118 FPS and 42 draw calls; the iPhone 14 screenshot showed 60 FPS and 42 draw calls.
- [playtest] "android share also ok, checked it" — the Android share sheet works.
- [correction] "The deck chair looks very bad, not like a deck chair and planter look out of place. Any other options? Like a basic circle table maybe?" — after the screenshot sheet; nothing was pushed.
- [correction] "Also the parasols beds headrest/back looks like if it is tilted in the wrong direction" — the lounger backrest was rotated -0.9 rad, raising its seat-side edge.
- [direction] "I will look for a cc0 or attribution deck chair model also"
- [decision] "Café tablet and menu board, but: move the chairs closer together and in front of the table, the menu board should be rotated 30 degrees" — picked from mock-ups of a café table, a menu board, a surfboard rack and a windbreak; the deckchair and planter are dropped.
- [direction] "could wel also rotate the parasols and the table+chair combo ? rotate them 20 degrees and lets rotate all objects randomly clockwise/counter-clockwise directions"
