# Rameau Machine - Plan de Implementacion

## Concepto

**Problema a resolver:** Contrastar el enfoque Neo-Riemanniano (simetrico, sin centro) con la armonia funcional clasica (jerarquica, centrada en tonica).

**Solucion:** Un sistema dinamico donde la "gravedad tonal" atrae hacia la tonica, pero la tension acumulada genera cadencias y modulaciones. Cadenas de Markov con pesos dinamicos.

**Valor pedagogico:** Permite comparar directamente dos paradigmas armonicos fundamentales:
- **Rameau (1722)**: Funciones T-S-D, jerarquia, resolucion
- **Neo-Riemannian (1980s+)**: Transformaciones P/L/R, simetria, parsimonia

---

## Fundamento Teorico

### Jean-Philippe Rameau (1683-1764)

El "Traite de l'harmonie" (1722) establecio los principios de la armonia funcional:

1. **Bajo fundamental**: Cada acorde tiene una "raiz" que determina su funcion
2. **Funciones armonicas**: Los acordes se agrupan en tres familias:
   - **Tonica (T)**: Reposo, estabilidad (I, vi, iii)
   - **Subdominante (S)**: Movimiento, preparacion (IV, ii)
   - **Dominante (D)**: Tension, necesidad de resolucion (V, vii)

3. **Progresion natural**: T -> S -> D -> T (el "ciclo de quintas funcional")

4. **Bajo fundamental vs bajo real**: Distincion crucial - la raiz abstracta puede diferir del bajo sonante (inversiones)

### El Espacio Funcional

```
        ┌─────────────────────────────────┐
        │           TONICA (T)            │
        │         I    vi    iii          │
        │           estabilidad           │
        └─────────────┬───────────────────┘
                      │
          ┌───────────┴───────────┐
          ▼                       ▼
┌─────────────────┐     ┌─────────────────┐
│ SUBDOMINANTE(S) │     │  DOMINANTE (D)  │
│    IV    ii     │────▶│    V    vii     │
│   preparacion   │     │    tension      │
└────────┬────────┘     └────────┬────────┘
         │                       │
         └───────────┬───────────┘
                     ▼
              (resolucion a T)
```

### Diferencia con Neo-Riemannian

| Aspecto | Rameau (Funcional) | Neo-Riemannian |
|---------|-------------------|----------------|
| Centro | Tonica como "sol" gravitacional | Sin centro, espacio homogeneo |
| Movimiento | Hacia resolucion (D->T) | Parsimonia de voces |
| Estructura | Jerarquica (T > D > S) | Simetrica (P = L = R) |
| Tension | Acumulativa, se resuelve | Uniforme, sin resolucion |
| Epoca | Barroco/Clasico | Romantico tardio/Contemporaneo |
| Ideal | Claridad funcional | Ambiguedad tonal |

---

## Modelo Matematico

### 1. Sistema de Transposicion (KEY_PITCH)

**Principio**: Los acordes se definen como grados relativos a la escala. Una variable global permite transponer sin reescribir la logica armonica.

```javascript
// Acordes como GRADOS RELATIVOS (0 = tonica de la escala)
const CHORDS = {
    // Funcion Tonica
    'I':   { function: 'T', tension: 0.0, root: 0, third: 4, fifth: 7, quality: 'major' },
    'vi':  { function: 'T', tension: 0.2, root: 9, third: 0, fifth: 4, quality: 'minor' },
    'iii': { function: 'T', tension: 0.3, root: 4, third: 7, fifth: 11, quality: 'minor' },

    // Funcion Subdominante
    'IV':  { function: 'S', tension: 0.4, root: 5, third: 9, fifth: 0, quality: 'major' },
    'ii':  { function: 'S', tension: 0.5, root: 2, third: 5, fifth: 9, quality: 'minor' },

    // Funcion Dominante
    'V':   { function: 'D', tension: 0.8, root: 7, third: 11, fifth: 2, quality: 'major' },
    'V7':  { function: 'D', tension: 0.9, root: 7, third: 11, fifth: 2, seventh: 5, quality: 'dom7' },
    'viio':{ function: 'D', tension: 0.85, root: 11, third: 2, fifth: 5, quality: 'dim' },

    // Cromaticos (dominantes secundarias)
    'V/V': { function: 'D2', tension: 0.7, root: 2, third: 6, fifth: 9, quality: 'major' },
    'V/vi':{ function: 'D2', tension: 0.65, root: 4, third: 8, fifth: 11, quality: 'major' },
};

// Tonalidades como offset en semitonos
const KEY_PITCHES = {
    'C': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3,
    'E': 4, 'F': 5, 'F#': 6, 'Gb': 6, 'G': 7, 'G#': 8,
    'Ab': 8, 'A': 9, 'A#': 10, 'Bb': 10, 'B': 11
};

class RameauMachine {
    constructor() {
        this.key = 'C';
        this.keyPitch = KEY_PITCHES['C'];
        this.baseOctave = 4;  // C4 = MIDI 60
    }

    setKey(keyName) {
        this.key = keyName;
        this.keyPitch = KEY_PITCHES[keyName];
        // No necesita recalcular nada - los acordes son relativos
    }

    // Convertir grado relativo a MIDI absoluto
    degreeToMidi(degree, octave = this.baseOctave) {
        return (octave * 12) + this.keyPitch + degree;
    }

    // Obtener notas MIDI absolutas de un acorde
    getChordMidi(chordName, inversion = 0) {
        const chord = CHORDS[chordName];
        const degrees = [chord.root, chord.third, chord.fifth];
        if (chord.seventh !== undefined) degrees.push(chord.seventh);

        // Aplicar inversion
        for (let i = 0; i < inversion; i++) {
            degrees.push(degrees.shift() + 12);
        }

        // Convertir a MIDI absoluto
        return degrees.map((d, i) =>
            this.degreeToMidi(d, this.baseOctave + Math.floor(i / 2))
        );
    }
}
```

### 2. Sistema de Inversiones y Bajo con Inercia

**Clave de Rameau**: El bajo fundamental (raiz teorica) puede diferir del bajo real (nota mas grave).

**Mejora**: El bajo tiene "momentum" - si esta bajando, prefiere seguir bajando.

```javascript
class HarmonicState {
    constructor() {
        this.chord = 'I';
        this.inversion = 0;
        this.bassLine = [];
        this.bassDirection = 0;   // -1=bajando, 0=neutral, 1=subiendo
        this.bassInertia = 0.6;   // Fuerza de la inercia (0-1)
        this.isApproachingCadence = false;
    }

    // Obtener notas del acorde segun inversion
    getVoicing(chordName, inversion = 0) {
        const chord = CHORDS[chordName];
        const notes = [chord.root, chord.third, chord.fifth];
        if (chord.seventh !== undefined) notes.push(chord.seventh);

        for (let i = 0; i < inversion; i++) {
            notes.push(notes.shift() + 12);
        }
        return notes;
    }

    // Elegir inversion con INERCIA DIRECCIONAL
    chooseBassNote(nextChord, currentBass) {
        const chord = CHORDS[nextChord];
        const candidates = [
            { bass: chord.root, inversion: 0, name: nextChord },
            { bass: chord.third, inversion: 1, name: nextChord + '6' },
            { bass: chord.fifth, inversion: 2, name: nextChord + '64' }
        ];

        // Calcular score para cada candidato
        candidates.forEach(c => {
            const distance = this.minDistance(currentBass, c.bass);
            const direction = Math.sign(c.bass - currentBass);

            // Score base por distancia (preferir cercanos)
            c.score = 10 - distance;

            // BONUS por inercia: si seguimos la direccion actual
            if (direction === this.bassDirection && this.bassDirection !== 0) {
                c.score += 3 * this.bassInertia;
            }

            // BONUS por movimiento por grado conjunto (distancia 1-2)
            if (distance <= 2) {
                c.score += 2;
            }

            // BONUS por salto de 4a/5a en CADENCIAS (movimiento fuerte)
            if (this.isApproachingCadence && (distance === 5 || distance === 7)) {
                c.score += 4;
            }
        });

        // Elegir el de mayor score
        const best = candidates.reduce((a, b) => a.score > b.score ? a : b);

        // Actualizar direccion para siguiente iteracion
        this.bassDirection = Math.sign(best.bass - currentBass);

        return best;
    }

    minDistance(a, b) {
        return Math.min(
            Math.abs(a - b),
            Math.abs(a - (b + 12)),
            Math.abs(a - (b - 12))
        );
    }
}

// Patrones de bajo obligatorios para progresiones especificas
const BASS_PATTERNS = {
    // I -> V6 -> vi: bajo descendente obligatorio (Do -> Si -> La)
    'I-V6-vi': {
        bassMotion: 'descending_stepwise',
        enforceDirection: -1
    },

    // ii -> V -> I: salto de 4a en V->I (movimiento fuerte final)
    'ii-V-I': {
        finalInterval: 5,  // 4a justa (5 semitonos)
        enforceOnCadence: true
    },

    // Circulo de quintas: bajo por 5as descendentes
    'circle': {
        bassMotion: 'descending_fifths',
        preferredInterval: 7
    }
};

// Voicings requeridos para cadencias especificas
const CADENCE_VOICINGS = {
    'frigia': {
        'iv': { inversion: 1, required: true },  // DEBE ser iv6
        'V': { inversion: 0 }
    },
    'autentica': {
        'V': { inversion: 0 },
        'I': { inversion: 0 }
    },
    'plagal': {
        'IV': { inversion: 0 },
        'I': { inversion: 0 }
    }
};
```

### 3. Matriz de Transicion (Markov)

Probabilidades basadas en practica comun (corpus analysis):

```javascript
// Matriz de transicion simplificada (T-S-D)
const TRANSITIONS = {
    'T': { 'T': 0.2, 'S': 0.5, 'D': 0.3 },
    'S': { 'T': 0.1, 'S': 0.2, 'D': 0.7 },
    'D': { 'T': 0.8, 'S': 0.05, 'D': 0.15 }
};

// Matriz detallada por grado
const DETAILED_TRANSITIONS = {
    'I':   { 'I': 0.05, 'ii': 0.15, 'iii': 0.05, 'IV': 0.25, 'V': 0.30, 'vi': 0.15, 'viio': 0.05 },
    'ii':  { 'I': 0.05, 'ii': 0.05, 'iii': 0.02, 'IV': 0.08, 'V': 0.60, 'vi': 0.05, 'viio': 0.15 },
    'iii': { 'I': 0.10, 'ii': 0.05, 'iii': 0.02, 'IV': 0.30, 'V': 0.10, 'vi': 0.40, 'viio': 0.03 },
    'IV':  { 'I': 0.15, 'ii': 0.10, 'iii': 0.02, 'IV': 0.05, 'V': 0.50, 'vi': 0.05, 'viio': 0.13 },
    'V':   { 'I': 0.70, 'ii': 0.02, 'iii': 0.02, 'IV': 0.05, 'V': 0.05, 'vi': 0.14, 'viio': 0.02 },
    'vi':  { 'I': 0.10, 'ii': 0.25, 'iii': 0.05, 'IV': 0.30, 'V': 0.20, 'vi': 0.05, 'viio': 0.05 },
    'viio':{ 'I': 0.80, 'ii': 0.02, 'iii': 0.05, 'IV': 0.02, 'V': 0.03, 'vi': 0.05, 'viio': 0.03 }
};
```

### 4. Sistema Dinamico: Gravedad Tonal

```javascript
class TonalGravity {
    constructor() {
        this.position = 'I';
        this.inversion = 0;
        this.tension = 0;
        this.momentum = 0;
        this.energy = 0.5;
        this.bassHistory = [48];
    }

    computeGravity(chord) {
        const chordData = CHORDS[chord];
        return chordData.tension * this.tension * GRAVITY_CONSTANT;
    }

    getTransitionProbabilities() {
        const base = DETAILED_TRANSITIONS[this.position];
        const modified = {};

        for (const [target, prob] of Object.entries(base)) {
            const targetData = CHORDS[target];

            if (this.tension > 0.7 && targetData.function === 'T') {
                modified[target] = prob * (1 + this.tension);
            } else if (this.energy > 0.6) {
                modified[target] = prob * (1 + this.energy * 0.5);
            } else {
                modified[target] = prob;
            }
        }

        return normalize(modified);
    }

    step() {
        const probs = this.getTransitionProbabilities();
        const nextChord = weightedRandom(probs);

        const currentBass = this.bassHistory[this.bassHistory.length - 1] % 12;
        const bassChoice = this.chooseBassNote(nextChord, currentBass);
        this.inversion = bassChoice.inversion;

        const newBass = bassChoice.bass + 36;
        this.bassHistory.push(newBass);
        if (this.bassHistory.length > 16) this.bassHistory.shift();

        const nextData = CHORDS[nextChord];
        if (nextData.function === 'T') {
            this.tension *= 0.3;
        } else if (nextData.function === 'D') {
            this.tension = Math.min(1, this.tension + 0.3);
        } else {
            this.tension = Math.min(1, this.tension + 0.1);
        }

        this.position = nextChord;
        return { chord: nextChord, inversion: this.inversion, tension: this.tension };
    }
}
```

---

## Voice Leading (Conduccion de Voces)

**Principio fundamental**: La belleza de la armonia funcional no esta solo en los acordes, sino en como se mueven las voces individuales.

### Mapeo Estricto SATB (Persistencia de Voces)

**Problema critico**: Si el VoiceLeader calcula que soprano va de B a C, pero el sintetizador asigna ese C al oscilador del bajo, se pierde la linea melodica.

**Solucion**: Mapeo indice-a-indice estricto.

```javascript
class VoiceLeader {
    constructor(numVoices = 4) {
        // SATB inicial en C mayor - ORDEN FIJO
        this.voices = [48, 52, 55, 60]; // [0]=Bass, [1]=Tenor, [2]=Alto, [3]=Soprano

        // Identidad de cada voz (NUNCA cambia)
        this.voiceIdentity = ['bass', 'tenor', 'alto', 'soprano'];

        this.voiceRanges = {
            bass:    { min: 36, max: 60 },  // C2 - C4
            tenor:   { min: 48, max: 67 },  // C3 - G4
            alto:    { min: 55, max: 74 },  // G3 - D5
            soprano: { min: 60, max: 81 }   // C4 - A5
        };
    }

    // El voicing retornado SIEMPRE es [bass, tenor, alto, soprano]
    findOptimalVoicing(targetPitchClasses, bassNote = null) {
        const candidates = this.generateVoicings(targetPitchClasses, bassNote);
        const valid = candidates.filter(v => this.isValidVoiceLeading(this.voices, v));

        if (valid.length === 0) {
            return this.findClosestVoicing(candidates);
        }

        return valid.reduce((best, candidate) => {
            const distance = this.totalVoiceDistance(this.voices, candidate);
            return distance < best.distance
                ? { voicing: candidate, distance }
                : best;
        }, { voicing: null, distance: Infinity }).voicing;
    }

    totalVoiceDistance(from, to) {
        return from.reduce((sum, note, i) => sum + Math.abs(note - to[i]), 0);
    }

    isValidVoiceLeading(from, to) {
        // Regla 1: Sensible debe resolver a tonica
        const leadingToneIndex = from.findIndex(n => n % 12 === 11);
        if (leadingToneIndex !== -1) {
            const resolution = to[leadingToneIndex] % 12;
            if (resolution !== 0) return false;
        }

        // Regla 2: Evitar quintas paralelas
        for (let i = 0; i < from.length - 1; i++) {
            for (let j = i + 1; j < from.length; j++) {
                const interval1 = Math.abs(from[i] - from[j]) % 12;
                const interval2 = Math.abs(to[i] - to[j]) % 12;

                if (interval1 === 7 && interval2 === 7) {
                    const dir1 = Math.sign(to[i] - from[i]);
                    const dir2 = Math.sign(to[j] - from[j]);
                    if (dir1 === dir2 && dir1 !== 0) return false;
                }
            }
        }

        // Regla 3: Evitar octavas paralelas
        for (let i = 0; i < from.length - 1; i++) {
            for (let j = i + 1; j < from.length; j++) {
                const interval1 = Math.abs(from[i] - from[j]) % 12;
                const interval2 = Math.abs(to[i] - to[j]) % 12;

                if (interval1 === 0 && interval2 === 0) {
                    const dir1 = Math.sign(to[i] - from[i]);
                    const dir2 = Math.sign(to[j] - from[j]);
                    if (dir1 === dir2 && dir1 !== 0) return false;
                }
            }
        }

        // Regla 4: PROHIBIR cruces de voces (voice crossing)
        // Bass < Tenor <= Alto <= Soprano
        if (to[0] >= to[1] || to[1] > to[2] || to[2] > to[3]) {
            return false;
        }

        // Regla 5: PROHIBIR overlapping
        // (voz cruza la posicion anterior de otra voz adyacente)
        for (let i = 0; i < from.length - 1; i++) {
            if (to[i] > from[i + 1] || to[i + 1] < from[i]) {
                return false;
            }
        }

        return true;
    }

    generateVoicings(pitchClasses, bassNote = null) {
        const voicings = [];
        const bass = bassNote !== null ? bassNote : pitchClasses[0];
        const bassOptions = this.getNotesInRange(bass, this.voiceRanges.bass);

        for (const b of bassOptions) {
            const remaining = pitchClasses.filter(p => p !== bass % 12);
            const tenorOptions = this.getNotesInRange(remaining, this.voiceRanges.tenor);
            const altoOptions = this.getNotesInRange(remaining, this.voiceRanges.alto);
            const sopranoOptions = this.getNotesInRange(pitchClasses, this.voiceRanges.soprano);

            for (const t of tenorOptions.slice(0, 3)) {
                for (const a of altoOptions.slice(0, 3)) {
                    for (const s of sopranoOptions.slice(0, 3)) {
                        // GARANTIZAR orden: bass < tenor <= alto <= soprano
                        if (b < t && t <= a && a <= s) {
                            voicings.push([b, t, a, s]);
                        }
                    }
                }
            }
        }

        return voicings;
    }

    getNotesInRange(pitchClassOrArray, range) {
        const pcs = Array.isArray(pitchClassOrArray) ? pitchClassOrArray : [pitchClassOrArray];
        const notes = [];

        for (const pc of pcs) {
            for (let octave = 0; octave < 8; octave++) {
                const note = pc + octave * 12;
                if (note >= range.min && note <= range.max) {
                    notes.push(note);
                }
            }
        }

        return notes.sort((a, b) => a - b);
    }

    transition(targetChord, inversion = 0) {
        const chordData = CHORDS[targetChord];
        const pitchClasses = [chordData.root, chordData.third, chordData.fifth];
        if (chordData.seventh !== undefined) pitchClasses.push(chordData.seventh);

        const bassPC = pitchClasses[inversion];
        const newVoicing = this.findOptimalVoicing(pitchClasses, bassPC);

        if (newVoicing) {
            const oldVoices = [...this.voices];
            this.voices = newVoicing;
            return { from: oldVoices, to: newVoicing };
        }

        return null;
    }
}
```

### Configuracion por Estilo

```javascript
const VOICE_LEADING_RULES = {
    barroco: {
        strictParallels: true,
        resolveLeadingTone: true,
        preferContrary: true,
        allowVoiceCrossing: false,
        maxLeap: 8
    },
    clasico: {
        strictParallels: true,
        resolveLeadingTone: true,
        preferContrary: true,
        allowVoiceCrossing: false,
        maxLeap: 10
    },
    romantico: {
        strictParallels: false,
        resolveLeadingTone: false,
        preferContrary: false,
        allowVoiceCrossing: true,  // Permitido ocasionalmente
        maxLeap: 12
    },
    jazz: {
        strictParallels: false,
        resolveLeadingTone: false,
        preferContrary: false,
        allowVoiceCrossing: true,
        maxLeap: 14
    }
};
```

---

## Ritmo Armonico (Duraciones Variables)

**Principio**: La musica no es metronomo. La tension debe reflejarse en el tiempo Y en la articulacion.

### Duracion y Articulacion Dinamica

```javascript
class RhythmicHarmony {
    constructor(baseTempo = 80) {
        this.baseTempo = baseTempo;
        this.style = 'clasico';
    }

    computeDuration(chord, context) {
        let baseDuration = 60 / this.baseTempo;

        const functionMultipliers = {
            'T': context.isResolution ? 2.0 : 1.0,
            'S': 1.0,
            'D': context.tensionLevel > 0.7 ? 0.7 : 0.9
        };

        const chordFunction = CHORDS[chord].function;
        baseDuration *= functionMultipliers[chordFunction] || 1.0;

        if (this.style === 'romantico') {
            baseDuration *= this.computeRubato(context);
        }

        if (this.style === 'jazz' && context.beatPosition % 2 === 1) {
            baseDuration *= 0.67;
        }

        return baseDuration;
    }

    // NUEVO: Articulacion dinamica segun tension
    computeArticulation(chord, context) {
        const tension = CHORDS[chord].tension;
        const func = CHORDS[chord].function;

        return {
            // Attack mas corto = mas "mordiente" en tension alta
            attackTime: tension > 0.7 ? 0.02 : 0.05,

            // Release mas corto en tension alta (staccato implicito)
            releaseTime: tension > 0.7 ? 0.08 : 0.15,

            // Decay mas pronunciado en dominantes
            decayTime: func === 'D' ? 0.1 : 0.2,

            // Sustain level
            sustainLevel: tension > 0.7 ? 0.25 : 0.20,

            // Velocity ligeramente mayor en tension
            velocity: 0.2 + (tension * 0.1)
        };
    }

    // NUEVO: Tempo dinamico segun entropia
    computeTempo(context) {
        const baseTempo = this.baseTempo;

        // Tension alta = tempo mas estricto y ligeramente acelerado
        if (context.tensionLevel > 0.7) {
            return {
                tempo: baseTempo * 1.05,  // 5% mas rapido
                variance: 0.02            // Menos variacion (mas "ansioso")
            };
        }

        // Tension baja (tonica) = tempo respira mas
        if (context.tensionLevel < 0.3) {
            return {
                tempo: baseTempo * 0.98,  // 2% mas lento
                variance: 0.08            // Mas variacion (mas "relajado")
            };
        }

        return { tempo: baseTempo, variance: 0.05 };
    }

    computeRubato(context) {
        // Accelerando hacia climax de tension
        if (context.tensionRising && context.tensionLevel > 0.5) {
            return 1.0 - (context.tensionLevel * 0.2);
        }

        // Ritardando hacia resolucion
        if (context.approachingCadence) {
            const proximityFactor = context.cadenceProximity;
            return 1.0 + (proximityFactor * 0.4);
        }

        return 1.0 + (Math.random() - 0.5) * 0.1;
    }

    detectCadenceApproach(history, currentChord) {
        if (CHORDS[currentChord].function === 'D') {
            return { approaching: true, proximity: 0.8 };
        }

        if (history.length >= 2) {
            const prev = history[history.length - 1];
            if (CHORDS[prev].function === 'S' && CHORDS[currentChord].function === 'D') {
                return { approaching: true, proximity: 0.9 };
            }
        }

        return { approaching: false, proximity: 0 };
    }
}
```

### Visualizacion del Ritmo

```javascript
class BreathingVisualization {
    constructor() {
        this.breathPhase = 0;
        this.breathTarget = 1.0;
    }

    update(duration) {
        const normalDuration = 60 / 80;
        this.breathTarget = duration / normalDuration;
        this.breathPhase += (this.breathTarget - this.breathPhase) * 0.1;
    }

    getScale() {
        return 0.9 + (this.breathPhase * 0.2);
    }
}
```

---

## Visualizacion: Anillos Funcionales con Gravedad Tonal

### D3 Force-Directed con Restricciones Radiales

**Principio pedagogico**: La visualizacion debe comunicar la teoria de Rameau literalmente:
- **Centro = Casa (Tonica)**
- **Anillo medio = Tension para volver (Dominante)**
- **Anillo exterior = Alejarse de casa (Subdominante)**

```javascript
class TonalForceField {
    constructor(width, height) {
        this.cx = width / 2;
        this.cy = height / 2;
        this.tension = 0;
        this.activeChord = 'I';

        // RADIOS POR FUNCION (visualiza la teoria)
        this.functionRadii = {
            'T': 0,      // Tonica: CENTRO (casa)
            'D': 100,    // Dominante: anillo medio (tension)
            'S': 180     // Subdominante: anillo exterior (alejarse)
        };

        // ANGULOS predefinidos para distribucion logica
        this.chordAngles = {
            'I':    0,                    // Centro (no usa angulo)
            'V':    Math.PI * 0.5,        // Dominante a la derecha
            'viio': Math.PI * 0.3,        // Cerca de V
            'IV':   Math.PI * 1.5,        // Subdominante arriba-izquierda
            'ii':   Math.PI * 1.2,        // Cerca de IV
            'vi':   Math.PI * 1.0,        // Tonica secundaria
            'iii':  Math.PI * 0.8         // Tonica terciaria
        };

        this.nodes = [
            { id: 'I', function: 'T', x: this.cx, y: this.cy },
            { id: 'ii', function: 'S' },
            { id: 'iii', function: 'T' },
            { id: 'IV', function: 'S' },
            { id: 'V', function: 'D' },
            { id: 'vi', function: 'T' },
            { id: 'viio', function: 'D' }
        ];

        this.setupSimulation();
    }

    setupSimulation() {
        this.simulation = d3.forceSimulation(this.nodes)
            // Fuerza radial ESTRICTA por funcion
            .force('radial', d3.forceRadial(
                d => this.functionRadii[CHORDS[d.id].function],
                this.cx, this.cy
            ).strength(0.9))  // Muy fuerte - mantiene estructura

            // Fuerza angular para distribuir dentro del anillo
            .force('angular', this.createAngularForce())

            // Repulsion suave entre nodos del mismo anillo
            .force('collision', d3.forceCollide(30))

            // Gravedad tonal dinamica
            .force('tonalGravity', this.createTonalGravity())

            .on('tick', () => this.render());

        // Anclar tonica en el centro
        const tonica = this.nodes.find(n => n.id === 'I');
        tonica.fx = this.cx;
        tonica.fy = this.cy;
    }

    createAngularForce() {
        return (alpha) => {
            this.nodes.forEach(node => {
                if (node.id === 'I') return;

                const targetAngle = this.chordAngles[node.id];
                const targetRadius = this.functionRadii[CHORDS[node.id].function];

                const targetX = this.cx + targetRadius * Math.cos(targetAngle);
                const targetY = this.cy + targetRadius * Math.sin(targetAngle);

                // Fuerza suave hacia posicion angular predefinida
                node.vx += (targetX - node.x) * 0.05 * alpha;
                node.vy += (targetY - node.y) * 0.05 * alpha;
            });
        };
    }

    createTonalGravity() {
        return (alpha) => {
            this.nodes.forEach(node => {
                if (node.id === 'I') return;

                const dx = node.x - this.cx;
                const dy = node.y - this.cy;
                const dist = Math.sqrt(dx * dx + dy * dy);

                // Si este es el nodo activo y hay tension alta
                if (node.id === this.activeChord && this.tension > 0.5) {
                    // REPELER del centro
                    const repelForce = this.tension * 0.5;
                    node.vx += (dx / dist) * repelForce;
                    node.vy += (dy / dist) * repelForce;

                    // Temblor si tension muy alta
                    if (this.tension > 0.7) {
                        node.vx += (Math.random() - 0.5) * this.tension * 2;
                        node.vy += (Math.random() - 0.5) * this.tension * 2;
                    }
                }
            });
        };
    }

    triggerResolution() {
        this.simulation
            .force('resolution', d3.forceRadial(0, this.cx, this.cy)
                .strength(2.0))
            .alpha(1)
            .restart();

        setTimeout(() => {
            this.simulation.force('resolution', null);
            this.simulation.force('radial', d3.forceRadial(
                d => this.functionRadii[CHORDS[d.id].function],
                this.cx, this.cy
            ).strength(0.9));
        }, 500);
    }

    setActiveChord(chord, tension) {
        this.activeChord = chord;
        this.tension = tension;

        if (CHORDS[chord].function === 'T' && this.tension < 0.3) {
            this.triggerResolution();
        }

        this.simulation.alpha(0.5).restart();
    }

    render() {
        // Actualizar posiciones en DOM/Canvas
    }
}
```

### Visualizacion de Zonas Funcionales

```javascript
function drawFunctionZones(ctx, cx, cy) {
    // Zona Tonica (centro verde)
    ctx.beginPath();
    ctx.arc(cx, cy, 50, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(34, 197, 94, 0.1)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(34, 197, 94, 0.3)';
    ctx.stroke();

    // Zona Dominante (anillo rojo medio)
    ctx.beginPath();
    ctx.arc(cx, cy, 130, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.2)';
    ctx.lineWidth = 40;
    ctx.stroke();

    // Zona Subdominante (anillo azul exterior)
    ctx.beginPath();
    ctx.arc(cx, cy, 200, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(59, 130, 246, 0.2)';
    ctx.lineWidth = 40;
    ctx.stroke();

    // Labels de zonas
    ctx.fillStyle = '#64748b';
    ctx.font = '10px Inter';
    ctx.textAlign = 'center';
    ctx.fillText('T (Casa)', cx, cy + 40);
    ctx.fillText('D (Tension)', cx + 115, cy);
    ctx.fillText('S (Alejarse)', cx, cy - 185);
}

// Colores por funcion
const FUNCTION_COLORS = {
    'T': '#22c55e',
    'S': '#3b82f6',
    'D': '#ef4444'
};

const VISUAL_EFFECTS = {
    activeGlow: {
        radius: (tension) => 20 + tension * 30,
        opacity: (tension) => 0.3 + tension * 0.5
    },
    trail: {
        maxLength: 8,
        fadeRate: 0.15
    },
    transitionArcs: {
        thickness: (probability) => 1 + probability * 4,
        opacity: (probability) => 0.2 + probability * 0.6
    },
    resolutionBurst: {
        duration: 500,
        particleCount: 20,
        color: '#22c55e'
    }
};
```

### Layout Propuesto

```
┌─────────────────────────────────────────────────────────────┐
│  Rameau Machine                                    [≡] [?]  │
├────────────────────────────────────────────┬────────────────┤
│                                            │   Controles    │
│     Grafo con Anillos Funcionales          │                │
│                                            │  Tonalidad:    │
│            ╭─── S (azul) ───╮              │  [C] [G] [D]   │
│           ii ●           ● IV              │                │
│            ╰───────┬───────╯               │  Tempo: 80 BPM │
│                    │                       │  [━━━━━●━━━░]  │
│            ╭─── D (rojo) ───╮              │                │
│         viio ●           ● V               │  ── Tension ── │
│            ╰───────┬───────╯               │  [████████░░]  │
│                    │                       │     0.82       │
│              ╭─ T (verde) ─╮               │                │
│           vi ●  ● I ●  ● iii               │  Estilo:       │
│              ╰─────────────╯               │  ○ Barroco     │
│                                            │  ● Clasico     │
│  ═══════════════════════════════════════   │  ○ Romantico   │
│  Bajo: C - F - G - C                       │  ○ Jazz        │
│  Progresion: I - IV - V - I                │                │
│  Cadencia: Autentica Perfecta              │  [▶] [⏸] [⏺]  │
└────────────────────────────────────────────┴────────────────┘
```

---

## Audio

### Sintesis con Voice Leading y Articulacion Dinamica

**Principio critico**: Cada oscilador mantiene su identidad SATB.

```javascript
class VoiceLeadingSynth {
    constructor(audioCtx) {
        this.ctx = audioCtx;
        this.numVoices = 4;
        this.oscillators = [];
        this.gains = [];

        // MAPEO FIJO: indice -> voz
        this.voiceAssignment = {
            0: 'bass',
            1: 'tenor',
            2: 'alto',
            3: 'soprano'
        };

        this.masterGain = audioCtx.createGain();
        this.reverb = this.createReverb();

        this.masterGain.connect(this.reverb);
        this.reverb.connect(audioCtx.destination);

        // Crear osciladores persistentes
        for (let i = 0; i < this.numVoices; i++) {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();

            osc.connect(gain);
            gain.connect(this.masterGain);

            osc.start();
            gain.gain.value = 0;

            this.oscillators.push(osc);
            this.gains.push(gain);
        }
    }

    // Transicion con ARTICULACION DINAMICA
    transitionTo(newVoicing, duration, articulation) {
        const now = this.ctx.currentTime;
        const glideTime = duration * 0.3;

        // newVoicing SIEMPRE es [bass, tenor, alto, soprano]
        newVoicing.forEach((targetNote, voiceIndex) => {
            const freq = this.midiToFreq(targetNote);
            const gain = this.gains[voiceIndex];

            // Glide suave a nueva frecuencia
            this.oscillators[voiceIndex].frequency.linearRampToValueAtTime(
                freq, now + glideTime
            );

            // ADSR dinamico segun articulacion
            gain.gain.cancelScheduledValues(now);
            gain.gain.setValueAtTime(gain.gain.value, now);

            // Attack (mas corto en tension alta)
            gain.gain.linearRampToValueAtTime(
                articulation.velocity,
                now + articulation.attackTime
            );

            // Decay
            gain.gain.linearRampToValueAtTime(
                articulation.sustainLevel,
                now + articulation.attackTime + articulation.decayTime
            );

            // Sustain
            gain.gain.setValueAtTime(
                articulation.sustainLevel,
                now + duration - articulation.releaseTime
            );

            // Release
            gain.gain.linearRampToValueAtTime(
                0.1,
                now + duration
            );
        });
    }

    midiToFreq(midi) {
        return 440 * Math.pow(2, (midi - 69) / 12);
    }

    setWaveform(type) {
        this.oscillators.forEach(osc => osc.type = type);
    }

    createReverb() {
        const convolver = this.ctx.createConvolver();
        // ... impulse response
        return convolver;
    }
}
```

### Bajo Separado

```javascript
class BassLine {
    constructor(audioCtx, style = 'clasico') {
        this.ctx = audioCtx;
        this.style = style;
        this.osc = audioCtx.createOscillator();
        this.gain = audioCtx.createGain();

        this.osc.type = 'triangle';
        this.osc.connect(this.gain);
        this.osc.start();
    }

    playBass(note, duration, style) {
        const freq = 65.41 * Math.pow(2, note / 12);
        const now = this.ctx.currentTime;

        switch(style) {
            case 'alberti':
                this.playAlberti(note, duration);
                break;
            case 'walking':
                this.playWalking(note, duration);
                break;
            case 'octaves':
                this.playOctaves(note, duration);
                break;
            default:
                this.osc.frequency.setValueAtTime(freq, now);
                this.gain.gain.setValueAtTime(0.3, now);
                this.gain.gain.linearRampToValueAtTime(0.2, now + duration);
        }
    }

    playAlberti(root, duration) {
        const pattern = [0, 7, 4, 7];
        const noteLength = duration / 4;

        pattern.forEach((interval, i) => {
            const freq = 65.41 * Math.pow(2, (root + interval) / 12);
            const time = this.ctx.currentTime + i * noteLength;

            this.osc.frequency.setValueAtTime(freq, time);
            this.gain.gain.setValueAtTime(0.25, time);
            this.gain.gain.linearRampToValueAtTime(0.1, time + noteLength * 0.9);
        });
    }
}
```

### Estilos Predefinidos

```javascript
const STYLES = {
    barroco: {
        tempo: 60,
        waveform: 'triangle',
        voiceLeadingRules: 'strict',
        bassStyle: 'walking',
        rubato: false,
        ornaments: true
    },
    clasico: {
        tempo: 80,
        waveform: 'sine',
        voiceLeadingRules: 'strict',
        bassStyle: 'alberti',
        rubato: false,
        ornaments: false
    },
    romantico: {
        tempo: 70,
        waveform: 'sawtooth',
        voiceLeadingRules: 'relaxed',
        bassStyle: 'octaves',
        rubato: true,
        ornaments: false
    },
    jazz: {
        tempo: 120,
        waveform: 'sine',
        voiceLeadingRules: 'free',
        bassStyle: 'walking',
        rubato: false,
        ornaments: false,
        extensions: true
    }
};
```

---

## Deteccion de Cadencias

```javascript
const CADENCES = {
    'autentica_perfecta': {
        pattern: ['V', 'I'],
        requirements: {
            VInversion: 0,
            IInversion: 0,
            sopranoOnTonic: true
        },
        strength: 1.0
    },
    'autentica_imperfecta': {
        pattern: ['V', 'I'],
        requirements: {},
        strength: 0.8
    },
    'plagal': {
        pattern: ['IV', 'I'],
        requirements: {},
        strength: 0.6
    },
    'semicadencia': {
        pattern: ['*', 'V'],
        requirements: {},
        strength: 0.5
    },
    'rota': {
        pattern: ['V', 'vi'],
        requirements: {},
        strength: 0.7
    },
    'frigia': {
        pattern: ['iv', 'V'],
        requirements: {
            ivInversion: 1
        },
        strength: 0.9
    }
};

function detectCadence(history, inversions, voiceLeader) {
    if (history.length < 2) return null;

    const last2 = history.slice(-2);
    const lastInversions = inversions.slice(-2);

    for (const [name, cadence] of Object.entries(CADENCES)) {
        if (matchesPattern(last2, cadence.pattern)) {
            if (checkRequirements(cadence.requirements, last2, lastInversions, voiceLeader)) {
                return {
                    type: name,
                    strength: cadence.strength,
                    position: history.length
                };
            }
        }
    }

    return null;
}
```

---

## Modos de Operacion

### 1. Modo Autonomo (Generativo)
- El sistema evoluciona solo segun gravedad tonal
- Genera progresiones infinitas
- Detecta y anuncia cadencias
- Voice leading automatico

### 2. Modo Guiado (Educativo)
- Usuario selecciona siguiente acorde clickeando nodo
- Sistema muestra probabilidades en hover
- Feedback: "Esa progresion es poco comun en estilo clasico"
- Muestra conduccion de voces recomendada

### 3. Modo Comparativo (vs Tonnetz)
- Pantalla dividida: Rameau | Tonnetz
- Misma progresion ejecutada en ambos sistemas
- Visualizar diferencias de voice leading

---

## Estructura de Archivos

```
rameau-machine/
├── index.html    # Aplicacion principal (~1000 lineas)
├── PLAN.md       # Este documento
└── README.md     # Documentacion usuario
```

**Dependencias (CDN):**
- D3.js (para force simulation)
- Tailwind CSS

---

## Pasos de Implementacion

### Fase 1: Estructura Base
- [ ] HTML con layout: canvas D3 + panel controles
- [ ] CSS inline (patron Physics Sound Lab)
- [ ] Import D3.js y Tailwind
- [ ] Sistema KEY_PITCH para transposicion

### Fase 2: Modelo Armonico
- [ ] Definir CHORDS como grados relativos
- [ ] Implementar HarmonicState con inercia de bajo
- [ ] Implementar patrones de bajo obligatorios
- [ ] Implementar matriz de transicion
- [ ] Crear clase TonalGravity con step()

### Fase 3: Voice Leading
- [ ] Implementar VoiceLeader con mapeo SATB estricto
- [ ] Reglas: paralelas, sensible, voice crossing, overlapping
- [ ] Configuracion por estilo
- [ ] Integracion con TonalGravity

### Fase 4: Visualizacion D3
- [ ] Force simulation con ANILLOS funcionales (T/D/S)
- [ ] Posiciones angulares predefinidas
- [ ] Dibujar zonas de color por funcion
- [ ] Gravedad tonal dinamica
- [ ] Efecto de implosion en resolucion
- [ ] Temblor de tension
- [ ] Trail del walker

### Fase 5: Ritmo Armonico
- [ ] RhythmicHarmony con duraciones variables
- [ ] computeArticulation() dinamico
- [ ] computeTempo() segun entropia
- [ ] Rubato algoritmico (romantico)
- [ ] Visualizacion de "respiracion"

### Fase 6: Audio
- [ ] VoiceLeadingSynth con mapeo indice-a-voz FIJO
- [ ] ADSR dinamico segun articulacion
- [ ] Glide entre voicings
- [ ] BassLine separada
- [ ] Selector de waveform
- [ ] Reverb/effects

### Fase 7: Controles UI
- [ ] Selector de tonalidad (KEY_PITCH)
- [ ] Selector de estilo
- [ ] Slider de tempo
- [ ] Indicador de tension
- [ ] Play/Pause/Reset

### Fase 8: Cadencias y Feedback
- [ ] Detector de cadencias completo
- [ ] Mostrar nombre y tipo de cadencia
- [ ] Historial de progresion
- [ ] Visualizacion de linea de bajo

### Fase 9: Modos Adicionales
- [ ] Modo educativo (click para elegir)
- [ ] Hover muestra probabilidades
- [ ] Feedback de naturalidad

### Fase 10: Grabacion y Export
- [x] MediaRecorder para audio
- [x] Export progresion como texto

### Fase 11: Mixer de Voces ✅ (2025-12-21)
- [x] Panel mixer con faders verticales (Bajo, Tenor, Alto, Soprano)
- [x] Botones Mute por voz
- [x] LEDs de actividad (parpadean al atacar)
- [x] Display de nota actual por voz
- [x] Canvas Voice Trail (historial melódico 10 acordes)
- [x] Toggle colapsable para matriz de transición

### Fase 12: Motor de Audio Profesional ✅ (2025-12-21)

#### 12.1 Síntesis (Fase 1)
- [x] Freeverb algorítmico (8 comb + 4 allpass filters)
- [x] Osciladores duales por voz (unísono con detune)
- [x] Filtros por registro:
  | Voz | Freq | Q | Env Amount |
  |-----|------|---|------------|
  | Bajo | 800Hz | 0.7 | 400 |
  | Tenor | 1500Hz | 0.8 | 600 |
  | Alto | 2500Hz | 0.9 | 800 |
  | Soprano | 4000Hz | 1.0 | 1200 |
- [x] Saturador suave (tanh waveshaper, oversample 2x)

#### 12.2 Expresividad (Fase 2)
- [x] LFO vibrato por voz:
  | Voz | Rate | Depth |
  |-----|------|-------|
  | Bajo | 4.5 Hz | 8 cents |
  | Tenor | 5.0 Hz | 12 cents |
  | Alto | 5.5 Hz | 18 cents |
  | Soprano | 6.0 Hz | 25 cents |
- [x] Micro-timing humanización (0-12ms offsets aleatorios)
- [x] Filter envelopes con exponential decay
- [x] Vibrato con entrada gradual post-ataque

#### 12.3 Timbres por Estilo (Fase 3)
- [x] STYLES expandido con parámetros de síntesis:
  ```javascript
  barroco:   { filterMult: 1.3, vibratoMult: 0.3, attackMult: 0.7, reverbMix: 0.4, reverbSize: 0.8 }
  clasico:   { filterMult: 1.0, vibratoMult: 0.5, attackMult: 1.0, reverbMix: 0.3, reverbSize: 0.6 }
  romantico: { filterMult: 0.8, vibratoMult: 1.5, attackMult: 1.4, reverbMix: 0.5, reverbSize: 0.85 }
  jazz:      { filterMult: 0.6, vibratoMult: 0.2, attackMult: 0.5, reverbMix: 0.15, reverbSize: 0.3 }
  ```
- [x] Método applyStyle() actualiza waveform, reverb, filtros, vibrato, detune

#### 12.4 Espacialización (Fase 4)
- [x] Panning estéreo por voz:
  | Voz | Pan |
  |-----|-----|
  | Bajo | -0.5 |
  | Tenor | -0.15 |
  | Alto | +0.15 |
  | Soprano | +0.5 |
- [x] Early reflections (4 taps):
  - 11ms, pan -0.7, gain 0.15 (pared izq)
  - 19ms, pan +0.7, gain 0.12 (pared der)
  - 27ms, pan -0.3, gain 0.08 (fondo izq)
  - 37ms, pan +0.3, gain 0.06 (fondo der)
  - Filtro lowpass 6kHz (absorción acústica)
- [x] Compresor master:
  - Threshold: -18dB
  - Knee: 12dB (soft)
  - Ratio: 3:1
  - Attack: 15ms
  - Release: 250ms

### Fase 13: Pulido
- [x] README.md actualizado
- [x] Actualizar hub de generativos
- [ ] Preview animado en hub

---

## Cadena de Audio Final (Implementada)

```
┌─────────────────────────────────────────────────────────────────┐
│                        POR VOZ (x4)                             │
├─────────────────────────────────────────────────────────────────┤
│  osc1 ──┬──► osc1Gain ──┐                                       │
│         │               ├──► oscMerge ──► Filter ──► Gain ──►   │
│  osc2 ──┴──► osc2Gain ──┘                                       │
│         ▲                                           │           │
│         │                                           ▼           │
│  LFO ──► lfoGain (vibrato)                      Panner          │
│                                                     │           │
└─────────────────────────────────────────────────────┼───────────┘
                                                      │
                                                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                      MASTER CHAIN                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  4 voces ──► MasterGain ──► Saturator ──► Early Reflections     │
│                                                  │              │
│                                                  ▼              │
│                              Freeverb ◄──────────┘              │
│                                  │                              │
│                                  ▼                              │
│                             Compressor ──► destination          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Metricas de Complejidad

| Componente | Lineas Estimadas | Dificultad |
|------------|------------------|------------|
| Modelo armonico + KEY_PITCH | ~180 | Media |
| Voice leading + SATB estricto | ~220 | Alta |
| Ritmo + articulacion dinamica | ~100 | Media |
| Visualizacion D3 + anillos | ~280 | Media |
| Audio + ADSR dinamico | ~180 | Media |
| UI/Controles | ~100 | Baja |
| **Total** | **~1060** | |

---

## Extensiones Futuras

1. **Modulacion**: Cambio de centro tonal (tonicizacion)
2. **Acordes extendidos**: 7as, 9as, 11as, 13as (modo Jazz)
3. **Modo menor**: Armonia menor melodica/armonica
4. **Corpus analysis**: Entrenar probabilidades con Bach, Mozart, etc.
5. **MIDI input/output**: Tocar acordes y ver analisis / exportar
6. **Comparador A/B**: Ejecutar misma seed en Rameau vs Tonnetz

---

## Referencias

- [Rameau - Traite de l'harmonie (1722)](https://imslp.org/wiki/Trait%C3%A9_de_l%27harmonie_(Rameau%2C_Jean-Philippe))
- [Kostka & Payne - Tonal Harmony](https://www.mheducation.com/highered/product/tonal-harmony-kostka-payne/M9781259447099.html)
- [David Temperley - Music and Probability](https://mitpress.mit.edu/9780262515191/music-and-probability/)
- [Dmitri Tymoczko - A Geometry of Music](https://dmitri.mycpanel.princeton.edu/geometry-of-music.html)
- [Open Music Theory - Harmonic Functions](https://viva.pressbooks.pub/openmusictheory/chapter/harmonic-functions/)

---

## Comparativa Final: Por Que Ambos Sistemas

| Para entender... | Usa Rameau | Usa Tonnetz |
|------------------|------------|-------------|
| Bach, Mozart, Beethoven | X | |
| Brahms, Wagner, Liszt | | X |
| Jazz standards | X (con extensiones) | |
| Cine/videojuegos | | X |
| Por que V->I suena "bien" | X | |
| Por que C->E->Ab suena "magico" | | X |
| Voice leading clasico | X | |
| Voice leading parsimonioso | | X |

**Rameau Machine** completa el circulo: donde Tonnetz muestra la *geometria* de los acordes, Rameau muestra su *funcion*, *jerarquia* y *conduccion de voces*.
