# Physics Sound Lab - Documentación Técnica

## Descripción

El **Physics Sound Lab** es el laboratorio de sonificación más extenso, con **19 simulaciones** organizadas en dos categorías: **Metronomos Físicos** (7) que convierten ecuaciones de movimiento en ritmos, y **Generativos Sonoros** (6+) que exploran composición emergente desde la física y teoría musical.

## Estructura Dual

```
Physics Sound Lab/
├── metronomos/         (7 simulaciones)
│   ├── pendulo/        - Péndulo simple (RK4)
│   ├── resorte/        - Oscilador armónico
│   ├── polirritmico/   - Péndulos acoplados
│   ├── lissajous/      - Figuras de Lissajous
│   ├── onda/           - Onda estacionaria (cuerda vibrante)
│   ├── rebote/         - Rebote elástico
│   └── kepler/         - Metrónomo kepleriano
├── generativos/        (6+ proyectos)
│   ├── harmonices-mundi/      - Sistema Solar sonificado (Kepler 1619)
│   ├── tonnetz-atractor/      - Neo-Riemannian + Caos
│   ├── rameau-machine/        - Teoría funcional (1722)
│   ├── orbifold-walker/       - Geometría de Tymoczko (2011)
│   ├── chromatic-emission/    - Fotón en espacio cromático
│   └── contrapunctus/         - Contrapunto de Schoenberg
└── papers/             (Artículos + papers académicos)
```

## Metronomos Físicos (7)

### 1. Péndulo Simple

**Ecuación:** `θ̈ + (g/L)sin(θ) = 0` (no lineal)

**Método numérico:** RK4
**Sonificación:** Zero-crossing de velocidad angular ω
**Parámetros:** L (0.1-2m), g (1-25 m/s²), θ₀ (5-90°)
**Fenómeno:** Período depende de amplitud (no isocronal)

### 2. Oscilador Armónico (Masa-Resorte)

**Ecuación:** `ẍ + (k/m)x = 0`

**Método numérico:** Euler
**Sonificación:** Zero-crossing de posición x
**Parámetros:** m (0.1-5 kg), k (1-50 N/m), A (0.2-2 m)
**Salidas:** ω = √(k/m), T = 2π/ω, E = ½kA²

### 3. Péndulos Acoplados (Polirritmo)

**Ecuación:** Dos péndulos independientes con L₁, L₂

**Ratio de períodos:** T₁/T₂ = √(L₁/L₂)
**Ejemplos:** L₁:L₂ = 4:9 → 2:3 poliritmia perfecta

### 4. Figuras de Lissajous

**Ecuaciones:** `x = sin(ωₓt)`, `y = sin(ωᵧt + δ)`

**Sonificación:** Frecuencias de x e y generan notas separadas
**Parámetros:** Ratios ωₓ/ωᵧ (1:1, 1:2, 2:3, 3:4), fase δ (0-π)

### 5. Onda Estacionaria (Cuerda Vibrante)

**Ecuación:** `y = A·sin(nπx/L)·cos(ωt)`

**Frecuencias armónicas:** `fₙ = n·v/(2L)` donde v = √(T/μ)
**Parámetros:** Modo n (1-6), L, tensión T, densidad μ
**Síntesis:** Tono continuo con onda triangular
**Mapeo musical:** Frecuencias → notas cromáticas + cents

### 6. Rebote Elástico

**Ecuación:** `h(t) = ½gt²`, `v' = -e·v` (coef. restitución)

**Sonificación:** Click en cada impacto
**Frecuencia de bounces:** Disminuye geométricamente
**Ritmo emergente:** Ritmos acelerados naturales (rubato automático)

### 7. Metrónomo Kepleriano

**Ecuación de Kepler:** Órbita elíptica con excentricidad e

**Método numérico:** Newton-Raphson
**Leyes de Kepler:**
- 3ª: `T² = a³/M` (periodo vs. semieje mayor)
- 2ª: "Barrido de área constante" → velocidad variable
**Sonificación:** Click al paso por perihelio

## Generativos Sonoros (6)

### 1. Harmonices Mundi ⭐

**Base:** Johannes Kepler, "Harmonices Mundi" (1619)

**Concepto:** Sistema Solar sonificado → 8 planetas como notas
**Física:** Velocidades orbitales reales → frecuencias musicales

**Features:**
- Mixer por planeta (volumen individual)
- FFT Spectrum Analyzer (análisis armónico real-time)
- Concert Hall mode (reverberación)
- 4 escalas (Mayor, Menor, Pentatónica, Cromática)

### 2. Tonnetz Atractor ⭐

**Base teórica:** Neo-Riemannian Theory (Riemann 1880s) + Caos

**Estructura harmónica:** Tonnetz hexagonal 2D (red tórica)
- Ejes: Quintas (5/4) vs. Terceras (5/3)
- Transformaciones: P (Parallel), L (Leading-tone), R (Relative)

**Física caótica:**
```
F = Σ K·(r_i - r) / |r_i - r|² - friction·v
```

**Sonificación:** Partícula entra en nodo → genera acorde (tríada)

**Variantes visuales:** Hexagonal, Grid, Chromatic, Dual

### 3. Rameau Machine

**Base:** Jean-Philippe Rameau, "Traité de l'harmonie" (1722)

**Estructura armónica:**
- T (Tónica): Centro gravitacional
- S (Subdominante): 4º grado
- D (Dominante): 5º grado

**Motor generativo:** Cadenas de Markov
- Bias = 0 → caos; Bias = 1 → T-S-D estricto

**Voice Leading SATB:** 4 voces (Soprano, Alto, Tenor, Bajo)

### 4. Orbifold Walker

**Base:** Dmitri Tymoczko, "Geometry of Music" (2011)

**Estructura geométrica:** Orbifold de tríadas (espacio 3D toroidal)
**Física:** Partícula con RK4, pozos de potencial en acordes consonantes
**Síntesis:** Waveforms múltiples (sine, triangle, sawtooth)

### 5. Chromatic Emission

**Módulos:** photon.js, physics.js, audio.js, set-theory.js
**Concepto:** Fotón que emite tonos al pasar por "átomos" cromáticos
**Modelo atómico:** Set-classes (0-2-4-7 tríada Mayor, etc.)

### 6. Contrapunctus

**Base:** Contrapunto de Schoenberg + Gramáticas generativas
**Módulos:** CantusFirmus.js, Pitch.js, Interval.js, Scale.js
**Datos:** Ejemplos de Schoenberg (CSV + XLSX)
**Complejidad:** Proyecto modular completo (>100KB)

## Web Audio API

### Lazy Initialization

```javascript
let audioCtx = null

function initAudio() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)()
    }
    if (audioCtx.state === 'suspended') {
        audioCtx.resume()
    }
}
```

### ADSR Envelopes (Metronomos)

```javascript
function playClick() {
    osc.frequency.setValueAtTime(1200, audioCtx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(600, audioCtx.currentTime + 0.015)
    
    gain.gain.setValueAtTime(0.6, audioCtx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1)
    
    osc.start(audioCtx.currentTime)
    osc.stop(audioCtx.currentTime + 0.1)
}
```

### Síntesis Aditiva (Harmonices Mundi)

```javascript
const analyser = audioCtx.createAnalyser()
analyser.fftSize = 2048
const dataArray = new Uint8Array(analyser.frequencyBinCount)

function drawSpectrum() {
    analyser.getByteFrequencyData(dataArray)
    // Renderizar 1024 bins de frecuencia
}
```

## Métodos Numéricos

### Runge-Kutta Orden 4 (RK4)

```javascript
const k1_theta = omega
const k1_omega = -(g / length) * Math.sin(theta)

const k2_theta = omega + 0.5 * dt * k1_omega
const k2_omega = -(g / length) * Math.sin(theta + 0.5 * dt * k1_theta)

// ... k3, k4 ...

theta += (dt / 6) * (k1_theta + 2*k2_theta + 2*k3_theta + k4_theta)
omega += (dt / 6) * (k1_omega + 2*k2_omega + 2*k3_omega + k4_omega)
```

### Newton-Raphson (Kepler)

```javascript
let E = M  // Estimación inicial
for (let i = 0; i < 10; i++) {
    E = E - (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E))
}
```

## Tecnología

### Stack
- **Canvas 2D** - Metronomos (renderizado minimal)
- **Web Audio API** - Síntesis principal
- **Three.js** - No usado
- **Tailwind CSS** - Índices

### Sonificación: Zero-Crossing Detection

```javascript
if ((prevOmega > 0 && omega <= 0) || (prevOmega < 0 && omega >= 0)) {
    playClick()
}
```

### Sonificación: Radio-Proximity (Generativos)

```javascript
const dist = Math.hypot(particle.x - node.x, particle.y - node.y)
if (dist < triggerRadius) {
    if (!node.wasInRadius) {
        playChord(node.chord)
    }
}
```

## Comparación con Physics Visual Lab

| Aspecto | Physics Visual Lab | Physics Sound Lab |
|---------|-------------------|-------------------|
| **Propósito** | Entender mecánica | Convertir física en música |
| **Métrica** | Posición, velocidad | Frecuencia, nota, timbre |
| **Sonido** | NO | SÍ (Web Audio API) |
| **Output** | Gráficos | Beats, acordes |
| **Overlap** | NO significativo | Complementarios |

## Referencias

**Total:** 19 simulaciones (~40,000 líneas estimadas)
**Metronomos:** ~6,869 líneas (7 sims autocontenidas)
**Generativos:** ~30,000 líneas (11 proyectos modulares)
**Papers:** 4 artículos + 1 paper académico

---

**Última actualización:** 2026-01-10
