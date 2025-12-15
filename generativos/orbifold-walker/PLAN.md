# Orbifold Walker - Plan de Implementación

## Concepto

**Problema a resolver:** Pasar de triadas ideales (Tonnetz) a voicings reales y textura.

**Solución:** Un sistema dinámico se mueve en el espacio de orbifolds de Tymoczko, donde la posición define voicings concretos (no solo clases de acordes).

---

## Fundamento Teórico (Tymoczko)

### El Espacio de Acordes
- Un acorde de N notas es un punto en el orbifold T^N/S_N (N-torus módulo grupo simétrico)
- **2 notas:** Möbius strip (banda de Möbius)
- **3 notas:** Prisma 3D con caras identificadas y twist
- **4 notas:** Estructura 4D (proyectamos a 3D)

### Voice Leading como Distancia
- Movimiento suave = distancia corta en el orbifold
- Acordes que dividen la octava uniformemente están en el **centro** del espacio
- Hacia los bordes: clusters, unísono, acordes extremos

### Coordenadas
Para tríadas (3 voces), usamos coordenadas en el espacio de intervalos:
- x = (p1 + p2 + p3) / 3 mod 12 → transposición (centro tonal)
- y = p2 - p1 → intervalo inferior
- z = p3 - p2 → intervalo superior

---

## Decisiones de Diseño

- **Sonido:** Ambos modos (drone continuo + trigger) con toggle
- **Visualización:** Directo a 3D con Three.js (prisma de tríadas)

---

## Geometría 3D: Prisma de Tríadas

```
        Aumentados (C-E-G#, equidistantes)
              ▲
             /│\
            / │ \        Eje Z: intervalo superior
           /  │  \       (de la nota media a la alta)
          /   │   \
         /    │    \
        ──────●──────  ← Centro: acordes simétricos
       /      │      \
      /       │       \     Eje Y: intervalo inferior
     /        │        \    (de la nota baja a la media)
    ▼─────────┼─────────▼
  Mayores   Menores   Disminuidos

        Eje X: transposición (rotación del prisma)
```

**Regiones del espacio:**
- **Centro geométrico:** Acorde aumentado (4+4 semitonos) - máxima simetría
- **Vértice superior:** Clusters (0+0) - tres notas iguales
- **Aristas:** Acordes mayores (4+3), menores (3+4), disminuidos (3+3)
- **Caras:** Transiciones suaves entre tipos de acorde

**Topología:**
- El prisma tiene **caras identificadas con twist** (como un Möbius 3D)
- Cuando el walker sale por una cara, reentra por la opuesta transpuesto

---

## Implementación Técnica

### 1. Sistema de Coordenadas (Tríadas en 3D)

```javascript
// Tríada (3 voces) → punto en orbifold 3D
// El espacio es T³/S₃ (3-torus módulo permutaciones)
function triadToOrbifold(p1, p2, p3) {
    // Ordenar para eliminar permutaciones (p1 ≤ p2 ≤ p3)
    const sorted = [p1, p2, p3].sort((a, b) => a - b);

    // Coordenadas en el prisma fundamental
    const x = (sorted[0] + sorted[1] + sorted[2]) / 3;  // centro tonal (0-12)
    const y = sorted[1] - sorted[0];                     // intervalo inferior (0-4)
    const z = sorted[2] - sorted[1];                     // intervalo superior (0-4)

    return { x: x * SCALE, y: y * SCALE, z: z * SCALE };
}

// Punto en orbifold → tríada (voicing real)
function orbifoldToTriad(ox, oy, oz) {
    const center = ox / SCALE;
    const int1 = oy / SCALE;
    const int2 = oz / SCALE;

    const p1 = (center - (int1 + int2) / 3 + 12) % 12;
    const p2 = p1 + int1;
    const p3 = p2 + int2;

    return [p1 % 12, p2 % 12, p3 % 12];
}
```

### 2. Sistema Físico (RK4 en 3D)

```javascript
// Attractores en acordes consonantes
const ATTRACTORS = [
    { x: 0, y: 4, z: 3, name: 'Major', color: 0x22c55e },
    { x: 0, y: 3, z: 4, name: 'Minor', color: 0x3b82f6 },
    { x: 0, y: 3, z: 3, name: 'Dim', color: 0xef4444 },
    { x: 0, y: 4, z: 4, name: 'Aug', color: 0xf59e0b }
];

// Walker con estado completo
const walker = {
    x: 0, y: 4, z: 3,      // posición en orbifold
    vx: 0, vy: 0, vz: 0,   // velocidad
    trail: []               // historial para visualización
};

// RK4 adaptado a 3D
function rk4Step(p, dt) {
    const a1 = computeAcceleration(p.x, p.y, p.z, p.vx, p.vy, p.vz);
    // ... (mismo patrón que Cadencia Orbital pero con z)
}
```

### 3. Topología del Orbifold

```javascript
// Manejo de bordes con identificación twisted
function wrapOrbifold(x, y, z) {
    // X es periódico (transposición)
    x = ((x % 12) + 12) % 12;

    // Y y Z tienen límites con reflexión
    // Cuando y < 0 o z < 0, reflejamos y transponemos
    if (y < 0) {
        y = -y;
        x = (x + 6) % 12;  // twist: transponer tritono
    }
    if (z < 0) {
        z = -z;
        x = (x + 6) % 12;
    }

    // Límite superior: cuando y + z > 12 (fuera del espacio válido)
    if (y + z > 12) {
        const excess = y + z - 12;
        y -= excess / 2;
        z -= excess / 2;
    }

    return { x, y, z };
}
```

---

## Características vs Tonnetz

| Aspecto | Tonnetz | Orbifold Walker |
|---------|---------|-----------------|
| Espacio | Discreto (triángulos) | Continuo (volumen 3D) |
| Acordes | Clases (C, Am, etc.) | Voicings específicos |
| Movimiento | Saltos entre triángulos | Glissando continuo |
| Topología | Plano hexagonal | Prisma twisted |
| Sonido | Acordes arpegiados | Drones que mutan |
| Dimensiones | 2D | 3D interactivo |

---

## Visualización 3D (Three.js)

### Estructura de la Escena

```javascript
// Setup Three.js
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(60, W/H, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });

// Prisma semi-transparente (el espacio de acordes)
const prismGeometry = createOrbifoldPrism();
const prismMaterial = new THREE.MeshBasicMaterial({
    color: 0x3b82f6,
    transparent: true,
    opacity: 0.1,
    wireframe: true
});

// Walker (esfera brillante)
const walkerGeometry = new THREE.SphereGeometry(0.3, 32, 32);
const walkerMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });

// Trail (línea que sigue al walker)
const trailGeometry = new THREE.BufferGeometry();
const trailMaterial = new THREE.LineBasicMaterial({
    color: 0x60a5fa,
    transparent: true,
    opacity: 0.6
});
```

### Elementos Visuales
1. **Prisma wireframe:** Muestra los límites del espacio de acordes
2. **Walker esférico:** Partícula luminosa que se mueve en 3D
3. **Trail 3D:** Línea que muestra el recorrido reciente
4. **Attractores:** Esferas en acordes consonantes (mayor, menor, dim, aug)
5. **Regiones coloreadas:** Zonas del prisma tintadas según tipo de acorde
6. **Ejes con etiquetas:** Mostrar qué significa cada dimensión
7. **OrbitControls:** Usuario puede rotar la vista con mouse/touch

---

## Controles de Usuario

### Panel Física
- **Friction:** Amortiguamiento del walker (0-0.05)
- **Force:** Intensidad de attractores (0.1-3)
- **Speed:** Velocidad inicial al lanzar (2-15)

### Panel Sonido
- **Mode:** Toggle Drone / Trigger
- **Crossfade:** Tiempo de transición entre voicings (50-500ms)
- **Waveform:** Sine, Triangle, Saw, Square
- **Octave:** Registro base (2-6)
- **Spread:** Voicing cerrado ↔ abierto

### Panel Visual
- **Show Prism:** Mostrar/ocultar wireframe del orbifold
- **Show Trail:** Mostrar estela del walker
- **Camera:** Reset / Auto-rotate

---

## Archivos

```
orbifold-walker/
├── index.html    # Aplicación principal (Three.js + Web Audio)
├── PLAN.md       # Este documento
└── README.md     # Documentación para usuarios
```

**Dependencias (CDN):**
- Three.js (r160+)
- OrbitControls
- Tailwind CSS

---

## Pasos de Implementación

### Paso 1: Estructura Base (~200 líneas)
- [ ] HTML con estructura: header, canvas 3D, panel de controles
- [ ] Importar Three.js y OrbitControls desde CDN
- [ ] CSS inline (patrón Physics Sound Lab)

### Paso 2: Escena Three.js (~150 líneas)
- [ ] Crear scene, camera, renderer
- [ ] Construir geometría del prisma (espacio fundamental del orbifold)
- [ ] Añadir iluminación ambiental
- [ ] Configurar OrbitControls para rotación con mouse

### Paso 3: Matemáticas del Orbifold (~100 líneas)
- [ ] `triadToOrbifold(p1, p2, p3)` → coordenadas 3D
- [ ] `orbifoldToTriad(x, y, z)` → pitch classes
- [ ] `wrapOrbifold(x, y, z)` → manejo de bordes con twist
- [ ] Posicionar attractores en acordes consonantes

### Paso 4: Sistema Físico RK4 (~120 líneas)
- [ ] Adaptar `computeAcceleration()` a 3D
- [ ] Adaptar `rk4Step()` para 3 dimensiones (x, y, z, vx, vy, vz)
- [ ] Integrar `wrapOrbifold()` después de cada step
- [ ] Collision con attractores para trigger mode

### Paso 5: Visualización Dinámica (~100 líneas)
- [ ] Actualizar posición del walker mesh
- [ ] Trail como BufferGeometry actualizada cada frame
- [ ] Glow en attractores cuando el walker se acerca
- [ ] Labels flotantes con nombre del acorde actual

### Paso 6: Audio - Modo Drone (~150 líneas)
- [ ] 3 osciladores persistentes (uno por voz de la tríada)
- [ ] Crossfade suave al cambiar voicing (`linearRampToValueAtTime`)
- [ ] Filter lowpass controlable
- [ ] Master gain + delay effect

### Paso 7: Audio - Modo Trigger (~80 líneas)
- [ ] Detectar entrada en región de attractor
- [ ] Disparar tríada con ADSR envelope
- [ ] Cooldown para evitar re-triggers rápidos
- [ ] Arpegio opcional (up/down/random)

### Paso 8: Controles UI (~100 líneas)
- [ ] Sliders para física (friction, force, speed)
- [ ] Toggle drone/trigger
- [ ] Selector de waveform
- [ ] Botones: Start/Stop, Reset, Record

### Paso 9: Grabación Audio (~50 líneas)
- [ ] MediaStreamDestination conectado al master
- [ ] MediaRecorder con detección de formato
- [ ] Export con timestamp en filename

### Paso 10: Pulido Final
- [ ] README.md con explicación del concepto
- [ ] Actualizar hub de generativos (`/generativos/index.html`)
- [ ] Añadir preview animado al hub

---

## Extensiones Futuras

1. **Orbifold 4D (Séptimas):** Proyección a 3D, jazz voicings
2. **Constrained Spaces:** Limitar a escalas específicas
3. **Multi-walker:** Contrapunto en el espacio de orbifolds
4. **MIDI Export:** Grabar la secuencia de voicings

---

## Referencias

- [Tymoczko - A Geometry of Music](https://dmitri.mycpanel.princeton.edu/geometry-of-music.html)
- [The Geometry of Musical Chords (Science)](https://dmitri.mycpanel.princeton.edu/files/publications/science.pdf)
- [ChordGeometries Software](https://dmitri.mycpanel.princeton.edu/software.html)
- [Harmonious App - Orbifold](https://harmoniousapp.net/p/78/Orbifold-Voice-Leading)
