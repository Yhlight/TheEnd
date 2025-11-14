// src/core/AudioManager.js
export class AudioManager {
  constructor(musicElement) {
    this.musicElement = musicElement;
    this.audioContext = null;
    this.soundBuffers = new Map();
    this.sfxVolume = 1.0;
    this.sfxGainNode = null;
    this.isInitialized = false;

    // Define the sound map by note type. Using placeholders.
    this.soundMap = {
      'tap': '/hit.wav',
      'flick': '/hit.wav',
      'hold': '/hit.wav',
      'drag': '/hit.wav',
      'catch': '/hit.wav',
      'miss': '/hit.wav', // A sound for when a note is missed
    };
  }

  _initializeAudio() {
    if (this.isInitialized) return;

    this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    this.sfxGainNode = this.audioContext.createGain();
    this.sfxGainNode.connect(this.audioContext.destination);

    // Load all sounds defined in the soundMap
    for (const key in this.soundMap) {
      this._loadSound(this.soundMap[key], key);
    }
    this.isInitialized = true;
  }

  async _loadSound(url, name) {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
      }
      const arrayBuffer = await response.arrayBuffer();
      const decodedBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
      this.soundBuffers.set(name, decodedBuffer);
      console.log(`Sound ${url} loaded successfully as '${name}'.`);
    } catch (error) {
      console.warn(`Warning: Could not load sound from ${url}. This is expected if the file is missing or corrupt.`, error);
    }
  }

  playSound(noteType) {
    // The noteType could be 'tap', 'flick', 'miss', etc.
    const buffer = this.soundBuffers.get(noteType);
    if (!buffer) {
      return;
    }
    this.sfxGainNode.gain.setValueAtTime(this.sfxVolume, this.audioContext.currentTime);
    const source = this.audioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(this.sfxGainNode);
    source.start(0);
  }

  setBgmVolume(volume) {
    if (this.musicElement) {
      this.musicElement.volume = volume;
    }
  }

  setSfxVolume(volume) {
    this.sfxVolume = volume;
  }

  playMusic() {
    this._initializeAudio();
    if (this.musicElement && this.musicElement.src) {
      this.musicElement.play().catch(e => console.warn("Music play failed (this is expected if audio files are missing):", e));
    }
  }

  pauseMusic() {
    if (this.musicElement) {
      this.musicElement.pause();
    }
  }

  resetMusic() {
     if (this.musicElement) {
      this.musicElement.pause();
      this.musicElement.currentTime = 0;
    }
  }
}
