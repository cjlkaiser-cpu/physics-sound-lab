# Set-Class Attractor - Plan de Desarrollo

## Concepto Central

Aplicar el paradigma "física → música emergente" a la **teoría de conjuntos de clases de alturas** (Pitch-Class Set Theory), el marco analítico dominante para música atonal y post-tonal del siglo XX.

```
TONAL (Rameau, Neo-Riemann)     →     ATONAL (Forte, Straus)
         │                                    │
    Funciones T-S-D                    Set-classes
    Triadas/7as                        Cualquier cardinalidad
    Resolución → Tónica               Sin centro gravitacional
         │                                    │
         ▼                                    ▼
   Rameau Machine                    Set-Class Attractor
   Tonnetz Atractor                  (este proyecto)
```

---

## Fundamento Teórico

### Pitch-Class Set Theory (Allen Forte, 1973)

1. **Pitch Class (PC)**: Las 12 notas cromáticas como números 0-11 (C=0, C#=1, ... B=11)

2. **PC Set**: Cualquier colección de pitch classes, ej: {0, 1, 4} = Do, Do#, Mi

3. **Set Class**: Clase de equivalencia bajo transposición (Tn) e inversión (TnI)
   - {0, 1, 4} ≡ {2, 3, 6} ≡ {0, 3, 4} (misma "forma")
   - Se identifica por su **Prime Form** y **Forte Number**

4. **Forte Number**: Nomenclatura estándar, ej:
   - 3-1: {0, 1, 2} - cluster cromático
   - 3-11: {0, 3, 7} - triada mayor/menor
   - 3-12: {0, 4, 8} - triada aumentada
   - 6-1: {0, 1, 2, 3, 4, 5} - hexacordo cromático
   - 6-Z44: {0, 1, 2, 5, 6, 9} - "all-interval tetrachord"

5. **Cardinalidad**: Número de elementos (3 = tricordio, 4 = tetracordio, etc.)

### Cantidad de Set Classes por Cardinalidad

| Card. | Set Classes | Ejemplos |
|-------|-------------|----------|
| 1 | 1 | nota única |
| 2 | 6 | intervalos |
| 3 | 12 | tricordios |
| 4 | 29 | tetracordios |
| 5 | 38 | pentacordios |
| 6 | 50 | hexacordios |
| 7 | 38 | (complementos de 5) |
| 8 | 29 | (complementos de 4) |
| 9 | 12 | (complementos de 3) |
| 10 | 6 | (complementos de 2) |
| 11 | 1 | (complemento de 1) |
| 12 | 1 | agregado cromático |
| **Total** | **223** | |

---

## Relaciones entre Set Classes

### Similaridad Interválica

1. **Interval Vector (IV)**: Cuenta de cada intervalo en el set
   - Formato: [ic1, ic2, ic3, ic4, ic5, ic6]
   - Ej: Triada mayor 3-11 = [0, 0, 1, 1, 1, 0]
   - Ej: Triada aumentada 3-12 = [0, 0, 0, 3, 0, 0]

2. **Similitud por IV**: Sets con vectores parecidos suenan parecidos
   - Distancia euclidiana entre vectores
   - Sets con mismo IV pero diferente prime form = **Z-relation**

### Relaciones de Inclusión

```
        6-Z44 (hexacordo)
       /    |    \
    4-Z15  4-18  4-Z29  (subsets)
     |      |      |
   3-5    3-3    3-11   (subsets de subsets)
```

### Complemento

- Complemento de un set = las notas que NO están
- Set de cardinalidad n tiene complemento de cardinalidad 12-n
- Relación simétrica importante en música serial

---

## Diseño del Sistema

### Espacio de Navegación

**Opción A: Grafo de Similaridad**
```
Nodos: 223 set classes
Aristas: Conexiones por similitud (IV distance < threshold)
Física: Partícula atraída por sets similares al actual
```

**Opción B: Espacio Continuo 6D**
```
Coordenadas: Los 6 componentes del Interval Vector
Posición: Punto en R^6
Atractores: Set classes como puntos fijos
Física: Gradiente hacia sets cercanos
```

**Opción C: Espacio por Cardinalidad (Recomendado para v1)**
```
Capas: Una "órbita" por cardinalidad (3, 4, 5, 6)
Dentro de cada capa: Distribución angular por similitud
Movimiento vertical: Cambio de cardinalidad (subset/superset)
Movimiento horizontal: Navegación por similitud
```

### Visualización Propuesta

```
                    Card. 6 (hexacordios)
                   ╱  ·  ·  ·  ·  ·  ╲
                  ╱    ·  ·  ·  ·     ╲
    Card. 5     ·  ·  ·  ·  ·  ·  ·  ·  ·     Card. 5
                  ╲    ·  ·  ·  ·     ╱
                   ╲  ·  ·  ·  ·  ·  ╱
                    Card. 4 (tetracordios)
                         ·  ·  ·
                    Card. 3 (tricordios)
                           ●  ← partícula
```

### Sistema Dinámico

```javascript
// Fuerzas sobre la partícula
F_total = F_similarity + F_inclusion + F_contrast + F_zPortal

// Atracción por similitud interválica
F_similarity = Σ (1/d²) * direction_to_similar_set

// Atracción por relación de inclusión (subset/superset)
F_inclusion = k * direction_to_related_set

// Repulsión de sets muy diferentes (contraste)
F_contrast = -c * direction_to_dissimilar_set

// Atracción especial hacia Z-mates (ver Z-Portals abajo)
F_zPortal = z * direction_to_z_related_set
```

---

## Features Distintivas (v2)

### Feature 1: Parsimonious Voice Leading (Conducción Parsimoniosa)

**Problema:** Saltar de un set [0,1,4] a [0,2,7] al azar suena desconectado.

**Solución:** Implementar conducción de voces con movimiento mínimo como **parámetro ajustable**.

```javascript
// Slider: "Voice Leading Smoothness" (0.0 - 1.0)
// 0.0 = Webern-style (saltos libres, Klangfarbenmelodie)
// 0.5 = Mixto
// 1.0 = Máxima parsimonia (estilo Neo-Riemannian)

class ParsimoniousVoiceLeader {
  constructor() {
    this.smoothness = 0.5; // parámetro
    this.currentVoices = []; // notas MIDI actuales
  }

  transition(fromSet, toSet, transposition) {
    if (this.smoothness < 0.3) {
      // Distribución libre en registros (atonal puro)
      return this.randomOctavePlacement(toSet, transposition);
    }

    // Conducción parsimoniosa
    const targetPCs = toSet.map(pc => (pc + transposition) % 12);
    const newVoices = [];

    // 1. Mantener notas comunes
    const commonTones = this.currentVoices.filter(v =>
      targetPCs.includes(v % 12)
    );
    newVoices.push(...commonTones);

    // 2. Mover otras voces por distancia mínima
    const remainingPCs = targetPCs.filter(pc =>
      !commonTones.some(v => v % 12 === pc)
    );
    const unusedVoices = this.currentVoices.filter(v =>
      !commonTones.includes(v)
    );

    for (const pc of remainingPCs) {
      if (unusedVoices.length > 0) {
        // Encontrar la voz más cercana
        const closest = this.findClosestVoice(unusedVoices, pc);
        const newNote = this.moveByMinimalDistance(closest, pc);
        newVoices.push(newNote);
        unusedVoices.splice(unusedVoices.indexOf(closest), 1);
      } else {
        // Añadir nueva voz en registro medio
        newVoices.push(pc + 60);
      }
    }

    this.currentVoices = newVoices.sort((a, b) => a - b);
    return this.currentVoices;
  }

  moveByMinimalDistance(fromNote, toPitchClass) {
    const fromPC = fromNote % 12;
    const diff = toPitchClass - fromPC;

    // Elegir dirección más corta
    if (Math.abs(diff) <= 6) {
      return fromNote + diff;
    } else {
      return fromNote + (diff > 0 ? diff - 12 : diff + 12);
    }
  }
}
```

**Justificación teórica:** La teoría de Forte es sobre *clases* de equivalencia; la *realización* sonora es otro nivel. Incluso Schoenberg escribió sobre Klangfarbenmelodie. El parámetro permite explorar ambos extremos.

---

### Feature 2: Z-Portals (Agujeros de Gusano)

**Concepto:** Los sets con **Z-relation** (mismo Interval Vector, diferente Prime Form) actúan como portales de teletransportación.

```
6-Z44 [0,1,2,5,6,9]  ←══════ Z-PORTAL ══════→  6-Z19 [0,1,3,4,7,8]
      │                                              │
    IV: [3,3,3,3,3,3]    =    IV: [3,3,3,3,3,3]
      │                                              │
      └────────── MISMO COLOR SONORO ───────────────┘
                 DIFERENTE ESTRUCTURA
```

**Implementación física:**

```javascript
class ZPortalSystem {
  constructor() {
    this.zPairs = this.buildZRelationMap();
    this.tunnelProbability = 0.3; // 30% chance al caer en pozo Z
    this.portalCooldown = 2000; // ms entre túneles
    this.lastTunnel = 0;
  }

  buildZRelationMap() {
    // Pares Z conocidos (hay ~20 pares en cardinalidades 4-6)
    return {
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
      '6-Z50': '6-Z29'
    };
  }

  checkTunnel(currentSet, potentialDepth) {
    const now = Date.now();
    if (now - this.lastTunnel < this.portalCooldown) return null;

    const zMate = this.zPairs[currentSet.forte];
    if (!zMate) return null;

    // Probabilidad aumenta con la profundidad del pozo
    const adjustedProb = this.tunnelProbability * potentialDepth;

    if (Math.random() < adjustedProb) {
      this.lastTunnel = now;
      return {
        from: currentSet.forte,
        to: zMate,
        type: 'Z-TUNNEL'
      };
    }
    return null;
  }
}

// En el loop principal:
const tunnelEvent = zPortalSystem.checkTunnel(currentSet, gravitationalDepth);
if (tunnelEvent) {
  // ¡Teletransportación!
  particle.teleportTo(getSetPosition(tunnelEvent.to));
  playWhooshSound();
  visualizeTunnelEffect(tunnelEvent.from, tunnelEvent.to);
}
```

**Valor pedagógico:** El usuario SIENTE que algo extraño pasó - "sonaba igual pero ahora estoy en otro lugar del espacio". Enseña Z-relations de forma visceral.

---

### Feature 3: Heat Map Emocional (Mapa de Temperatura)

**Concepto:** Colorear cada set según su "temperatura emocional" basada en el Interval Vector.

```
         FRÍO (azul)                    CALIENTE (rojo)
              │                              │
    Pentatónicas ←────────────────────→ Clusters cromáticos
    Triadas                             All-interval sets
    5-35 [0,2,4,7,9]                   3-1 [0,1,2]
    IV: [0,3,2,1,4,0]                  IV: [2,1,0,0,0,0]
```

**Implementación:**

```javascript
class TensionHeatMap {
  // Pesos basados en teoría de disonancia (Helmholtz, Plomp-Levelt)
  static WEIGHTS = {
    ic1: 1.0,   // m2: máxima disonancia (clusters)
    ic2: 0.5,   // M2: disonancia media
    ic3: -0.3,  // m3: consonancia
    ic4: -0.3,  // M3: consonancia
    ic5: -0.5,  // P5: máxima consonancia
    ic6: 0.8    // tritono: alta tensión
  };

  static calculateTension(intervalVector) {
    const [ic1, ic2, ic3, ic4, ic5, ic6] = intervalVector;

    const rawTension =
      ic1 * this.WEIGHTS.ic1 +
      ic2 * this.WEIGHTS.ic2 +
      ic3 * this.WEIGHTS.ic3 +
      ic4 * this.WEIGHTS.ic4 +
      ic5 * this.WEIGHTS.ic5 +
      ic6 * this.WEIGHTS.ic6;

    // Normalizar a 0-1
    // Rango teórico aproximado: -3 a +6
    return Math.max(0, Math.min(1, (rawTension + 3) / 9));
  }

  static tensionToColor(tension) {
    // HSL: Azul frío (240°) → Rojo caliente (0°)
    const hue = (1 - tension) * 240;
    const saturation = 70 + tension * 20; // más saturado = más tenso
    const lightness = 50;

    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  }

  static getSetColor(setClass) {
    const tension = this.calculateTension(setClass.intervalVector);
    return this.tensionToColor(tension);
  }
}

// Ejemplos de colores resultantes:
// 3-12 [0,4,8] (aumentado)  → IV: [0,0,0,3,0,0] → Azul (consonante)
// 3-11 [0,3,7] (triada)     → IV: [0,0,1,1,1,0] → Azul-verde
// 3-3  [0,1,4] (Vienés)     → IV: [1,0,1,1,0,0] → Amarillo
// 3-1  [0,1,2] (cluster)    → IV: [2,1,0,0,0,0] → Rojo (disonante)
```

**Visualización resultante:** El usuario ve "zonas calientes" (rojas, clusters, atonalidad dura) y "zonas frías" (azules, pentatónicas, triadas). Navegar se convierte en moverse entre temperaturas emocionales.

---

### Feature 4: Ghost Traces (Fantasmas de Memoria)

**Concepto:** La música atonal depende de la memoria a corto plazo. Visualizar "dónde has estado" ayuda a la coherencia perceptiva.

```javascript
class GhostTraceSystem {
  constructor() {
    this.ghosts = []; // {setClass, position, opacity, timestamp}
    this.fadeRate = 0.2; // opacity por segundo
    this.maxGhosts = 20;
    this.returnThreshold = 30; // distancia en pixels
    this.returnReverbGain = 0.3; // reverb añadido al volver
  }

  addGhost(setClass, position) {
    this.ghosts.push({
      setClass: setClass,
      position: { x: position.x, y: position.y },
      opacity: 1.0,
      timestamp: Date.now()
    });

    // Limitar cantidad
    if (this.ghosts.length > this.maxGhosts) {
      this.ghosts.shift();
    }
  }

  update(deltaTime) {
    // Fade out gradual
    this.ghosts.forEach(ghost => {
      ghost.opacity -= this.fadeRate * deltaTime;
    });

    // Remover fantasmas desvanecidos
    this.ghosts = this.ghosts.filter(g => g.opacity > 0);
  }

  checkReturn(currentPosition, synth) {
    const nearbyGhosts = this.ghosts.filter(ghost => {
      const dx = ghost.position.x - currentPosition.x;
      const dy = ghost.position.y - currentPosition.y;
      return Math.sqrt(dx*dx + dy*dy) < this.returnThreshold;
    });

    if (nearbyGhosts.length > 0) {
      // ¡Retorno a territorio familiar!
      const intensity = Math.min(1, nearbyGhosts.length * 0.3);

      // Efecto auditivo: añadir reverb/resonancia
      synth.setReverbWet(this.returnReverbGain * intensity);

      // Efecto visual: hacer brillar los fantasmas cercanos
      nearbyGhosts.forEach(g => {
        g.brightness = 1.5; // temporal glow
      });

      return {
        isReturn: true,
        intensity: intensity,
        familiarSets: nearbyGhosts.map(g => g.setClass)
      };
    }

    // Territorio nuevo: reverb normal
    synth.setReverbWet(0.1);
    return { isReturn: false };
  }

  draw(ctx) {
    this.ghosts.forEach(ghost => {
      const alpha = ghost.opacity * 0.6;
      const brightness = ghost.brightness || 1.0;
      ghost.brightness = Math.max(1.0, (ghost.brightness || 1) - 0.1);

      ctx.beginPath();
      ctx.arc(ghost.position.x, ghost.position.y, 8, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${alpha * brightness})`;
      ctx.fill();

      // Halo
      ctx.beginPath();
      ctx.arc(ghost.position.x, ghost.position.y, 15, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(200, 200, 255, ${alpha * 0.3})`;
      ctx.lineWidth = 2;
      ctx.stroke();
    });
  }
}
```

**Efecto perceptivo:**
- Sin ghosts: cada set suena aislado, difícil de seguir
- Con ghosts: el usuario "recuerda" dónde estuvo, y al volver siente reconocimiento
- El reverb añadido simula la resonancia de un motivo recordado

---

## Sonificación

### Estrategia 1: Arpegio del Set

```javascript
// Al llegar a un set class, arpegiar sus notas
const set = getCurrentSetClass(); // ej: [0, 1, 4]
const transposition = Math.floor(Math.random() * 12);
const notes = set.map(pc => (pc + transposition) % 12);
playArpeggio(notes, register);
```

### Estrategia 2: Acordes Sostenidos

```javascript
// Drone que muta según la posición
// Interpolación entre sets cercanos
const blend = getBlendWeights(position, nearbySetClasses);
const currentPitches = weightedMerge(blend);
synth.setFrequencies(currentPitches);
```

### Estrategia 3: Timbral

```javascript
// El Interval Vector controla el timbre
const iv = getIntervalVector(currentSet);
// iv[0] = minor 2nds → disonancia alta → más armónicos
// iv[5] = tritones → tensión → filtro resonante
synth.setTimbre(mapIVtoTimbre(iv));
```

---

## Repertorio de Referencia

### Para Validación Auditiva

| Compositor | Obra | Set Classes Característicos |
|------------|------|----------------------------|
| Webern | Op. 5 | 3-3, 4-9, 6-Z44 |
| Schoenberg | Op. 11 | 3-3, 4-19, 5-Z18 |
| Berg | Wozzeck | 4-19, 4-Z29, 6-Z17 |
| Bartók | Mikrokosmos | 3-9, 4-21, 5-35 |
| Messiaen | Modes | 6-7, 8-28 |
| Ligeti | Atmosphères | Clusters, 12-1 |
| Boulez | Structures | Series, 6-1 |

### Sets Estructuralmente Importantes

- **3-3 [0,1,4]**: "Viennese trichord" - omnipresente en Segunda Escuela
- **4-Z29 [0,1,3,7]**: "All-interval tetrachord" - máxima variedad
- **6-Z44**: Hexacordo de Schoenberg
- **5-35 [0,2,4,7,9]**: Pentatónica - puente con tonalidad

---

## Fases de Implementación

### Fase 1: Motor de Set Classes (1-2 días)

```javascript
// set-theory.js
class SetClass {
  constructor(primeForm, forteNumber) {
    this.primeForm = primeForm;
    this.forte = forteNumber;
    this.intervalVector = this.computeIV();
    this.zMate = null; // se asigna después
  }

  computeIV() { /* ... */ }

  static distance(a, b) {
    // Distancia euclidiana de interval vectors
    return Math.sqrt(
      a.intervalVector.reduce((sum, v, i) =>
        sum + Math.pow(v - b.intervalVector[i], 2), 0)
    );
  }

  getSubsets() { /* ... */ }
  getSupersets() { /* ... */ }
  getComplement() { /* ... */ }
}

// Cargar los 223 set classes + Z-relations
const SET_CLASSES = loadForteTable();
const Z_PAIRS = buildZRelationMap();
```

### Fase 2: Visualización 2D + Heat Map (2-3 días)

- Canvas/SVG con distribución por cardinalidad
- Clustering por similitud dentro de cada anillo
- **Heat Map de tensión** (Feature 3): colorear por Interval Vector
- Partícula con trail
- Hover: mostrar info del set (Forte #, IV, prime form, color = tensión)
- Indicadores visuales de Z-pairs (conectores punteados)

### Fase 3: Sistema Dinámico + Z-Portals (2 días)

- Física de atractores (similar a Tonnetz)
- Parámetros ajustables: fuerza, fricción, modo de atracción
- **Z-Portals** (Feature 2): teletransportación entre Z-mates
- Triggers: sonido al acercarse a un atractor
- Efecto visual de "túnel cuántico"

### Fase 4: Síntesis + Voice Leading (2-3 días)

- Web Audio con síntesis aditiva
- **Parsimonious Voice Leading** (Feature 1): slider de suavidad
- Arpegios o acordes según el set
- Timbre controlado por interval vector
- Transposiciones automáticas para variedad

### Fase 5: Ghost Traces + Memory (1-2 días)

- **Ghost Traces** (Feature 4): visualizar memoria auditiva
- Fade-out gradual de posiciones visitadas
- Reverb aumentado al retornar a zonas familiares
- Indicador de "reconocimiento" visual

### Fase 6: UI y Polish (1-2 días)

- Controles: cardinalidad activa, velocidad, modo de sonido
- **Slider Voice Leading Smoothness** (0 = Webern, 1 = parsimonia)
- **Toggle Z-Portals** (on/off)
- **Toggle Ghost Traces** (on/off)
- Información contextual: qué compositor usó este set
- Export de secuencia
- Modos: Explorer (simple) / Analyst (con jerga teórica)

---

## Resumen de Features

| Feature | Descripción | Slider/Toggle | Fase |
|---------|-------------|---------------|------|
| Heat Map | Color por tensión (IV) | Siempre activo | 2 |
| Z-Portals | Teletransporte entre Z-mates | Toggle on/off | 3 |
| Voice Leading | Conducción parsimoniosa | Slider 0-1 | 4 |
| Ghost Traces | Memoria visual + reverb | Toggle on/off | 5 |

**Tiempo total estimado: 10-14 días**

---

## Consideraciones de Diseño

### Accesibilidad vs. Rigor

El público general NO conoce la teoría de Forte. Opciones:

1. **Modo "Explorer"**: Ocultar jerga, enfatizar el sonido
2. **Modo "Analyst"**: Mostrar Forte numbers, interval vectors
3. **Tutorial progresivo**: Introducir conceptos gradualmente

### El Problema del "Centro"

A diferencia de la tonalidad, la música atonal NO tiene centro gravitacional inherente. Soluciones:

1. **Centro artificial**: El usuario elige un "home set"
2. **Sin centro**: La partícula vaga libremente
3. **Centros múltiples**: Atractores competidores

### Cardinalidad Dinámica

¿Permitir cambio de cardinalidad durante la navegación?

- **Sí**: Más rico, pero complejo visualmente
- **No**: Más simple, una capa a la vez
- **Híbrido**: Cardinalidades adyacentes visibles en fade

---

## Valor del Proyecto

### Educativo
- Herramienta para cursos de teoría post-tonal
- Visualización de conceptos abstractos
- Ear training para música atonal

### Artístico
- Generador de material para composición
- Exploración de territorios armónicos inexplorados
- Puente entre análisis y creatividad

### Investigación
- Validación empírica de medidas de similitud
- Nuevas métricas basadas en comportamiento del sistema

---

## Referencias

1. Forte, A. (1973). *The Structure of Atonal Music*. Yale University Press.
2. Straus, J. (2016). *Introduction to Post-Tonal Theory* (4th ed.). Norton.
3. Morris, R. (1987). *Composition with Pitch-Classes*. Yale University Press.
4. Cohn, R. (1997). "Neo-Riemannian Operations, Parsimonious Trichords, and Their Tonnetz Representations". *JMT*.
5. Quinn, I. (2006). "General Equal-Tempered Harmony". *PNM*.

---

*Creado: 15/12/2024*
*Proyecto: Physics Sound Lab - Generativos*
