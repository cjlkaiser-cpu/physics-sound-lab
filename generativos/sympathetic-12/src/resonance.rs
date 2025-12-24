//! Sympathetic Resonance Matrix
//!
//! Models the coupling between strings based on their interval relationships.
//! When one string vibrates, it excites other strings proportionally to
//! their harmonic relationship.
//!
//! ## Physical Basis
//!
//! In real instruments like pianos and sitars, undamped strings resonate
//! sympathetically with played strings. The coupling strength depends on:
//!
//! 1. **Interval relationship** - Perfect intervals (octave, fifth) couple strongly
//! 2. **Frequency ratio** - Simple ratios (2:1, 3:2) resonate more
//! 3. **Energy transfer** - Proportional to amplitude of source string
//!
//! ## Implementation
//!
//! A 12×12 matrix where entry [i][j] represents how much string i
//! excites string j. Values are based on psychoacoustic consonance.

use crate::NUM_STRINGS;

/// Sympathetic resonance matrix
pub struct SympatheticMatrix {
    /// 12×12 coupling matrix
    /// matrix[source][target] = coupling strength
    matrix: [[f32; NUM_STRINGS]; NUM_STRINGS],

    /// Resonance buffers for each string
    resonance_buffers: [f32; NUM_STRINGS],

    /// Smoothing coefficient for resonance buildup
    smoothing: f32,
}

impl SympatheticMatrix {
    /// Create a new sympathetic matrix with default interval-based coupling
    pub fn new() -> Self {
        let mut matrix = [[0.0; NUM_STRINGS]; NUM_STRINGS];

        // Coupling strengths based on interval class
        // Balanced values - rich but stable
        let interval_coupling = [
            1.0,   // 0: Unison (maximum coupling)
            0.08,  // 1: Minor second
            0.20,  // 2: Major second
            0.35,  // 3: Minor third
            0.40,  // 4: Major third
            0.55,  // 5: Perfect fourth
            0.15,  // 6: Tritone
            0.70,  // 7: Perfect fifth
            0.35,  // 8: Minor sixth
            0.30,  // 9: Major sixth
            0.15,  // 10: Minor seventh
            0.18,  // 11: Major seventh
        ];

        // Fill the matrix symmetrically
        for source in 0..NUM_STRINGS {
            for target in 0..NUM_STRINGS {
                let interval = (target as i32 - source as i32).rem_euclid(12) as usize;
                matrix[source][target] = interval_coupling[interval];
            }
        }

        SympatheticMatrix {
            matrix,
            resonance_buffers: [0.0; NUM_STRINGS],
            smoothing: 0.999, // Slow buildup and decay
        }
    }

    /// Process string outputs and return sympathetic excitation for each string
    ///
    /// # Arguments
    /// * `string_outputs` - Current output sample from each string
    /// * `string_energies` - Energy level of each string (for gating)
    /// * `amount` - Overall sympathetic resonance amount (0-1)
    ///
    /// # Returns
    /// Excitation signal for each string
    pub fn process(&mut self, string_outputs: &[f32], string_energies: &[f32], amount: f32) -> [f32; NUM_STRINGS] {
        let mut excitation = [0.0f32; NUM_STRINGS];

        // Energy gate threshold - only couple if source has real energy
        let energy_gate = 0.01;

        // Very small scale - resonance builds up naturally over many cycles
        // The delay line filters out non-resonant frequencies automatically
        let scale = amount * 0.002;

        // For each source string
        for source in 0..NUM_STRINGS {
            // Gate: only couple if source is actually vibrating
            if string_energies[source] < energy_gate {
                continue;
            }

            let source_signal = string_outputs[source];

            // Excite target strings based on coupling matrix
            for target in 0..NUM_STRINGS {
                if source != target {
                    let coupling = self.matrix[source][target];
                    excitation[target] += source_signal * coupling * scale;
                }
            }
        }

        // Direct output - no smoothing buffer (the delay line does the filtering)
        // Just safety clamp
        for i in 0..NUM_STRINGS {
            excitation[i] = excitation[i].clamp(-0.1, 0.1);

            if !excitation[i].is_finite() {
                excitation[i] = 0.0;
            }
        }

        excitation
    }

    /// Get the raw coupling matrix (for visualization)
    pub fn get_matrix(&self) -> Vec<f32> {
        let mut flat = Vec::with_capacity(NUM_STRINGS * NUM_STRINGS);
        for row in &self.matrix {
            flat.extend_from_slice(row);
        }
        flat
    }

    /// Set coupling strength for a specific interval
    pub fn set_interval_coupling(&mut self, interval: usize, strength: f32) {
        if interval >= 12 {
            return;
        }

        let strength = strength.clamp(0.0, 1.0);

        // Update all entries with this interval
        for source in 0..NUM_STRINGS {
            for target in 0..NUM_STRINGS {
                let current_interval = (target as i32 - source as i32).rem_euclid(12) as usize;
                if current_interval == interval {
                    self.matrix[source][target] = strength;
                }
            }
        }
    }

    /// Set custom coupling between two specific strings
    pub fn set_coupling(&mut self, source: usize, target: usize, strength: f32) {
        if source < NUM_STRINGS && target < NUM_STRINGS {
            self.matrix[source][target] = strength.clamp(0.0, 1.0);
        }
    }

    /// Reset the matrix to default interval-based coupling
    pub fn reset_to_default(&mut self) {
        *self = Self::new();
    }

    /// Set smoothing coefficient (affects resonance buildup speed)
    pub fn set_smoothing(&mut self, smoothing: f32) {
        self.smoothing = smoothing.clamp(0.9, 0.9999);
    }

    /// Clear resonance buffers
    pub fn clear(&mut self) {
        self.resonance_buffers = [0.0; NUM_STRINGS];
    }
}

impl Default for SympatheticMatrix {
    fn default() -> Self {
        Self::new()
    }
}

/// Presets for sympathetic matrix
impl SympatheticMatrix {
    /// Piano-like coupling (mainly octaves and fifths)
    pub fn preset_piano(&mut self) {
        self.set_interval_coupling(0, 1.0);   // Unison
        self.set_interval_coupling(7, 0.5);   // Fifth
        self.set_interval_coupling(5, 0.3);   // Fourth
        self.set_interval_coupling(4, 0.2);   // Major third
        self.set_interval_coupling(3, 0.15);  // Minor third
        // Others minimal
        self.set_interval_coupling(1, 0.02);
        self.set_interval_coupling(2, 0.05);
        self.set_interval_coupling(6, 0.02);
        self.set_interval_coupling(8, 0.1);
        self.set_interval_coupling(9, 0.08);
        self.set_interval_coupling(10, 0.03);
        self.set_interval_coupling(11, 0.03);
    }

    /// Sitar-like coupling (strong sympathetic strings)
    pub fn preset_sitar(&mut self) {
        self.set_interval_coupling(0, 1.0);   // Unison
        self.set_interval_coupling(7, 0.8);   // Fifth (very strong)
        self.set_interval_coupling(5, 0.7);   // Fourth
        self.set_interval_coupling(4, 0.5);   // Major third
        self.set_interval_coupling(3, 0.4);   // Minor third
        self.set_interval_coupling(9, 0.35);  // Major sixth
        self.set_interval_coupling(2, 0.25);  // Major second
        self.set_interval_coupling(10, 0.2);  // Minor seventh
        self.set_interval_coupling(8, 0.3);   // Minor sixth
        self.set_interval_coupling(1, 0.1);   // Minor second
        self.set_interval_coupling(6, 0.15);  // Tritone
        self.set_interval_coupling(11, 0.1);  // Major seventh
    }

    /// Chromatic coupling (all intervals equal)
    pub fn preset_chromatic(&mut self) {
        for i in 0..12 {
            self.set_interval_coupling(i, if i == 0 { 1.0 } else { 0.3 });
        }
    }

    /// Pentatonic coupling (only pentatonic intervals)
    pub fn preset_pentatonic(&mut self) {
        // Clear all
        for i in 0..12 {
            self.set_interval_coupling(i, 0.0);
        }
        // Pentatonic intervals: 0, 2, 4, 7, 9
        self.set_interval_coupling(0, 1.0);
        self.set_interval_coupling(2, 0.5);
        self.set_interval_coupling(4, 0.5);
        self.set_interval_coupling(7, 0.6);
        self.set_interval_coupling(9, 0.4);
        // Also their inversions
        self.set_interval_coupling(5, 0.6);  // Inversion of 7
        self.set_interval_coupling(8, 0.5);  // Inversion of 4
        self.set_interval_coupling(10, 0.5); // Inversion of 2
        self.set_interval_coupling(3, 0.4);  // Inversion of 9
    }

    /// Whole-tone coupling
    pub fn preset_whole_tone(&mut self) {
        for i in 0..12 {
            self.set_interval_coupling(i, 0.0);
        }
        // Whole-tone intervals: 0, 2, 4, 6, 8, 10
        self.set_interval_coupling(0, 1.0);
        self.set_interval_coupling(2, 0.5);
        self.set_interval_coupling(4, 0.5);
        self.set_interval_coupling(6, 0.4);
        self.set_interval_coupling(8, 0.5);
        self.set_interval_coupling(10, 0.5);
    }
}
