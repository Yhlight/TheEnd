// src/core/AudioManager.js

export class AudioManager {
  constructor(musicElement) {
    this.musicElement = musicElement;
    this.audioContext = new (window.AudioContext || window.webkitAudioContext)();

    this.hitSoundBuffer = null;
    this.missSoundBuffer = null;
    this.sfxVolume = 1.0;

    // Create a GainNode to control SFX volume
    this.sfxGainNode = this.audioContext.createGain();
    this.sfxGainNode.connect(this.audioContext.destination);

    this._loadHitSound();
    this._loadMissSound();
  }

  async _loadHitSound() {
    try {
      const response = await fetch('/hit.wav');
      if (!response.ok) {
        throw new Error(`Failed to fetch hit sound: ${response.statusText}`);
      }
      const arrayBuffer = await response.arrayBuffer();
      this.hitSoundBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
    } catch (error)
 {
      console.error('Error loading hit sound:', error);
    }
  }

  async _loadMissSound() {
    try {
      const response = await fetch('/hit.wav'); // Using hit.wav as a placeholder
      if (!response.ok) {
        throw new Error(`Failed to fetch miss sound: ${response.statusText}`);
      }
      const arrayBuffer = await response.arrayBuffer();
      this.missSoundBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
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
}
