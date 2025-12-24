# Sympathetic 12 - Roadmap

## Priority 1: Recover Harmonic Richness

The original unstable version had a magical sound quality that was lost during stabilization fixes. The current version is stable but sounds simpler/thinner.

### Investigation needed:
- [ ] Compare original `pluck()` algorithm vs current simplified version
- [ ] Original had complex comb filter reading from delay_line during generation
- [ ] The instability might have been adding desirable artifacts (similar to analog gear)
- [ ] Test intermediate feedback values in pluck comb filter

### Potential improvements:
- [ ] Add second-pass comb filter for richer harmonics
- [ ] Experiment with noise shaping (pink noise vs white noise)
- [ ] Add subtle nonlinearity/saturation in the feedback loop
- [ ] Try different allpass interpolation coefficients
- [ ] Add body resonance simulation (formant filter)

---

## Priority 2: Sound Design Enhancements

### String Model
- [ ] Variable pluck position with more dramatic effect
- [ ] Velocity-to-brightness curve refinement
- [ ] Per-string inharmonicity presets
- [ ] Sustain pedal mode (undamp all strings)

### Sympathetic Resonance
- [ ] Adjustable coupling matrix presets in UI
- [ ] Visualize energy flow between strings
- [ ] Higher coupling values for more dramatic effect
- [ ] Experiment with non-linear coupling

### Reverb
- [ ] Add pre-delay control
- [ ] Early reflections modeling
- [ ] Modulated delay times for chorus-like width

---

## Priority 3: Features

### Audio
- [ ] MIDI input support
- [ ] Audio export (WAV/MP3)
- [ ] Custom tuning systems (just intonation, Pythagorean)
- [ ] Microtuning per string

### UI/UX
- [ ] Touch/mobile support
- [ ] Preset save/load to localStorage
- [ ] Waveform display per string
- [ ] Real-time spectrum per string

### Visualization
- [ ] 3D string visualization option (Three.js)
- [ ] Sympathetic energy flow animation
- [ ] Piano-roll style note display

---

## Completed

### v0.2.0 (Current)
- [x] Fix DC blocker (was causing 99x gain explosion)
- [x] Fix pluck() buffer corruption (read/write same buffer)
- [x] Add soft limiter with knee
- [x] Re-enable sympathetic resonance with safety clamps
- [x] Re-enable FDN reverb with NaN protection
- [x] Stabilize all audio processing

### v0.1.0
- [x] Basic Karplus-Strong synthesis
- [x] 12 strings with keyboard control
- [x] Stereo panning
- [x] Visualization (energy bars, string lines)

---

## Technical Debt

- [ ] Split `lib.rs` into smaller modules
- [ ] Add unit tests for DSP functions
- [ ] Benchmark WASM vs JS performance
- [ ] Remove unused code warnings
- [ ] Add LICENSE file

---

## Notes

### What made the original sound special?

The original unstable version had:
1. Complex comb filter in `pluck()` that read from delay_line during generation
2. Possibly higher feedback values somewhere
3. The DC blocker bug (99x gain) might have added harmonic distortion
4. No output limiting - allowing natural peaks

The "magic" might have been:
- Subtle distortion from the broken DC blocker
- Richer initial excitation from the complex pluck
- Higher energy transfer in sympathetic matrix
- No compression from the limiter

### Approach to recover
1. Add optional "analog warmth" saturation
2. Increase pluck complexity without breaking stability
3. Make limiter threshold adjustable
4. Add subtle harmonic exciter
