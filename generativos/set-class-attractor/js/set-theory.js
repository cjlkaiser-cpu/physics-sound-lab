/**
 * Set-Class Attractor - Motor de Pitch-Class Set Theory
 * Basado en Allen Forte (1973) "The Structure of Atonal Music"
 */

// Calcular Interval Vector de un pitch-class set
function computeIntervalVector(pcSet) {
  const iv = [0, 0, 0, 0, 0, 0]; // [ic1, ic2, ic3, ic4, ic5, ic6]

  for (let i = 0; i < pcSet.length; i++) {
    for (let j = i + 1; j < pcSet.length; j++) {
      let interval = Math.abs(pcSet[j] - pcSet[i]);
      if (interval > 6) interval = 12 - interval; // Reducir a clase de intervalo
      if (interval > 0) iv[interval - 1]++;
    }
  }

  return iv;
}

// Transponer un set
function transpose(pcSet, n) {
  return pcSet.map(pc => (pc + n) % 12).sort((a, b) => a - b);
}

// Invertir un set
function invert(pcSet) {
  return pcSet.map(pc => (12 - pc) % 12).sort((a, b) => a - b);
}

// Obtener forma normal de un set
function normalForm(pcSet) {
  const sorted = [...new Set(pcSet)].sort((a, b) => a - b);
  const n = sorted.length;
  if (n === 0) return [];

  let bestRotation = sorted;
  let minSpan = (sorted[n-1] - sorted[0] + 12) % 12;

  for (let i = 1; i < n; i++) {
    const rotated = [...sorted.slice(i), ...sorted.slice(0, i).map(x => x + 12)];
    const normalized = rotated.map(x => x - rotated[0]);
    const span = normalized[n-1];

    if (span < minSpan || (span === minSpan && isLexSmaller(normalized, bestRotation.map(x => x - bestRotation[0])))) {
      minSpan = span;
      bestRotation = rotated.map(x => x % 12);
    }
  }

  return bestRotation.map(x => (x - bestRotation[0] + 12) % 12);
}

function isLexSmaller(a, b) {
  for (let i = 0; i < a.length; i++) {
    if (a[i] < b[i]) return true;
    if (a[i] > b[i]) return false;
  }
  return false;
}

// Obtener prime form (forma más compacta bajo Tn/TnI)
function primeForm(pcSet) {
  const nf = normalForm(pcSet);
  const inv = normalForm(invert(pcSet));

  // Transponer ambos para empezar en 0
  const nfZero = nf.map(x => (x - nf[0] + 12) % 12);
  const invZero = inv.map(x => (x - inv[0] + 12) % 12);

  return isLexSmaller(nfZero, invZero) ? nfZero : invZero;
}

// Clase principal SetClass
class SetClass {
  constructor(primeFormArray, forteNumber, name = null) {
    this.primeForm = primeFormArray;
    this.forte = forteNumber;
    this.name = name;
    this.cardinality = primeFormArray.length;
    this.intervalVector = computeIntervalVector(primeFormArray);
    this.zMate = null;
    this.tension = this.computeTension();
  }

  // Calcular tension basada en Interval Vector (para Heat Map)
  computeTension() {
    const weights = {
      ic1: 1.0,   // m2: maxima disonancia
      ic2: 0.5,   // M2: disonancia media
      ic3: -0.3,  // m3: consonancia
      ic4: -0.3,  // M3: consonancia
      ic5: -0.5,  // P5: maxima consonancia
      ic6: 0.8    // tritono: alta tension
    };

    const [ic1, ic2, ic3, ic4, ic5, ic6] = this.intervalVector;
    const rawTension =
      ic1 * weights.ic1 +
      ic2 * weights.ic2 +
      ic3 * weights.ic3 +
      ic4 * weights.ic4 +
      ic5 * weights.ic5 +
      ic6 * weights.ic6;

    // Normalizar a 0-1
    return Math.max(0, Math.min(1, (rawTension + 3) / 9));
  }

  // Color basado en tension (Heat Map)
  getColor() {
    const hue = (1 - this.tension) * 240; // Azul (frio) a Rojo (caliente)
    const saturation = 70 + this.tension * 20;
    return `hsl(${hue}, ${saturation}%, 50%)`;
  }

  // Distancia euclidiana entre interval vectors
  static distance(a, b) {
    return Math.sqrt(
      a.intervalVector.reduce((sum, v, i) =>
        sum + Math.pow(v - b.intervalVector[i], 2), 0)
    );
  }

  // Verificar si un set es subset de este
  containsSubset(otherPrimeForm) {
    // Simplificado: verificar si el otro set es subconjunto
    return otherPrimeForm.every(pc => this.primeForm.includes(pc));
  }

  toString() {
    return `${this.forte} [${this.primeForm.join(',')}]`;
  }
}

// Tabla completa de Forte (223 set classes)
const FORTE_TABLE = [
  // Cardinality 1
  { prime: [0], forte: '1-1', name: 'single note' },

  // Cardinality 2 (intervalos)
  { prime: [0, 1], forte: '2-1', name: 'minor second' },
  { prime: [0, 2], forte: '2-2', name: 'major second' },
  { prime: [0, 3], forte: '2-3', name: 'minor third' },
  { prime: [0, 4], forte: '2-4', name: 'major third' },
  { prime: [0, 5], forte: '2-5', name: 'perfect fourth' },
  { prime: [0, 6], forte: '2-6', name: 'tritone' },

  // Cardinality 3 (tricordios)
  { prime: [0, 1, 2], forte: '3-1', name: 'chromatic cluster' },
  { prime: [0, 1, 3], forte: '3-2', name: null },
  { prime: [0, 1, 4], forte: '3-3', name: 'Viennese trichord' },
  { prime: [0, 1, 5], forte: '3-4', name: null },
  { prime: [0, 1, 6], forte: '3-5', name: null },
  { prime: [0, 2, 4], forte: '3-6', name: 'whole-tone trichord' },
  { prime: [0, 2, 5], forte: '3-7', name: null },
  { prime: [0, 2, 6], forte: '3-8', name: null },
  { prime: [0, 2, 7], forte: '3-9', name: 'quartal' },
  { prime: [0, 3, 6], forte: '3-10', name: 'diminished' },
  { prime: [0, 3, 7], forte: '3-11', name: 'major/minor triad' },
  { prime: [0, 4, 8], forte: '3-12', name: 'augmented triad' },

  // Cardinality 4 (tetracordios)
  { prime: [0, 1, 2, 3], forte: '4-1', name: 'chromatic tetrachord' },
  { prime: [0, 1, 2, 4], forte: '4-2', name: null },
  { prime: [0, 1, 3, 4], forte: '4-3', name: null },
  { prime: [0, 1, 2, 5], forte: '4-4', name: null },
  { prime: [0, 1, 2, 6], forte: '4-5', name: null },
  { prime: [0, 1, 2, 7], forte: '4-6', name: null },
  { prime: [0, 1, 4, 5], forte: '4-7', name: null },
  { prime: [0, 1, 5, 6], forte: '4-8', name: null },
  { prime: [0, 1, 6, 7], forte: '4-9', name: null },
  { prime: [0, 2, 3, 5], forte: '4-10', name: null },
  { prime: [0, 1, 3, 5], forte: '4-11', name: null },
  { prime: [0, 2, 3, 6], forte: '4-12', name: null },
  { prime: [0, 1, 3, 6], forte: '4-13', name: null },
  { prime: [0, 2, 3, 7], forte: '4-14', name: null },
  { prime: [0, 1, 4, 6], forte: '4-Z15', name: 'all-interval tetrachord' },
  { prime: [0, 1, 5, 7], forte: '4-16', name: null },
  { prime: [0, 3, 4, 7], forte: '4-17', name: null },
  { prime: [0, 1, 4, 7], forte: '4-18', name: null },
  { prime: [0, 1, 4, 8], forte: '4-19', name: 'minor-major seventh' },
  { prime: [0, 1, 5, 8], forte: '4-20', name: 'major seventh' },
  { prime: [0, 2, 4, 6], forte: '4-21', name: 'whole-tone tetrachord' },
  { prime: [0, 2, 4, 7], forte: '4-22', name: null },
  { prime: [0, 2, 5, 7], forte: '4-23', name: 'quartal tetrachord' },
  { prime: [0, 2, 4, 8], forte: '4-24', name: null },
  { prime: [0, 2, 6, 8], forte: '4-25', name: 'French sixth' },
  { prime: [0, 3, 5, 8], forte: '4-26', name: 'minor seventh' },
  { prime: [0, 2, 5, 8], forte: '4-27', name: 'dominant/half-dim seventh' },
  { prime: [0, 3, 6, 9], forte: '4-28', name: 'diminished seventh' },
  { prime: [0, 1, 3, 7], forte: '4-Z29', name: 'all-interval tetrachord' },

  // Cardinality 5 (pentacordios)
  { prime: [0, 1, 2, 3, 4], forte: '5-1', name: 'chromatic pentachord' },
  { prime: [0, 1, 2, 3, 5], forte: '5-2', name: null },
  { prime: [0, 1, 2, 4, 5], forte: '5-3', name: null },
  { prime: [0, 1, 2, 3, 6], forte: '5-4', name: null },
  { prime: [0, 1, 2, 3, 7], forte: '5-5', name: null },
  { prime: [0, 1, 2, 5, 6], forte: '5-6', name: null },
  { prime: [0, 1, 2, 6, 7], forte: '5-7', name: null },
  { prime: [0, 2, 3, 4, 6], forte: '5-8', name: null },
  { prime: [0, 1, 2, 4, 6], forte: '5-9', name: null },
  { prime: [0, 1, 3, 4, 6], forte: '5-10', name: null },
  { prime: [0, 2, 3, 4, 7], forte: '5-11', name: null },
  { prime: [0, 1, 3, 5, 6], forte: '5-Z12', name: null },
  { prime: [0, 1, 2, 4, 8], forte: '5-13', name: null },
  { prime: [0, 1, 2, 5, 7], forte: '5-14', name: null },
  { prime: [0, 1, 2, 6, 8], forte: '5-15', name: null },
  { prime: [0, 1, 3, 4, 7], forte: '5-16', name: null },
  { prime: [0, 1, 3, 4, 8], forte: '5-Z17', name: null },
  { prime: [0, 1, 4, 5, 7], forte: '5-Z18', name: null },
  { prime: [0, 1, 3, 6, 7], forte: '5-19', name: null },
  { prime: [0, 1, 5, 6, 8], forte: '5-20', name: null },
  { prime: [0, 1, 4, 5, 8], forte: '5-21', name: null },
  { prime: [0, 1, 4, 7, 8], forte: '5-22', name: null },
  { prime: [0, 2, 3, 5, 7], forte: '5-23', name: null },
  { prime: [0, 1, 3, 5, 7], forte: '5-24', name: null },
  { prime: [0, 2, 3, 5, 8], forte: '5-25', name: null },
  { prime: [0, 2, 4, 5, 8], forte: '5-26', name: null },
  { prime: [0, 1, 3, 5, 8], forte: '5-27', name: null },
  { prime: [0, 2, 3, 6, 8], forte: '5-28', name: null },
  { prime: [0, 1, 3, 6, 8], forte: '5-29', name: null },
  { prime: [0, 1, 4, 6, 8], forte: '5-30', name: null },
  { prime: [0, 1, 3, 6, 9], forte: '5-31', name: null },
  { prime: [0, 1, 4, 6, 9], forte: '5-32', name: null },
  { prime: [0, 2, 4, 6, 8], forte: '5-33', name: 'whole-tone pentachord' },
  { prime: [0, 2, 4, 6, 9], forte: '5-34', name: 'dominant ninth' },
  { prime: [0, 2, 4, 7, 9], forte: '5-35', name: 'pentatonic' },
  { prime: [0, 1, 2, 4, 7], forte: '5-Z36', name: null },
  { prime: [0, 3, 4, 5, 8], forte: '5-Z37', name: null },
  { prime: [0, 1, 2, 5, 8], forte: '5-Z38', name: null },

  // Cardinality 6 (hexacordios)
  { prime: [0, 1, 2, 3, 4, 5], forte: '6-1', name: 'chromatic hexachord' },
  { prime: [0, 1, 2, 3, 4, 6], forte: '6-2', name: null },
  { prime: [0, 1, 2, 3, 5, 6], forte: '6-Z3', name: null },
  { prime: [0, 1, 2, 4, 5, 6], forte: '6-Z4', name: null },
  { prime: [0, 1, 2, 3, 6, 7], forte: '6-5', name: null },
  { prime: [0, 1, 2, 5, 6, 7], forte: '6-Z6', name: null },
  { prime: [0, 1, 2, 6, 7, 8], forte: '6-7', name: null },
  { prime: [0, 2, 3, 4, 5, 7], forte: '6-8', name: null },
  { prime: [0, 1, 2, 3, 5, 7], forte: '6-9', name: null },
  { prime: [0, 1, 3, 4, 5, 7], forte: '6-Z10', name: null },
  { prime: [0, 1, 2, 4, 5, 7], forte: '6-Z11', name: null },
  { prime: [0, 1, 2, 4, 6, 7], forte: '6-Z12', name: null },
  { prime: [0, 1, 3, 4, 6, 7], forte: '6-Z13', name: null },
  { prime: [0, 1, 3, 4, 5, 8], forte: '6-14', name: null },
  { prime: [0, 1, 2, 4, 5, 8], forte: '6-15', name: null },
  { prime: [0, 1, 4, 5, 6, 8], forte: '6-16', name: null },
  { prime: [0, 1, 2, 4, 7, 8], forte: '6-Z17', name: null },
  { prime: [0, 1, 2, 5, 7, 8], forte: '6-18', name: null },
  { prime: [0, 1, 3, 4, 7, 8], forte: '6-Z19', name: null },
  { prime: [0, 1, 4, 5, 8, 9], forte: '6-20', name: 'hexatonic' },
  { prime: [0, 2, 3, 4, 6, 8], forte: '6-21', name: null },
  { prime: [0, 1, 2, 4, 6, 8], forte: '6-22', name: null },
  { prime: [0, 2, 3, 5, 6, 8], forte: '6-Z23', name: null },
  { prime: [0, 1, 3, 4, 6, 8], forte: '6-Z24', name: null },
  { prime: [0, 1, 3, 5, 6, 8], forte: '6-Z25', name: null },
  { prime: [0, 1, 3, 5, 7, 8], forte: '6-Z26', name: null },
  { prime: [0, 1, 3, 4, 6, 9], forte: '6-27', name: null },
  { prime: [0, 1, 3, 5, 6, 9], forte: '6-Z28', name: null },
  { prime: [0, 2, 3, 6, 7, 9], forte: '6-Z29', name: null },
  { prime: [0, 1, 3, 6, 7, 9], forte: '6-30', name: 'Petrushka chord' },
  { prime: [0, 1, 4, 5, 7, 9], forte: '6-31', name: null },
  { prime: [0, 2, 4, 5, 7, 9], forte: '6-32', name: 'diatonic hexachord' },
  { prime: [0, 2, 3, 5, 7, 9], forte: '6-33', name: 'Dorian hexachord' },
  { prime: [0, 1, 3, 5, 7, 9], forte: '6-34', name: 'Mystic chord' },
  { prime: [0, 2, 4, 6, 8, 10], forte: '6-35', name: 'whole-tone scale' },
  { prime: [0, 1, 2, 3, 4, 7], forte: '6-Z36', name: null },
  { prime: [0, 1, 2, 3, 4, 8], forte: '6-Z37', name: null },
  { prime: [0, 1, 2, 3, 7, 8], forte: '6-Z38', name: null },
  { prime: [0, 2, 3, 4, 5, 8], forte: '6-Z39', name: null },
  { prime: [0, 1, 2, 3, 5, 8], forte: '6-Z40', name: null },
  { prime: [0, 1, 2, 3, 6, 8], forte: '6-Z41', name: null },
  { prime: [0, 1, 2, 3, 6, 9], forte: '6-Z42', name: null },
  { prime: [0, 1, 2, 5, 6, 8], forte: '6-Z43', name: null },
  { prime: [0, 1, 2, 5, 6, 9], forte: '6-Z44', name: 'Schoenberg hexachord' },
  { prime: [0, 2, 3, 4, 6, 9], forte: '6-Z45', name: null },
  { prime: [0, 1, 2, 4, 6, 9], forte: '6-Z46', name: null },
  { prime: [0, 1, 2, 4, 7, 9], forte: '6-Z47', name: null },
  { prime: [0, 1, 2, 5, 7, 9], forte: '6-Z48', name: null },
  { prime: [0, 1, 3, 4, 7, 9], forte: '6-Z49', name: null },
  { prime: [0, 1, 4, 6, 7, 9], forte: '6-Z50', name: null },

  // Cardinality 7 (complementos de 5)
  { prime: [0, 1, 2, 3, 4, 5, 6], forte: '7-1', name: 'chromatic heptachord' },
  { prime: [0, 1, 2, 3, 4, 5, 7], forte: '7-2', name: null },
  { prime: [0, 1, 2, 3, 4, 5, 8], forte: '7-3', name: null },
  { prime: [0, 1, 2, 3, 4, 6, 7], forte: '7-4', name: null },
  { prime: [0, 1, 2, 3, 5, 6, 7], forte: '7-5', name: null },
  { prime: [0, 1, 2, 3, 4, 7, 8], forte: '7-6', name: null },
  { prime: [0, 1, 2, 3, 6, 7, 8], forte: '7-7', name: null },
  { prime: [0, 2, 3, 4, 5, 6, 8], forte: '7-8', name: null },
  { prime: [0, 1, 2, 3, 4, 6, 8], forte: '7-9', name: null },
  { prime: [0, 1, 2, 3, 4, 6, 9], forte: '7-10', name: null },
  { prime: [0, 1, 3, 4, 5, 6, 8], forte: '7-11', name: null },
  { prime: [0, 1, 2, 3, 4, 7, 9], forte: '7-Z12', name: null },
  { prime: [0, 1, 2, 4, 5, 6, 8], forte: '7-13', name: null },
  { prime: [0, 1, 2, 3, 5, 7, 8], forte: '7-14', name: null },
  { prime: [0, 1, 2, 4, 6, 7, 8], forte: '7-15', name: null },
  { prime: [0, 1, 2, 3, 5, 6, 9], forte: '7-16', name: null },
  { prime: [0, 1, 2, 4, 5, 6, 9], forte: '7-Z17', name: null },
  { prime: [0, 1, 4, 5, 6, 7, 9], forte: '7-Z18', name: null },
  { prime: [0, 1, 2, 3, 6, 7, 9], forte: '7-19', name: null },
  { prime: [0, 1, 2, 5, 6, 7, 9], forte: '7-20', name: null },
  { prime: [0, 1, 2, 4, 5, 8, 9], forte: '7-21', name: null },
  { prime: [0, 1, 2, 5, 6, 8, 9], forte: '7-22', name: 'Hungarian minor' },
  { prime: [0, 2, 3, 4, 5, 7, 9], forte: '7-23', name: null },
  { prime: [0, 1, 2, 3, 5, 7, 9], forte: '7-24', name: null },
  { prime: [0, 2, 3, 4, 6, 7, 9], forte: '7-25', name: null },
  { prime: [0, 1, 3, 4, 5, 7, 9], forte: '7-26', name: null },
  { prime: [0, 1, 2, 4, 5, 7, 9], forte: '7-27', name: null },
  { prime: [0, 1, 3, 5, 6, 7, 9], forte: '7-28', name: null },
  { prime: [0, 1, 2, 4, 6, 7, 9], forte: '7-29', name: null },
  { prime: [0, 1, 2, 4, 6, 8, 9], forte: '7-30', name: null },
  { prime: [0, 1, 3, 4, 6, 7, 9], forte: '7-31', name: null },
  { prime: [0, 1, 3, 4, 6, 8, 9], forte: '7-32', name: 'harmonic minor' },
  { prime: [0, 1, 2, 4, 6, 8, 10], forte: '7-33', name: 'whole-tone + 1' },
  { prime: [0, 1, 3, 4, 6, 8, 10], forte: '7-34', name: 'melodic minor' },
  { prime: [0, 1, 3, 5, 6, 8, 10], forte: '7-35', name: 'diatonic (major)' },
  { prime: [0, 1, 2, 3, 5, 6, 8], forte: '7-Z36', name: null },
  { prime: [0, 1, 3, 4, 5, 7, 8], forte: '7-Z37', name: null },
  { prime: [0, 1, 2, 4, 5, 7, 8], forte: '7-Z38', name: null },

  // Cardinality 8 (complementos de 4)
  { prime: [0, 1, 2, 3, 4, 5, 6, 7], forte: '8-1', name: 'chromatic octachord' },
  { prime: [0, 1, 2, 3, 4, 5, 6, 8], forte: '8-2', name: null },
  { prime: [0, 1, 2, 3, 4, 5, 6, 9], forte: '8-3', name: null },
  { prime: [0, 1, 2, 3, 4, 5, 7, 8], forte: '8-4', name: null },
  { prime: [0, 1, 2, 3, 4, 6, 7, 8], forte: '8-5', name: null },
  { prime: [0, 1, 2, 3, 5, 6, 7, 8], forte: '8-6', name: null },
  { prime: [0, 1, 2, 3, 4, 5, 8, 9], forte: '8-7', name: null },
  { prime: [0, 1, 2, 3, 4, 7, 8, 9], forte: '8-8', name: null },
  { prime: [0, 1, 2, 3, 6, 7, 8, 9], forte: '8-9', name: null },
  { prime: [0, 2, 3, 4, 5, 6, 7, 9], forte: '8-10', name: null },
  { prime: [0, 1, 2, 3, 4, 5, 7, 9], forte: '8-11', name: null },
  { prime: [0, 1, 3, 4, 5, 6, 7, 9], forte: '8-12', name: null },
  { prime: [0, 1, 2, 3, 4, 6, 7, 9], forte: '8-13', name: null },
  { prime: [0, 1, 2, 4, 5, 6, 7, 9], forte: '8-14', name: null },
  { prime: [0, 1, 2, 3, 4, 6, 8, 9], forte: '8-Z15', name: null },
  { prime: [0, 1, 2, 3, 5, 7, 8, 9], forte: '8-16', name: null },
  { prime: [0, 1, 3, 4, 5, 6, 8, 9], forte: '8-17', name: null },
  { prime: [0, 1, 2, 3, 5, 6, 8, 9], forte: '8-18', name: null },
  { prime: [0, 1, 2, 4, 5, 6, 8, 9], forte: '8-19', name: null },
  { prime: [0, 1, 2, 4, 5, 7, 8, 9], forte: '8-20', name: null },
  { prime: [0, 1, 2, 3, 4, 6, 8, 10], forte: '8-21', name: null },
  { prime: [0, 1, 2, 3, 5, 6, 8, 10], forte: '8-22', name: null },
  { prime: [0, 1, 2, 3, 5, 7, 8, 10], forte: '8-23', name: null },
  { prime: [0, 1, 2, 4, 5, 6, 8, 10], forte: '8-24', name: null },
  { prime: [0, 1, 2, 4, 6, 7, 8, 10], forte: '8-25', name: null },
  { prime: [0, 1, 3, 4, 5, 7, 8, 10], forte: '8-26', name: null },
  { prime: [0, 1, 2, 4, 5, 7, 8, 10], forte: '8-27', name: null },
  { prime: [0, 1, 3, 4, 6, 7, 9, 10], forte: '8-28', name: 'octatonic' },
  { prime: [0, 1, 2, 3, 5, 6, 7, 9], forte: '8-Z29', name: null },

  // Cardinality 9 (complementos de 3)
  { prime: [0, 1, 2, 3, 4, 5, 6, 7, 8], forte: '9-1', name: 'chromatic nonachord' },
  { prime: [0, 1, 2, 3, 4, 5, 6, 7, 9], forte: '9-2', name: null },
  { prime: [0, 1, 2, 3, 4, 5, 6, 8, 9], forte: '9-3', name: null },
  { prime: [0, 1, 2, 3, 4, 5, 7, 8, 9], forte: '9-4', name: null },
  { prime: [0, 1, 2, 3, 4, 6, 7, 8, 9], forte: '9-5', name: null },
  { prime: [0, 1, 2, 3, 4, 5, 6, 8, 10], forte: '9-6', name: null },
  { prime: [0, 1, 2, 3, 4, 5, 7, 8, 10], forte: '9-7', name: null },
  { prime: [0, 1, 2, 3, 4, 6, 7, 8, 10], forte: '9-8', name: null },
  { prime: [0, 1, 2, 3, 5, 6, 7, 8, 10], forte: '9-9', name: null },
  { prime: [0, 1, 2, 3, 4, 6, 7, 9, 10], forte: '9-10', name: null },
  { prime: [0, 1, 2, 3, 5, 6, 7, 9, 10], forte: '9-11', name: null },
  { prime: [0, 1, 2, 4, 5, 6, 8, 9, 10], forte: '9-12', name: 'nonatonic' },

  // Cardinality 10 (complementos de 2)
  { prime: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9], forte: '10-1', name: null },
  { prime: [0, 1, 2, 3, 4, 5, 6, 7, 8, 10], forte: '10-2', name: null },
  { prime: [0, 1, 2, 3, 4, 5, 6, 7, 9, 10], forte: '10-3', name: null },
  { prime: [0, 1, 2, 3, 4, 5, 6, 8, 9, 10], forte: '10-4', name: null },
  { prime: [0, 1, 2, 3, 4, 5, 7, 8, 9, 10], forte: '10-5', name: null },
  { prime: [0, 1, 2, 3, 4, 6, 7, 8, 9, 10], forte: '10-6', name: null },

  // Cardinality 11
  { prime: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10], forte: '11-1', name: null },

  // Cardinality 12
  { prime: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], forte: '12-1', name: 'chromatic aggregate' }
];

// Mapa de Z-Relations (sets con mismo Interval Vector pero diferente Prime Form)
const Z_PAIRS = {
  '4-Z15': '4-Z29',
  '4-Z29': '4-Z15',
  '5-Z12': '5-Z36',
  '5-Z36': '5-Z12',
  '5-Z17': '5-Z37',
  '5-Z37': '5-Z17',
  '5-Z18': '5-Z38',
  '5-Z38': '5-Z18',
  '6-Z3':  '6-Z36',
  '6-Z36': '6-Z3',
  '6-Z4':  '6-Z37',
  '6-Z37': '6-Z4',
  '6-Z6':  '6-Z38',
  '6-Z38': '6-Z6',
  '6-Z10': '6-Z39',
  '6-Z39': '6-Z10',
  '6-Z11': '6-Z40',
  '6-Z40': '6-Z11',
  '6-Z12': '6-Z41',
  '6-Z41': '6-Z12',
  '6-Z13': '6-Z42',
  '6-Z42': '6-Z13',
  '6-Z17': '6-Z43',
  '6-Z43': '6-Z17',
  '6-Z19': '6-Z44',
  '6-Z44': '6-Z19',
  '6-Z23': '6-Z45',
  '6-Z45': '6-Z23',
  '6-Z24': '6-Z46',
  '6-Z46': '6-Z24',
  '6-Z25': '6-Z47',
  '6-Z47': '6-Z25',
  '6-Z26': '6-Z48',
  '6-Z48': '6-Z26',
  '6-Z28': '6-Z49',
  '6-Z49': '6-Z28',
  '6-Z29': '6-Z50',
  '6-Z50': '6-Z29',
  '7-Z12': '7-Z36',
  '7-Z36': '7-Z12',
  '7-Z17': '7-Z37',
  '7-Z37': '7-Z17',
  '7-Z18': '7-Z38',
  '7-Z38': '7-Z18',
  '8-Z15': '8-Z29',
  '8-Z29': '8-Z15'
};

// Construir objetos SetClass
const SET_CLASSES = FORTE_TABLE.map(entry => {
  const sc = new SetClass(entry.prime, entry.forte, entry.name);
  sc.zMate = Z_PAIRS[entry.forte] || null;
  return sc;
});

// Indices por cardinalidad para acceso rapido
const SET_BY_CARDINALITY = {};
SET_CLASSES.forEach(sc => {
  if (!SET_BY_CARDINALITY[sc.cardinality]) {
    SET_BY_CARDINALITY[sc.cardinality] = [];
  }
  SET_BY_CARDINALITY[sc.cardinality].push(sc);
});

// Indice por Forte number
const SET_BY_FORTE = {};
SET_CLASSES.forEach(sc => {
  SET_BY_FORTE[sc.forte] = sc;
});

// Encontrar los N sets mas similares a uno dado
function findSimilarSets(setClass, n = 5, sameCardinality = true) {
  let candidates = sameCardinality
    ? SET_BY_CARDINALITY[setClass.cardinality]
    : SET_CLASSES;

  return candidates
    .filter(sc => sc.forte !== setClass.forte)
    .map(sc => ({ set: sc, distance: SetClass.distance(setClass, sc) }))
    .sort((a, b) => a.distance - b.distance)
    .slice(0, n);
}

// Encontrar subsets de un set class
function findSubsets(setClass) {
  const card = setClass.cardinality;
  if (card <= 1) return [];

  const subsets = [];
  const primes = setClass.primeForm;

  // Generar todos los subsets de cardinality-1
  for (let i = 0; i < primes.length; i++) {
    const subset = [...primes.slice(0, i), ...primes.slice(i + 1)];
    const pf = primeForm(subset);
    const pfKey = pf.join(',');

    // Buscar en la tabla
    const match = SET_BY_CARDINALITY[card - 1]?.find(
      sc => sc.primeForm.join(',') === pfKey
    );

    if (match && !subsets.find(s => s.forte === match.forte)) {
      subsets.push(match);
    }
  }

  return subsets;
}

// Encontrar supersets de un set class
function findSupersets(setClass) {
  const card = setClass.cardinality;
  if (card >= 12) return [];

  const supersets = [];

  SET_BY_CARDINALITY[card + 1]?.forEach(candidate => {
    // Verificar si el setClass es subset del candidato
    const candidateSubsets = findSubsets(candidate);
    if (candidateSubsets.find(s => s.forte === setClass.forte)) {
      supersets.push(candidate);
    }
  });

  return supersets;
}

// Exportar todo
window.SetTheory = {
  SetClass,
  SET_CLASSES,
  SET_BY_CARDINALITY,
  SET_BY_FORTE,
  Z_PAIRS,
  computeIntervalVector,
  transpose,
  invert,
  normalForm,
  primeForm,
  findSimilarSets,
  findSubsets,
  findSupersets
};
