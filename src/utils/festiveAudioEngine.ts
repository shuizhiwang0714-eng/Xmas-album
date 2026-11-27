export interface FestiveTrack {
  id: string;
  title: string;
  subtitle: string;
  bpm: number;
  notes: Array<{
    note: string;
    beats: number;
    bass?: string;
  }>;
}

const NOTE_FREQ: Record<string, number> = {
  C3: 130.81, D3: 146.83, E3: 164.81, F3: 174.61, G3: 196.0, A3: 220.0, B3: 246.94,
  C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392.0, A4: 440.0, B4: 493.88,
  C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46, G5: 783.99, A5: 880.0,
};

export const FESTIVE_PLAYLIST: FestiveTrack[] = [
  {
    id: 'silent-night',
    title: 'Silent Night',
    subtitle: '平安夜 · 静谧八音盒',
    bpm: 82,
    notes: [
      { note: 'G4', beats: 1.5, bass: 'C3' }, { note: 'A4', beats: 0.5 }, { note: 'G4', beats: 1 }, { note: 'E4', beats: 3, bass: 'G3' },
      { note: 'G4', beats: 1.5, bass: 'C3' }, { note: 'A4', beats: 0.5 }, { note: 'G4', beats: 1 }, { note: 'E4', beats: 3, bass: 'G3' },
      { note: 'D5', beats: 2, bass: 'G3' }, { note: 'D5', beats: 1 }, { note: 'B4', beats: 3, bass: 'G3' },
      { note: 'C5', beats: 2, bass: 'C3' }, { note: 'C5', beats: 1 }, { note: 'G4', beats: 3, bass: 'E3' },
      { note: 'A4', beats: 2, bass: 'F3' }, { note: 'A4', beats: 1 }, { note: 'C5', beats: 1.5, bass: 'F3' }, { note: 'B4', beats: 0.5 }, { note: 'A4', beats: 1 },
      { note: 'G4', beats: 1.5, bass: 'C3' }, { note: 'A4', beats: 0.5 }, { note: 'G4', beats: 1 }, { note: 'E4', beats: 3, bass: 'G3' },
      { note: 'A4', beats: 2, bass: 'F3' }, { note: 'A4', beats: 1 }, { note: 'C5', beats: 1.5, bass: 'F3' }, { note: 'B4', beats: 0.5 }, { note: 'A4', beats: 1 },
      { note: 'G4', beats: 1.5, bass: 'C3' }, { note: 'A4', beats: 0.5 }, { note: 'G4', beats: 1 }, { note: 'E4', beats: 3, bass: 'G3' },
      { note: 'D5', beats: 2, bass: 'G3' }, { note: 'D5', beats: 1 }, { note: 'F5', beats: 1.5, bass: 'G3' }, { note: 'D5', beats: 0.5 }, { note: 'B4', beats: 1 },
      { note: 'C5', beats: 3, bass: 'C3' }, { note: 'E5', beats: 3, bass: 'E3' },
      { note: 'C5', beats: 1, bass: 'C3' }, { note: 'G4', beats: 1 }, { note: 'E4', beats: 1 },
      { note: 'G4', beats: 1.5, bass: 'G3' }, { note: 'F4', beats: 0.5 }, { note: 'D4', beats: 1 }, { note: 'C4', beats: 3.5, bass: 'C3' },
    ],
  },
  {
    id: 'jingle-bells',
    title: 'Jingle Bells',
    subtitle: '铃儿响叮当 · 欢快铃音',
    bpm: 136,
    notes: [
      { note: 'E4', beats: 1, bass: 'C3' }, { note: 'E4', beats: 1 }, { note: 'E4', beats: 2, bass: 'G3' },
      { note: 'E4', beats: 1, bass: 'C3' }, { note: 'E4', beats: 1 }, { note: 'E4', beats: 2, bass: 'G3' },
      { note: 'E4', beats: 1, bass: 'C3' }, { note: 'G4', beats: 1 }, { note: 'C4', beats: 1.5, bass: 'E3' }, { note: 'D4', beats: 0.5 }, { note: 'E4', beats: 4, bass: 'C3' },
      { note: 'F4', beats: 1, bass: 'F3' }, { note: 'F4', beats: 1 }, { note: 'F4', beats: 1.5 }, { note: 'F4', beats: 0.5 },
      { note: 'F4', beats: 1, bass: 'C3' }, { note: 'E4', beats: 1 }, { note: 'E4', beats: 1 }, { note: 'E4', beats: 0.5 }, { note: 'E4', beats: 0.5 },
      { note: 'E4', beats: 1, bass: 'G3' }, { note: 'D4', beats: 1 }, { note: 'D4', beats: 1 }, { note: 'E4', beats: 1 }, { note: 'D4', beats: 2, bass: 'G3' }, { note: 'G4', beats: 2 },
      { note: 'E4', beats: 1, bass: 'C3' }, { note: 'E4', beats: 1 }, { note: 'E4', beats: 2, bass: 'G3' },
      { note: 'E4', beats: 1, bass: 'C3' }, { note: 'E4', beats: 1 }, { note: 'E4', beats: 2, bass: 'G3' },
      { note: 'E4', beats: 1, bass: 'C3' }, { note: 'G4', beats: 1 }, { note: 'C4', beats: 1.5, bass: 'E3' }, { note: 'D4', beats: 0.5 }, { note: 'E4', beats: 4, bass: 'C3' },
      { note: 'F4', beats: 1, bass: 'F3' }, { note: 'F4', beats: 1 }, { note: 'F4', beats: 1.5 }, { note: 'F4', beats: 0.5 },
      { note: 'F4', beats: 1, bass: 'C3' }, { note: 'E4', beats: 1 }, { note: 'E4', beats: 1 }, { note: 'E4', beats: 0.5 }, { note: 'E4', beats: 0.5 },
      { note: 'G4', beats: 1, bass: 'G3' }, { note: 'G4', beats: 1 }, { note: 'F4', beats: 1 }, { note: 'D4', beats: 1 }, { note: 'C4', beats: 4, bass: 'C3' },
    ],
  },
  {
    id: 'we-wish-you',
    title: 'We Wish You a Merry Christmas',
    subtitle: '圣诞快乐 · 温馨颂歌',
    bpm: 132,
    notes: [
      { note: 'G4', beats: 1, bass: 'G3' },
      { note: 'C5', beats: 1, bass: 'C3' }, { note: 'C5', beats: 0.5 }, { note: 'D5', beats: 0.5 }, { note: 'C5', beats: 0.5 }, { note: 'B4', beats: 0.5 },
      { note: 'A4', beats: 1, bass: 'F3' }, { note: 'A4', beats: 1 }, { note: 'A4', beats: 1 },
      { note: 'D5', beats: 1, bass: 'D3' }, { note: 'D5', beats: 0.5 }, { note: 'E5', beats: 0.5 }, { note: 'D5', beats: 0.5 }, { note: 'C5', beats: 0.5 },
      { note: 'B4', beats: 1, bass: 'G3' }, { note: 'G4', beats: 1 }, { note: 'G4', beats: 1 },
      { note: 'E5', beats: 1, bass: 'E3' }, { note: 'E5', beats: 0.5 }, { note: 'F5', beats: 0.5 }, { note: 'E5', beats: 0.5 }, { note: 'D5', beats: 0.5 },
      { note: 'C5', beats: 1, bass: 'A3' }, { note: 'A4', beats: 1 }, { note: 'G4', beats: 0.5 }, { note: 'G4', beats: 0.5 },
      { note: 'A4', beats: 1, bass: 'F3' }, { note: 'D5', beats: 1, bass: 'G3' }, { note: 'B4', beats: 1 },
      { note: 'C5', beats: 3, bass: 'C3' },
    ],
  },
  {
    id: 'o-christmas-tree',
    title: 'O Christmas Tree',
    subtitle: '圣诞树 · 经典华尔兹',
    bpm: 102,
    notes: [
      { note: 'G4', beats: 1, bass: 'G3' },
      { note: 'C5', beats: 0.75, bass: 'C3' }, { note: 'C5', beats: 0.25 }, { note: 'C5', beats: 1 }, { note: 'D5', beats: 1 },
      { note: 'E5', beats: 0.75, bass: 'C3' }, { note: 'E5', beats: 0.25 }, { note: 'E5', beats: 1.5 }, { note: 'E5', beats: 0.5 },
      { note: 'D5', beats: 0.5, bass: 'G3' }, { note: 'E5', beats: 0.5 }, { note: 'F5', beats: 1 }, { note: 'B4', beats: 1 },
      { note: 'D5', beats: 1, bass: 'G3' }, { note: 'C5', beats: 2, bass: 'C3' },
      { note: 'G4', beats: 1, bass: 'G3' },
      { note: 'C5', beats: 0.75, bass: 'C3' }, { note: 'C5', beats: 0.25 }, { note: 'C5', beats: 1 }, { note: 'D5', beats: 1 },
      { note: 'E5', beats: 0.75, bass: 'C3' }, { note: 'E5', beats: 0.25 }, { note: 'E5', beats: 1.5 }, { note: 'E5', beats: 0.5 },
      { note: 'D5', beats: 0.5, bass: 'G3' }, { note: 'E5', beats: 0.5 }, { note: 'F5', beats: 1 }, { note: 'B4', beats: 1 },
      { note: 'D5', beats: 1, bass: 'G3' }, { note: 'C5', beats: 2.5, bass: 'C3' },
    ],
  },
];

/**
 * Polyphonic Web Audio API Christmas music-box & warm pad synthesizer.
 * AudioContext is strictly created/resumed only after user interaction.
 */
export class FestiveAudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private echoDelay: DelayNode | null = null;
  private timerId: number | null = null;

  private isPlaying = false;
  private trackIndex = 0;
  private noteIndex = 0;
  private nextNoteTime = 0;
  private volume = 0.55;
  private onTrackEndCallback: (() => void) | null = null;

  public isInitialized(): boolean {
    return this.ctx !== null;
  }

  /** Must be called inside or after a user interaction */
  public async initAfterInteraction(): Promise<void> {
    if (typeof window === 'undefined') return;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.volume;

      // Subtle warm hall echo for celesta music-box ambiance
      this.echoDelay = this.ctx.createDelay(1.0);
      this.echoDelay.delayTime.value = 0.28;

      const echoFilter = this.ctx.createBiquadFilter();
      echoFilter.type = 'lowpass';
      echoFilter.frequency.value = 2400;

      const echoFeedback = this.ctx.createGain();
      echoFeedback.gain.value = 0.26;

      const wetGain = this.ctx.createGain();
      wetGain.gain.value = 0.22;

      this.echoDelay.connect(echoFilter);
      echoFilter.connect(echoFeedback);
      echoFeedback.connect(this.echoDelay);
      echoFilter.connect(wetGain);
      wetGain.connect(this.masterGain);

      this.masterGain.connect(this.ctx.destination);
    }

    if (this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.ctx && this.masterGain) {
      this.masterGain.gain.setTargetAtTime(this.volume, this.ctx.currentTime, 0.03);
    }
  }

  public setTrack(index: number, restart = true) {
    this.trackIndex = ((index % FESTIVE_PLAYLIST.length) + FESTIVE_PLAYLIST.length) % FESTIVE_PLAYLIST.length;
    if (restart) {
      this.noteIndex = 0;
      if (this.ctx) {
        this.nextNoteTime = this.ctx.currentTime + 0.06;
      }
    }
  }

  public setOnTrackEnd(cb: (() => void) | null) {
    this.onTrackEndCallback = cb;
  }

  public async play(): Promise<void> {
    await this.initAfterInteraction();
    if (!this.ctx) return;
    if (this.isPlaying) return;

    this.isPlaying = true;
    this.nextNoteTime = this.ctx.currentTime + 0.05;

    this.timerId = window.setInterval(() => {
      this.scheduleAhead();
    }, 60);
  }

  public pause() {
    this.isPlaying = false;
    if (this.timerId !== null) {
      window.clearInterval(this.timerId);
      this.timerId = null;
    }
  }

  public dispose() {
    this.pause();
    if (this.ctx) {
      void this.ctx.close();
      this.ctx = null;
      this.masterGain = null;
      this.echoDelay = null;
    }
  }

  private scheduleAhead() {
    if (!this.ctx || !this.isPlaying) return;

    const lookahead = 0.18;
    const track = FESTIVE_PLAYLIST[this.trackIndex];
    const secPerBeat = 60 / track.bpm;

    while (this.nextNoteTime < this.ctx.currentTime + lookahead) {
      const event = track.notes[this.noteIndex];
      const durationSec = event.beats * secPerBeat;

      const leadFreq = NOTE_FREQ[event.note];
      if (leadFreq) {
        this.triggerCelestaNote(leadFreq, this.nextNoteTime, Math.min(2.2, durationSec * 1.15));
      }

      if (event.bass && NOTE_FREQ[event.bass]) {
        this.triggerWarmBass(NOTE_FREQ[event.bass], this.nextNoteTime, Math.min(2.8, durationSec * 1.6));
      }

      this.nextNoteTime += durationSec;
      this.noteIndex += 1;

      if (this.noteIndex >= track.notes.length) {
        this.noteIndex = 0;
        this.nextNoteTime += 0.55; // Brief gentle breath between carols
        this.onTrackEndCallback?.();
        break;
      }
    }
  }

  private triggerCelestaNote(freq: number, time: number, duration: number) {
    if (!this.ctx || !this.masterGain || !this.echoDelay) return;

    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const noteGain = this.ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(freq, time);

    // Subtle music-box bell overtone
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(freq * 2, time);

    const overtoneGain = this.ctx.createGain();
    overtoneGain.gain.setValueAtTime(0.14, time);
    overtoneGain.gain.exponentialRampToValueAtTime(0.001, time + Math.min(0.45, duration));

    noteGain.gain.setValueAtTime(0.0001, time);
    noteGain.gain.linearRampToValueAtTime(0.26, time + 0.014);
    noteGain.gain.exponentialRampToValueAtTime(0.0008, time + duration);

    osc1.connect(noteGain);
    osc2.connect(overtoneGain);
    overtoneGain.connect(noteGain);

    noteGain.connect(this.masterGain);
    noteGain.connect(this.echoDelay);

    osc1.start(time);
    osc2.start(time);
    osc1.stop(time + duration + 0.05);
    osc2.stop(time + duration + 0.05);
  }

  private triggerWarmBass(freq: number, time: number, duration: number) {
    if (!this.ctx || !this.masterGain) return;

    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, time);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(520, time);

    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.linearRampToValueAtTime(0.13, time + 0.06);
    gain.gain.exponentialRampToValueAtTime(0.0008, time + duration);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc.start(time);
    osc.stop(time + duration + 0.05);
  }
}
