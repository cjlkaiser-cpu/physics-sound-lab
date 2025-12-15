# El Atractor del Tonnetz

**Instrumento generativo donde la física del caos produce armonía musical**

Un sistema dinámico que combina la física de atractores magnéticos con la teoría Neo-Riemanniana para generar progresiones armónicas emergentes. La partícula orbita entre acordes siguiendo leyes físicas reales, creando música que es simultáneamente caótica y armónicamente coherente.

## Demo

**[Hexagonal (Original)](https://cjlkaiser-cpu.github.io/tonnetz-atractor/)** · **[Tutorial](https://cjlkaiser-cpu.github.io/tonnetz-atractor/tutorial.html)**

## Tres Versiones

El proyecto incluye **3 versiones** con diferente complejidad teórica:

| Versión | Archivo | Notas | Tríadas | Física | Características |
|---------|---------|-------|---------|--------|-----------------|
| **Hexagonal** | `index.html` | 7 diatónicas | 6 | 1/r² | 5 modos armónicos, ideal para explorar |
| **Cromático** | `tonnetz-chromatic.html` | 12 pitch classes | 24 | 1/r³ | P/L/R completos, layout dual-ring |
| **Grid** | `tonnetz-grid.html` | 20 nodos | 24 | 1/r³ | Topología Euler, base del paper académico |

### Hexagonal (Original)

```
        C
    F       G
        E
    A       B
        D
```

- 7 notas diatónicas (teclas blancas)
- 6 tríadas: C, Dm, Em, F, G, Am
- 5 modos armónicos: Mayor, Menor, Frigio, Lidio, Blues
- Ideal para explorar y experimentar

### Cromático

- 12 pitch classes (todas las notas cromáticas)
- 24 tríadas (12 mayores + 12 menores)
- Layout dual-ring: anillo exterior (quintas) + interior (bemoles)
- Transformaciones P, L, R completas
- Física 1/r³ para mejor estabilidad

### Grid

```
    C --- G --- D --- A
   / \ / \ / \ / \ /
  F --- C --- G --- D
   \ / \ / \ / \ / \
    Bb--- F --- C --- G
   / \ / \ / \ / \ /
  Eb--- Bb--- F --- C
```

- 20 nodos en rejilla 4×5 triangular
- 24 tríadas con detección geométrica precisa
- Topología fiel al Tonnetz original de Euler
- Base teórica para el paper académico

## Concepto

### La Analogía Central

| Física | Música |
|--------|--------|
| Pozo de potencial | Tónica (estabilidad) |
| Fuerza centrípeta | Atracción tonal |
| Órbita caótica | Arpegio infinito |
| Transición de órbita | Modulación armónica |
| Fricción | Decay natural del sonido |

## Física

### Ecuación de Movimiento

La partícula se mueve bajo la influencia de múltiples atractores magnéticos:

```
F = Σ K·(r_i - r) / |r_i - r|ⁿ - friction·v
```

Donde:
- **K**: Constante de fuerza magnética
- **r_i**: Posición del nodo i
- **r**: Posición de la partícula
- **n**: Exponente de la fuerza (2 para Hexagonal, 3 para Cromático/Grid)
- **friction**: Coeficiente de fricción
- **v**: Velocidad de la partícula

### Comportamiento Caótico

Este sistema exhibe **caos determinista**:
- Las trayectorias son sensibles a condiciones iniciales
- El movimiento es impredecible pero no aleatorio
- Emergen patrones complejos de los simples atractores

## Teoría Musical

### Teoría Neo-Riemanniana

Desarrollada por David Lewin y Richard Cohn, extiende las ideas de Hugo Riemann sobre transformaciones armónicas. Las tres operaciones fundamentales:

- **P (Parallel)**: C Mayor ↔ C menor (cambia la tercera)
- **L (Leading-tone)**: C Mayor ↔ E menor (cambia la fundamental)
- **R (Relative)**: C Mayor ↔ A menor (cambia la quinta)

En las versiones **Cromático** y **Grid**, todas las transformaciones P/L/R son posibles entre las 24 tríadas.

### Modos Armónicos (Versión Hexagonal)

| Modo | Tonalidad | Carácter | Acordes |
|------|-----------|----------|---------|
| **Mayor** | Do Mayor | Brillante, estable | C, Am, Em, G, Dm, F |
| **Menor** | La menor | Melancólico, oscuro | Am, Dm, F, E°, Gm, C |
| **Frigio** | Mi frigio | Español, flamenco | E°, F, Gm, Am, Bb, Dm |
| **Lidio** | Fa lidio | Soñador, cinematográfico | F, G, Am, B°, C, Dm |
| **Blues** | Blues en Do | Jazzy, tensión | C7, Fm, G7, Ab, Bb, Eb |

## Controles

### Parámetros Físicos

| Control | Efecto |
|---------|--------|
| Fuerza Magnética | Intensidad de atracción hacia los nodos |
| Fricción | Resistencia al movimiento (decay) |
| Velocidad Inicial | Energía al hacer reset |
| Trail Length | Longitud de la estela visual |

### Interacción

- **Click en canvas**: Teletransportar partícula
- **Arrastrar**: Mover partícula manualmente
- **Soltar**: Lanzar con velocidad del movimiento
- **Botones de acorde**: Impulso hacia ese acorde
- **Botones de modo**: Cambiar escala (solo Hexagonal)
- **Reset**: Nueva posición y velocidad aleatoria

## Tecnologías

| Tecnología | Uso |
|------------|-----|
| Canvas 2D | Renderizado de la simulación |
| Web Audio API | Síntesis de sonido en tiempo real |
| Euler semi-implícito | Integración numérica estable |
| Detección punto-en-triángulo | Trigger de acordes |

## Estructura

```
tonnetz-atractor/
├── index.html              # Versión Hexagonal (original)
├── tonnetz-chromatic.html  # Versión Cromática (24 tríadas)
├── tonnetz-grid.html       # Versión Grid (topología Euler)
├── tutorial.html           # Tutorial interactivo
├── simulation/             # Framework de simulación headless
│   ├── simulator.js        # Motor de simulación
│   ├── run_batch.js        # Runner para barrido de parámetros
│   ├── analyze.py          # Análisis estadístico Python
│   └── results.html        # Visualización de resultados
├── README.md               # Este archivo
└── LICENSE                 # MIT License
```

## Simulación Headless

El directorio `simulation/` contiene un framework para ejecutar simulaciones sin interfaz gráfica:

```bash
cd simulation
npm install
node run_batch.js
python analyze.py
```

Permite:
- Barrido sistemático de parámetros (friction, force, deltaT)
- 450 simulaciones en paralelo
- Métricas: Lyapunov exponent proxy, chord transitions, dwell times
- Exporta a SQLite para análisis posterior

## Roadmap

### Completado

- [x] **Tres versiones**: Hexagonal, Cromático, Grid
- [x] **Transformaciones P/L/R**: Completas en versiones Cromático y Grid
- [x] **Modos armónicos**: 5 escalas en versión Hexagonal
- [x] **Síntesis mejorada**: 4 osciladores, ADSR, filtro lowpass, reverb
- [x] **Framework simulación**: 450 simulaciones headless para paper
- [x] **Paper académico**: Draft completo (~12K palabras, 8 figuras)

### Pendiente

- [ ] **Export MIDI**: Guardar las progresiones generadas
- [ ] **Modo VR/3D**: Tonnetz en esfera, navegación inmersiva
- [ ] **Múltiples partículas**: Polifonía caótica

## Referencias

### Teoría Musical
- Cohn, Richard - "Audacious Euphony: Chromaticism and the Triad's Second Nature"
- Lewin, David - "Generalized Musical Intervals and Transformations"
- Tymoczko, Dmitri - "A Geometry of Music"

### Física
- Lorenz, Edward - "Deterministic Nonperiodic Flow"
- Strogatz, Steven - "Nonlinear Dynamics and Chaos"

### Inspiración
- Kepler, Johannes - "Harmonices Mundi" (1619)

## Licencia

**Código:** MIT License
**Contenido educativo:** CC BY 4.0

---

*Parte de [Physics Sound Lab](https://github.com/cjlkaiser-cpu/physics-sound-lab) — Simulaciones donde la física genera música*
