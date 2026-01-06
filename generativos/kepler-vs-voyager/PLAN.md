# Kepler vs Voyager: Harmonices Mundi Empiricus

## Metadata
- **Fecha inicio**: 2026-01-06
- **Autor**: Carlos Lorente Kaiser
- **Proyecto padre**: harmonices-mundi
- **Estado**: En desarrollo

---

## Prompt de Reproducción

```
Estoy desarrollando "Kepler vs Voyager", un proyecto hermano de Harmonices Mundi.

CONTEXTO:
- Harmonices Mundi es una sonificación interactiva del sistema solar basada en Kepler (1619)
- Este proyecto compara las frecuencias TEÓRICAS de Kepler (velocidad orbital → Hz) con datos EMPÍRICOS de NASA Voyager (ondas de plasma electromagnéticas)
- Son fenómenos físicamente DIFERENTES: cinemática vs electromagnetismo
- La pregunta científica: ¿existe correlación inesperada entre teoría histórica y mediciones reales?

FUENTES DE DATOS NASA (RAW, sin procesar):
- space-audio.org (Universidad de Iowa) - Licencia CC 4.0
- PWS (Plasma Wave System): 28,800 samples/s, 4-bit, rango audible
- Planetas disponibles: Júpiter, Saturno, Urano, Neptuno (Voyager 1 y 2)

STACK:
- Análisis: Python + TorchAudio + SciPy (PSD Welch)
- Web: Vanilla JS + Canvas 2D + Web Audio API
- Sin build tools, autocontenido

ESTRUCTURA DEL PROYECTO:
kepler-vs-voyager/
├── analysis/           # Python scripts
├── web/               # Aplicación final
│   ├── css/
│   ├── js/
│   └── assets/{data,samples}
├── raw/               # Audio original (no en git)
├── outputs/           # Gráficas generadas
└── PLAN.md            # Este documento

FASES:
0. Setup + descarga Júpiter
1. Análisis espectral Python
2. Extracción samples 5s
3. Cálculos Kepler
4. Web visualización estática
5. Web audio interactivo
6. Análisis científico
7. Expansión (Saturno, Urano, Neptuno)

ESTADO ACTUAL: [Actualizar según progreso]

PRÓXIMO PASO: [Indicar fase actual]
```

---

## 1. Concepto Científico

### 1.1 La Pregunta
¿Existe correlación entre las frecuencias derivadas matemáticamente por Kepler (1619) y las ondas electromagnéticas medidas por Voyager (1977-1989)?

### 1.2 Comparación de Fenómenos

| Aspecto | Kepler 1619 | NASA Voyager |
|---------|-------------|--------------|
| **Origen físico** | Órbita gravitacional | Plasma magnetosférico |
| **Tipo de onda** | Tono puro (calculado) | Ruido coloreado (medido) |
| **Variable clave** | Velocidad orbital: v = 2πa/T | Densidad electrónica: n_e |
| **Ecuación** | f ∝ v / v_tierra | PSD de campo eléctrico |
| **Rango dinámico** | Estático por órbita | Altamente variable |
| **Método análisis** | Cálculo directo | Power Spectral Density |

### 1.3 Frecuencias de Kepler (Base: La3 = 220 Hz)

```
Planeta   │ a (UA)  │ T (años) │ v (UA/año) │ f_kepler (Hz)
──────────┼─────────┼──────────┼────────────┼──────────────
Mercurio  │  0.387  │  0.241   │   10.08    │   318.4
Venus     │  0.723  │  0.615   │    7.39    │   233.4
Tierra    │  1.000  │  1.000   │    6.28    │   220.0 (ref)
Marte     │  1.524  │  1.881   │    5.09    │   178.4
Júpiter   │  5.203  │ 11.862   │    2.76    │    96.6
Saturno   │  9.537  │ 29.457   │    2.03    │    71.2
Urano     │ 19.191  │ 84.011   │    1.44    │    50.3
Neptuno   │ 30.069  │164.79    │    1.15    │    40.2
```

### 1.4 Hipótesis a Testear

**H1**: Planetas más cercanos al Sol tienen frecuencias dominantes más altas en datos NASA
- Test: Correlación velocidad orbital vs pico espectral principal

**H2**: Los ratios entre frecuencias de Kepler aproximan intervalos musicales
- Test: Calcular ratios y comparar con 3/2 (quinta), 4/3 (cuarta), 5/4 (tercera mayor)

**H3**: Los ratios NASA mantienen proporciones similares a Kepler
- Test: Comparar ratios de picos dominantes entre planetas

---

## 2. Fuentes de Datos

### 2.1 NASA Voyager PWS (Recomendado)
- **URL**: https://space-audio.org/
- **Institución**: Universidad de Iowa
- **Licencia**: Creative Commons 4.0
- **Características técnicas**:
  - Sample rate: 28,800 Hz
  - Resolución: 4-bit (calidad telefónica)
  - Rango: 20 Hz - 14 kHz

### 2.2 Archivos Disponibles

| # | Sonda | Planeta | Evento | Fecha |
|---|-------|---------|--------|-------|
| 1 | Voyager 1 | Júpiter | Encounter | 1979 |
| 2 | Voyager 2 | Júpiter | Arrival | 1979 |
| 3 | Voyager 1 | Saturno | Encounter | Nov 1980 |
| 4 | Voyager 2 | Saturno | Encounter | Ago-Sep 1981 |
| 5 | Voyager 2 | Urano | Encounter | Ene 1986 |
| 6 | Voyager 2 | Neptuno | Encounter | Ago 1989 |

### 2.3 Qué Captura el PWS
- Ondas de plasma electromagnéticas
- Interacciones magnetosfera-viento solar
- Emisiones de radio auroral
- NO es sonido atmosférico, es campo eléctrico convertido a audio

---

## 3. Arquitectura Técnica

### 3.1 Pipeline de Datos

```
┌─────────────────┐
│  space-audio.org │
│  (FLAC/MP3)      │
└────────┬────────┘
         │ wget/curl
         ▼
┌─────────────────┐
│  raw/*.flac     │
│  (30+ min)      │
└────────┬────────┘
         │ torchaudio
         ▼
┌─────────────────┐     ┌─────────────────┐
│  PSD Welch      │────▶│ outputs/*.png   │
│  (scipy.signal) │     │ (gráficas)      │
└────────┬────────┘     └─────────────────┘
         │
         ▼
┌─────────────────┐     ┌─────────────────┐
│  Peak detection │────▶│ assets/data/    │
│  (find_peaks)   │     │ *.json          │
└────────┬────────┘     └─────────────────┘
         │
         ▼
┌─────────────────┐     ┌─────────────────┐
│  Extract clips  │────▶│ assets/samples/ │
│  (5s segments)  │     │ *.mp3           │
└─────────────────┘     └─────────────────┘
```

### 3.2 Stack Web

```
┌─────────────────────────────────────────────────┐
│                   index.html                     │
├─────────────────────────────────────────────────┤
│  ┌─────────┐  ┌─────────┐  ┌─────────┐         │
│  │ app.js  │  │spectrum │  │ audio.js│         │
│  │         │  │  .js    │  │         │         │
│  └────┬────┘  └────┬────┘  └────┬────┘         │
│       │            │            │               │
│       ▼            ▼            ▼               │
│  ┌─────────────────────────────────────┐       │
│  │         Web Audio API               │       │
│  │  • Oscillator (Kepler tones)        │       │
│  │  • AudioBuffer (NASA samples)       │       │
│  │  • Analyser (FFT real-time)         │       │
│  └─────────────────────────────────────┘       │
│                     │                           │
│                     ▼                           │
│  ┌─────────────────────────────────────┐       │
│  │         Canvas 2D                    │       │
│  │  • Spectrum visualization           │       │
│  │  • Kepler frequency line            │       │
│  │  • Harmonic guides                  │       │
│  └─────────────────────────────────────┘       │
└─────────────────────────────────────────────────┘
```

---

## 4. Plan de Implementación

### Fase 0: Setup
- [ ] Crear estructura de directorios
- [ ] Verificar dependencias Python
- [ ] Descargar Jupiter audio de space-audio.org
- [ ] Verificar características del audio (sample rate, duración)

### Fase 1: Análisis Espectral
- [ ] Script 01_spectral_analysis.py
- [ ] Calcular PSD Welch
- [ ] Identificar picos (frecuencias dominantes)
- [ ] Generar gráficas PNG
- [ ] Exportar JSON con datos espectrales

### Fase 2: Extracción de Samples
- [ ] Script 02_extract_samples.py
- [ ] Seleccionar 5 segmentos representativos
- [ ] Aplicar fade in/out
- [ ] Convertir a MP3 128kbps
- [ ] Documentar timestamps

### Fase 3: Cálculos Kepler
- [ ] Script 03_kepler_frequencies.py
- [ ] Calcular frecuencias para 4 planetas Voyager
- [ ] Calcular ratios musicales
- [ ] Exportar kepler_data.json

### Fase 4: Web - Visualización
- [ ] HTML estructura
- [ ] CSS tema oscuro
- [ ] Canvas espectro estático
- [ ] Mostrar comparación Kepler vs NASA

### Fase 5: Web - Audio
- [ ] Playback Kepler (oscilador)
- [ ] Playback NASA (samples)
- [ ] Modo A/B comparación
- [ ] FFT en tiempo real

### Fase 6: Análisis Científico
- [ ] Calcular correlaciones
- [ ] Documentar hallazgos
- [ ] Sección conclusiones en web

### Fase 7: Expansión
- [ ] Repetir para Saturno
- [ ] Repetir para Urano
- [ ] Repetir para Neptuno
- [ ] Vista multi-planeta

---

## 5. Especificaciones de Código

### 5.1 Python: Análisis Espectral

```python
# Parámetros PSD Welch
SAMPLE_RATE = 44100      # Resamplear si es necesario
NPERSEG = 8192           # Resolución frecuencial
NOVERLAP = 4096          # 50% overlap
FREQ_MIN = 20            # Hz
FREQ_MAX = 2000          # Hz (rango interesante)
PEAK_PROMINENCE = 5      # dB mínimo para pico
```

### 5.2 JavaScript: Web Audio

```javascript
// Parámetros audio
const KEPLER_WAVEFORM = 'sine';
const SAMPLE_DURATION = 5;        // segundos
const FFT_SIZE = 2048;
const CROSSFADE_TIME = 0.1;       // segundos
```

### 5.3 Formato JSON Espectral

```json
{
  "planet": "jupiter",
  "source": "voyager_1",
  "analysis": {
    "method": "welch",
    "sample_rate": 44100,
    "nperseg": 8192
  },
  "spectrum": {
    "freqs": [20, 21, 22, ...],
    "psd_db": [-45.2, -44.8, ...]
  },
  "peaks": {
    "frequencies": [120.5, 340.2, 890.1],
    "amplitudes": [-32.1, -35.4, -38.2]
  },
  "statistics": {
    "centroid": 456.7,
    "spread": 234.5,
    "total_energy": 1.23e6
  }
}
```

---

## 6. Interfaz de Usuario

### 6.1 Layout Principal

```
┌─────────────────────────────────────────────────────────────┐
│  KEPLER vs VOYAGER: Harmonices Mundi Empiricus              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                                                     │   │
│  │              SPECTRUM VISUALIZATION                 │   │
│  │                                                     │   │
│  │   NASA (blue line) ~~~~~~~~~~~~~~~~~~~~~~~~~~~~    │   │
│  │                        │                           │   │
│  │                        │ Kepler (red vertical)     │   │
│  │                        │                           │   │
│  │   ─────────────────────┼───────────────────────    │   │
│  │   20Hz              500Hz                  2000Hz  │   │
│  │                                                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   JUPITER    │  │   SATURN     │  │   URANUS     │ ...  │
│  │   ● Active   │  │   ○          │  │   ○          │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                             │
│  ┌─────────────────────┐  ┌─────────────────────┐          │
│  │  ▶ PLAY KEPLER      │  │  ▶ PLAY VOYAGER     │          │
│  │    96.6 Hz          │  │    Sample 1 of 5    │          │
│  └─────────────────────┘  └─────────────────────┘          │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  ANALYSIS                                           │   │
│  │  Kepler predicts: 96.6 Hz                          │   │
│  │  NASA dominant peaks: 120 Hz, 340 Hz, 890 Hz       │   │
│  │  Nearest match: 120 Hz (diff: +24 Hz)              │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 6.2 Paleta de Colores

```css
--bg-primary: #0a0a0f;
--bg-secondary: #12121a;
--accent-kepler: #ff4444;
--accent-nasa: #4488ff;
--accent-peak: #44ff88;
--text-primary: #ffffff;
--text-secondary: #888888;
```

---

## 7. Checklist de Progreso

### Fase 0: Setup
- [ ] Estructura creada
- [ ] Python dependencies OK
- [ ] Jupiter.flac descargado
- [ ] Audio verificado

### Fase 1: Análisis
- [ ] PSD calculado
- [ ] Picos identificados
- [ ] JSON exportado
- [ ] Gráficas generadas

### Fase 2: Samples
- [ ] Clips extraídos
- [ ] MP3 convertidos
- [ ] Timestamps documentados

### Fase 3: Kepler
- [ ] Frecuencias calculadas
- [ ] Ratios calculados
- [ ] JSON exportado

### Fase 4: Web Visual
- [ ] HTML base
- [ ] CSS aplicado
- [ ] Canvas funcional
- [ ] Espectro visible

### Fase 5: Web Audio
- [ ] Kepler playback OK
- [ ] NASA playback OK
- [ ] A/B compare OK
- [ ] FFT real-time OK

### Fase 6: Análisis
- [ ] Correlaciones calculadas
- [ ] Conclusiones escritas
- [ ] UI actualizada

### Fase 7: Expansión
- [ ] Saturno completo
- [ ] Urano completo
- [ ] Neptuno completo
- [ ] Multi-planeta OK

---

## 8. Referencias

### Científicas
- Kepler, J. (1619). "Harmonices Mundi"
- Gurnett, D.A. et al. (1977). "Plasma Wave Investigation for Voyager"

### Técnicas
- https://space-audio.org/ (datos Voyager)
- https://pytorch.org/audio/ (TorchAudio)
- https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API

### Proyecto Relacionado
- /harmonices-mundi (proyecto padre)

---

## 9. Notas de Desarrollo

### 2026-01-06
- Inicio del proyecto
- Plan creado
- Estructura de directorios establecida

---

*Documento vivo - actualizar según progreso*
