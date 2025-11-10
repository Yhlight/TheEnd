// src/core/AudioManager.js

export class AudioManager {
  constructor() {
    this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    this.hitSoundBuffer = null;
    this._loadHitSound();
  }

  async _loadHitSound() {
    try {
      const response = await fetch('/hit.wav');
      if (!response.ok) {
        throw new Error(`Failed to fetch hit sound: ${response.statusText}`);
      }
      const arrayBuffer = await response.arrayBuffer();
      this.hitSoundBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
      console.log('Hit sound loaded successfully.');
    } catch (error) {
      console.error('Error loading hit sound:', error);
      // In a real game, you might want to fall back to a synthesized sound.
    }
  }

  playHitSound() {
    if (!this.hitSoundBuffer) {
      // console.warn('Hit sound not loaded yet.');
      return;
    }
    const source = this.audioContext.createBufferSource();
    source.buffer = this.hitSoundBuffer;
    source.connect(this.audioContext.destination);
    source.start(0);
  }
}
