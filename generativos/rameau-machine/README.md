# Rameau Machine

Sistema generativo de armonía funcional basado en las teorías de Jean-Philippe Rameau (1722).

## Concepto

Mientras que el [Tonnetz Walker](../tonnetz-walker/) explora la geometría simétrica de las transformaciones Neo-Riemannianas, **Rameau Machine** implementa el paradigma opuesto: la armonía funcional jerárquica donde la tónica actúa como centro gravitacional.

### Dos Paradigmas Armónicos

| Aspecto | Rameau (Funcional) | Neo-Riemannian |
|---------|-------------------|----------------|
| Centro | Tónica como "sol" gravitacional | Sin centro, espacio homogéneo |
| Movimiento | Hacia resolución (D->T) | Parsimonia de voces |
| Estructura | Jerárquica (T > D > S) | Simétrica (P = L = R) |
| Tensión | Acumulativa, se resuelve | Uniforme, sin resolución |
| Época | Barroco/Clásico | Romántico tardío/Contemporáneo |

## Funciones Armónicas

El sistema organiza los acordes en tres familias funcionales:

- **Tónica (T)** - Verde: Centro, estabilidad, resolución (I, vi, iii)
- **Subdominante (S)** - Azul: Alejarse del centro, preparación (IV, ii)
- **Dominante (D)** - Rojo: Tensión máxima, necesidad de retorno (V, viiº)

```
        ┌─────────────────────────────────┐
        │           TÓNICA (T)            │
        │         I    vi    iii          │
        │           estabilidad           │
        └─────────────┬───────────────────┘
                      │
          ┌───────────┴───────────┐
          ▼                       ▼
┌─────────────────┐     ┌─────────────────┐
│ SUBDOMINANTE(S) │     │  DOMINANTE (D)  │
│    IV    ii     │────▶│    V    viiº    │
│   preparación   │     │    tensión      │
└────────┬────────┘     └────────┬────────┘
         │                       │
         └───────────┬───────────┘
                     ▼
              (resolución a T)
```

## Características

### Gravedad Tonal
La tensión se acumula al alejarse de la tónica y se libera al resolver. El sistema modifica dinámicamente las probabilidades de transición: a mayor tensión, mayor atracción hacia la tónica.

### Voice Leading SATB
Conducción de voces a cuatro partes (Soprano, Alto, Tenor, Bajo) con:
- Evitación de quintas y octavas paralelas
- Resolución de sensible a tónica
- Prevención de cruce de voces
- Preferencia por movimiento conjunto

### Ritmo Armónico
Duraciones variables según función y tensión:
- Acordes de tónica: duración extendida (respiración)
- Acordes de dominante en tensión alta: duración comprimida (urgencia)
- Rubato automático en estilo romántico

### Detección de Cadencias
El sistema reconoce y anuncia:
- Cadencia Auténtica Perfecta (V -> I)
- Cadencia Plagal (IV -> I)
- Cadencia Rota/Deceptiva (V -> vi)
- Semicadencia (* -> V)

## Uso

### Controles

- **Tonalidad**: Selecciona la tónica (C, G, D, etc.)
- **Tempo**: Ajusta la velocidad (40-140 BPM)
- **Estilo**: Barroco, Clásico, Romántico o Jazz
- **Modo Autónomo**: El sistema genera progresiones automáticamente
- **Modo Guiado**: Haz clic en los acordes para dirigir la progresión

### Transporte

- **Play/Pause**: Inicia o detiene la generación
- **Reset**: Vuelve al estado inicial (I)
- **Record**: Graba el audio generado (WebM)
- **Export**: Descarga la progresión como texto Markdown

### Visualización

- **Anillos concéntricos**: Representan las zonas funcionales
- **Centro verde**: Zona de tónica (estabilidad)
- **Anillo rojo**: Zona de dominante (tensión)
- **Anillo azul**: Zona de subdominante (alejamiento)
- **Trail**: Muestra el camino armónico recorrido
- **Hover**: Revela probabilidades de transición

## Estilos

| Estilo | Tempo | Waveform | Voice Leading | Característica |
|--------|-------|----------|---------------|----------------|
| Barroco | 60 | Triangle | Estricto | Ornamentos |
| Clásico | 80 | Sine | Estricto | Alberti bass |
| Romántico | 70 | Sawtooth | Relajado | Rubato |
| Jazz | 120 | Sine | Libre | Extensiones |

## Fundamento Teórico

### Jean-Philippe Rameau (1683-1764)

El "Traité de l'harmonie" (1722) estableció los principios de la armonía funcional occidental:

1. **Bajo fundamental**: Cada acorde tiene una raíz que determina su función
2. **Funciones armónicas**: T-S-D como fuerzas gravitacionales
3. **Progresión natural**: T -> S -> D -> T (ciclo funcional)

### Referencias

- Rameau, J.P. (1722). *Traité de l'harmonie*
- Kostka & Payne. *Tonal Harmony*
- Temperley, D. *Music and Probability*
- Tymoczko, D. *A Geometry of Music*

## Comparativa: Cuándo Usar Cada Sistema

| Para entender... | Rameau Machine | Tonnetz Walker |
|------------------|----------------|----------------|
| Bach, Mozart, Beethoven | ✓ | |
| Brahms, Wagner, Liszt | | ✓ |
| Jazz standards | ✓ | |
| Música de cine/videojuegos | | ✓ |
| Por qué V->I suena "bien" | ✓ | |
| Por qué C->E->Ab suena "mágico" | | ✓ |

## Motor de Audio Profesional

### Síntesis

| Componente | Descripción |
|------------|-------------|
| Osciladores duales | Unísono con detune para chorus |
| Filtros por registro | Bajo cálido → Soprano brillante |
| LFO vibrato | Profundidad escalada por voz |
| Micro-timing | Humanización 0-12ms por ataque |
| Saturador suave | Calidez analógica (tanh) |

### Espacialización

| Voz | Pan | Early Reflections |
|-----|-----|-------------------|
| Bajo | -0.5 (izq) | 4 taps estéreo |
| Tenor | -0.15 | 11-37ms delays |
| Alto | +0.15 | Filtro 6kHz |
| Soprano | +0.5 (der) | Absorción simulada |

### Reverb (Freeverb)

Implementación Schroeder/Moorer:
- 8 filtros comb paralelos (feedback)
- 4 filtros allpass en serie (difusión)
- Control de room size y damping
- Mezcla wet/dry ajustable por estilo

### Compresor Master

- Threshold: -18dB
- Ratio: 3:1 (gentle glue)
- Attack: 15ms (preserva transientes)
- Release: 250ms

## Mixer de Voces

Panel de control individual para cada voz:
- **Faders verticales**: Volumen independiente
- **Botones Mute**: Silenciar voces específicas
- **LEDs**: Indicador de actividad por ataque
- **Voice Trail**: Visualización del movimiento melódico

## Tecnologías

- D3.js (visualización funcional)
- Web Audio API (síntesis profesional)
- Tailwind CSS (estilos)
- Canvas 2D (voice trail)

## Licencia

MIT
