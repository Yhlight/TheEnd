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

    this._loadHitSound();
    this._loadMissSound();
    this.isInitialized = true;
  }

  async _loadHitSound() {
    try {
      // A simple, short click sound is often used for rhythm games
      const response = await fetch('/hit.wav');
      if (!response.ok) {
        throw new Error(`Failed to fetch hit sound: ${response.statusText}`);
      }
      const arrayBuffer = await response.arrayBuffer();
      this.hitSoundBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
      console.log('Hit sound loaded successfully.');
    } catch (error)
 {
      console.error('Error loading hit sound:', error);
    }
  }

  async _loadMissSound() {
    try {
      // TODO: Replace with a real miss sound file when available.
      const response = await fetch('/hit.wav'); // Using hit.wav as a placeholder
      if (!response.ok) {
        throw new Error(`Failed to fetch miss sound: ${response.statusText}`);
      }
      const arrayBuffer = await response.arrayBuffer();
      this.missSoundBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
      console.log('Miss sound loaded (using placeholder).');
    } catch (error)
 {
      console.error('Error loading miss sound:', error);
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
    if (this.musicElement) {
      this.musicElement.play().catch(e => console.error("Music play failed:", e));
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
