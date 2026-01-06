#!/usr/bin/env python3
"""
Kepler vs Voyager - Fase 0: Setup y Descarga
=============================================
Descarga audio de Júpiter desde space-audio.org y verifica características.
"""

import os
import sys
import subprocess
from pathlib import Path

# Configuración
PROJECT_ROOT = Path(__file__).parent.parent
RAW_DIR = PROJECT_ROOT / "raw"
OUTPUTS_DIR = PROJECT_ROOT / "outputs"

# URLs de Universidad de Iowa (space.physics.uiowa.edu)
AUDIO_SOURCES = {
    "jupiter": {
        "url": "https://space.physics.uiowa.edu/voyager/V1PWS_Jupiter_1979-03-05T0000-2359.mp3",
        "name": "Voyager 1 Jupiter Encounter (1979-03-05)",
        "filename": "jupiter_voyager1.mp3"
    }
}


def check_dependencies():
    """Verifica que las dependencias Python estén instaladas."""
    print("Verificando dependencias...")

    required = ["scipy", "numpy", "matplotlib"]
    missing = []

    for pkg in required:
        try:
            __import__(pkg)
            print(f"  ✓ {pkg}")
        except ImportError:
            print(f"  ✗ {pkg} - FALTA")
            missing.append(pkg)

    # Verificar ffmpeg
    try:
        result = subprocess.run(["ffmpeg", "-version"], capture_output=True)
        if result.returncode == 0:
            print("  ✓ ffmpeg")
        else:
            missing.append("ffmpeg")
    except FileNotFoundError:
        print("  ✗ ffmpeg - FALTA")
        missing.append("ffmpeg")

    if missing:
        print(f"\n⚠️  Instalar dependencias faltantes:")
        if "ffmpeg" in missing:
            print("   brew install ffmpeg")
        pip_missing = [m for m in missing if m != "ffmpeg"]
        if pip_missing:
            print(f"   pip install {' '.join(pip_missing)}")
        return False

    print("✓ Todas las dependencias instaladas")
    return True


def download_audio(planet="jupiter"):
    """Descarga audio de un planeta."""
    if planet not in AUDIO_SOURCES:
        print(f"✗ Planeta no disponible: {planet}")
        return None

    source = AUDIO_SOURCES[planet]
    output_path = RAW_DIR / source["filename"]

    # Crear directorio si no existe
    RAW_DIR.mkdir(parents=True, exist_ok=True)

    if output_path.exists():
        print(f"✓ Audio ya existe: {output_path}")
        return output_path

    print(f"Descargando {source['name']}...")
    print(f"  URL: {source['url']}")
    print(f"  Destino: {output_path}")

    try:
        result = subprocess.run(
            ["curl", "-L", "-o", str(output_path), source["url"]],
            capture_output=True,
            text=True
        )

        if result.returncode != 0:
            print(f"✗ Error en descarga: {result.stderr}")
            return None

        print(f"✓ Descarga completada: {output_path}")
        return output_path

    except Exception as e:
        print(f"✗ Error: {e}")
        return None


def convert_to_wav(mp3_path):
    """Convierte MP3 a WAV para análisis."""
    wav_path = mp3_path.with_suffix('.wav')

    if wav_path.exists():
        print(f"✓ WAV ya existe: {wav_path}")
        return wav_path

    print(f"Convirtiendo a WAV...")

    result = subprocess.run([
        "ffmpeg", "-y", "-i", str(mp3_path),
        "-ar", "44100", "-ac", "1",  # 44.1kHz mono
        str(wav_path)
    ], capture_output=True, text=True)

    if result.returncode != 0:
        print(f"✗ Error en conversión: {result.stderr}")
        return None

    print(f"✓ Convertido: {wav_path}")
    return wav_path


def verify_audio(audio_path):
    """Verifica características del audio."""
    from scipy.io import wavfile
    import numpy as np

    print(f"\nVerificando audio: {audio_path}")
    print("=" * 60)

    if not os.path.exists(audio_path):
        print(f"✗ Archivo no encontrado")
        return None

    # Leer WAV con scipy
    sample_rate, data = wavfile.read(audio_path)

    # Info básica
    if len(data.shape) > 1:
        num_channels = data.shape[1]
        num_frames = data.shape[0]
    else:
        num_channels = 1
        num_frames = len(data)

    duration_sec = num_frames / sample_rate
    duration_min = duration_sec / 60
    file_size_mb = os.path.getsize(audio_path) / (1024 * 1024)

    print(f"Sample Rate:     {sample_rate} Hz")
    print(f"Channels:        {num_channels}")
    print(f"Total Frames:    {num_frames:,}")
    print(f"Duration:        {duration_sec:.1f}s ({duration_min:.1f} min)")
    print(f"File Size:       {file_size_mb:.2f} MB")

    # Verificaciones
    print("\nVerificaciones:")

    warnings = []

    if sample_rate < 22050:
        warnings.append(f"Sample rate bajo ({sample_rate} Hz)")
    else:
        print(f"  ✓ Sample rate OK ({sample_rate} Hz)")

    if num_channels > 1:
        print(f"  ℹ️  Estéreo ({num_channels} canales)")
    else:
        print(f"  ✓ Mono")

    if file_size_mb > 500:
        warnings.append(f"Archivo muy grande ({file_size_mb:.1f} MB)")
    else:
        print(f"  ✓ Tamaño manejable ({file_size_mb:.1f} MB)")

    if warnings:
        print("\n⚠️  Advertencias:")
        for w in warnings:
            print(f"    - {w}")

    print("=" * 60)

    return {
        "sample_rate": sample_rate,
        "channels": num_channels,
        "duration_sec": duration_sec,
        "file_size_mb": file_size_mb,
        "path": str(audio_path)
    }


def main():
    """Ejecuta setup completo."""
    print("=" * 60)
    print("KEPLER vs VOYAGER - Fase 0: Setup")
    print("=" * 60)

    # 1. Verificar dependencias
    if not check_dependencies():
        sys.exit(1)

    # 2. Crear directorios
    print("\nCreando directorios...")
    OUTPUTS_DIR.mkdir(parents=True, exist_ok=True)
    print(f"  ✓ {OUTPUTS_DIR}")

    # 3. Descargar audio
    print("\n" + "=" * 60)
    mp3_path = download_audio("jupiter")

    if not mp3_path:
        print("✗ No se pudo descargar el audio")
        sys.exit(1)

    # 4. Convertir a WAV
    wav_path = convert_to_wav(mp3_path)

    if not wav_path:
        print("✗ No se pudo convertir el audio")
        sys.exit(1)

    # 5. Verificar audio
    info = verify_audio(wav_path)

    if info:
        print("\n✓ FASE 0 COMPLETADA")
        print(f"\nPróximo paso: python analysis/01_spectral_analysis.py")
    else:
        print("\n✗ Error en verificación")
        sys.exit(1)


if __name__ == "__main__":
    main()
