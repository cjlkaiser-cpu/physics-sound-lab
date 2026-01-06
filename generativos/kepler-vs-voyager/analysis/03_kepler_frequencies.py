#!/usr/bin/env python3
"""
Kepler vs Voyager - Fase 3: Cálculos Kepler
============================================
Calcula frecuencias teóricas de Kepler basadas en velocidades orbitales.
Calcula ratios musicales entre planetas.
"""

import json
import numpy as np
import matplotlib.pyplot as plt
from pathlib import Path

# Configuración
PROJECT_ROOT = Path(__file__).parent.parent
OUTPUTS_DIR = PROJECT_ROOT / "outputs"
DATA_DIR = PROJECT_ROOT / "web" / "assets" / "data"

# Datos orbitales (NASA JPL)
# a: semieje mayor en UA
# T: período orbital en años terrestres
ORBITAL_DATA = {
    "mercury":  {"a": 0.387, "T": 0.241,  "color": "#8C7853", "symbol": "☿"},
    "venus":    {"a": 0.723, "T": 0.615,  "color": "#FFC649", "symbol": "♀"},
    "earth":    {"a": 1.000, "T": 1.000,  "color": "#6B93D6", "symbol": "⊕"},
    "mars":     {"a": 1.524, "T": 1.881,  "color": "#CD5C5C", "symbol": "♂"},
    "jupiter":  {"a": 5.203, "T": 11.862, "color": "#C88B3A", "symbol": "♃"},
    "saturn":   {"a": 9.537, "T": 29.457, "color": "#FAD5A5", "symbol": "♄"},
    "uranus":   {"a": 19.191, "T": 84.011, "color": "#4FD0E0", "symbol": "⛢"},
    "neptune":  {"a": 30.069, "T": 164.79, "color": "#4166F5", "symbol": "♆"}
}

# Planetas con datos Voyager disponibles
VOYAGER_PLANETS = ["jupiter", "saturn", "uranus", "neptune"]

# Frecuencia base (La3 = 220 Hz, estándar musical)
BASE_FREQ = 220.0
REFERENCE_PLANET = "earth"

# Intervalos musicales para comparación
MUSICAL_INTERVALS = {
    "unísono": 1.0,
    "segunda_menor": 16/15,
    "segunda_mayor": 9/8,
    "tercera_menor": 6/5,
    "tercera_mayor": 5/4,
    "cuarta": 4/3,
    "tritono": 45/32,
    "quinta": 3/2,
    "sexta_menor": 8/5,
    "sexta_mayor": 5/3,
    "séptima_menor": 9/5,
    "séptima_mayor": 15/8,
    "octava": 2.0
}


def calculate_orbital_velocity(a, T):
    """Calcula velocidad orbital media (UA/año)."""
    return (2 * np.pi * a) / T


def calculate_kepler_frequency(planet_data, reference_velocity, base_freq=BASE_FREQ):
    """
    Calcula frecuencia según método de Kepler.

    Kepler asociaba la velocidad orbital con el "tono" del planeta.
    Normalizamos usando la Tierra como referencia.
    """
    v = calculate_orbital_velocity(planet_data["a"], planet_data["T"])
    return base_freq * (v / reference_velocity)


def find_nearest_interval(ratio):
    """Encuentra el intervalo musical más cercano a un ratio dado."""
    nearest = None
    min_diff = float("inf")

    for name, interval_ratio in MUSICAL_INTERVALS.items():
        diff = abs(ratio - interval_ratio)
        if diff < min_diff:
            min_diff = diff
            nearest = name

    # También comprobar inversiones (ratio < 1)
    if ratio < 1:
        inverse_ratio = 1 / ratio
        for name, interval_ratio in MUSICAL_INTERVALS.items():
            diff = abs(inverse_ratio - interval_ratio)
            if diff < min_diff:
                min_diff = diff
                nearest = f"{name}_inv"

    return nearest, min_diff


def calculate_all_frequencies():
    """Calcula frecuencias de Kepler para todos los planetas."""
    print("Calculando frecuencias de Kepler...")
    print("=" * 60)

    # Velocidad de referencia (Tierra)
    ref_data = ORBITAL_DATA[REFERENCE_PLANET]
    ref_velocity = calculate_orbital_velocity(ref_data["a"], ref_data["T"])

    print(f"Referencia: {REFERENCE_PLANET.capitalize()} = {BASE_FREQ} Hz")
    print(f"Velocidad Tierra: {ref_velocity:.3f} UA/año")
    print()

    frequencies = {}

    print(f"{'Planeta':<12} {'a (UA)':<10} {'T (años)':<12} {'v (UA/año)':<12} {'f (Hz)':<10}")
    print("-" * 60)

    for planet, data in ORBITAL_DATA.items():
        v = calculate_orbital_velocity(data["a"], data["T"])
        freq = calculate_kepler_frequency(data, ref_velocity)
        frequencies[planet] = freq

        print(f"{planet.capitalize():<12} {data['a']:<10.3f} {data['T']:<12.3f} {v:<12.3f} {freq:<10.1f}")

    return frequencies


def calculate_ratios(frequencies):
    """Calcula ratios entre frecuencias de planetas Voyager."""
    print("\n" + "=" * 60)
    print("Ratios entre planetas Voyager:")
    print("=" * 60)

    ratios = {}

    for i, p1 in enumerate(VOYAGER_PLANETS):
        for p2 in VOYAGER_PLANETS[i+1:]:
            ratio = frequencies[p1] / frequencies[p2]
            interval, diff = find_nearest_interval(ratio)

            key = f"{p1}/{p2}"
            ratios[key] = {
                "ratio": ratio,
                "nearest_interval": interval,
                "difference": diff
            }

            print(f"  {p1.capitalize()}/{p2.capitalize()}: {ratio:.3f} ≈ {interval} (diff: {diff:.3f})")

    return ratios


def plot_frequencies(frequencies):
    """Genera gráfica de frecuencias de Kepler."""
    print("\nGenerando gráfica...")

    OUTPUTS_DIR.mkdir(parents=True, exist_ok=True)

    # Solo planetas Voyager
    planets = VOYAGER_PLANETS
    freqs = [frequencies[p] for p in planets]
    colors = [ORBITAL_DATA[p]["color"] for p in planets]
    symbols = [ORBITAL_DATA[p]["symbol"] for p in planets]

    fig, ax = plt.subplots(figsize=(12, 6))

    bars = ax.bar(range(len(planets)), freqs, color=colors, edgecolor="black", linewidth=2)

    # Etiquetas
    ax.set_xticks(range(len(planets)))
    ax.set_xticklabels([f"{symbols[i]}\n{p.capitalize()}" for i, p in enumerate(planets)],
                       fontsize=12)

    # Valores sobre barras
    for bar, freq in zip(bars, freqs):
        ax.text(bar.get_x() + bar.get_width()/2, bar.get_height() + 2,
                f"{freq:.1f} Hz",
                ha="center", va="bottom", fontsize=11, weight="bold")

    ax.set_ylabel("Frecuencia (Hz)", fontsize=12)
    ax.set_title("Frecuencias de Kepler - Planetas Voyager\n(Base: Tierra = 220 Hz)",
                 fontsize=14, weight="bold")
    ax.grid(axis="y", alpha=0.3)

    # Añadir líneas de intervalos musicales de referencia
    earth_freq = frequencies["earth"]
    for name, ratio in [("Quinta (3/2)", 3/2), ("Octava (2/1)", 2), ("Cuarta (4/3)", 4/3)]:
        ref_freq = earth_freq / ratio  # Abajo de Tierra
        if 20 < ref_freq < 200:
            ax.axhline(ref_freq, color="gray", linestyle="--", alpha=0.5)
            ax.text(len(planets) - 0.5, ref_freq, name, fontsize=9, alpha=0.7)

    plt.tight_layout()

    output_path = OUTPUTS_DIR / "kepler_frequencies.png"
    plt.savefig(output_path, dpi=200, bbox_inches="tight")
    plt.close()

    print(f"  ✓ Guardada: {output_path}")


def export_json(frequencies, ratios):
    """Exporta datos de Kepler a JSON."""
    print("\nExportando JSON...")

    DATA_DIR.mkdir(parents=True, exist_ok=True)

    data = {
        "method": "kepler_1619",
        "base_frequency": BASE_FREQ,
        "reference_planet": REFERENCE_PLANET,
        "planets": {},
        "ratios": ratios
    }

    for planet in VOYAGER_PLANETS:
        data["planets"][planet] = {
            "frequency": round(frequencies[planet], 2),
            "orbital": {
                "a_ua": ORBITAL_DATA[planet]["a"],
                "T_years": ORBITAL_DATA[planet]["T"],
                "velocity": round(calculate_orbital_velocity(
                    ORBITAL_DATA[planet]["a"],
                    ORBITAL_DATA[planet]["T"]
                ), 3)
            },
            "color": ORBITAL_DATA[planet]["color"],
            "symbol": ORBITAL_DATA[planet]["symbol"]
        }

    output_path = DATA_DIR / "kepler_data.json"
    with open(output_path, "w") as f:
        json.dump(data, f, indent=2)

    print(f"  ✓ Guardado: {output_path}")


def main():
    """Ejecuta cálculos de Kepler."""
    print("=" * 60)
    print("KEPLER vs VOYAGER - Fase 3: Cálculos Kepler")
    print("=" * 60)
    print()

    # 1. Calcular frecuencias
    frequencies = calculate_all_frequencies()

    # 2. Calcular ratios
    ratios = calculate_ratios(frequencies)

    # 3. Generar gráfica
    plot_frequencies(frequencies)

    # 4. Exportar JSON
    export_json(frequencies, ratios)

    print("\n" + "=" * 60)
    print("✓ FASE 3 COMPLETADA")
    print(f"\nFrecuencias Kepler para planetas Voyager:")
    for planet in VOYAGER_PLANETS:
        print(f"  {planet.capitalize()}: {frequencies[planet]:.1f} Hz")
    print(f"\nPróximo paso: Implementar web (Fase 4)")


if __name__ == "__main__":
    main()
