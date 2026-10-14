// Sound effects (GDD §10): a few Kenney CC0 sounds in public/sounds (credited in src/credits.json).
// Muted by default; the player's choice is remembered on the device. Mobile browsers only start audio
// inside a user gesture, so the AudioContext is created or resumed from the unmute and Play taps.
const SOUND_FILES = {
  coffee: 'sounds/interface/glass_002.mp3', // mug and takeaway cup
  frappe: 'sounds/interface/confirmation_001.mp3',
  stumble: 'sounds/impact/impactSoft_heavy_000.mp3',
  gameOver: 'sounds/digital/lowDown.mp3',
  tap: 'sounds/interface/click_001.mp3',
};
const MUTED_KEY = 'brisa-dash-muted';

function deviceStorage() {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

async function fetchSound(file) {
  const response = await fetch(import.meta.env.BASE_URL + file);
  if (!response.ok) throw new Error(`${response.status} ${file}`);
  return response.arrayBuffer();
}

export function createAudio({
  storage = deviceStorage(),
  createContext = () => new AudioContext(),
  loadFile = fetchSound,
} = {}) {
  let muted = true;
  try {
    muted = storage?.getItem(MUTED_KEY) !== 'false';
  } catch {
    // stays muted
  }
  let context = null;
  const buffers = {};

  function loadAll() {
    for (const [name, file] of Object.entries(SOUND_FILES)) {
      loadFile(file)
        .then((data) => context.decodeAudioData(data))
        .then((buffer) => (buffers[name] = buffer))
        .catch((error) => console.warn(`Sound ${file} failed to load`, error));
    }
  }

  // Call from a tap or click handler
  function unlock() {
    if (muted) return;
    if (!context) {
      try {
        context = createContext();
      } catch {
        return; // no Web Audio: the game stays silent
      }
      loadAll();
    }
    if (context.state !== 'running') context.resume(); // iOS can also report 'interrupted'
  }

  function play(name) {
    if (muted || !context || !buffers[name]) return;
    const source = context.createBufferSource();
    source.buffer = buffers[name];
    source.connect(context.destination);
    source.start();
  }

  function setMuted(value) {
    muted = value;
    try {
      storage?.setItem(MUTED_KEY, String(muted));
    } catch {
      // the choice still holds for this visit
    }
    unlock();
  }

  return { unlock, play, setMuted, isMuted: () => muted };
}
