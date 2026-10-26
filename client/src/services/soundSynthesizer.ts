// Web Audio API ambient sound generator for white noise, pink noise, rain, and binaural focus drone
class SoundSynthesizer {
  private ctx: AudioContext | null = null;
  private activeNodes: { stop: () => void }[] = [];
  private gainNode: GainNode | null = null;
  private currentVolume: number = 0.7;

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.gainNode = this.ctx.createGain();
        this.gainNode.gain.setValueAtTime(this.currentVolume, this.ctx.currentTime);
        this.gainNode.connect(this.ctx.destination);
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  setVolume(vol: number) {
    this.currentVolume = Math.max(0, Math.min(1, vol));
    if (this.gainNode && this.ctx) {
      this.gainNode.gain.setValueAtTime(this.currentVolume, this.ctx.currentTime);
    }
  }

  stop() {
    this.activeNodes.forEach((node) => {
      try {
        node.stop();
      } catch {
        // Ignore stopped nodes
      }
    });
    this.activeNodes = [];
  }

  playWhiteNoise() {
    this.initContext();
    if (!this.ctx || !this.gainNode) return;
    this.stop();

    const bufferSize = 2 * this.ctx.sampleRate;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;

    // Filter to soften white noise for studying
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1200, this.ctx.currentTime);

    whiteNoise.connect(filter);
    filter.connect(this.gainNode);
    whiteNoise.start();

    this.activeNodes.push({
      stop: () => {
        try {
          whiteNoise.stop();
          whiteNoise.disconnect();
          filter.disconnect();
        } catch {}
      },
    });
  }

  playPinkNoise() {
    this.initContext();
    if (!this.ctx || !this.gainNode) return;
    this.stop();

    const bufferSize = 2 * this.ctx.sampleRate;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);

    // Paul Kellet's filtered pink noise algorithm
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
      b6 = white * 0.115926;
    }

    const pinkNoise = this.ctx.createBufferSource();
    pinkNoise.buffer = noiseBuffer;
    pinkNoise.loop = true;
    pinkNoise.connect(this.gainNode);
    pinkNoise.start();

    this.activeNodes.push({
      stop: () => {
        try {
          pinkNoise.stop();
          pinkNoise.disconnect();
        } catch {}
      },
    });
  }

  playBinauralFocus() {
    this.initContext();
    if (!this.ctx || !this.gainNode) return;
    this.stop();

    // 432 Hz warm fundamental tone with gentle 10Hz Alpha wave pulsation
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const lfo = this.ctx.createOscillator();
    const lfoGain = this.ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(216, this.ctx.currentTime); // A3 harmonic

    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(226, this.ctx.currentTime); // 10Hz difference for alpha wave focus

    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(0.2, this.ctx.currentTime); // Slow breathing rate
    lfoGain.gain.setValueAtTime(0.08, this.ctx.currentTime);

    const subGain = this.ctx.createGain();
    subGain.gain.setValueAtTime(0.25, this.ctx.currentTime);

    lfo.connect(lfoGain.gain);
    osc1.connect(subGain);
    osc2.connect(subGain);
    subGain.connect(this.gainNode);

    osc1.start();
    osc2.start();
    lfo.start();

    this.activeNodes.push({
      stop: () => {
        try {
          osc1.stop();
          osc2.stop();
          lfo.stop();
          osc1.disconnect();
          osc2.disconnect();
          subGain.disconnect();
        } catch {}
      },
    });
  }
}

export const soundSynthesizer = new SoundSynthesizer();
