# Orbifold Walker

**Explora el espacio geometrico de acordes de Tymoczko en 3D**

[![Demo](https://img.shields.io/badge/Demo-Live-blue)](https://cjlkaiser-cpu.github.io/orbifold-walker/)
[![Physics Sound Lab](https://img.shields.io/badge/Physics%20Sound%20Lab-Project-purple)](https://github.com/cjlkaiser-cpu)

![Orbifold Walker Preview](https://img.shields.io/badge/Three.js-3D-black?logo=three.js)
![Web Audio](https://img.shields.io/badge/Web%20Audio-API-green)

---

## Concepto

El teorico musical **Dmitri Tymoczko** demostro que todos los voicings posibles de acordes forman un espacio geometrico llamado **orbifold**. En este espacio:

- Cada punto es un **voicing especifico** (no solo una clase de acorde)
- La **distancia** entre puntos equivale a la suavidad del voice leading
- Los acordes **consonantes** (mayores, menores) habitan el centro
- Los **bordes** contienen clusters y unisonos

Este proyecto visualiza ese espacio para **triadas** (acordes de 3 notas) como un prisma 3D interactivo.

```
            Clusters (unisono)
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

| Accion | Resultado |
|--------|-----------|
| Click en canvas | Lanza la particula con velocidad aleatoria |
| Arrastrar | Rota la vista 3D |
| Scroll | Zoom in/out |
| Start/Pause | Inicia o pausa la simulacion |
| Reset | Devuelve la particula al origen |
| Rec | Graba el audio generado |

### Parametros

- **Friction**: Amortiguamiento (0 = sin friccion, 0.05 = alta)
- **Force**: Intensidad de atraccion de los acordes consonantes
- **Speed**: Velocidad inicial al lanzar
- **Wave**: Forma de onda (sine, triangle, saw, square)
- **Octave**: Registro base (2-5)
- **Crossfade**: Tiempo de transicion entre voicings (ms)

### Modos de Sonido

- **Drone**: Tres osciladores suenan continuamente, mutando con el movimiento
- **Trigger**: Los acordes solo suenan al acercarse a un atractor

## Teoria

### Coordenadas del Orbifold

Para una triada (p1, p2, p3) donde p1 ≤ p2 ≤ p3:

```
x = (p1 + p2 + p3) / 3    // Centro tonal (transposicion)
y = p2 - p1               // Intervalo inferior
z = p3 - p2               // Intervalo superior
```

### Atractores

Los acordes consonantes actuan como atractores gravitacionales:

| Acorde | Intervalos (y, z) | Color |
|--------|-------------------|-------|
| Mayor | (4, 3) | Verde |
| Menor | (3, 4) | Azul |
| Disminuido | (3, 3) | Rojo |
| Aumentado | (4, 4) | Naranja |

### Topologia Twisted

El orbifold tiene bordes "pegados con torsion". Cuando la particula cruza un borde:

1. Reentra por el lado opuesto
2. Se transpone un **tritono** (6 semitonos)
3. La velocidad se refleja

Esto crea conexiones inesperadas entre tonalidades distantes.

## Tecnologias

- **Three.js** - Renderizado 3D con OrbitControls
- **Web Audio API** - Sintesis en tiempo real
- **RK4** - Integracion numerica de alta precision
- **MediaRecorder** - Grabacion de audio

## Articulo

Lee el articulo divulgativo completo:
**[Orbifold Walker: Explorando la Geometria del Espacio de Acordes](../../papers/paper-orbifold-walker/ARTICLE_v1.html)**

## Referencias

- Tymoczko, D. (2006). "The Geometry of Musical Chords". *Science*, 313(5783), 72-74.
- Tymoczko, D. (2011). *A Geometry of Music*. Oxford University Press.
- [Dmitri Tymoczko's Website](https://dmitri.mycpanel.princeton.edu/)

## Relacionados

- [Tonnetz Atractor](https://github.com/cjlkaiser-cpu/tonnetz-atractor) - Caos sobre el Tonnetz Neo-Riemanniano
- [Harmonices Mundi](https://github.com/cjlkaiser-cpu/harmonices-mundi) - El Sistema Solar sonificado segun Kepler

---

**Physics Sound Lab** · 2024
