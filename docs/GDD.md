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
- Obstacle spacing grows with speed, so there is always time to react.

## 6. Scoring

- **Distance:** +1 point per metre run (tune).
- **Coffee:** +10 points per cup (tune). A small "+10" pops up above the runner when one is picked up.
- The HUD shows the score. The game-over screen shows the score, the distance in metres and the coffees collected.
- **Best score (nice-to-have):** stored in `localStorage` on the device and shown as "Best: N" on the start and game-over screens.

## 7. World and entities

| Entity | What it is | Source |
|---|---|---|
| Runner | A barista made from Kenney Blocky Character **`character-f.glb`** (teal shirt), in a static pose with a code-driven run bob. No apron for now; it may come later | Blocky Characters (CC0) |
| Obstacle (one type) | A beach parasol or deckchair blocking one lane | Built from primitives (a parasol is a cylinder plus a cone). None of the three packs has a parasol or deckchair (checked 14 October 2026) |
| Coffee pickup | A coffee cup that spins and bobs: **`cup-coffee.glb`** (a ceramic cup with a handle). `frappe.glb` (a takeaway cup with a lid and straw) is parked as a possible later add-on | Food Kit (CC0) |
| Track | A sandy promenade in Sunlit Sand with white kerbs and dashed lane lines | Code-built planes that stay still. Only the lane-line dashes move and get recycled (one instanced mesh) |
| Scenery | A few palms or rocks beside the track, with turquoise sea on one side and sky behind | Nature Kit (CC0): `tree_palm*` and `rock_*` models, recycled |

- **Spawning:** obstacles come in rows, and every row **leaves at least one lane free**. Coffees come in short lines of 3–5 cups (tune) in a lane that is free at that point, which rewards reading the road.
- **Recycling:** every track segment, obstacle, cup and scenery piece comes from a small pool and moves back ahead of the runner once it has passed behind the camera. No infinite world is built.
- **Camera:** a fixed perspective camera behind and above the runner, looking down the track. The look-at point stays steady; the only camera motion is the stumble shake.
- **Lighting:** ambient plus one directional light, with flat colours. No shadows by default; they could be added later only if the frame rate allows.

## 8. Screens and UI (HTML/CSS overlay)

| Screen | Contents |
|---|---|
| **Start** | The "Brisa Dash" logo as styled text with a "by Brisa Café" tagline, a **Play** button (Turquoise), Best score (if that's built), mute toggle, **Credits** link |
| **HUD** (during a run) | Score at top centre (Deep Ocean text), coffee count, stumble meter (shown only while stumbling), mute toggle. The bottom half of the screen stays clear for the thumb |
| **Game over** | Score, distance, coffees, best score, **Retry** (primary button), **Share score** (secondary button), **Credits** link. Panel in Sea Salt White |
| **Credits** | An overlay listing every asset actually used: creator, pack, URL, CC0. Generated from the same data as `CREDITS.md` |

- **Orientation:** the game is designed for portrait. In landscape or on a desktop, the 9:16 game column is centred and the sides are filled with the brand colour (letterboxing). There is no "rotate your phone" blocker.
- **Pausing:** the run pauses automatically when the tab is hidden (`visibilitychange`) and shows a "Tap to resume" panel when the player comes back.

## 9. Sharing

- On the game-over screen, **Share score** uses the **Web Share API** (`navigator.share`) when it's available. Otherwise it copies the text and link to the clipboard and shows a "Copied!" message.
- Proposed share text:
  > I dashed 412 m and grabbed 23 coffees at Brisa Café — score 642! ☕🌊 Can you beat me? `https://<project>.pages.dev`
- There's no leaderboard, no account and no tracking. Sharing only happens when the player taps Share.

## 10. Audio

- A few **CC0 sound effects**: coffee pickup, stumble, game over, and optionally a button tap. The source pack has to be verified as CC0 and credited.
- Sound is **muted by default**, and a mute/unmute toggle on the start screen and HUD turns it on. Audio only starts after a user gesture, as mobile browsers require.
- There's no music.
- **Scope note:** the brief doesn't mention audio, and you chose to add it. It's first on the cut list (section 11).

## 11. Scope

**Must-haves (from the brief):**
- A real-time 3D three-lane runner
- Swipe and keyboard controls
- One obstacle type and one pickup
- The stumble fail rule
- Distance plus coffee scoring
- The start, HUD, game-over and credits screens
- Share with a copy fallback
- Portrait-first resizing, capped device pixel ratio, few draw calls
- `CREDITS.md` and the in-game credits
- HTTPS deployment on Cloudflare Pages

**Nice-to-haves:**
- Sound effects (added this session)
- Best score
- A second obstacle arrangement, only once the core game is finished

**Cut first, in this order:**
1. Sound effects
2. Extra scenery
3. Best score
4. Extra obstacle arrangements

**Out of scope (unchanged from the brief):** jumping or sliding, free movement, rigs or animation, physics, procedural levels, post-processing, dynamic lighting or shadows, multiple environments or levels, character selection, power-ups, achievements, prizes, sign-in, analytics, leaderboards, music, AI-generated art.

## 12. Success criteria (as in the brief)

- A complete 3D loop (start → play → game over → replay) works in a tested WebGL2 mobile browser, and lanes and obstacles stay readable in portrait.
- One first-time tester finds the swipe control and finishes a run without help. Their feedback is recorded as given, not turned into a success rate.
- Share or copy produces meaningful text and a link that works. Every asset used is credited and verified as CC0.
- Tests on a real phone report any performance limits honestly. The target is smooth play near 30 FPS on the tested phone. The test phones are an iPhone 14 and/or a Samsung Galaxy S20 FE; record which browser was used when testing.

## 13. Review decisions (14 October 2026)

1. **Asset packs:** three CC0 packs are allowed: Blocky Characters, Food Kit and Nature Kit. This lifts the brief's two-pack limit for this project.
2. **Share link:** the default Cloudflare Pages `*.pages.dev` address. No custom domain.
3. **Runner:** a barista. A customer chasing their order was rejected because it "would not send the right message" for the café.
4. **Stumble numbers:** start at a 5 s window and 70% speed. They'll be adjusted after playtests.
5. **Test devices:** an iPhone 14 and/or a Samsung Galaxy S20 FE, the older phones the game should run well on.
