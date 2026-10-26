import '@testing-library/jest-dom';

// Polyfill window.matchMedia for JSDOM in Vitest
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
});

// Polyfill HTMLMediaElement play & pause
window.HTMLMediaElement.prototype.play = () => Promise.resolve();
window.HTMLMediaElement.prototype.pause = () => {};
window.HTMLMediaElement.prototype.load = () => {};

// Polyfill AudioContext if not present
if (typeof window.AudioContext === 'undefined') {
  (window as any).AudioContext = class {
    state = 'running';
    createBufferSource = () => ({
      connect: () => {},
      start: () => {},
      stop: () => {},
      loop: false,
      buffer: null,
    });
    createGain = () => ({
      connect: () => {},
      gain: { value: 1, setValueAtTime: () => {} },
    });
    createBiquadFilter = () => ({
      connect: () => {},
      type: 'lowpass',
      frequency: { value: 1000 },
    });
    createOscillator = () => ({
      connect: () => {},
      start: () => {},
      stop: () => {},
      frequency: { value: 432 },
    });
    createBuffer = () => ({
      getChannelData: () => new Float32Array(100),
    });
    destination = {};
    sampleRate = 44100;
    close = () => Promise.resolve();
    resume = () => Promise.resolve();
    suspend = () => Promise.resolve();
  };
}
