# Sympathetic 12

**Physical Modeling Synthesizer with 12 Sympathetically Resonating Strings**

> **Status: Beta** - All core features working. Sound quality improvements pending.

A Rust/WebAssembly synthesizer that models 12 virtual strings, one for each pitch class (C through B). When one string vibrates, the others resonate sympathetically based on their intervallic relationships.

---

## Current Status

| Feature | Status | Notes |
|---------|--------|-------|
| Karplus-Strong strings | **Working** | 12 strings, keyboard control |
| Stereo panning | **Working** | Per-string spatial placement |
| Visualization | **Working** | Energy bars, matrix, spectrum |
| Sympathetic Matrix | **Working** | 12×12 interval-based coupling |
| FDN Reverb | **Working** | Schroeder/Moorer algorithm |
| Presets | **Working** | Harp, Piano, Guitar, Sitar, Bell, Pad |

See [TODO.md](TODO.md) for roadmap.

---

## Demo

```bash
cd web
python3 -m http.server 8080
open http://localhost:8080
```

---

## Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                       SYMPATHETIC 12                              │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│   String 0 (C)  ══════════════════════════════════════           │
│   String 1 (C#) ══════════════════════════════════════           │
│   String 2 (D)  ══════════════════════════════════════           │
│   String 3 (D#) ══════════════════════════════════════           │
│   String 4 (E)  ══════════════════════════════════════           │
│   String 5 (F)  ══════════════════════════════════════           │
│   String 6 (F#) ══════════════════════════════════════           │
│   String 7 (G)  ══════════════════════════════════════           │
│   String 8 (G#) ══════════════════════════════════════           │
│   String 9 (A)  ══════════════════════════════════════           │
│   String 10(A#) ══════════════════════════════════════           │
│   String 11(B)  ══════════════════════════════════════           │
│                              │                                    │
│                              ▼                                    │
│               ┌────────────────────────┐                         │
│               │   Sympathetic Matrix   │                         │
│               │        12 × 12         │                         │
│               └───────────┬────────────┘                         │
│                           │                                       │
│                           ▼                                       │
│               ┌────────────────────────┐                         │
│               │      FDN Reverb        │                         │
│               │   (8 comb + 4 allpass) │                         │
│               └───────────┬────────────┘                         │
│                           │                                       │
│                           ▼                                       │
│                    [ Stereo Output ]                              │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

---

## Features

### Karplus-Strong String Synthesis
- Delay line with fractional interpolation for precise tuning
- One-pole lowpass damping filter
- Allpass filter for fractional delay
- DC blocking
- Variable pluck position simulation
- Inharmonicity control (for bell-like tones)

### Sympathetic Resonance
- 12×12 coupling matrix based on interval relationships
- Configurable coupling strengths per interval
- Presets: Piano, Sitar, Chromatic, Pentatonic, Whole-tone

### Polyphony
- 128-voice polyphony with voice stealing
- Per-voice envelope and parameters

### Reverb
- Feedback Delay Network (Schroeder/Moorer algorithm)
- 8 parallel comb filters with prime delays
- 4 series allpass diffusers
- Configurable room size and damping
- Stereo output with width control

### Presets
| Preset | Character |
|--------|-----------|
| **Harp** | Low damping, high sympathy, lush reverb |
| **Piano** | Higher damping, moderate sympathy |
| **Guitar** | Medium damping, low sympathy |
| **Sitar** | High sympathy, bright, resonant |
| **Bell** | Very low damping, high inharmonicity |
| **Pad** | Maximum sustain, maximum sympathy, huge reverb |

---

## Keyboard Mapping

```
       W   E       T   Y   U
       C#  D#      F#  G#  A#
     ┌───┬───┐   ┌───┬───┬───┐
     │ 1 │ 3 │   │ 6 │ 8 │ 10│
   ┌─┴─┬─┴─┬─┴─┬─┴─┬─┴─┬─┴─┬─┴─┐
   │ A │ S │ D │ F │ G │ H │ J │
   │ C │ D │ E │ F │ G │ A │ B │
   │ 0 │ 2 │ 4 │ 5 │ 7 │ 9 │11 │
   └───┴───┴───┴───┴───┴───┴───┘

   Space: Damp all strings
```

---

## Technical Details

### WASM Module Size
- **58 KB** (optimized with wasm-opt -O4)

### Performance
- Sample rate: 44100 Hz
- Buffer size: 256 samples
- Latency: ~5.8 ms

### Dependencies (Rust)
- `wasm-bindgen` - JS/WASM interop
- `js-sys` - JavaScript bindings
- `console_error_panic_hook` - Better error messages
- `getrandom` - Random number generation

---

## Building from Source

### Prerequisites
```bash
# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Install wasm-pack
cargo install wasm-pack

# Add WASM target
rustup target add wasm32-unknown-unknown
```

### Build
```bash
cd sympathetic-12
wasm-pack build --target web --release

# Copy to web folder
cp -r pkg web/
```

### Run
```bash
cd web
python3 -m http.server 8080
```

---

## Project Structure

```
sympathetic-12/
├── Cargo.toml              # Rust project config
├── src/
│   ├── lib.rs              # Main WASM entry point
│   ├── string.rs           # Karplus-Strong string model
│   ├── voice.rs            # Voice allocation
│   ├── resonance.rs        # Sympathetic resonance matrix
│   ├── reverb.rs           # FDN reverb
│   └── filters.rs          # DSP filters
├── web/
│   ├── index.html          # Main UI
│   ├── js/
│   │   ├── audio-processor.js   # Web Audio integration
│   │   └── visualization.js     # Canvas rendering
│   └── pkg/                # WASM output (generated)
├── pkg/                    # wasm-pack output
└── README.md
```

---

## Interval Coupling (Default)

| Interval | Semitones | Coupling |
|----------|-----------|----------|
| Unison | 0 | 1.00 |
| Minor 2nd | 1 | 0.05 |
| Major 2nd | 2 | 0.15 |
| Minor 3rd | 3 | 0.25 |
| Major 3rd | 4 | 0.30 |
| Perfect 4th | 5 | 0.45 |
| Tritone | 6 | 0.10 |
| **Perfect 5th** | 7 | **0.60** |
| Minor 6th | 8 | 0.25 |
| Major 6th | 9 | 0.20 |
| Minor 7th | 10 | 0.10 |
| Major 7th | 11 | 0.15 |

---

## API Reference

### Plucking
```javascript
synth.pluck(pitchClass, velocity, position);  // Single string
synth.pluck_set([0, 4, 7], velocity, position); // Chord
synth.pluck_prime_form([0, 3, 7], transposition, velocity); // Set class
```

### Parameters
```javascript
synth.set_global_damping(0.998);      // 0.99 - 0.9999
synth.set_global_brightness(0.5);      // 0 - 1
synth.set_sympathy_amount(0.3);        // 0 - 1
synth.set_reverb_mix(0.25);            // 0 - 1
synth.set_reverb_size(0.5);            // 0 - 1
synth.set_base_octave(3);              // 1 - 6
synth.set_string_inharmonicity(0, 0.02); // Per-string
```

### Presets
```javascript
synth.preset_piano();
synth.preset_harp();
synth.preset_guitar();
synth.preset_sitar();
synth.preset_bell();
synth.preset_pad();
```

### Visualization Data
```javascript
const energies = synth.get_string_energies();     // [12] floats
const matrix = synth.get_sympathy_matrix();       // [144] floats
const waveform = synth.get_string_waveform(0, 128); // [128] floats
const voices = synth.get_active_voice_count();    // number
```

---

## Theoretical Background

### Sympathetic Resonance
In acoustic instruments like piano, sitar, and hardingfele, undamped strings vibrate in response to other played strings. This phenomenon occurs when:

1. The exciting frequency is a harmonic of the resonating string
2. The two strings share common harmonics
3. Energy is transferred through the bridge/body

In **Sympathetic 12**, we model this as a coupling matrix where each entry represents how strongly string `i` excites string `j`. The coupling is based on music-theoretic interval relationships, with perfect consonances (P5, P4) coupling strongly and dissonances (m2, tritone) coupling weakly.

### Karplus-Strong Algorithm
The Karplus-Strong algorithm (1983) simulates plucked strings using:
1. A delay line filled with initial excitation (noise or impulse)
2. A lowpass filter in the feedback loop (simulates energy loss)
3. The delay length determines the pitch

Extensions in this implementation:
- **Fractional delay** via allpass interpolation for precise tuning
- **Variable damping** for timbral control
- **Pluck position** affects initial harmonic content
- **Inharmonicity** for metallic/bell tones

---

## License

MIT

---

## Author

**Carlos Lorente Kaiser**

Part of [EigenLab](https://github.com/cjlkaiser-cpu/EigenLab) - Interactive scientific simulations.
