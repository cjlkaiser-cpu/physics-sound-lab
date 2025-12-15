# Cadencia Orbital

Instrumento generativo que combina física de atractores con progresiones armónicas. Las partículas orbitan entre atractores gravitacionales, activando acordes según el sector que atraviesan.

## Concepto

Basado en sistemas dinámicos de múltiples cuerpos, cada atractor representa un grado de la escala (I, ii, iii, IV, V, vi, vii°). El movimiento caótico de las partículas genera progresiones armónicas emergentes, explorando relaciones tonales de forma orgánica.

## Controles

### Panel Izquierdo

**Tonalidad**
- Selector de tonalidad mayor/menor
- Botones de modulación:
  - V↑: Dominante (círculo de quintas ascendente)
  - IV↓: Subdominante (círculo de quintas descendente)
  - Rel: Relativo mayor/menor
  - Par: Paralelo (mismo nombre, distinto modo)

**Atractores**
- 3-8 atractores configurables
- Cada cantidad mapea grados armónicos específicos

**Física**
- Exponente (n): Controla la caída de fuerza con la distancia (F ∝ 1/r^n)
- Intensidad: Fuerza de atracción global
- Fricción: Amortiguamiento del sistema
- Velocidad inicial: Impulso al reiniciar
- Mostrar vectores: Visualiza velocidad (amarillo) y aceleración (cyan)

**Partículas**
- 1 o 2 partículas simultáneas
- Sync: Sincroniza posición y velocidad
- Paneo estéreo independiente (-0.6 / +0.6)

**Audio**
- Activar/desactivar síntesis
- Control de volumen master

### Panel Derecho

**Arpegio**
- Modo: Arriba, Abajo, Alternado, Aleatorio
- Velocidad: Intervalo entre notas (10-150ms)

**Delay**
- Activar efecto de delay
- Tiempo: 100-800ms
- Feedback: Cantidad de repeticiones

**Síntesis**
- Forma de onda: Sine, Triangle, Sawtooth, Square
- Attack: Tiempo de ataque del envelope
- Release: Tiempo de liberación

**Octava**
- Transposición de -2 a +2 octavas

**Grabar**
- Graba todo el audio generado
- Exporta como WebM/Opus o M4A
- Muestra duración en tiempo real

## Zonas de Modulación

- **Centro (cyan)**: Modula al relativo mayor/menor
- **Exterior (violeta)**: Modula a la dominante

Las modulaciones automáticas tienen cooldown de 1.5 segundos y reproducen un arpegio especial.

## Interacción

- **Click + arrastrar**: Lanza partículas con velocidad inicial
- **Reset**: Nueva posición aleatoria
- **Pausa**: Congela la simulación

## Tecnología

- Canvas 2D para visualización
- Web Audio API para síntesis
- Integración Runge-Kutta 4º orden (RK4) para física
- MediaRecorder API para grabación

## Grados Armónicos

### Modo Mayor
| Atractores | Grados |
|------------|--------|
| 3 | I, IV, V |
| 4 | I, ii, IV, V |
| 5 | I, ii, iii, IV, V |
| 6 | I, ii, iii, IV, V, vi |
| 7 | I, ii, iii, IV, V, vi, vii° |
| 8 | I, bII, ii, iii, IV, V, vi, vii° |

### Modo Menor (armónico)
| Atractores | Grados |
|------------|--------|
| 3 | i, iv, V |
| 4 | i, iv, V, VI |
| 5 | i, ii°, iv, V, VI |
| 6 | i, ii°, III, iv, V, VI |
| 7 | i, ii°, III, iv, V, VI, vii° |
| 8 | i, ii°, III, iv, v, V, VI, vii° |

## Archivo

- `cadencia-orbital.html` - Aplicación completa (standalone)
