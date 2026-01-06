#!/usr/bin/env python3
"""
Kepler vs Voyager - Fase 2: Extracción de Samples
==================================================
Extrae clips cortos (5s) del audio largo para uso en web.
Aplica fade in/out y convierte a MP3.
"""

import subprocess
import json
from pathlib import Path

# Configuración
PROJECT_ROOT = Path(__file__).parent.parent
RAW_DIR = PROJECT_ROOT / "raw"
SAMPLES_DIR = PROJECT_ROOT / "web" / "assets" / "samples"
DATA_DIR = PROJECT_ROOT / "web" / "assets" / "data"

# Parámetros de extracción
EXTRACT_PARAMS = {
    "sample_duration": 5,       # segundos por clip
    "n_samples": 5,             # número de clips a extraer
    "fade_duration": 0.1,       # segundos de fade in/out
    "output_bitrate": "128k",   # calidad MP3
}


def get_audio_duration(audio_path):
    """Obtiene duración del audio usando ffprobe."""
    result = subprocess.run(
        [
            "ffprobe", "-v", "error",
            "-show_entries", "format=duration",
            "-of", "default=noprint_wrappers=1:nokey=1",
            str(audio_path)
        ],
        capture_output=True,
        text=True
    )

    if result.returncode != 0:
        print(f"✗ Error obteniendo duración: {result.stderr}")
        return None

    return float(result.stdout.strip())


def extract_sample(audio_path, output_path, start_time, duration, fade_dur):
    """Extrae un clip del audio con fade in/out."""

    # Construir filtros de audio
    filters = [
        f"afade=t=in:st=0:d={fade_dur}",
        f"afade=t=out:st={duration - fade_dur}:d={fade_dur}"
    ]

    cmd = [
        "ffmpeg", "-y",
        "-ss", str(start_time),
        "-i", str(audio_path),
        "-t", str(duration),
        "-af", ",".join(filters),
        "-ar", "44100",
        "-ac", "1",  # Mono
        "-b:a", EXTRACT_PARAMS["output_bitrate"],
        str(output_path)
    ]

    result = subprocess.run(cmd, capture_output=True, text=True)

    if result.returncode != 0:
        print(f"✗ Error: {result.stderr[:200]}")
        return False

    return True


# Configuración de planetas
PLANETS_WAV = {
    "jupiter": "jupiter_voyager1.wav",
    "saturn": "saturn_voyager1.wav",
    "uranus": "uranus_voyager2.wav",
    "neptune": "neptune_voyager2.wav"
}


def extract_samples_for_planet(planet_name):
    """Extrae múltiples samples de un planeta."""
    print(f"\nExtrayendo samples de {planet_name}...")

    # Buscar audio WAV
    wav_filename = PLANETS_WAV.get(planet_name, f"{planet_name}_voyager1.wav")
    wav_path = RAW_DIR / wav_filename

    if not wav_path.exists():
        print(f"✗ No se encontró audio: {wav_path}")
        return None

    print(f"  Fuente: {wav_path}")

    # Obtener duración
    total_duration = get_audio_duration(wav_path)
    if not total_duration:
        return None

    print(f"  Duración total: {total_duration:.1f}s ({total_duration/60:.1f} min)")

    # Crear directorio de salida
    planet_samples_dir = SAMPLES_DIR / planet_name
    planet_samples_dir.mkdir(parents=True, exist_ok=True)

    # Calcular timestamps para extracción
    sample_dur = EXTRACT_PARAMS["sample_duration"]
    n_samples = EXTRACT_PARAMS["n_samples"]
    fade_dur = EXTRACT_PARAMS["fade_duration"]

    # Distribuir samples equidistantemente (solo primeros 30 min para variedad)
    usable_duration = min(total_duration, 1800) - sample_dur
    step = usable_duration / (n_samples - 1) if n_samples > 1 else 0

    samples_info = []

    for i in range(n_samples):
        start_time = i * step
        output_path = planet_samples_dir / f"sample_{i:02d}.mp3"

        print(f"  Extrayendo sample {i+1}/{n_samples}: {start_time:.1f}s - {start_time + sample_dur:.1f}s")

        success = extract_sample(
            wav_path,
            output_path,
            start_time,
            sample_dur,
            fade_dur
        )

        if success:
            file_size = output_path.stat().st_size / 1024
            print(f"    ✓ {output_path.name} ({file_size:.1f} KB)")

            samples_info.append({
                "index": i,
                "filename": output_path.name,
                "start_time": round(start_time, 2),
                "duration": sample_dur,
                "size_kb": round(file_size, 1)
            })
        else:
            print(f"    ✗ Error extrayendo sample {i}")

    return samples_info


def export_samples_metadata(planet_name, samples_info):
    """Guarda metadata de los samples extraídos."""
    DATA_DIR.mkdir(parents=True, exist_ok=True)

    metadata = {
        "planet": planet_name,
        "sample_duration": EXTRACT_PARAMS["sample_duration"],
        "fade_duration": EXTRACT_PARAMS["fade_duration"],
        "samples": samples_info
    }

    output_path = DATA_DIR / f"{planet_name}_samples.json"
    with open(output_path, "w") as f:
        json.dump(metadata, f, indent=2)

    print(f"  ✓ Metadata guardada: {output_path}")
    return output_path


def main():
    """Ejecuta extracción de samples para todos los planetas."""
    print("=" * 60)
    print("KEPLER vs VOYAGER - Fase 2: Extracción de Samples")
    print("=" * 60)

    total_samples = 0

    for planet_name in PLANETS_WAV.keys():
        samples_info = extract_samples_for_planet(planet_name)

        if samples_info:
            export_samples_metadata(planet_name, samples_info)
            total_samples += len(samples_info)

    print("\n" + "=" * 60)
    print("✓ FASE 2 COMPLETADA")
    print(f"\nPlanetas procesados: {len(PLANETS_WAV)}")
    print(f"Total samples extraídos: {total_samples}")
    print(f"Ubicación: {SAMPLES_DIR}")
    print(f"\nPróximo paso: python analysis/03_kepler_frequencies.py")


if __name__ == "__main__":
    main()
