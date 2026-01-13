export class AudioManager {
  private audioContext: AudioContext | null = null;
  private enabled: boolean = true;

  constructor() {
    try {
      this.audioContext = new AudioContext();
    } catch (e) {
      console.warn('WebAudio not supported, sounds disabled');
      this.enabled = false;
    }
  }

  public playTone(frequency: number, duration: number, type: OscillatorType = 'square'): void {
    if (!this.enabled || !this.audioContext) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.frequency.value = frequency;
    oscillator.type = type;

    gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);

    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + duration);
  }

  public playPelletSound(): void {
    this.playTone(800, 0.05);
  }

  public playPowerPelletSound(): void {
    this.playTone(600, 0.2);
  }

  public playGhostEatenSound(): void {
    this.playTone(400, 0.3);
  }

  public playDeathSound(): void {
    const frequencies = [200, 150, 100, 80];
    frequencies.forEach((freq, i) => {
      setTimeout(() => {
        this.playTone(freq, 0.2);
      }, i * 100);
    });
  }

  public setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }
}
