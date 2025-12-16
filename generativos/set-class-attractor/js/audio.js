/**
 * Set-Class Attractor - Sintesis de Audio + Voice Leading
 * Web Audio API con conduccion de voces parsimoniosa
 */

class AudioEngine {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.reverbGain = null;
    this.convolver = null;
    this.isInitialized = false;

    // Voces activas
    this.voices = [];
    this.maxVoices = 6;

    // Configuracion de sintesis
    this.config = {
      waveform: 'triangle',  // sine, triangle, sawtooth, square
      attackTime: 0.05,
      decayTime: 0.3,
      sustainLevel: 0.4,
      releaseTime: 0.8,
      masterVolume: 0.3,
      reverbMix: 0.2
    };

    // Voice Leading
    this.voiceLeader = new ParsimoniousVoiceLeader();

    // Sonidos especiales
    this.tunnelSoundEnabled = true;
  }

  async init() {
    if (this.isInitialized) return;

    this.ctx = new (window.AudioContext || window.webkitAudioContext)();

    // Master gain
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = this.config.masterVolume;
    this.masterGain.connect(this.ctx.destination);

    // Reverb
    this.convolver = this.ctx.createConvolver();
    this.reverbGain = this.ctx.createGain();
    this.reverbGain.gain.value = this.config.reverbMix;

    // Crear impulse response sintetico
    await this.createReverbIR();

    this.convolver.connect(this.reverbGain);
    this.reverbGain.connect(this.ctx.destination);

    this.isInitialized = true;
  }

  async createReverbIR() {
    // Crear impulse response sintetico para reverb
    const sampleRate = this.ctx.sampleRate;
    const length = sampleRate * 2; // 2 segundos
    const impulse = this.ctx.createBuffer(2, length, sampleRate);

    for (let channel = 0; channel < 2; channel++) {
      const channelData = impulse.getChannelData(channel);
      for (let i = 0; i < length; i++) {
        const decay = Math.exp(-i / (sampleRate * 0.5));
        channelData[i] = (Math.random() * 2 - 1) * decay * 0.5;
      }
    }

    this.convolver.buffer = impulse;
  }

  // Convertir pitch class (0-11) a frecuencia MIDI -> Hz
  pcToFreq(pc, octave = 4) {
    const midiNote = pc + (octave + 1) * 12;
    return 440 * Math.pow(2, (midiNote - 69) / 12);
  }

  // Reproducir un set class con voice leading
  playSet(setClass, transposition = null) {
    if (!this.isInitialized) return;

    // Transposicion aleatoria si no se especifica
    if (transposition === null) {
      transposition = Math.floor(Math.random() * 12);
    }

    // Obtener notas con voice leading
    const midiNotes = this.voiceLeader.transition(setClass.primeForm, transposition);

    // Detener voces anteriores gradualmente
    this.releaseAllVoices();

    // Crear nuevas voces
    midiNotes.forEach((midi, index) => {
      const delay = index * 0.05 * (1 - this.voiceLeader.smoothness);
      setTimeout(() => {
        this.playNote(midi);
      }, delay * 1000);
    });
  }

  playNote(midiNote, duration = 2) {
    if (!this.isInitialized) return;

    const freq = 440 * Math.pow(2, (midiNote - 69) / 12);

    // Crear oscilador
    const osc = this.ctx.createOscillator();
    osc.type = this.config.waveform;
    osc.frequency.value = freq;

    // Envelope
    const envelope = this.ctx.createGain();
    const now = this.ctx.currentTime;

    envelope.gain.setValueAtTime(0, now);
    envelope.gain.linearRampToValueAtTime(0.3, now + this.config.attackTime);
    envelope.gain.linearRampToValueAtTime(
      this.config.sustainLevel * 0.3,
      now + this.config.attackTime + this.config.decayTime
    );

    // Conectar
    osc.connect(envelope);
    envelope.connect(this.masterGain);
    envelope.connect(this.convolver);

    osc.start(now);

    // Programar release
    envelope.gain.setValueAtTime(
      this.config.sustainLevel * 0.3,
      now + duration
    );
    envelope.gain.linearRampToValueAtTime(0, now + duration + this.config.releaseTime);
    osc.stop(now + duration + this.config.releaseTime + 0.1);

    // Guardar referencia
    this.voices.push({
      osc,
      envelope,
      midiNote,
      endTime: now + duration
    });

    // Limpiar voces expiradas
    this.cleanupVoices();
  }

  playArpeggio(setClass, transposition = null, tempo = 120) {
    if (!this.isInitialized) return;

    if (transposition === null) {
      transposition = Math.floor(Math.random() * 12);
    }

    const midiNotes = this.voiceLeader.transition(setClass.primeForm, transposition);
    const interval = 60000 / tempo / 2; // Corcheas

    midiNotes.forEach((midi, index) => {
      setTimeout(() => {
        this.playNote(midi, 0.5);
      }, index * interval);
    });
  }

  releaseAllVoices() {
    const now = this.ctx.currentTime;

    this.voices.forEach(voice => {
      try {
        voice.envelope.gain.cancelScheduledValues(now);
        voice.envelope.gain.setValueAtTime(voice.envelope.gain.value, now);
        voice.envelope.gain.linearRampToValueAtTime(0, now + 0.3);
        voice.osc.stop(now + 0.4);
      } catch (e) {
        // Oscilador ya detenido
      }
    });

    this.voices = [];
  }

  cleanupVoices() {
    const now = this.ctx.currentTime;
    this.voices = this.voices.filter(v => v.endTime > now);
  }

  // Sonido de tunel Z-Portal
  playTunnelSound() {
    if (!this.isInitialized || !this.tunnelSoundEnabled) return;

    const now = this.ctx.currentTime;

    // Whoosh descendente
    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(100, now + 0.5);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.linearRampToValueAtTime(0, now + 0.5);

    // Ruido blanco filtrado
    const noise = this.ctx.createBufferSource();
    const noiseBuffer = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.5, this.ctx.sampleRate);
    const noiseData = noiseBuffer.getChannelData(0);
    for (let i = 0; i < noiseData.length; i++) {
      noiseData[i] = Math.random() * 2 - 1;
    }
    noise.buffer = noiseBuffer;

    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.setValueAtTime(2000, now);
    noiseFilter.frequency.exponentialRampToValueAtTime(200, now + 0.5);
    noiseFilter.Q.value = 5;

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.1, now);
    noiseGain.gain.linearRampToValueAtTime(0, now + 0.5);

    // Conectar
    osc.connect(gain);
    gain.connect(this.masterGain);
    gain.connect(this.convolver);

    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.6);
    noise.start(now);
    noise.stop(now + 0.6);
  }

  // Ajustar reverb (para Ghost Traces)
  setReverbWet(value) {
    if (this.reverbGain) {
      this.reverbGain.gain.linearRampToValueAtTime(
        Math.max(0, Math.min(1, value)),
        this.ctx.currentTime + 0.1
      );
    }
  }

  setVolume(value) {
    this.config.masterVolume = value;
    if (this.masterGain) {
      this.masterGain.gain.linearRampToValueAtTime(value, this.ctx.currentTime + 0.1);
    }
  }

  setWaveform(type) {
    this.config.waveform = type;
  }
}

// Voice Leading Parsimonioso
class ParsimoniousVoiceLeader {
  constructor() {
    this.smoothness = 0.5; // 0 = saltos libres, 1 = maxima parsimonia
    this.currentVoices = []; // Notas MIDI actuales
    this.centerOctave = 4;
  }

  transition(primeForm, transposition) {
    const targetPCs = primeForm.map(pc => (pc + transposition) % 12);

    if (this.smoothness < 0.3 || this.currentVoices.length === 0) {
      // Distribucion libre
      this.currentVoices = this.randomOctavePlacement(targetPCs);
      return this.currentVoices;
    }

    // Conduccion parsimoniosa
    const newVoices = [];

    // 1. Mantener notas comunes (common tones)
    const commonTones = this.currentVoices.filter(midi =>
      targetPCs.includes(midi % 12)
    );

    // Marcar PCs ya cubiertos
    const coveredPCs = new Set(commonTones.map(m => m % 12));
    const remainingPCs = targetPCs.filter(pc => !coveredPCs.has(pc));

    // 2. Voces a mover
    const unusedVoices = this.currentVoices.filter(midi =>
      !targetPCs.includes(midi % 12)
    );

    // 3. Asignar voces no usadas a PCs restantes por minima distancia
    for (const pc of remainingPCs) {
      if (unusedVoices.length > 0) {
        // Encontrar voz mas cercana
        let closestIdx = 0;
        let minDist = Infinity;

        unusedVoices.forEach((midi, idx) => {
          const dist = this.minSemitoneDistance(midi % 12, pc);
          if (dist < minDist) {
            minDist = dist;
            closestIdx = idx;
          }
        });

        const fromMidi = unusedVoices.splice(closestIdx, 1)[0];
        const toMidi = this.moveByMinimalDistance(fromMidi, pc);
        newVoices.push(toMidi);
      } else {
        // Crear nueva voz en registro central
        newVoices.push(pc + this.centerOctave * 12 + 12);
      }
    }

    // Combinar common tones + nuevas voces
    this.currentVoices = [...commonTones, ...newVoices].sort((a, b) => a - b);

    // Ajustar voces extras si hay
    while (this.currentVoices.length > primeForm.length) {
      this.currentVoices.pop();
    }

    return this.currentVoices;
  }

  minSemitoneDistance(pc1, pc2) {
    const diff = Math.abs(pc1 - pc2);
    return Math.min(diff, 12 - diff);
  }

  moveByMinimalDistance(fromMidi, toPitchClass) {
    const fromPC = fromMidi % 12;
    let diff = toPitchClass - fromPC;

    // Elegir direccion mas corta
    if (diff > 6) diff -= 12;
    if (diff < -6) diff += 12;

    // Aplicar smoothness: mezclar con salto directo
    const smoothDiff = diff;
    const randomDiff = (Math.random() > 0.5 ? 1 : -1) * Math.floor(Math.random() * 12);
    const finalDiff = Math.round(smoothDiff * this.smoothness + randomDiff * (1 - this.smoothness));

    let newMidi = fromMidi + finalDiff;

    // Mantener en rango razonable (MIDI 36-84)
    while (newMidi < 36) newMidi += 12;
    while (newMidi > 84) newMidi -= 12;

    return newMidi;
  }

  randomOctavePlacement(pitchClasses) {
    return pitchClasses.map(pc => {
      const octave = this.centerOctave + Math.floor(Math.random() * 3) - 1;
      return pc + (octave + 1) * 12;
    }).sort((a, b) => a - b);
  }

  setSmoothness(value) {
    this.smoothness = Math.max(0, Math.min(1, value));
  }
}

// Exportar
window.AudioEngine = AudioEngine;
window.ParsimoniousVoiceLeader = ParsimoniousVoiceLeader;
