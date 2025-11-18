// src/core/AudioManager.js

/**
 * Manages all audio loading and playback for the game.
 * This includes the main background music (BGM) and sound effects (SFX).
 * It is designed to be resilient to audio loading failures, allowing the game
 * to continue running without sound if an audio file fails to load.
 */
export class AudioManager {
  constructor(sfxMap, initialVolume = 1.0) {
    this.audioContext = null; // To be initialized on first user interaction
    this.bgmSource = null;
    this.sfxBuffers = {};
    this.sfxMap = sfxMap; // e.g., { tap: '/sfx/tap.wav', flick: '/sfx/flick.wav' }
    this.isMuted = false;
    this.volume = initialVolume;
    this.isBgmLoaded = false;
  }

  /**
   * Initializes the AudioContext. Must be called after a user interaction.
   */
  _initAudioContext() {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
  }

  /**
   * Loads the main background music track.
   * @param {string} url - The URL of the BGM file.
   * @returns {Promise<AudioBuffer>}
   */
  async loadBgm(url) {
    this._initAudioContext();
    this.isBgmLoaded = false;
    try {
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
      this.bgmBuffer = audioBuffer;
      this.isBgmLoaded = true;
      console.log('BGM loaded successfully.');
      return audioBuffer;
    } catch (error) {
      console.error(`[AudioManager] Error loading BGM from ${url}:`, error);
      this.isBgmLoaded = false;
      throw error; // Propagate error to be handled by the caller
    }
  }

  /**
   * Loads all sound effects defined in the sfxMap.
   */
  async loadSfx() {
    this._initAudioContext();
    const promises = Object.entries(this.sfxMap).map(async ([key, url]) => {
      try {
        const response = await fetch(url);
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
        this.sfxBuffers[key] = audioBuffer;
      } catch (error) {
        console.warn(`[AudioManager] Could not load sound effect "${key}" from ${url}. The game will continue without this sound.`);
        // Don't throw an error, just log a warning and continue.
      }
    });
    await Promise.all(promises);
    console.log('SFX loading complete.');
  }

  /**
   * Plays the loaded BGM.
   * @param {number} when - The AudioContext's currentTime to start playback.
   * @param {number} offset - The offset in seconds within the audio to start from.
   */
  playBgm(when = 0, offset = 0) {
    if (!this.bgmBuffer || !this.isBgmLoaded) {
      console.warn('[AudioManager] BGM not loaded or failed to load. Cannot play.');
      return;
    }
    this.stopBgm(); // Stop any existing playback

    this.bgmSource = this.audioContext.createBufferSource();
    this.bgmSource.buffer = this.bgmBuffer;
    this.gainNode = this.audioContext.createGain();
    this.gainNode.gain.value = this.isMuted ? 0 : this.volume;
    this.bgmSource.connect(this.gainNode).connect(this.audioContext.destination);
    this.bgmSource.start(when, offset);
  }

  /**
   * Stops the BGM playback immediately.
   */
  stopBgm() {
    if (this.bgmSource) {
      this.bgmSource.stop();
      this.bgmSource.disconnect();
      this.bgmSource = null;
    }
  }

  /**
   * Plays a sound effect by its key.
   * @param {string} key - The key of the SFX to play (e.g., 'tap').
   */
  playSfx(key) {
    if (this.isMuted || !this.sfxBuffers[key]) return;

    const sfxSource = this.audioContext.createBufferSource();
    sfxSource.buffer = this.sfxBuffers[key];
    const sfxGainNode = this.audioContext.createGain();
    sfxGainNode.gain.value = this.volume;
    sfxSource.connect(sfxGainNode).connect(this.audioContext.destination);
    sfxSource.start();
  }

  /**
   * Sets the volume for all audio.
   * @param {number} volume - A value between 0.0 and 1.0.
   */
  setVolume(volume) {
    this.volume = Math.max(0, Math.min(1, volume));
    if (this.gainNode && !this.isMuted) {
      this.gainNode.gain.setValueAtTime(this.volume, this.audioContext.currentTime);
    }
  }

  /**
   * Mutes all audio.
   */
  mute() {
    this.isMuted = true;
    if (this.gainNode) {
      this.gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
    }
  }

  /**
   * Unmutes all audio.
   */
  unmute() {
    this.isMuted = false;
    if (this.gainNode) {
      this.gainNode.gain.setValueAtTime(this.volume, this.audioContext.currentTime);
    }
  }

  /**
   * Returns the current time of the audio context.
   * @returns {number}
   */
  getContextTime() {
    return this.audioContext ? this.audioContext.currentTime : 0;
  }
}
