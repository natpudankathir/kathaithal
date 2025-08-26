// Sound effects utility class for chat application
export class SoundService {
  private static audioContext: AudioContext | null = null;
  private static sounds: Map<string, AudioBuffer> = new Map();

  // Initialize audio context
  static initialize() {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.preloadSounds();
    }
  }

  // Generate sound effects programmatically
  private static preloadSounds() {
    if (!this.audioContext) return;

    // Message send sound
    this.createSound('messageSent', {
      frequency: 800,
      duration: 0.1,
      type: 'sine',
      volume: 0.3
    });

    // Message receive sound
    this.createSound('messageReceived', {
      frequency: 600,
      duration: 0.15,
      type: 'sine',
      volume: 0.3
    });

    // Notification sound
    this.createSound('notification', {
      frequency: 1000,
      duration: 0.2,
      type: 'triangle',
      volume: 0.4
    });

    // Button click sound
    this.createSound('buttonClick', {
      frequency: 400,
      duration: 0.05,
      type: 'square',
      volume: 0.2
    });

    // Typing sound
    this.createSound('typing', {
      frequency: 300,
      duration: 0.03,
      type: 'sawtooth',
      volume: 0.1
    });

    // Online notification
    this.createSound('userOnline', {
      frequency: 880,
      duration: 0.3,
      type: 'sine',
      volume: 0.3
    });

    // Error sound
    this.createSound('error', {
      frequency: 200,
      duration: 0.4,
      type: 'square',
      volume: 0.3
    });
  }

  private static createSound(name: string, options: {
    frequency: number;
    duration: number;
    type: OscillatorType;
    volume: number;
  }) {
    if (!this.audioContext) return;

    const sampleRate = this.audioContext.sampleRate;
    const numSamples = sampleRate * options.duration;
    const buffer = this.audioContext.createBuffer(1, numSamples, sampleRate);
    const channelData = buffer.getChannelData(0);

    for (let i = 0; i < numSamples; i++) {
      const t = i / sampleRate;
      let sample = 0;

      switch (options.type) {
        case 'sine':
          sample = Math.sin(2 * Math.PI * options.frequency * t);
          break;
        case 'square':
          sample = Math.sign(Math.sin(2 * Math.PI * options.frequency * t));
          break;
        case 'triangle':
          sample = (2 / Math.PI) * Math.asin(Math.sin(2 * Math.PI * options.frequency * t));
          break;
        case 'sawtooth':
          sample = 2 * (t * options.frequency - Math.floor(0.5 + t * options.frequency));
          break;
      }

      // Apply volume and fade out
      const fadeOut = 1 - (i / numSamples);
      channelData[i] = sample * options.volume * fadeOut;
    }

    this.sounds.set(name, buffer);
  }

  // Play a sound effect
  static playSound(soundName: string, volume: number = 1) {
    if (!this.audioContext || !this.sounds.has(soundName)) {
      return;
    }

    try {
      const buffer = this.sounds.get(soundName);
      if (!buffer) return;

      const source = this.audioContext.createBufferSource();
      const gainNode = this.audioContext.createGain();

      source.buffer = buffer;
      gainNode.gain.value = volume;

      source.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      source.start();
    } catch (error) {
      console.warn('Could not play sound:', error);
    }
  }

  // Sound effect methods
  static playMessageSent() {
    this.playSound('messageSent');
  }

  static playMessageReceived() {
    this.playSound('messageReceived');
  }

  static playNotification() {
    this.playSound('notification');
  }

  static playButtonClick() {
    this.playSound('buttonClick');
  }

  static playTyping() {
    this.playSound('typing', 0.5);
  }

  static playUserOnline() {
    this.playSound('userOnline');
  }

  static playError() {
    this.playSound('error');
  }

  // Create a more complex notification sound
  static playComplexNotification() {
    if (!this.audioContext) return;

    try {
      // Create a melody-like notification
      const frequencies = [523.25, 659.25, 783.99]; // C5, E5, G5
      frequencies.forEach((freq, index) => {
        setTimeout(() => {
          this.createAndPlayTone(freq, 0.15, 0.3);
        }, index * 100);
      });
    } catch (error) {
      console.warn('Could not play complex notification:', error);
    }
  }

  private static createAndPlayTone(frequency: number, duration: number, volume: number) {
    if (!this.audioContext) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);

    gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(volume, this.audioContext.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration);

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + duration);
  }

  // Resume audio context (needed for some browsers)
  static async resumeAudioContext() {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }
  }
}
