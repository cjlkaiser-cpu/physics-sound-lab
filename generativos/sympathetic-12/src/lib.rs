//! # Sympathetic 12
//!
//! Physical modeling synthesizer with 12 sympathetically resonating strings.
//! Each string corresponds to a pitch class (C=0 through B=11).
//!
//! ## Architecture
//!
//! ```text
//! ┌─────────────────────────────────────────────────────────────┐
//! │                    SYMPATHETIC 12                            │
//! ├─────────────────────────────────────────────────────────────┤
//! │  String 0 (C)  ════════════════════════════════════════     │
//! │  String 1 (C#) ════════════════════════════════════════     │
//! │  String 2 (D)  ════════════════════════════════════════     │
//! │  ...                                                         │
//! │  String 11 (B) ════════════════════════════════════════     │
//! │                          │                                   │
//! │                          ▼                                   │
//! │              ┌─────────────────────┐                        │
//! │              │ Sympathetic Matrix  │                        │
//! │              │      12 × 12        │                        │
//! │              └──────────┬──────────┘                        │
//! │                         │                                    │
//! │                         ▼                                    │
//! │              ┌─────────────────────┐                        │
//! │              │    FDN Reverb       │                        │
//! │              └──────────┬──────────┘                        │
//! │                         │                                    │
//! │                         ▼                                    │
//! │                    [Output L/R]                              │
//! └─────────────────────────────────────────────────────────────┘
//! ```

use wasm_bindgen::prelude::*;

mod string;
mod voice;
mod resonance;
mod reverb;
mod filters;

use string::KarplusStrong;
use voice::VoicePool;
use resonance::SympatheticMatrix;
use reverb::FDNReverb;

// Constants
pub const NUM_STRINGS: usize = 12;
pub const MAX_VOICES: usize = 128;
pub const SAMPLE_RATE: f32 = 44100.0;

/// Pitch class names for display
pub const PC_NAMES: [&str; 12] = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

/// Convert pitch class + octave to frequency in Hz
#[inline]
pub fn pc_to_freq(pitch_class: usize, octave: i32) -> f32 {
    let midi_note = (pitch_class as i32) + ((octave + 1) * 12);
    440.0 * 2.0_f32.powf((midi_note as f32 - 69.0) / 12.0)
}

/// Main synthesizer engine
#[wasm_bindgen]
pub struct Sympathetic12 {
    /// The 12 Karplus-Strong strings
    strings: Vec<KarplusStrong>,

    /// Voice pool for polyphony
    voice_pool: VoicePool,

    /// Sympathetic resonance matrix
    sympathy: SympatheticMatrix,

    /// Reverb processor
    reverb: FDNReverb,

    /// Master volume (0-1)
    master_volume: f32,

    /// Reverb wet/dry mix (0-1)
    reverb_mix: f32,

    /// Base octave for string tuning
    base_octave: i32,

    /// Sympathetic resonance amount (0-1)
    sympathy_amount: f32,

    /// Output buffer for stereo samples
    output_left: Vec<f32>,
    output_right: Vec<f32>,

    /// String output buffer (for visualization)
    string_outputs: Vec<f32>,

    /// String energy levels (for visualization)
    string_energies: Vec<f32>,
}

#[wasm_bindgen]
impl Sympathetic12 {
    /// Create a new Sympathetic12 synthesizer
    #[wasm_bindgen(constructor)]
    pub fn new() -> Sympathetic12 {
        // Set up panic hook for better error messages
        #[cfg(feature = "console_error_panic_hook")]
        console_error_panic_hook::set_once();

        let base_octave = 3; // C3 = 130.81 Hz

        // Create 12 strings, one for each pitch class
        let strings: Vec<KarplusStrong> = (0..NUM_STRINGS)
            .map(|pc| {
                let freq = pc_to_freq(pc, base_octave);
                KarplusStrong::new(freq, SAMPLE_RATE)
            })
            .collect();

        Sympathetic12 {
            strings,
            voice_pool: VoicePool::new(MAX_VOICES),
            sympathy: SympatheticMatrix::new(),
            reverb: FDNReverb::new(SAMPLE_RATE),
            master_volume: 0.7,
            reverb_mix: 0.25,
            base_octave,
            sympathy_amount: 0.4,
            output_left: vec![0.0; 128],
            output_right: vec![0.0; 128],
            string_outputs: vec![0.0; NUM_STRINGS],
            string_energies: vec![0.0; NUM_STRINGS],
        }
    }

    /// Pluck a string (pitch_class 0-11, velocity 0-1, position 0-1)
    #[wasm_bindgen]
    pub fn pluck(&mut self, pitch_class: usize, velocity: f32, position: f32) {
        if pitch_class >= NUM_STRINGS {
            return;
        }

        // Allocate a voice
        if let Some(voice_id) = self.voice_pool.allocate(pitch_class) {
            // Excite the string
            self.strings[pitch_class].pluck(velocity, position);

            // Record voice assignment
            self.voice_pool.set_active(voice_id, pitch_class, velocity);
        }
    }

    /// Pluck multiple strings (for set classes)
    #[wasm_bindgen]
    pub fn pluck_set(&mut self, pitch_classes: &[u8], velocity: f32, position: f32) {
        for &pc in pitch_classes {
            self.pluck(pc as usize, velocity, position);
        }
    }

    /// Pluck a Forte set class by prime form
    #[wasm_bindgen]
    pub fn pluck_prime_form(&mut self, prime_form: &[u8], transposition: u8, velocity: f32) {
        for &pc in prime_form {
            let transposed = ((pc as usize) + (transposition as usize)) % 12;
            self.pluck(transposed, velocity, 0.5);
        }
    }

    /// Damp a specific string
    #[wasm_bindgen]
    pub fn damp(&mut self, pitch_class: usize, amount: f32) {
        if pitch_class < NUM_STRINGS {
            self.strings[pitch_class].damp(amount);
        }
    }

    /// Damp all strings
    #[wasm_bindgen]
    pub fn damp_all(&mut self, amount: f32) {
        for string in &mut self.strings {
            string.damp(amount);
        }
    }

    /// Process a block of audio samples
    /// Returns interleaved stereo samples [L, R, L, R, ...]
    #[wasm_bindgen]
    pub fn process(&mut self, num_samples: usize) -> Vec<f32> {
        // Resize output buffers if needed
        if self.output_left.len() < num_samples {
            self.output_left.resize(num_samples, 0.0);
            self.output_right.resize(num_samples, 0.0);
        }

        // Clear output buffers
        for i in 0..num_samples {
            self.output_left[i] = 0.0;
            self.output_right[i] = 0.0;
        }

        // Process each sample
        for i in 0..num_samples {
            // Get sympathetic excitation based on previous string outputs and energies
            let excitation = self.sympathy.process(&self.string_outputs, &self.string_energies, self.sympathy_amount);

            // Process each string with sympathetic excitation
            for s in 0..NUM_STRINGS {
                self.string_outputs[s] = self.strings[s].process(excitation[s]);
                self.string_energies[s] = self.strings[s].get_energy();
                // Clamp to prevent NaN propagation
                if !self.string_outputs[s].is_finite() {
                    self.string_outputs[s] = 0.0;
                }
            }

            // Mix strings to stereo and compute mono for reverb
            let mut mono = 0.0f32;
            for s in 0..NUM_STRINGS {
                let pan = (s as f32 / 11.0) * 2.0 - 1.0;
                let left_gain = ((1.0 - pan) * 0.5).sqrt();
                let right_gain = ((1.0 + pan) * 0.5).sqrt();

                self.output_left[i] += self.string_outputs[s] * left_gain;
                self.output_right[i] += self.string_outputs[s] * right_gain;
                mono += self.string_outputs[s];
            }
            mono /= NUM_STRINGS as f32;

            // Apply reverb
            if self.reverb_mix > 0.001 {
                let (rev_l, rev_r) = self.reverb.process(mono);
                self.output_left[i] += rev_l * self.reverb_mix;
                self.output_right[i] += rev_r * self.reverb_mix;
            }

            // Apply master volume
            self.output_left[i] *= self.master_volume;
            self.output_right[i] *= self.master_volume;

            // Soft clipping only at peaks (gentle, preserves dynamics)
            if self.output_left[i].abs() > 0.95 {
                self.output_left[i] = self.output_left[i].signum() * (0.95 + (self.output_left[i].abs() - 0.95).tanh() * 0.05);
            }
            if self.output_right[i].abs() > 0.95 {
                self.output_right[i] = self.output_right[i].signum() * (0.95 + (self.output_right[i].abs() - 0.95).tanh() * 0.05);
            }

            // Final safety clamp and NaN check
            if self.output_left[i].is_finite() {
                self.output_left[i] = self.output_left[i].clamp(-1.0, 1.0);
            } else {
                self.output_left[i] = 0.0;
            }
            if self.output_right[i].is_finite() {
                self.output_right[i] = self.output_right[i].clamp(-1.0, 1.0);
            } else {
                self.output_right[i] = 0.0;
            }
        }

        // Return interleaved stereo
        let mut output = Vec::with_capacity(num_samples * 2);
        for i in 0..num_samples {
            output.push(self.output_left[i]);
            output.push(self.output_right[i]);
        }
        output
    }

    // ========================================================================
    // Parameter setters
    // ========================================================================

    /// Set master volume (0-1)
    #[wasm_bindgen]
    pub fn set_master_volume(&mut self, volume: f32) {
        self.master_volume = volume.clamp(0.0, 1.0);
    }

    /// Set reverb mix (0-1)
    #[wasm_bindgen]
    pub fn set_reverb_mix(&mut self, mix: f32) {
        self.reverb_mix = mix.clamp(0.0, 1.0);
    }

    /// Set reverb room size (0-1)
    #[wasm_bindgen]
    pub fn set_reverb_size(&mut self, size: f32) {
        self.reverb.set_room_size(size);
    }

    /// Set reverb damping (0-1)
    #[wasm_bindgen]
    pub fn set_reverb_damping(&mut self, damping: f32) {
        self.reverb.set_damping(damping);
    }

    /// Set sympathetic resonance amount (0-1)
    #[wasm_bindgen]
    pub fn set_sympathy_amount(&mut self, amount: f32) {
        self.sympathy_amount = amount.clamp(0.0, 1.0);
    }

    /// Set global damping for all strings (0-1)
    #[wasm_bindgen]
    pub fn set_global_damping(&mut self, damping: f32) {
        for string in &mut self.strings {
            string.set_damping(damping);
        }
    }

    /// Set global brightness for all strings (0-1)
    #[wasm_bindgen]
    pub fn set_global_brightness(&mut self, brightness: f32) {
        for string in &mut self.strings {
            string.set_brightness(brightness);
        }
    }

    /// Set damping for a specific string
    #[wasm_bindgen]
    pub fn set_string_damping(&mut self, pitch_class: usize, damping: f32) {
        if pitch_class < NUM_STRINGS {
            self.strings[pitch_class].set_damping(damping);
        }
    }

    /// Set base octave (affects all string frequencies)
    #[wasm_bindgen]
    pub fn set_base_octave(&mut self, octave: i32) {
        self.base_octave = octave.clamp(1, 6);
        for (pc, string) in self.strings.iter_mut().enumerate() {
            let freq = pc_to_freq(pc, self.base_octave);
            string.set_frequency(freq);
        }
    }

    /// Retune a specific string (for microtonal exploration)
    #[wasm_bindgen]
    pub fn set_string_frequency(&mut self, pitch_class: usize, freq: f32) {
        if pitch_class < NUM_STRINGS {
            self.strings[pitch_class].set_frequency(freq);
        }
    }

    /// Set inharmonicity for a string (simulates stiff strings)
    #[wasm_bindgen]
    pub fn set_string_inharmonicity(&mut self, pitch_class: usize, inharmonicity: f32) {
        if pitch_class < NUM_STRINGS {
            self.strings[pitch_class].set_inharmonicity(inharmonicity);
        }
    }

    // ========================================================================
    // State queries (for visualization)
    // ========================================================================

    /// Get current energy level for each string (for visualization)
    #[wasm_bindgen]
    pub fn get_string_energies(&self) -> Vec<f32> {
        self.string_energies.clone()
    }

    /// Get the sympathetic coupling matrix (12x12 = 144 values, row-major)
    #[wasm_bindgen]
    pub fn get_sympathy_matrix(&self) -> Vec<f32> {
        self.sympathy.get_matrix()
    }

    /// Get current string frequencies
    #[wasm_bindgen]
    pub fn get_string_frequencies(&self) -> Vec<f32> {
        self.strings.iter().map(|s| s.get_frequency()).collect()
    }

    /// Get number of active voices
    #[wasm_bindgen]
    pub fn get_active_voice_count(&self) -> usize {
        self.voice_pool.active_count()
    }

    /// Get delay line visualization data for a string
    #[wasm_bindgen]
    pub fn get_string_waveform(&self, pitch_class: usize, num_samples: usize) -> Vec<f32> {
        if pitch_class < NUM_STRINGS {
            self.strings[pitch_class].get_waveform(num_samples)
        } else {
            vec![0.0; num_samples]
        }
    }
}

impl Default for Sympathetic12 {
    fn default() -> Self {
        Self::new()
    }
}

// ============================================================================
// Presets
// ============================================================================

#[wasm_bindgen]
impl Sympathetic12 {
    /// Preset: Piano-like (high damping, moderate sympathy)
    #[wasm_bindgen]
    pub fn preset_piano(&mut self) {
        self.set_global_damping(0.995);
        self.set_global_brightness(0.6);
        self.sympathy_amount = 0.2;
        self.reverb_mix = 0.15;
        self.reverb.set_room_size(0.4);
    }

    /// Preset: Harp-like (low damping, high sympathy)
    #[wasm_bindgen]
    pub fn preset_harp(&mut self) {
        self.set_global_damping(0.999);
        self.set_global_brightness(0.8);
        self.sympathy_amount = 0.5;
        self.reverb_mix = 0.3;
        self.reverb.set_room_size(0.6);
    }

    /// Preset: Guitar-like (medium damping, low sympathy)
    #[wasm_bindgen]
    pub fn preset_guitar(&mut self) {
        self.set_global_damping(0.997);
        self.set_global_brightness(0.5);
        self.sympathy_amount = 0.1;
        self.reverb_mix = 0.2;
        self.reverb.set_room_size(0.3);
    }

    /// Preset: Sitar-like (high sympathy, bright)
    #[wasm_bindgen]
    pub fn preset_sitar(&mut self) {
        self.set_global_damping(0.998);
        self.set_global_brightness(0.9);
        self.sympathy_amount = 0.7;
        self.reverb_mix = 0.25;
        self.reverb.set_room_size(0.5);
    }

    /// Preset: Bell-like (very low damping, high inharmonicity)
    #[wasm_bindgen]
    pub fn preset_bell(&mut self) {
        self.set_global_damping(0.9995);
        self.set_global_brightness(0.95);
        self.sympathy_amount = 0.4;
        for s in 0..NUM_STRINGS {
            self.set_string_inharmonicity(s, 0.02);
        }
        self.reverb_mix = 0.4;
        self.reverb.set_room_size(0.8);
    }

    /// Preset: Pad-like (maximum sustain and sympathy)
    #[wasm_bindgen]
    pub fn preset_pad(&mut self) {
        self.set_global_damping(0.9999);
        self.set_global_brightness(0.4);
        self.sympathy_amount = 0.9;
        self.reverb_mix = 0.6;
        self.reverb.set_room_size(0.95);
    }
}
