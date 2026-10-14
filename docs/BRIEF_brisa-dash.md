# The brief — Brisa Dash

*Fictional client exercise. The client message is invented; the scope is a proposed self-directed prototype, not an approved commission.*

## Client input

> **Subject: Little game for our café?**
>
> Hi! We run **Brisa Café** on the Costa del Sol. We'd love something people can play while waiting for coffee — maybe from a QR code on our tables or a link on Instagram. I've seen those games where you try to beat your score. Could ours have the beach, our colours and some coffee cups? It would be fun if people could share their scores. Nothing too complicated, hopefully ready before the busy season. What do you think?
>
> Thanks, **Lucía**, owner

**Source:** Simulated owner email; undated.

**Client / product:** Brisa Café (fictional) / branded casual advergame.

**What they want:** A quick, branded score-chaser with a social-sharing moment.

**Who it's for:** Café customers and people opening shared links.

**Where it will run:** Phone browser from a QR code or social link.

**Deadline / budget:** “Before the busy season”; budget unspecified.

**References:** Unspecified high-score games.

**Materials provided:** None; café name, colours and logo are placeholders.

**Who approves:** Lucía, provisionally (fictional).

## Scoped brief

**Goal (one sentence, measurable):** Deliver a branded, genuinely 3D, 30–60-second endless runner that a first-time player can control without explanation and use to copy or share a score and link.

**Target player:** An adult café visitor on a phone, playing one-handed while waiting for an order.

**Platform & orientation:** **Three.js + HTML5/CSS**, browser-playable, **mobile portrait (9:16)**, responsive to common phone widths; WebGL2-capable iOS/Android browser; no install, account or backend. Phaser is not used for this prototype.

**Core loop (one sentence):** Swipe between three fixed lanes in a low-poly 3D seaside scene, collect coffee pickups, dodge approaching obstacles, earn a score and immediately retry.

### Must-haves

- **Real-time 3D scene:** fixed perspective camera looking along a simple three-lane promenade, flat colours/ambient lighting, one short repeating stretch of track and a little low-poly scenery. Recycle objects rather than construct an infinite world.
- **Minimal runner gameplay:** a static character or simple 3D pawn, one obstacle type, one coffee collectible, swipe left/right to switch among exactly three lanes and gradual speed increase. Use lane-plus-distance collision checks, **not** a physics engine.
- **Simple presentation:** HTML/CSS overlay for branded start screen, gesture hint, score, game over, one-tap retry and a fictional café palette/text logo. No animation rig or character animation system.
- **Share score:** use the Web Share API when available and a copy-text-plus-link fallback otherwise; no leaderboard.
- **Mobile-first engineering:** resize camera/canvas for portrait phones, cap device pixel ratio, keep draw calls/models low, support keyboard arrows for desktop testing and deploy via HTTPS.
- Visible *Credits* link on start/end screen and exact CC0 asset references in `CREDITS.md`.

### Nice-to-haves

- Device-local best score; a second obstacle configuration **only if the core game is finished**.

### Out of scope

- Free-roaming movement, jumping, character rigging/animation, full physics, procedural level generation, advanced shaders/post-processing, dynamic lighting and multiple environments.
- Multiple levels, character selection, achievements, prizes, discounts, sign-in and analytics.
- Custom illustration or modelling, commissioned branding, AI-generated art, printed QR collateral and native app packaging.

### Success criteria

- A complete **3D** start → play → game over → replay loop works in a tested WebGL2-enabled mobile browser; lane changes and obstacles remain legible on a portrait screen.
- One first-time tester can discover the swipe control and finish a run without help; record feedback, not a fabricated success rate.
- Share/copy action produces meaningful text and a working game link; all used art is credited and CC0-verified.
- Actual mobile-device testing reports any performance limitations; a practical target is smooth gameplay near 30 FPS on the tested phone, not an unverified universal guarantee.

### Time box

**Maximum 3 focused working days (AI-assisted development):** **Day 1** — set up Three.js scene/camera, select and import one small CC0 3D pack, implement swipes and fixed lane switching; **Day 2** — moving/recycled obstacle and pickup, simple collisions/scoring, HTML overlay and game-over/retry; **Day 3** — fictional café styling, score sharing, performance/portrait QA, deployment and credits. **Cut first:** extra scenery, local best score and additional patterns. Keep the essential 3D lane runner intact. This timeline is a target, not a claim that 3D implementation is risk-free.

### Asset constraints

**Use verified CC0 low-poly 3D packs; no AI-generated images, textures or models.** Candidate sources: [Kenney Nature Kit](https://kenney.nl/assets/nature-kit), [Kenney Food Kit](https://kenney.nl/assets/food-kit), and optionally [Kenney Blocky Characters](https://kenney.nl/assets/blocky-characters) (each pack's page lists **3D** and **CC0**). Prefer **one primary pack plus at most one supporting pack**; use code-built primitive meshes for a simple track/obstacle/character or coffee pickup if an appropriate model is unavailable. Reuse static models, avoiding rigs and custom animation. Choose model files Three.js can load (prefer glTF/GLB, converting a small number only if required), and avoid large textures. HTML/CSS handles HUD and branding. Record *only assets actually used* with creator, pack, URL and CC0 in `CREDITS.md`, despite CC0 not requiring attribution. Any OpenGameArt alternative must be individually verified as CC0.

### Legal & privacy

No accounts, tracking, competition or real promotional prizes; sharing is player-initiated. The fictional café identity is not presented as a real endorsement. Confirm every selected OpenGameArt item's own licence; **the site contains non-CC0 work too**. Keep a `CREDITS.md` and an in-game credit link.

### Assumptions and open questions

- **Scope choice:** A real 3D three-lane runner rather than match-3/tap timing; simple perspective, object recycling and manual collisions demonstrate Three.js without requiring a full 3D game engine.
- **Development claim:** AI assistance may accelerate **Three.js/JavaScript implementation**, debugging, collision logic and iteration; visual assets come from credited human-made CC0 packs (plus code-defined geometry), not generative AI.
- **Assumed fictional-client confirmations:** Assumed primary goal is sharing (since I cannot confirm with the fictional client). Assumed brand guidelines: since client didn't provide, use colors from `docs/brisa-cafe-brand-palette.md`.
