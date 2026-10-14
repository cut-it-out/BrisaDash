# Brisa Dash — Execution Plan

*Status: approved, 14 October 2026 (Session 2). Built from [GDD.md](GDD.md). Each phase ends with something playable that can be committed. Tick phases off in [buildlog.md](buildlog.md); if the plan changes, edit this file in the same session.*

The phases fit the brief's 3-day time box: Day 1 = Phases 0–1, Day 2 = Phases 2–3, Day 3 = Phases 4–5, then Phase 6 if there's time.

## Toolchain

- **Vite + `three` from npm + Vitest**, in plain JavaScript.
- Test: `npm test` (`vitest run`). Build: `npm run build`, which writes to `dist/` for Cloudflare Pages.

## Architecture rule

Game logic lives in plain modules under `src/game/` with no Three.js or DOM imports, so Vitest can test it without WebGL. Rendering (`src/render/`) and UI (`src/ui/`) read the logic state and draw it. This keeps the "Verification First" rule without adding abstraction layers.

```
index.html                 9:16 game column: <canvas> + overlay <div>
src/main.js                boot, requestAnimationFrame loop, wires modules
src/style.css              palette tokens, screens, HUD, letterboxing
src/game/config.js         every (tune) number in one place
src/game/lanes.js          lane index, 0.12 s slide, one queued swipe, effectiveLane
src/game/speed.js          start speed, acceleration, cap, stumble multiplier
src/game/spawner.js        obstacle rows (≥1 free lane), coffee lines, injectable RNG
src/game/collision.js      same effectiveLane && |dz| < overlap
src/game/stumble.js        steady → stumbling(5 s) → dead / back to steady
src/game/score.js          distance + 10 per cup
src/game/run.js            one run's state; update(dt) → events (pickup/stumble/gameOver)
src/render/scene.js        renderer (WebGL2 check, DPR cap), camera, lights, resize
src/render/world.js        pooled track segments, sea, scenery
src/render/entities.js     runner, obstacle and cup meshes plus pools, wobble/shake/knock-aside
src/ui/input.js            pointer swipes (30 px, fires mid-move) + arrows/A/D
src/ui/screens.js          start / HUD / game over / credits / pause overlays
src/ui/share.js            share text builder + Web Share / clipboard fallback
src/credits.json           single source for the credits overlay and CREDITS.md
scripts/gen-credits.mjs    `npm run credits` → writes CREDITS.md
tests/*.test.js            Vitest, one file per src/game module + share text
public/models/             only the GLBs actually used
```

---

## Phase 0 — Scaffold, deploy pipeline, asset check

*Goal: an empty branded page live on `*.pages.dev`, so real-phone testing is possible from day one.*

1. Scaffold Vite (vanilla JS) and add `three` and `vitest`. Add the `dev` (`vite --host` for LAN phone testing), `build`, `preview` and `test` scripts. The `credits` script comes in Phase 4, together with `scripts/gen-credits.mjs`. Add a `.gitignore` covering `node_modules` and `dist`.
2. `index.html` + `style.css`: palette as CSS custom properties, a centred 9:16 column with brand-colour letterboxing, `touch-action: none` and `overscroll-behavior: none` on the game area (stops pull-to-refresh and double-tap zoom stealing swipes), and the viewport meta.
3. `render/scene.js`: WebGL2 renderer with the DPR cap (`min(devicePixelRatio, 2)`, tune), resize to the column, a placeholder cube spinning in Turquoise. If WebGL2 is missing, show a plain "browser not supported" message.
4. **Asset check (a risk, so it comes early):** download the three Kenney packs (Blocky Characters, Food Kit, Nature Kit) to a temporary folder outside the repo. Confirm the CC0 licence file in each and list the GLB files. Then decide model or primitive for each entity: runner, parasol/deckchair, takeaway cup, palm/rock. Check whether the character's apron is a separate material that can be tinted. Record the results in the build log. The models themselves are swapped in during Phase 4.
5. Cloudflare Pages: I connect the GitHub repo in the Cloudflare dashboard (build `npm run build`, output `dist`). Claude Code asks before every push.
6. A trivial Vitest test so `npm test` runs green.

**Verify:** `npm test` passes, `npm run build` succeeds, and the `*.pages.dev` URL shows the spinning cube in a 9:16 column on the phone.

## Phase 1 — Scene, track, lanes, controls

*Goal: a placeholder runner on a scrolling promenade, switching lanes by swipe and keyboard.*

1. `game/config.js` holds all the GDD's (tune) values: lane width, slide 0.12 s, swipe 30 px, speeds, stumble 5 s / 70 %, scoring, spawn spacing.
2. `game/lanes.js`: lanes 0–2, slide progress, one queued input, ignores swipes past an edge, `effectiveLane` = the target lane during a slide (GDD §4).
3. `render/scene.js` + `world.js`: fixed camera behind and above the runner, ambient + directional light, no shadows, sky colour, a turquoise sea plane on one side, Sunlit Sand track segments with lane lines, pooled and recycled at a constant speed.
4. `render/entities.js`: a primitive runner (block) with a code-driven run bob, eased between lane x positions.
5. `ui/input.js`: a swipe fires once the finger has moved 30 px horizontally, once per gesture (re-armed on pointerup); arrows and A/D do the same.
6. Gesture hint: a CSS-animated hand, removed after the first successful lane change.
7. Debug overlay behind `?debug`: FPS and `renderer.info.render.calls`, for honest phone performance numbers from now on.

**Verify:** `npm test` (lane state machine: slide, queue, edges, effectiveLane). On the phone over LAN (`npm run dev`) or a deploy: swipes feel immediate, double swipes queue, and the debug overlay shows FPS and draw calls.

## Phase 2 — Core gameplay loop

*Goal: obstacles, coffee, stumble, score. The game is playable end to end, with a debug key to restart.*

1. `game/speed.js`: speed ramps up to a cap; the stumble multiplier goes from 0.7 back to 1.0 over the window.
2. `game/spawner.js`: obstacle rows **always leave at least one lane free**; spacing grows with speed; coffee lines of 3–5 cups go in a lane that's free at that point. The RNG is injected so tests are deterministic.
3. `game/collision.js`: hit when in the same effectiveLane and |dz| is under the overlap length. The same check handles cups.
4. `game/stumble.js`: first hit → stumbling (5 s meter); a hit while stumbling → dead; when the meter runs out → steady. The obstacle that was hit is flagged as knocked so it can't hit twice.
5. `game/score.js` + `game/run.js`: distance points + 10 per cup. `run.update(dt)` returns events for the renderer and UI.
6. Rendering: pooled primitive parasols (cylinder + cone) and coral cups (cylinder + lid) that spin and bob; knock-aside tween; runner wobble + small camera shake; a "+10" HTML pop.
7. Minimal HUD: score, coffee count, stumble meter (shown only while stumbling).

**Verify:** `npm test`, including a fuzz test (many seeded rows, each with a free lane), the collision edges, every stumble transition and the score maths. Playtest: does a typical first run end in about 30–60 s? Adjust `config.js` and record the numbers in the build log.

## Phase 3 — Screens, flow and sharing

*Goal: the full start → play → game over → retry loop the brief requires.*

1. `ui/screens.js`: the start screen (text logo "Brisa Dash", "by Brisa Café", Turquoise Play, Credits link), the HUD, the game-over panel in Sea Salt White (score, distance, coffees, Retry, Share score, Credits) and the credits overlay (reading `credits.json`, which only has placeholders until Phase 4).
2. Retry resets the run state and returns every pooled object without rebuilding the scene.
3. Pause on `visibilitychange` with a "Tap to resume" panel; `dt` is clamped so returning to the tab doesn't make the runner jump.
4. `ui/share.js`: build the share text (pure, tested) from the GDD §9 template using `location.origin`. Use `navigator.share` when it exists and treat a cancelled share (AbortError) as a no-op. Otherwise use `navigator.clipboard.writeText` and show "Copied!".

**Verify:** `npm test` (share text). On the iPhone the full loop works and the share sheet opens; on desktop the clipboard fallback copies the text and link.

## Phase 4 — Kenney models, scenery and credits

*Goal: swap the primitives for the CC0 models chosen in Phase 0 and make the credits real.*

1. Copy only the chosen GLBs into `public/models/`: `character-f.glb` (Blocky Characters), `cup-coffee.glb` (Food Kit), and a few `tree_palm*` / `rock_*` models (Nature Kit). Blocky and Food Kit GLBs reference an external texture, so keep the exact relative path in each GLB's `images[].uri` (e.g. a `Textures/` folder beside the GLB), or point `GLTFLoader.setResourcePath()` at the folder. Load them with GLTFLoader before Play is enabled and clone them for the pools. Scale each pack separately: the character is about 2.7 units tall, the cup 0.5 and the palm 1.4. No apron for now. The obstacle stays a primitive parasol, because no pack has one.
2. Add the brief's "little low-poly scenery": a few palms or rocks beside the track, pooled and recycled.
3. `src/credits.json` is the single source (creator, pack, URL, licence, files used). `npm run credits` generates `CREDITS.md`. A Vitest test fails if `CREDITS.md` doesn't match the JSON or if a GLB in `public/models/` has no credit entry.
4. Check the draw-call count in the debug overlay. Merge or instance meshes only if the phone numbers call for it.

**Verify:** `npm test`, the credits overlay lists exactly the packs used, and the FPS and draw-call figures on the phone are recorded in the build log.

## Phase 5 — Brand polish, QA and release

*Goal: meet the brief's success criteria honestly.*

1. Palette and typography pass, button pressed states, and `env(safe-area-inset-*)` padding for the iPhone notch and home bar.
2. Real-device test: iPhone 14 (Safari) and/or Galaxy S20 FE (Chrome). Record the browser versions and the FPS from `?debug`. Tune the speed and stumble values and log each change.
   - **Balancing pass (added in Session 3):** after the Phase 3 playtest I said the game "feels a bit easy at the moment". Tune difficulty with the `src/game/config.js` settings. Row rate is fixed in time by design, so the main levers are `twoBlockedChance`, `rowGapSeconds`, `minRowGap`, `acceleration`/`maxSpeed` and `stumbleSeconds`. Log each before → after value with the run lengths observed.
   - **How to tune on the phone (built in Session 3):** with `?debug` in the URL, any number in `src/game/config.js` can be overridden, and the debug panel lists the active overrides. Use a dotted key for `cupLineMix`; its shares are relative, so overriding one share works on its own. At the start speed, `minRowGap` (12 m) sets row spacing, not `rowGapSeconds`. A harder starting set to try:
     `https://brisa-dash.pages.dev/?debug&twoBlockedChance=0.55&rowGapSeconds=1.3&minRowGap=10&acceleration=0.2&maxSpeed=20`
     Write the chosen values into `config.js` and log them.
3. One first-time tester plays with no help. Record their feedback as given, with no success rate.
4. Share check from the live `*.pages.dev` URL: the link in the shared text opens the game.

**Verify:** the GDD §12 checklist, ticked off in the build log with evidence.

## Phase 6 — Nice-to-haves (only once Phase 5 passes)

Build order (Claude Code's proposal, cheapest first): **best score** (`localStorage` wrapped in try/catch, "Best: N" on the start and game-over screens) → **SFX + mute toggle** (CC0 pack checked and credited, muted by default, audio unlocked on the first gesture) → **extra scenery** → **a second obstacle arrangement**. If time runs short, cut in the GDD §11 order (SFX first).

---

## Verification approach (all phases)

- `npm test` after every change to `src/game/` or `src/ui/share.js`. The output is quoted in the build log, not summarised from memory.
- `npm run build` before each commit that will be deployed.
- Look on the phone through `npm run dev` (LAN, `--host`) or the Pages deploy. `?debug` gives FPS and draw calls.
- Each phase ends with a commit and a build-log note.
