# Orbifold Walker

**Explora el espacio geométrico de acordes de Tymoczko en 3D**

[![Demo](https://img.shields.io/badge/Demo-Live-blue)](https://cjlkaiser-cpu.github.io/orbifold-walker/)
[![Physics Sound Lab](https://img.shields.io/badge/Physics%20Sound%20Lab-Project-purple)](https://github.com/cjlkaiser-cpu)

![Orbifold Walker Preview](https://img.shields.io/badge/Three.js-3D-black?logo=three.js)
![Web Audio](https://img.shields.io/badge/Web%20Audio-API-green)

---

## Concepto

El teórico musical **Dmitri Tymoczko** demostró que todos los voicings posibles de acordes forman un espacio geométrico llamado **orbifold**. En este espacio:

- Cada punto es un **voicing específico** (no solo una clase de acorde)
- La **distancia** entre puntos equivale a la suavidad del voice leading
- Los acordes **consonantes** (mayores, menores) habitan el centro
- Los **bordes** contienen clusters y unísonos

Este proyecto visualiza ese espacio para **tríadas** (acordes de 3 notas) como un prisma 3D interactivo.

```
            Clusters (unísono)
                 ●
                /|\
               / | \
              /  |  \
     Aug ●───/───●───\───● Dim
        (4,4)  Centro  (3,3)
             /    |    \
            /     |     \
           ●──────●──────●
        Major   Minor
        (4,3)   (3,4)
```

## Demo

**[▶ Probar Online](https://cjlkaiser-cpu.github.io/orbifold-walker/)**

### Controles

| Acción | Resultado |
|--------|-----------|
| Click en canvas | Lanza la partícula con velocidad aleatoria |
| Arrastrar | Rota la vista 3D |
| Scroll | Zoom in/out |
| Start/Pause | Inicia o pausa la simulación |
| Reset | Devuelve la partícula al origen |
| Rec | Graba el audio generado |

### Parámetros

- **Friction**: Amortiguamiento (0 = sin fricción, 0.05 = alta)
- **Force**: Intensidad de atracción de los acordes consonantes
- **Speed**: Velocidad inicial al lanzar
- **Wave**: Forma de onda (sine, triangle, saw, square)
- **Octave**: Registro base (2-5)
- **Crossfade**: Tiempo de transición entre voicings (ms)

### Modos de Sonido

- **Drone**: Tres osciladores suenan continuamente, mutando con el movimiento
- **Trigger**: Los acordes solo suenan al acercarse a un atractor

## Teoría

### Coordenadas del Orbifold

Para una tríada (p1, p2, p3) donde p1 ≤ p2 ≤ p3:

```
x = (p1 + p2 + p3) / 3    // Centro tonal (transposición)
y = p2 - p1               // Intervalo inferior
z = p3 - p2               // Intervalo superior
```

### Atractores

Los acordes consonantes actúan como atractores gravitacionales:

| Acorde | Intervalos (y, z) | Color |
|--------|-------------------|-------|
| Mayor | (4, 3) | Verde |
| Menor | (3, 4) | Azul |
| Disminuido | (3, 3) | Rojo |
| Aumentado | (4, 4) | Naranja |

### Topología Twisted

El orbifold tiene bordes "pegados con torsión". Cuando la partícula cruza un borde:

1. Reentra por el lado opuesto
2. Se transpone un **tritono** (6 semitonos)
3. La velocidad se refleja

Esto crea conexiones inesperadas entre tonalidades distantes.

## Tecnologías

- **Three.js** - Renderizado 3D con OrbitControls
- **Web Audio API** - Síntesis en tiempo real
- **RK4** - Integración numérica de alta precisión
- **MediaRecorder** - Grabación de audio

## Artículo

Lee el artículo divulgativo completo:
**[Orbifold Walker: Explorando la Geometría del Espacio de Acordes](../../papers/paper-orbifold-walker/ARTICLE_v1.html)**

## Referencias

- Tymoczko, D. (2006). "The Geometry of Musical Chords". *Science*, 313(5783), 72-74.
- Tymoczko, D. (2011). *A Geometry of Music*. Oxford University Press.
- [Dmitri Tymoczko's Website](https://dmitri.mycpanel.princeton.edu/)

## Relacionados

- [Tonnetz Atractor](https://github.com/cjlkaiser-cpu/tonnetz-atractor) - Caos sobre el Tonnetz Neo-Riemanniano
- [Harmonices Mundi](https://github.com/cjlkaiser-cpu/harmonices-mundi) - El Sistema Solar sonificado según Kepler

---

**Physics Sound Lab** · 2024
