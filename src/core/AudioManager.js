// src/core/AudioManager.js
export class AudioManager {
  constructor(musicElement) {
    this.musicElement = musicElement;
    this.audioContext = null;
    this.hitSoundBuffer = null;
    this.missSoundBuffer = null;
    this.sfxVolume = 1.0;
    this.sfxGainNode = null;
    this.isInitialized = false;
  }

  _initializeAudio() {
    if (this.isInitialized) return;

    this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    this.sfxGainNode = this.audioContext.createGain();
    this.sfxGainNode.connect(this.audioContext.destination);

    this._loadSound('/hit.wav', 'hitSoundBuffer');
    this._loadSound('/miss.wav', 'missSoundBuffer');
    this.isInitialized = true;
  }

  async _loadSound(url, bufferName) {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
      }
      const arrayBuffer = await response.arrayBuffer();
      this[bufferName] = await this.audioContext.decodeAudioData(arrayBuffer);
      console.log(`Sound ${url} loaded successfully into ${bufferName}.`);
    } catch (error) {
      console.warn(`Warning: Could not load sound from ${url}. This is expected if the file is missing or corrupt.`, error);
    }
  }

  _playSound(buffer) {
    if (!buffer) {
      return;
    }
    this.sfxGainNode.gain.setValueAtTime(this.sfxVolume, this.audioContext.currentTime);
    const source = this.audioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(this.sfxGainNode);
    source.start(0);
  }

  playHitSound() {
    this._playSound(this.hitSoundBuffer);
  }

  playMissSound() {
    this._playSound(this.missSoundBuffer);
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
