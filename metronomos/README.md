# Physics Sound Lab

**Simulaciones de física interactivas donde las ecuaciones del movimiento generan sonido.**

7 metrónomos físicos que convierten fenómenos mecánicos en ritmo: cada sistema oscilatorio produce beats basados en física real, resolviendo ecuaciones diferenciales con métodos numéricos precisos.

## Demos en Vivo

| Simulación | Descripción | Ecuación |
|------------|-------------|----------|
| [Péndulo Simple](https://cjlkaiser-cpu.github.io/metronomo-fisico/) | Ecuación completa (no lineal) con Runge-Kutta 4 | θ'' + (g/L)sin(θ) = 0 |
| [Oscilador Armónico](https://cjlkaiser-cpu.github.io/metronomo-resorte/) | Sistema masa-resorte, MAS puro | ẍ + (k/m)x = 0 |
| [Péndulos Acoplados](https://cjlkaiser-cpu.github.io/metronomo-polirritmico/) | Polirritmos naturales por superposición | T₁/T₂ = √(L₁/L₂) |
| [Figuras de Lissajous](https://cjlkaiser-cpu.github.io/metronomo-lissajous/) | Oscilaciones perpendiculares, ratios de frecuencia | x = sin(ωₓt), y = sin(ωᵧt + δ) |
| [Onda Estacionaria](https://cjlkaiser-cpu.github.io/metronomo-onda/) | Modos normales, serie armónica | fₙ = n·v/(2L) |
| [Rebote Elástico](https://cjlkaiser-cpu.github.io/metronomo-rebote/) | Progresión geométrica de impactos | v' = -e·v |
| [Harmonices Mundi](https://cjlkaiser-cpu.github.io/metronomo-kepler/) | Órbitas elípticas, ecuación de Kepler | T² = a³ |

### Proyecto Destacado: Coro Planetario

Sistema Solar completo sonificado según la visión de Kepler (1619). 8 planetas en armonía orbital con física real, analizador FFT y modo Concert Hall.

**[Demo](https://cjlkaiser-cpu.github.io/harmonices-mundi/)** · **[Tutorial](https://cjlkaiser-cpu.github.io/harmonices-mundi/tutorial.html)** · **[Repositorio](https://github.com/cjlkaiser-cpu/harmonices-mundi)**

## Tecnologías

- **Canvas 2D** - Renderizado de simulaciones
- **Web Audio API** - Síntesis de sonido en tiempo real
- **Runge-Kutta 4** - Integración numérica de alta precisión
- **Newton-Raphson** - Resolución de ecuación de Kepler
- **FFT Analyser** - Visualización espectral

## Estructura

```
physics-sound-lab/
├── index.html              # Landing page con previews animados
├── pendulo-simple/         # Péndulo no lineal
├── oscilador-armonico/     # Sistema masa-resorte
├── pendulos-acoplados/     # Generador de polirritmos
├── lissajous/              # Figuras paramétricas
├── onda-estacionaria/      # Modos de vibración
├── rebote-elastico/        # Colisiones con disipación
└── harmonices-mundi/       # Órbita kepleriana
```

## Uso Local

Cada simulación es un archivo HTML autocontenido. Abre cualquier `index.html` directamente en el navegador o usa un servidor local:

```bash
python -m http.server 8000
# Abrir http://localhost:8000
```

## Licencia

**Código:** MIT License
**Contenido educativo:** CC BY 4.0

Ver [LICENSE](LICENSE) para detalles completos.

---

*Physics Sound Lab · Simulaciones donde la física genera música*
