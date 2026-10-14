import { describe, expect, it, vi } from 'vitest';
import { createAudio } from '../src/ui/audio.js';

function fakeStorage(initial = {}) {
  const data = { ...initial };
  return { data, getItem: (key) => (key in data ? data[key] : null), setItem: (key, value) => (data[key] = value) };
}

function fakeContext() {
  const started = [];
  return {
    started,
    state: 'suspended',
    resume: vi.fn(function () {
      this.state = 'running';
    }),
    destination: {},
    gains: [],
    createGain() {
      const node = { gain: { value: 1 }, connect(target) { node.target = target; } };
      this.gains.push(node);
      return node;
    },
    decodeAudioData: async (data) => ({ decoded: data }),
    createBufferSource: () => ({ connect() {}, start() { started.push(this.buffer.decoded); } }),
  };
}

const loadFile = async (file) => file;
const settle = () => new Promise((resolve) => setTimeout(resolve));

describe('audio', () => {
  it('is muted by default and creates no AudioContext', () => {
    const createContext = vi.fn(fakeContext);
    const audio = createAudio({ storage: fakeStorage(), createContext, loadFile });
    audio.unlock();
    audio.play('coffee');
    expect(audio.isMuted()).toBe(true);
    expect(createContext).not.toHaveBeenCalled();
  });

  it('unmuting creates and resumes the context, loads the sounds and plays them', async () => {
    const context = fakeContext();
    const audio = createAudio({ storage: fakeStorage(), createContext: () => context, loadFile });
    audio.setMuted(false);
    await settle();
    expect(context.resume).toHaveBeenCalled();
    audio.play('coffee');
    expect(context.started).toEqual(['sounds/interface/glass_002.mp3']);
  });

  it('plays nothing again once muted', async () => {
    const context = fakeContext();
    const audio = createAudio({ storage: fakeStorage(), createContext: () => context, loadFile });
    audio.setMuted(false);
    await settle();
    audio.setMuted(true);
    audio.play('stumble');
    expect(context.started).toEqual([]);
  });

  it('plays every sound through one gain node set to the volume', async () => {
    const context = fakeContext();
    const audio = createAudio({ volume: 0.4, storage: fakeStorage(), createContext: () => context, loadFile });
    audio.setMuted(false);
    await settle();
    expect(context.gains).toHaveLength(1);
    expect(context.gains[0].gain.value).toBe(0.4);
    expect(context.gains[0].target).toBe(context.destination);
  });

  it('remembers the choice on the device', () => {
    const storage = fakeStorage();
    createAudio({ storage, createContext: fakeContext, loadFile }).setMuted(false);
    expect(createAudio({ storage, createContext: fakeContext, loadFile }).isMuted()).toBe(false);
  });

  it('stays muted and working when storage throws', () => {
    const throwing = {
      getItem() {
        throw new Error('SecurityError');
      },
      setItem() {
        throw new Error('SecurityError');
      },
    };
    const audio = createAudio({ storage: throwing, createContext: fakeContext, loadFile });
    expect(audio.isMuted()).toBe(true);
    expect(() => audio.setMuted(false)).not.toThrow();
    expect(audio.isMuted()).toBe(false);
  });

  it('a sound that fails to load is skipped', async () => {
    const context = fakeContext();
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const failing = async (file) => (file.includes('glass') ? Promise.reject(new Error('404')) : file);
    const audio = createAudio({ storage: fakeStorage(), createContext: () => context, loadFile: failing });
    audio.setMuted(false);
    await settle();
    audio.play('coffee');
    audio.play('tap');
    expect(context.started).toEqual(['sounds/interface/click_001.mp3']);
    warn.mockRestore();
  });
});
