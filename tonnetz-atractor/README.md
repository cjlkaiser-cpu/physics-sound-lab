# El Atractor del Tonnetz

**Instrumento generativo donde la fisica del caos produce armonia musical**

Un sistema dinamico que combina la fisica de atractores magneticos con la teoria Neo-Riemanniana para generar progresiones armonicas emergentes. La particula orbita entre acordes siguiendo leyes fisicas reales, creando musica que es simultaneamente caotica y harmonicamente coherente.

## Demo

**[Ver Demo en Vivo](https://cjlkaiser-cpu.github.io/tonnetz-atractor/)**

**[Tutorial Interactivo](https://cjlkaiser-cpu.github.io/tonnetz-atractor/tutorial.html)**

## Concepto

### La Analogia Central

| Fisica | Musica |
|--------|--------|
| Pozo de potencial | Tonica (estabilidad) |
| Fuerza centripeta | Atraccion tonal |
| Orbita caotica | Arpegio infinito |
| Transicion de orbita | Modulacion armonica |
| Friccion | Decay natural del sonido |

### El Tonnetz como Espacio Fisico

El Tonnetz (red de tonos) es una representacion geometrica de las relaciones armonicas, propuesta originalmente por Euler en 1739 y formalizada por Hugo Riemann. En esta simulacion:

```
        C
    F       G
        E
    A       B
        D
```

- **Centro (E)**: Nota comun a multiples acordes
- **Hexagono exterior**: Las 6 notas restantes de la escala
- **Triangulos**: Cada triangulo representa una triada (acorde)

### Acordes Disponibles

| Acorde | Notas | Tipo |
|--------|-------|------|
| C Mayor | C - E - G | Mayor |
| A menor | A - C - E | Menor |
| E menor | E - G - B | Menor |
| G Mayor | G - B - D | Mayor |
| D menor | D - F - A | Menor |
| F Mayor | F - A - C | Mayor |

## Fisica

### Ecuacion de Movimiento

La particula se mueve bajo la influencia de multiples atractores magneticos:

```
F = Σ K·(r_i - r) / |r_i - r|² - friction·v
```

Donde:
- **K**: Constante de fuerza magnetica
- **r_i**: Posicion del nodo i
- **r**: Posicion de la particula
- **friction**: Coeficiente de friccion
- **v**: Velocidad de la particula

### Comportamiento Caotico

Este sistema exhibe **caos determinista**:
- Las trayectorias son sensibles a condiciones iniciales
- El movimiento es impredecible pero no aleatorio
- Emergen patrones complejos de los simples atractores

### Integracion Numerica

Se utiliza integracion de Euler semi-implicita con substepping (8 pasos por frame) para estabilidad numerica.

## Teoria Musical

### Teoria Neo-Riemanniana

Desarrollada por David Lewin y Richard Cohn, extiende las ideas de Hugo Riemann sobre transformaciones armonicas. Las tres operaciones fundamentales:

- **P (Parallel)**: C Mayor ↔ C menor
- **L (Leading-tone)**: C Mayor ↔ E menor
- **R (Relative)**: C Mayor ↔ A menor

### Triadas y Proximidad

Cuando la particula entra en un triangulo del Tonnetz:
1. Se detecta el acorde correspondiente
2. Suenan las 3 notas de la triada
3. El triangulo se ilumina visualmente

Esto crea progresiones armonicas **emergentes** de la fisica.

## Controles

### Parametros Fisicos

| Control | Efecto |
|---------|--------|
| Fuerza Magnetica | Intensidad de atraccion hacia los nodos |
| Friccion | Resistencia al movimiento (decay) |
| Velocidad Inicial | Energia al hacer reset |
| Trail Length | Longitud de la estela visual |

### Interaccion

- **Click en canvas**: Teletransportar particula
- **Arrastrar**: Mover particula manualmente
- **Soltar**: Lanzar con velocidad del movimiento
- **Botones de acorde**: Impulso hacia ese acorde
- **Reset**: Nueva posicion y velocidad aleatoria

## Tecnologias

| Tecnologia | Uso |
|------------|-----|
| Canvas 2D | Renderizado de la simulacion |
| Web Audio API | Sintesis de sonido en tiempo real |
| Euler semi-implicito | Integracion numerica estable |
| Deteccion punto-en-triangulo | Trigger de acordes |

## Estructura

```
tonnetz-atractor/
├── index.html      # Simulacion principal
├── tutorial.html   # Tutorial interactivo
├── README.md       # Este archivo
└── LICENSE         # MIT License
```

## Uso Local

```bash
# Clonar repositorio
git clone https://github.com/cjlkaiser-cpu/tonnetz-atractor.git

# Abrir directamente o con servidor local
python -m http.server 8000
# Navegar a http://localhost:8000
```

## Roadmap

### Mejoras Pendientes

- [ ] **Secuenciador automatico**: Progresiones pre-programadas (I-V-vi-IV, etc.)
- [ ] **Sintesis mejorada**: Ondas mas ricas, ADSR configurable, efectos
- [ ] **Transformaciones P/L/R**: Botones para operaciones Neo-Riemannianas
- [ ] **Export MIDI**: Guardar las progresiones generadas
- [ ] **Modo VR/3D**: Tonnetz en esfera, navegacion inmersiva

### Ideas Futuras

- Multiples particulas (polifonia caotica)
- Atractor de Lorenz como generador
- Secciones de Poincare visualizadas
- Bifurcaciones por parametro K

## Referencias

### Teoria Musical
- Cohn, Richard - "Audacious Euphony: Chromaticism and the Triad's Second Nature"
- Lewin, David - "Generalized Musical Intervals and Transformations"
- Tymoczko, Dmitri - "A Geometry of Music"

### Fisica
- Lorenz, Edward - "Deterministic Nonperiodic Flow"
- Strogatz, Steven - "Nonlinear Dynamics and Chaos"

### Inspiracion
- Kepler, Johannes - "Harmonices Mundi" (1619)

## Licencia

**Codigo:** MIT License
**Contenido educativo:** CC BY 4.0

---

*Parte de [Physics Sound Lab](https://github.com/cjlkaiser-cpu/physics-sound-lab) — Simulaciones donde la fisica genera musica*
