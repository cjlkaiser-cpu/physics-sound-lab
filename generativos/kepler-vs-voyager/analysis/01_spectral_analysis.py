#!/usr/bin/env python3
"""
Kepler vs Voyager - Fase 1: Análisis Espectral
===============================================
Calcula PSD (Power Spectral Density) usando método de Welch.
Identifica frecuencias dominantes y exporta a JSON.
"""

import json
import numpy as np
import matplotlib.pyplot as plt
from pathlib import Path
from scipy.io import wavfile
from scipy.signal import welch, find_peaks

# Configuración
PROJECT_ROOT = Path(__file__).parent.parent
RAW_DIR = PROJECT_ROOT / "raw"
OUTPUTS_DIR = PROJECT_ROOT / "outputs"
DATA_DIR = PROJECT_ROOT / "web" / "assets" / "data"

# Parámetros de análisis
ANALYSIS_PARAMS = {
    "nperseg": 8192,              # Tamaño ventana FFT
    "noverlap": 4096,             # 50% overlap
    "freq_min": 20,               # Hz mínimo
    "freq_max": 2000,             # Hz máximo (rango interesante)
    "peak_prominence": 3,         # dB mínimo para detectar pico
    "peak_distance": 20,          # Bins mínimos entre picos
    "sample_duration": 300,       # Analizar primeros 5 minutos (audio muy largo)
}


def load_audio(audio_path):
    """Carga audio WAV."""
    print(f"Cargando: {audio_path}")

    sample_rate, data = wavfile.read(audio_path)

    # Info
    if len(data.shape) > 1:
        data = data.mean(axis=1)  # Convertir a mono

    print(f"  Sample rate: {sample_rate} Hz")
    print(f"  Duración total: {len(data)/sample_rate:.1f}s")

    # Limitar a primeros N segundos para análisis más rápido
    max_samples = int(sample_rate * ANALYSIS_PARAMS["sample_duration"])
    if len(data) > max_samples:
        data = data[:max_samples]
        print(f"  Limitado a: {ANALYSIS_PARAMS['sample_duration']}s para análisis")

    # Normalizar
    data = data.astype(np.float64)
    data = data / np.max(np.abs(data))

    return data, sample_rate


def compute_psd_welch(audio_np, sample_rate):
    """Calcula Power Spectral Density usando método de Welch."""
    print("\nCalculando PSD (Welch)...")

    freqs, psd = welch(
        audio_np,
        fs=sample_rate,
        nperseg=ANALYSIS_PARAMS["nperseg"],
        noverlap=ANALYSIS_PARAMS["noverlap"],
        window="hann",
        scaling="density"
    )

    # Convertir a dB
    psd_db = 10 * np.log10(psd + 1e-10)

    # Filtrar rango de frecuencias
    freq_min = ANALYSIS_PARAMS["freq_min"]
    freq_max = ANALYSIS_PARAMS["freq_max"]
    mask = (freqs >= freq_min) & (freqs <= freq_max)

    freqs_filtered = freqs[mask]
    psd_filtered = psd_db[mask]

    print(f"  Rango: {freq_min}-{freq_max} Hz")
    print(f"  Bins: {len(freqs_filtered)}")

    return freqs_filtered, psd_filtered


def find_dominant_peaks(freqs, psd_db):
    """Encuentra frecuencias dominantes (picos)."""
    print("\nBuscando picos dominantes...")

    peaks, properties = find_peaks(
        psd_db,
        prominence=ANALYSIS_PARAMS["peak_prominence"],
        distance=ANALYSIS_PARAMS["peak_distance"]
    )

    peak_freqs = freqs[peaks]
    peak_amps = psd_db[peaks]

    # Ordenar por amplitud (mayor primero)
    sorted_idx = np.argsort(peak_amps)[::-1]
    peak_freqs = peak_freqs[sorted_idx]
    peak_amps = peak_amps[sorted_idx]

    print(f"  Picos encontrados: {len(peak_freqs)}")
    print(f"\n  Top 10 frecuencias dominantes:")
    for i, (freq, amp) in enumerate(zip(peak_freqs[:10], peak_amps[:10]), 1):
        print(f"    {i:2d}. {freq:7.1f} Hz  ({amp:6.1f} dB)")

    return peak_freqs, peak_amps


def compute_statistics(freqs, psd_db):
    """Calcula estadísticas espectrales."""
    # Normalizar PSD para cálculos (convertir de dB a lineal)
    psd_linear = 10 ** (psd_db / 10)

    # Centroide espectral
    centroid = np.sum(freqs * psd_linear) / np.sum(psd_linear)

    # Dispersión espectral
    spread = np.sqrt(
        np.sum(((freqs - centroid) ** 2) * psd_linear) / np.sum(psd_linear)
    )

    # Energía total
    total_energy = np.sum(psd_linear)

    print(f"\nEstadísticas espectrales:")
    print(f"  Centroide: {centroid:.1f} Hz")
    print(f"  Dispersión: {spread:.1f} Hz")
    print(f"  Energía total: {total_energy:.2e}")

    return {
        "centroid": float(centroid),
        "spread": float(spread),
        "total_energy": float(total_energy)
    }


def plot_spectrum(freqs, psd_db, peak_freqs, peak_amps, planet_name, kepler_freq=None):
    """Genera gráfica del espectro."""
    print("\nGenerando gráfica...")

    fig, (ax1, ax2) = plt.subplots(2, 1, figsize=(14, 10))

    # --- Gráfica 1: Espectro completo ---
    ax1.plot(freqs, psd_db, "b-", alpha=0.7, linewidth=1.5, label="NASA Voyager PSD")

    # Marcar picos
    for freq in peak_freqs[:10]:
        idx = np.argmin(np.abs(freqs - freq))
        ax1.plot(freq, psd_db[idx], "go", markersize=8)

    ax1.plot([], [], "go", markersize=8, label=f"Picos dominantes ({len(peak_freqs)} total)")

    # Anotar top 5
    for freq, amp in zip(peak_freqs[:5], peak_amps[:5]):
        ax1.annotate(
            f"{freq:.0f} Hz",
            xy=(freq, amp),
            xytext=(freq, amp + 3),
            ha="center",
            fontsize=9,
            color="green",
            weight="bold"
        )

    # Línea Kepler si se proporciona
    if kepler_freq:
        ax1.axvline(kepler_freq, color="red", linestyle="--", linewidth=2,
                    label=f"Kepler teoría: {kepler_freq:.1f} Hz")

    ax1.set_title(f"{planet_name.upper()} - Power Spectral Density (Welch)",
                  fontsize=14, weight="bold")
    ax1.set_xlabel("Frecuencia (Hz)", fontsize=12)
    ax1.set_ylabel("PSD (dB/Hz)", fontsize=12)
    ax1.legend(loc="upper right", fontsize=10)
    ax1.grid(True, alpha=0.3)
    ax1.set_xlim(ANALYSIS_PARAMS["freq_min"], ANALYSIS_PARAMS["freq_max"])

    # --- Gráfica 2: Zoom en bajas frecuencias (20-500 Hz) ---
    mask_low = freqs <= 500
    ax2.plot(freqs[mask_low], psd_db[mask_low], "b-", alpha=0.7, linewidth=1.5)

    # Marcar picos en este rango
    low_peaks = peak_freqs[peak_freqs <= 500][:5]
    for freq in low_peaks:
        idx = np.argmin(np.abs(freqs - freq))
        ax2.plot(freq, psd_db[idx], "go", markersize=10)
        ax2.annotate(
            f"{freq:.0f} Hz",
            xy=(freq, psd_db[idx]),
            xytext=(freq, psd_db[idx] + 2),
            ha="center",
            fontsize=10,
            color="green",
            weight="bold"
        )

    if kepler_freq and kepler_freq <= 500:
        ax2.axvline(kepler_freq, color="red", linestyle="--", linewidth=2)

    ax2.set_title("Zoom: Rango bajo (20-500 Hz) - Rango típico de Kepler",
                  fontsize=12)
    ax2.set_xlabel("Frecuencia (Hz)", fontsize=12)
    ax2.set_ylabel("PSD (dB/Hz)", fontsize=12)
    ax2.grid(True, alpha=0.3)
    ax2.set_xlim(20, 500)

    plt.tight_layout()

    # Guardar
    output_path = OUTPUTS_DIR / f"{planet_name}_spectrum.png"
    plt.savefig(output_path, dpi=200, bbox_inches="tight")
    plt.close()

    print(f"  ✓ Guardada: {output_path}")
    return output_path


def export_json(planet_name, freqs, psd_db, peak_freqs, peak_amps, stats):
    """Exporta datos a JSON para uso en web."""
    print("\nExportando JSON...")

    DATA_DIR.mkdir(parents=True, exist_ok=True)

    # Submuestrear para reducir tamaño (cada 4 puntos)
    step = 4
    freqs_sub = freqs[::step].tolist()
    psd_sub = psd_db[::step].tolist()

    data = {
        "planet": planet_name,
        "source": "voyager_1",
        "date": "1979-03-05",
        "analysis": {
            "method": "welch",
            "nperseg": ANALYSIS_PARAMS["nperseg"],
            "freq_range": [ANALYSIS_PARAMS["freq_min"], ANALYSIS_PARAMS["freq_max"]]
        },
        "spectrum": {
            "freqs": freqs_sub,
            "psd_db": psd_sub
        },
        "peaks": {
            "frequencies": peak_freqs[:20].tolist(),
            "amplitudes": peak_amps[:20].tolist()
        },
        "statistics": stats
    }

    output_path = DATA_DIR / f"{planet_name}_spectrum.json"
    with open(output_path, "w") as f:
        json.dump(data, f, indent=2)

    print(f"  ✓ Guardado: {output_path}")
    print(f"  Tamaño: {output_path.stat().st_size / 1024:.1f} KB")

    return output_path


# Configuración de planetas Voyager
PLANETS_CONFIG = {
    "jupiter": {
        "wav_file": "jupiter_voyager1.wav",
        "kepler_freq": 96.5,
        "source": "voyager_1",
        "date": "1979-03-05"
    },
    "saturn": {
        "wav_file": "saturn_voyager1.wav",
        "kepler_freq": 71.23,
        "source": "voyager_1",
        "date": "1980-11-12"
    },
    "uranus": {
        "wav_file": "uranus_voyager2.wav",
        "kepler_freq": 50.26,
        "source": "voyager_2",
        "date": "1986-01-24"
    },
    "neptune": {
        "wav_file": "neptune_voyager2.wav",
        "kepler_freq": 40.14,
        "source": "voyager_2",
        "date": "1989-08-25"
    }
}


def export_json_planet(planet_name, freqs, psd_db, peak_freqs, peak_amps, stats, config):
    """Exporta datos a JSON para uso en web con metadatos del planeta."""
    print("\nExportando JSON...")

    DATA_DIR.mkdir(parents=True, exist_ok=True)

    # Submuestrear para reducir tamaño (cada 4 puntos)
    step = 4
    freqs_sub = freqs[::step].tolist()
    psd_sub = psd_db[::step].tolist()

    data = {
        "planet": planet_name,
        "source": config["source"],
        "date": config["date"],
        "analysis": {
            "method": "welch",
            "nperseg": ANALYSIS_PARAMS["nperseg"],
            "freq_range": [ANALYSIS_PARAMS["freq_min"], ANALYSIS_PARAMS["freq_max"]]
        },
        "spectrum": {
            "freqs": freqs_sub,
            "psd_db": psd_sub
        },
        "peaks": {
            "frequencies": peak_freqs[:20].tolist(),
            "amplitudes": peak_amps[:20].tolist()
        },
        "statistics": stats
    }

    output_path = DATA_DIR / f"{planet_name}_spectrum.json"
    with open(output_path, "w") as f:
        json.dump(data, f, indent=2)

    print(f"  ✓ Guardado: {output_path}")
    print(f"  Tamaño: {output_path.stat().st_size / 1024:.1f} KB")

    return output_path


def analyze_planet(planet_name, config):
    """Analiza un planeta específico."""
    print(f"\n{'=' * 60}")
    print(f"ANALIZANDO: {planet_name.upper()}")
    print("=" * 60)

    wav_path = RAW_DIR / config["wav_file"]

    if not wav_path.exists():
        print(f"✗ No se encontró audio: {wav_path}")
        return None

    kepler_freq = config["kepler_freq"]

    # 1. Cargar audio
    audio_np, sample_rate = load_audio(wav_path)

    # 2. Calcular PSD
    freqs, psd_db = compute_psd_welch(audio_np, sample_rate)

    # 3. Encontrar picos
    peak_freqs, peak_amps = find_dominant_peaks(freqs, psd_db)

    # 4. Estadísticas
    stats = compute_statistics(freqs, psd_db)

    # 5. Generar gráfica
    OUTPUTS_DIR.mkdir(parents=True, exist_ok=True)
    plot_spectrum(freqs, psd_db, peak_freqs, peak_amps, planet_name, kepler_freq)

    # 6. Exportar JSON
    export_json_planet(planet_name, freqs, psd_db, peak_freqs, peak_amps, stats, config)

    print(f"\n  Kepler predice: {kepler_freq:.1f} Hz")
    print(f"  NASA pico principal: {peak_freqs[0]:.1f} Hz")
    print(f"  Diferencia: {abs(peak_freqs[0] - kepler_freq):.1f} Hz")

    return {
        "planet": planet_name,
        "kepler_freq": kepler_freq,
        "nasa_peak": float(peak_freqs[0]),
        "difference": float(abs(peak_freqs[0] - kepler_freq))
    }


def main():
    """Ejecuta análisis espectral completo para todos los planetas."""
    print("=" * 60)
    print("KEPLER vs VOYAGER - Fase 1: Análisis Espectral")
    print("=" * 60)

    results = []

    for planet_name, config in PLANETS_CONFIG.items():
        result = analyze_planet(planet_name, config)
        if result:
            results.append(result)

    # Resumen final
    print("\n" + "=" * 60)
    print("✓ FASE 1 COMPLETADA - RESUMEN")
    print("=" * 60)
    print(f"\nPlanetas analizados: {len(results)}")
    print("\n{:<10} {:>12} {:>12} {:>12}".format("Planeta", "Kepler (Hz)", "NASA (Hz)", "Diff (Hz)"))
    print("-" * 50)
    for r in results:
        print("{:<10} {:>12.1f} {:>12.1f} {:>12.1f}".format(
            r["planet"], r["kepler_freq"], r["nasa_peak"], r["difference"]
        ))

    print(f"\nPróximo paso: python analysis/02_extract_samples.py")


if __name__ == "__main__":
    main()
