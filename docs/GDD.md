# Brisa Dash — Game Design Document

*Status: reviewed, 14 October 2026; review answers are in section 13. The source brief is [BRIEF_brisa-dash.md](BRIEF_brisa-dash.md) and the colours come from [brisa-cafe-brand-palette.md](brisa-cafe-brand-palette.md). This document turns the brief into concrete design and doesn't repeat it. Values marked **(tune)** are starting points to adjust in playtests, not final numbers.*

## 1. Pitch

A barista dashes down a sunny Costa del Sol promenade, swerving between beach umbrellas and deckchairs and grabbing coffee cups along the way. One thumb, three lanes, a 30–60-second run, then share your score and try again.

- **Player:** an adult café visitor on a phone, playing one-handed while waiting for an order.
- **Platform:** a phone browser in portrait (9:16), opened from a QR code or a social link. Hosted on Cloudflare Pages at the default `*.pages.dev` address, with the code on GitHub.
- **Feel:** relaxed, sunny and playful (from the palette doc), not twitchy or punishing.

## 2. Core loop

```
Start screen → tap Play → run (swipe between lanes, grab coffee, dodge)
      ↑                                   │ second hit while stumbling
      └──── Retry (one tap) ← Game over (score, share) ←┘
```

## 3. Controls

| Input | Action |
|---|---|
| Swipe left / right (anywhere on screen) | Move one lane left or right |
| ← / → or A / D (desktop testing) | Same |
| Tap | Only on UI buttons (Play, Retry, Share, Mute, Credits) |

- There are exactly **3 lanes**, and the runner is always in one of them. Swiping toward the edge from an outer lane does nothing.
- A lane change is a quick slide of about **0.12 s (tune)**. One extra swipe made during a slide is queued, so quick double swipes work.
- A swipe counts once the finger has moved about **30 px horizontally (tune)**, so it fires before the finger lifts. That feels more responsive one-handed.
- The first run shows a **gesture hint** (an animated hand swiping left and right). It disappears after the first successful lane change.

## 4. Fail rule: the stumble

The runner does not die on the first hit:

1. **First hit:** the runner **stumbles**.
   - The speed drops to about **70% (tune)** and climbs back to full over the stumble window.
   - The runner wobbles: a tilt and bob of the static model, plus a small camera shake.
   - A **stumble meter** shows on the HUD and drains over **5 s (tune)**.
   - The obstacle that was hit gets knocked aside (it tips over and slides out of the lane), so one obstacle can't hit the runner twice.
2. **Second hit while the meter is still draining:** the **run ends**.
3. **Meter runs out:** the runner is steady again, and the next hit is a fresh first hit.

The runner can still change lanes and collect coffee while stumbling.

The wobble is just a **code-driven change of position and rotation** on a static mesh. There is no rig and no animation system, which the brief rules out.

**Collision:** an obstacle hits when the runner is in the obstacle's lane and their forward distance is less than the overlap length. During a lane slide, the runner counts as being in the lane it's moving *into*. There is no physics engine.

## 5. Speed and run length

- The start speed and acceleration (tune) are set so a typical first-time run ends somewhere around 30–60 s.
- Speed ramps up gradually to a **cap**, so the game stays readable on a small screen.
- Obstacle spacing grows with speed, but more slowly than the speed itself (Session 12): rows start 9.6 m apart and the gap grows 0.5 m per m/s (tune), so rows come more often as the run goes on: 0.74 s apart at 60 s, 0.64 s at top speed, and never under 0.5 s.

## 6. Scoring

- **Distance:** +1 point per metre run (tune).
- **Pickups:** +10 points per coffee mug or takeaway cup, and +20 per frappe (tune). A small "+10" or "+20" pops up above the runner on each pickup.
- The HUD shows the score. The game-over screen shows the score, the distance in metres and the coffees collected. Frappes count as coffees in that total and in the share text; only the score shows their extra value.
- **Best score (built in Phase 6):** stored in `localStorage` on the device and shown as "Best: N" on the start and game-over screens, or "New best: N!" when a run beats an earlier best. If storage is blocked (private browsing), the game plays the same without it.

## 7. World and entities

| Entity | What it is | Source |
|---|---|---|
| Runner | A barista made from Kenney Blocky Character **`character-f.glb`** (teal shirt), in a static pose with a code-driven run bob. No apron for now; it may come later | Blocky Characters (CC0) |
| Obstacles (three looks, one behaviour) | Each blocks one lane and hits the same way. The look is picked per obstacle by `obstacleMix` (tune): a beach parasol over a lounger 50%, a round café table with two stools 25%, a café A-frame menu board 25%. Each obstacle is turned about its vertical axis, clockwise or counter-clockwise at random: parasols 10°, tables 20°, menu boards 30° (Session 12). The lounger under the parasol is 0.8 m wide. Obstacles use turquoise, white and Deep Ocean, never coral, because coral means a cup to collect | All built from primitives (Session 12). The tent and barrel tried in Session 11, and a code-built deckchair and a City Kit planter tried in Session 12, were dropped after my review. A deckchair model may come later |
| Pickup A: coffee mug | The common pickup, spinning and bobbing: **`cup-coffee.glb`** (a ceramic cup with a handle), tinted Sunset Coral, 0.3 m tall. Worth +10 | Food Kit (CC0) |
| Pickup B: frappe | The rarer pickup: **`frappe.glb`** (a takeaway cup with a lid and straw) in its own colours, 0.8 m tall. Worth +20 | Food Kit (CC0) |
| Pickup C: takeaway cup | A common pickup: "Low-Poly Takeaway Coffee Cup", recoloured in code with a Sunset Coral body and a Sea Salt White lid, 0.58 m tall. Worth +10 | PickledCactusAlan on Sketchfab (**CC BY 4.0**, see §13) |
| Track | A sandy promenade in Sunlit Sand with white kerbs and dashed lane lines | Code-built planes that stay still. Only the lane-line dashes move and get recycled (one instanced mesh) |
| Scenery | Palms, sandy rocks and gray stones on both sides; a few stones in the shallows; a row of white villas with terracotta roofs on the right; three boats on the turquoise sea on the left, bobbing. One layout of 24 pieces (6 palms, 4 rocks, 6 stones, 5 villas, 3 boats) repeats every 80 m | Nature Kit: `tree_palm*`, `rock_*` and `stone_*` (tinted gray). City Kit (Suburban): `building-type-g/k/m/r` with the pack's terracotta roof colours swapped into the shared texture. Watercraft Kit: `boat-sail-a`, `boat-speed-j`, `boat-fishing-small` (all CC0) |
| Seagulls | Four gulls circling over the sea ahead of the runner, banking into the turn with a slow bob. `seagullCount` in `config.js` sets how many; 0 turns them off | Built from primitives (no pack has a seagull) |

- **Spawning:** obstacles come in rows, and every row **leaves at least one lane free**. A share of rows (`zigzagChance`, 20%, tune) come as a **zigzag pair**: two rows that each block two lanes, whose free lanes sit side by side, so the runner has to swipe straight after the first row. The second row is placed so there is exactly 0.5 s (`zigzagRunSeconds`, tune) of free running between the two rows' hit windows at any speed. Coffees come in short lines of 3–5 cups (tune) in a lane that is free at that point, which rewards reading the road. Each line is one kind of cup: mugs 40%, takeaway cups 40%, frappes 20% (tune).
- **Recycling:** every track segment, obstacle, cup and scenery piece comes from a small pool and moves back ahead of the runner once it has passed behind the camera. No infinite world is built.
- **Camera:** a fixed perspective camera behind and above the runner, looking down the track. The look-at point stays steady; the only camera motion is the stumble shake.
- **Lighting:** ambient plus one directional light, with flat colours. No shadows by default; they could be added later only if the frame rate allows.

## 8. Screens and UI (HTML/CSS overlay)

| Screen | Contents |
|---|---|
| **Start** | The "Brisa Dash" logo as styled text with a "by Brisa Café" tagline, a **Play** button (Turquoise), Best score (once there is one), mute toggle, **Credits** link |
| **HUD** (during a run) | Score at top centre (Deep Ocean text), coffee count, stumble meter (shown only while stumbling), mute toggle. The bottom half of the screen stays clear for the thumb |
| **Game over** | Score, distance, coffees, best score, **Retry** (primary button), **Share score** (secondary button), **Credits** link. Panel in Sea Salt White |
| **Credits** | An overlay listing every asset actually used: creator, pack, URL, licence (CC0, or CC BY with the changes made). Generated from the same data as `CREDITS.md` |

- **Orientation:** the game is designed for portrait. In landscape or on a desktop, the 9:16 game column is centred and the sides are filled with the brand colour (letterboxing). There is no "rotate your phone" blocker.
- **Pausing:** the run pauses automatically when the tab is hidden (`visibilitychange`) and shows a "Tap to resume" panel when the player comes back.

## 9. Sharing

- On the game-over screen, **Share score** uses the **Web Share API** (`navigator.share`) when it's available. Otherwise it copies the text and link to the clipboard and shows a "Copied!" message.
- Proposed share text:
  > I dashed 412 m and grabbed 23 coffees at Brisa Café — score 642! ☕🌊 Can you beat me? `https://<project>.pages.dev`
- There's no leaderboard, no account and no tracking. Sharing only happens when the player taps Share.

## 10. Audio

- A few **CC0 sound effects** (built in Phase 6), from three Kenney packs checked as CC0 and credited: a glass clink for a mug or takeaway cup and a brighter chime for a frappe (Interface Sounds), a soft thud for a stumble (Impact Sounds), a falling tone for game over (Digital Audio) and a click for Play, Retry and Share (Interface Sounds). Converted to mono MP3 with the volume evened out, so they play in iOS Safari.
- Sound is **muted by default**, and a mute/unmute toggle in the top-right corner (over every screen and the HUD) turns it on; the choice is remembered on the device. Every sound plays at 40% volume (`soundVolume`, tune), turned down in Session 12 because it felt intrusive. Audio only starts after a user gesture, as mobile browsers require: the unmute, Play, Retry and resume taps.
- There's no music.
- **Scope note:** the brief doesn't mention audio, and you chose to add it. It's first on the cut list (section 11).

## 11. Scope

**Must-haves (from the brief):**
- A real-time 3D three-lane runner
- Swipe and keyboard controls
- One obstacle type (three looks since Phase 6, one behaviour) and three pickups: a coffee mug, a takeaway cup and a rarer, higher-value frappe. The brief asked for one; I added the others in Session 8
- The stumble fail rule
- Distance plus pickup scoring
- The start, HUD, game-over and credits screens
- Share with a copy fallback
- Portrait-first resizing, capped device pixel ratio, few draw calls
- `CREDITS.md` and the in-game credits
- HTTPS deployment on Cloudflare Pages

**Nice-to-haves (all built in Phase 6):**
- Sound effects (added in the Session 2 review)
- Best score
- A second obstacle arrangement: the zigzag pair (§7)
- Added in Phase 6 (Session 11) at my direction: two more obstacle looks (a café table and a menu board since Session 12), and extra scenery (villas, boats, gray stones, seagulls). Both go past the brief's "one obstacle type" and "little low-poly scenery" on purpose

**Cut first, in this order:**
1. Sound effects
2. Extra scenery
3. Best score
4. Extra obstacle arrangements

**Out of scope (unchanged from the brief):** jumping or sliding, free movement, rigs or animation, physics, procedural levels, post-processing, dynamic lighting or shadows, multiple environments or levels, character selection, power-ups, achievements, prizes, sign-in, analytics, leaderboards, music, AI-generated art.

## 12. Success criteria (as in the brief)

- A complete 3D loop (start → play → game over → replay) works in a tested WebGL2 mobile browser, and lanes and obstacles stay readable in portrait.
- One first-time tester finds the swipe control and finishes a run without help. Their feedback is recorded as given, not turned into a success rate.
- Share or copy produces meaningful text and a link that works. Every asset used is credited and verified as CC0, apart from the one CC BY 4.0 model allowed in §13, which is credited with its required attribution.
- Tests on a real phone report any performance limits honestly. The target is smooth play near 30 FPS on the tested phone. The test phones are an iPhone 14 and/or a Samsung Galaxy S20 FE; record which browser was used when testing.

## 13. Review decisions (14 October 2026)

1. **Asset packs:** three CC0 packs are allowed: Blocky Characters, Food Kit and Nature Kit. This lifts the brief's two-pack limit for this project. In Phase 6 (Session 11) I added two more CC0 model packs, City Kit (Suburban) and Watercraft Kit, for houses and boats, and three CC0 Kenney sound packs (Interface Sounds, Impact Sounds, Digital Audio).
2. **Share link:** the default Cloudflare Pages `*.pages.dev` address. No custom domain.
3. **Runner:** a barista. A customer chasing their order was rejected because it "would not send the right message" for the café.
4. **Stumble numbers:** start at a 5 s window and 70% speed. They'll be adjusted after playtests.
5. **Test devices:** an iPhone 14 and/or a Samsung Galaxy S20 FE, the older phones the game should run well on.
6. **CC BY exception (Session 8):** the takeaway cup, "Low-Poly Takeaway Coffee Cup" by PickledCactusAlan (https://skfb.ly/oxqpp), is CC BY 4.0, not CC0. Its page says it was "Modelled in Maya, textured in Photoshop", so it is hand-made. I allowed it as the one exception to the brief's CC0-only rule. It is credited in-game and in `CREDITS.md` with title, author, source, licence and the changes made (recoloured in code).
