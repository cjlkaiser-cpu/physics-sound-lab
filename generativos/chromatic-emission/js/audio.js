/**
 * Chromatic Emission - Motor de Audio
 *
 * Sonificación de set-classes y emisión de fotones.
 * Los intervalos (fotones) tienen colores sonoros distintos.
 */

class AudioEngine {
  constructor() {
    this.audioContext = null;
    this.masterGain = null;
    this.isInitialized = false;
    this.volume = 0.3;
    this.waveform = 'triangle';

    // Frecuencia base (C4)
    this.baseFrequency = 261.63;

    // Ratios para la escala cromática (temperamento igual)
    this.chromaticRatios = [];
    for (let i = 0; i < 12; i++) {
      this.chromaticRatios[i] = Math.pow(2, i / 12);
    }
  }

  async init() {
    if (this.isInitialized) return;

    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      this.masterGain = this.audioContext.createGain();
      this.masterGain.connect(this.audioContext.destination);
      this.masterGain.gain.value = this.volume;
      this.isInitialized = true;
    } catch (e) {
      console.error('Audio init failed:', e);
    }
  }

  setVolume(v) {
    this.volume = v;
    if (this.masterGain) {
      this.masterGain.gain.value = v;
    }
  }

  setWaveform(type) {
    this.waveform = type;
  }

  /**
   * Convertir pitch-class a frecuencia
   */
  pcToFrequency(pc, octave = 4) {
    const baseFreq = 261.63 * Math.pow(2, octave - 4);
    return baseFreq * this.chromaticRatios[pc % 12];
  }

  /**
   * Tocar un set-class completo (acorde)
   */
  playSet(setClass, duration = 0.8) {
    if (!this.isInitialized || !setClass) return;

    const now = this.audioContext.currentTime;

    setClass.primeForm.forEach((pc, i) => {
      this.playNote(pc, now + i * 0.02, duration);
    });
  }

  /**
   * Tocar un arpegio del set
   */
  playArpeggio(setClass, direction = 'up', noteDuration = 150) {
    if (!this.isInitialized || !setClass) return;

    const notes = direction === 'down'
      ? [...setClass.primeForm].reverse()
      : setClass.primeForm;

    const now = this.audioContext.currentTime;
    const noteSpacing = noteDuration / 1000;

    notes.forEach((pc, i) => {
      this.playNote(pc, now + i * noteSpacing, noteSpacing * 1.5);
    });
  }

  /**
   * Tocar una nota individual
   */
  playNote(pc, startTime, duration = 0.5) {
    if (!this.isInitialized) return;

    const freq = this.pcToFrequency(pc);

    // Oscilador
    const osc = this.audioContext.createOscillator();
    osc.type = this.waveform;
    osc.frequency.value = freq;

    // Envelope
    const env = this.audioContext.createGain();
    env.gain.setValueAtTime(0, startTime);
    env.gain.linearRampToValueAtTime(0.3, startTime + 0.02);
    env.gain.exponentialRampToValueAtTime(0.01, startTime + duration);

    // Filtro suave
    const filter = this.audioContext.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 2000 + freq;

    osc.connect(filter);
    filter.connect(env);
    env.connect(this.masterGain);

    osc.start(startTime);
    osc.stop(startTime + duration + 0.1);
  }

  /**
   * Sonido de fotón basado en el intervalo
   * Intervalos pequeños = sonido grave, largo
   * Intervalos grandes = sonido agudo, corto
   */
  playPhotonSound(intervalClass) {
    if (!this.isInitialized || intervalClass < 1 || intervalClass > 6) return;

    const now = this.audioContext.currentTime;

    // Frecuencia basada en el intervalo (más alto = más energético)
    const baseFreq = 200 + intervalClass * 150;

    // Duración inversa al intervalo
    const duration = 0.5 - intervalClass * 0.05;

    // Oscilador principal
    const osc = this.audioContext.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(baseFreq * 2, now);
    osc.frequency.exponentialRampToValueAtTime(baseFreq, now + duration);

    // Segundo oscilador para riqueza
    const osc2 = this.audioContext.createOscillator();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(baseFreq * 1.5, now);
    osc2.frequency.exponentialRampToValueAtTime(baseFreq * 0.5, now + duration);

    // Envelope
    const env = this.audioContext.createGain();
    env.gain.setValueAtTime(0.15, now);
    env.gain.exponentialRampToValueAtTime(0.01, now + duration);

    // Filtro
    const filter = this.audioContext.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = baseFreq * 2;
    filter.Q.value = 2;

    osc.connect(filter);
    osc2.connect(filter);
    filter.connect(env);
    env.connect(this.masterGain);

    osc.start(now);
    osc2.start(now);
    osc.stop(now + duration + 0.1);
    osc2.stop(now + duration + 0.1);
  }

  /**
   * Sonido de túnel Z-Portal
   */
  playTunnelSound() {
    if (!this.isInitialized) return;

    const now = this.audioContext.currentTime;

    // Sweep de frecuencia (whoosh)
    const osc = this.audioContext.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(100, now);
    osc.frequency.exponentialRampToValueAtTime(800, now + 0.15);
    osc.frequency.exponentialRampToValueAtTime(200, now + 0.3);

    // Ruido
    const noise = this.createNoiseNode();

    // Filtro para el ruido
    const noiseFilter = this.audioContext.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.setValueAtTime(500, now);
    noiseFilter.frequency.exponentialRampToValueAtTime(2000, now + 0.15);
    noiseFilter.frequency.exponentialRampToValueAtTime(300, now + 0.3);
    noiseFilter.Q.value = 1;

    // Envelopes
    const oscEnv = this.audioContext.createGain();
    oscEnv.gain.setValueAtTime(0.1, now);
    oscEnv.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

    const noiseEnv = this.audioContext.createGain();
    noiseEnv.gain.setValueAtTime(0.05, now);
    noiseEnv.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

    osc.connect(oscEnv);
    oscEnv.connect(this.masterGain);

    noise.connect(noiseFilter);
    noiseFilter.connect(noiseEnv);
    noiseEnv.connect(this.masterGain);

    osc.start(now);
    noise.start(now);
    osc.stop(now + 0.4);
    noise.stop(now + 0.4);
  }

  /**
   * Crear nodo de ruido blanco
   */
  createNoiseNode() {
    const bufferSize = this.audioContext.sampleRate * 0.5;
    const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.audioContext.createBufferSource();
    noise.buffer = buffer;
    return noise;
  }

  /**
   * Sonificar emisión de fotones
   */
  sonifyPhotonEmission(photons) {
    if (!this.isInitialized || !photons || photons.length === 0) return;

    // Agrupar por intervalo y tocar sonidos
    const intervals = new Set(photons.map(p => p.intervalClass));

    let delay = 0;
    intervals.forEach(ic => {
      setTimeout(() => {
        this.playPhotonSound(ic);
      }, delay);
      delay += 50;
    });
  }

  /**
   * Sonido cuando un fotón excita un nodo
   * El sonido depende de las propiedades del fotón y del set excitado
   */
  playPhotonExcitation(setClass, photonProps) {
    if (!this.isInitialized || !setClass) return;

    const { intervalClass, energy, velocity } = photonProps;

    // Mapear energía del fotón a parámetros de sonido
    // Alta energía (tritono) = agudo, brillante, ataque rápido
    // Baja energía (semitono) = grave, suave, ataque lento
    const octaveShift = Math.floor(energy * 2) - 1; // -1 a +1
    const attackTime = 0.01 + (1 - energy) * 0.04;
    const volume = 0.08 + energy * 0.12;
    const duration = 0.2 + (1 - energy) * 0.3;

    // Filtro basado en intervalo
    const filterFreq = 800 + intervalClass * 400;

    const now = this.audioContext.currentTime;

    // Tocar las notas del set como arpegio rápido
    setClass.primeForm.forEach((pc, i) => {
      const noteTime = now + i * 0.025 * (2 - energy); // Más rápido para alta energía

      this.playExcitedNote(pc, noteTime, {
        octaveShift,
        attackTime,
        volume,
        duration,
        filterFreq
      });
    });
  }

  /**
   * Tocar una nota con parámetros de excitación
   */
  playExcitedNote(pc, startTime, params) {
    if (!this.isInitialized) return;

    const { octaveShift = 0, attackTime = 0.02, volume = 0.15, duration = 0.3, filterFreq = 1500 } = params;

    // Frecuencia con shift de octava
    const baseOctave = 4 + octaveShift;
    const freq = this.pcToFrequency(pc, baseOctave);

    // Oscilador
    const osc = this.audioContext.createOscillator();
    osc.type = 'sine'; // Más suave para excitaciones
    osc.frequency.value = freq;

    // Segundo oscilador armónico
    const osc2 = this.audioContext.createOscillator();
    osc2.type = 'triangle';
    osc2.frequency.value = freq * 2; // Octava arriba

    // Envelope
    const env = this.audioContext.createGain();
    env.gain.setValueAtTime(0, startTime);
    env.gain.linearRampToValueAtTime(volume, startTime + attackTime);
    env.gain.exponentialRampToValueAtTime(volume * 0.3, startTime + duration * 0.5);
    env.gain.exponentialRampToValueAtTime(0.01, startTime + duration);

    // Filtro
    const filter = this.audioContext.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = filterFreq;
    filter.Q.value = 1;

    // Mixer para los dos osciladores
    const mixer = this.audioContext.createGain();
    mixer.gain.value = 1;

    osc.connect(mixer);
    osc2.connect(mixer);
    mixer.connect(filter);
    filter.connect(env);
    env.connect(this.masterGain);

    osc.start(startTime);
    osc2.start(startTime);
    osc.stop(startTime + duration + 0.1);
    osc2.stop(startTime + duration + 0.1);
  }
}


/**
 * Voice Leader - Gestiona transiciones suaves de voice leading
 */
class VoiceLeader {
  constructor(audioEngine) {
    this.audio = audioEngine;
    this.smoothness = 0.5; // 0 = Webern (saltos), 1 = Parsimoniosa (mínimo movimiento)
    this.lastVoices = null;
  }

  setSmoothness(value) {
    this.smoothness = Math.max(0, Math.min(1, value));
  }

  /**
   * Tocar un set con voice leading desde el anterior
   */
  playWithVoiceLeading(newSet) {
    if (!this.audio.isInitialized || !newSet) return;

    const newNotes = [...newSet.primeForm];

    if (!this.lastVoices) {
      // Primera vez: simplemente tocar el set
      this.audio.playArpeggio(newSet);
      this.lastVoices = newNotes;
      return;
    }

    // Calcular voice leading óptimo
    const movements = this.calculateVoiceLeading(this.lastVoices, newNotes);

    // Tocar basado en smoothness
    const now = this.audio.audioContext.currentTime;

    movements.forEach((movement, i) => {
      const delay = i * (0.02 + (1 - this.smoothness) * 0.08);

      if (movement.from !== null && movement.to !== null) {
        // Nota que se mueve
        if (this.smoothness > 0.7 && movement.interval <= 2) {
          // Glissando para movimientos pequeños con alta parsimonia
          this.playGlide(movement.from, movement.to, now + delay, 0.3);
        } else {
          // Nota directa
          this.audio.playNote(movement.to, now + delay, 0.5);
        }
      } else if (movement.to !== null) {
        // Nota nueva
        this.audio.playNote(movement.to, now + delay, 0.5);
      }
    });

    this.lastVoices = newNotes;
  }

  /**
   * Tocar glissando entre dos notas
   */
  playGlide(fromPc, toPc, startTime, duration) {
    if (!this.audio.isInitialized) return;

    const fromFreq = this.audio.pcToFrequency(fromPc);
    const toFreq = this.audio.pcToFrequency(toPc);

    const osc = this.audio.audioContext.createOscillator();
    osc.type = this.audio.waveform;
    osc.frequency.setValueAtTime(fromFreq, startTime);
    osc.frequency.exponentialRampToValueAtTime(toFreq, startTime + duration * 0.7);

    const env = this.audio.audioContext.createGain();
    env.gain.setValueAtTime(0, startTime);
    env.gain.linearRampToValueAtTime(0.25, startTime + 0.02);
    env.gain.exponentialRampToValueAtTime(0.01, startTime + duration);

    osc.connect(env);
    env.connect(this.audio.masterGain);

    osc.start(startTime);
    osc.stop(startTime + duration + 0.1);
  }

  calculateVoiceLeading(oldNotes, newNotes) {
    const movements = [];
    const usedNew = new Set();

    // Emparejar notas viejas con las nuevas más cercanas
    oldNotes.forEach(oldNote => {
      let minDist = Infinity;
      let bestNew = null;

      newNotes.forEach(newNote => {
        if (usedNew.has(newNote)) return;
        let dist = Math.abs(newNote - oldNote);
        if (dist > 6) dist = 12 - dist;
        if (dist < minDist) {
          minDist = dist;
          bestNew = newNote;
        }
      });

      if (bestNew !== null) {
        usedNew.add(bestNew);
        movements.push({
          from: oldNote,
          to: bestNew,
          interval: minDist
        });
      }
    });

    // Notas nuevas sin pareja
    newNotes.forEach(newNote => {
      if (!usedNew.has(newNote)) {
        movements.push({
          from: null,
          to: newNote,
          interval: 0
        });
      }
    });

    return movements;
  }

  reset() {
    this.lastVoices = null;
  }
}

// Exportar
window.AudioEngine = AudioEngine;
window.VoiceLeader = VoiceLeader;
