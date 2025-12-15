# Rameau Machine

Sistema generativo de armonia funcional basado en las teorias de Jean-Philippe Rameau (1722).

## Concepto

Mientras que el [Tonnetz Walker](../tonnetz-walker/) explora la geometria simetrica de las transformaciones Neo-Riemannianas, **Rameau Machine** implementa el paradigma opuesto: la armonia funcional jerarquica donde la tonica actua como centro gravitacional.

### Dos Paradigmas Armonicos

| Aspecto | Rameau (Funcional) | Neo-Riemannian |
|---------|-------------------|----------------|
| Centro | Tonica como "sol" gravitacional | Sin centro, espacio homogeneo |
| Movimiento | Hacia resolucion (D->T) | Parsimonia de voces |
| Estructura | Jerarquica (T > D > S) | Simetrica (P = L = R) |
| Tension | Acumulativa, se resuelve | Uniforme, sin resolucion |
| Epoca | Barroco/Clasico | Romantico tardio/Contemporaneo |

## Funciones Armonicas

El sistema organiza los acordes en tres familias funcionales:

- **Tonica (T)** - Verde: Centro, estabilidad, resolucion (I, vi, iii)
- **Subdominante (S)** - Azul: Alejarse del centro, preparacion (IV, ii)
- **Dominante (D)** - Rojo: Tension maxima, necesidad de retorno (V, viio)

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
│    IV    ii     │────▶│    V    viio    │
│   preparacion   │     │    tension      │
└────────┬────────┘     └────────┬────────┘
         │                       │
         └───────────┬───────────┘
                     ▼
              (resolucion a T)
```

## Caracteristicas

### Gravedad Tonal
La tension se acumula al alejarse de la tonica y se libera al resolver. El sistema modifica dinamicamente las probabilidades de transicion: a mayor tension, mayor atraccion hacia la tonica.

### Voice Leading SATB
Conduccion de voces a cuatro partes (Soprano, Alto, Tenor, Bajo) con:
- Evitacion de quintas y octavas paralelas
- Resolucion de sensible a tonica
- Prevencion de cruce de voces
- Preferencia por movimiento conjunto

### Ritmo Armonico
Duraciones variables segun funcion y tension:
- Acordes de tonica: duracion extendida (respiracion)
- Acordes de dominante en tension alta: duracion comprimida (urgencia)
- Rubato automatico en estilo romantico

### Deteccion de Cadencias
El sistema reconoce y anuncia:
- Cadencia Autentica Perfecta (V -> I)
- Cadencia Plagal (IV -> I)
- Cadencia Rota/Deceptiva (V -> vi)
- Semicadencia (* -> V)

## Uso

### Controles

- **Tonalidad**: Selecciona la tonica (C, G, D, etc.)
- **Tempo**: Ajusta la velocidad (40-140 BPM)
- **Estilo**: Barroco, Clasico, Romantico o Jazz
- **Modo Autonomo**: El sistema genera progresiones automaticamente
- **Modo Guiado**: Haz clic en los acordes para dirigir la progresion

### Transporte

- **Play/Pause**: Inicia o detiene la generacion
- **Reset**: Vuelve al estado inicial (I)
- **Record**: Graba el audio generado (WebM)
- **Export**: Descarga la progresion como texto Markdown

### Visualizacion

- **Anillos concentricos**: Representan las zonas funcionales
- **Centro verde**: Zona de tonica (estabilidad)
- **Anillo rojo**: Zona de dominante (tension)
- **Anillo azul**: Zona de subdominante (alejamiento)
- **Trail**: Muestra el camino armonico recorrido
- **Hover**: Revela probabilidades de transicion

## Estilos

| Estilo | Tempo | Waveform | Voice Leading | Caracteristica |
|--------|-------|----------|---------------|----------------|
| Barroco | 60 | Triangle | Estricto | Ornamentos |
| Clasico | 80 | Sine | Estricto | Alberti bass |
| Romantico | 70 | Sawtooth | Relajado | Rubato |
| Jazz | 120 | Sine | Libre | Extensiones |

## Fundamento Teorico

### Jean-Philippe Rameau (1683-1764)

El "Traite de l'harmonie" (1722) establecio los principios de la armonia funcional occidental:

1. **Bajo fundamental**: Cada acorde tiene una raiz que determina su funcion
2. **Funciones armonicas**: T-S-D como fuerzas gravitacionales
3. **Progresion natural**: T -> S -> D -> T (ciclo funcional)

### Referencias

- Rameau, J.P. (1722). *Traite de l'harmonie*
- Kostka & Payne. *Tonal Harmony*
- Temperley, D. *Music and Probability*
- Tymoczko, D. *A Geometry of Music*

## Comparativa: Cuando Usar Cada Sistema

| Para entender... | Rameau Machine | Tonnetz Walker |
|------------------|----------------|----------------|
| Bach, Mozart, Beethoven | X | |
| Brahms, Wagner, Liszt | | X |
| Jazz standards | X | |
| Musica de cine/videojuegos | | X |
| Por que V->I suena "bien" | X | |
| Por que C->E->Ab suena "magico" | | X |

## Tecnologias

- D3.js (visualizacion)
- Web Audio API (sintesis)
- Tailwind CSS (estilos)

## Licencia

MIT
