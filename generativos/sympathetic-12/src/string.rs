//! Karplus-Strong string synthesis with extensions
//!
//! The Karplus-Strong algorithm models a plucked string using:
//! 1. A delay line whose length determines the pitch
//! 2. A lowpass filter in the feedback loop (energy loss)
//! 3. An initial excitation (burst of noise or shaped impulse)
//!
//! Extensions implemented:
//! - Fractional delay via allpass interpolation (precise tuning)
//! - Variable damping and brightness controls
//! - Pluck position simulation
//! - Inharmonicity for bell-like tones

use crate::filters::{OnePole, Allpass, DCBlocker};
use crate::SAMPLE_RATE;

/// Maximum delay line length (supports frequencies down to ~20 Hz)
const MAX_DELAY_LENGTH: usize = 4096;

/// Karplus-Strong string model
pub struct KarplusStrong {
    /// Circular delay line buffer
    delay_line: Vec<f32>,

    /// Current write position in delay line
    write_pos: usize,

    /// Integer part of delay length
    delay_length: usize,

    /// Fractional delay for precise tuning
    fractional_delay: f32,

    /// Current frequency in Hz
    frequency: f32,

    /// Feedback coefficient (affects sustain)
    feedback: f32,

    /// Damping filter (lowpass in feedback)
    damping_filter: OnePole,

    /// Allpass filter for fractional delay interpolation
    allpass: Allpass,

    /// DC blocking filter
    dc_blocker: DCBlocker,

    /// Brightness control (0-1)
    brightness: f32,

    /// Damping control (0-1, higher = longer sustain)
    damping: f32,

    /// Inharmonicity coefficient (for bell-like tones)
    inharmonicity: f32,

    /// Current energy level (for visualization)
    energy: f32,

    /// Energy decay rate for visualization
    energy_decay: f32,

    /// Noise generator state (simple LCG)
    noise_state: u32,
}

impl KarplusStrong {
    /// Create a new Karplus-Strong string tuned to the given frequency
    pub fn new(frequency: f32, sample_rate: f32) -> Self {
        let mut string = KarplusStrong {
            delay_line: vec![0.0; MAX_DELAY_LENGTH],
            write_pos: 0,
            delay_length: 0,
            fractional_delay: 0.0,
            frequency,
            feedback: 0.998,
            damping_filter: OnePole::new(0.5),
            allpass: Allpass::new(0.5),
            dc_blocker: DCBlocker::new(10.0, sample_rate),
            brightness: 0.5,
            damping: 0.998,
            inharmonicity: 0.0,
            energy: 0.0,
            energy_decay: 0.9995,
            noise_state: 12345,
        };
        string.set_frequency(frequency);
        string
    }

    /// Set the string frequency
    pub fn set_frequency(&mut self, frequency: f32) {
        self.frequency = frequency.max(20.0).min(SAMPLE_RATE / 2.0);

        // Calculate delay length
        let total_delay = SAMPLE_RATE / self.frequency;

        // Account for filter delays
        let filter_delay = 0.5; // Approximate delay from filters
        let adjusted_delay = total_delay - filter_delay;

        self.delay_length = adjusted_delay.floor() as usize;
        self.fractional_delay = adjusted_delay - self.delay_length as f32;

        // Clamp delay length
        self.delay_length = self.delay_length.min(MAX_DELAY_LENGTH - 1).max(2);

        // Update allpass coefficient for fractional delay
        // Thiran allpass: coef = (1 - d) / (1 + d) where d is fractional delay
        let d = self.fractional_delay;
        let coef = (1.0 - d) / (1.0 + d);
        self.allpass.set_coefficient(coef);
    }

    /// Get current frequency
    pub fn get_frequency(&self) -> f32 {
        self.frequency
    }

    /// Set damping (0-1, higher = longer sustain)
    pub fn set_damping(&mut self, damping: f32) {
        self.damping = damping.clamp(0.9, 0.9999);
        self.feedback = self.damping;
    }

    /// Set brightness (0-1)
    pub fn set_brightness(&mut self, brightness: f32) {
        self.brightness = brightness.clamp(0.0, 1.0);
        // Adjust damping filter cutoff based on brightness
        let cutoff = 0.2 + brightness * 0.6; // Range: 0.2 to 0.8
        self.damping_filter.set_coefficient(cutoff);
    }

    /// Set inharmonicity (for bell-like tones)
    pub fn set_inharmonicity(&mut self, inharmonicity: f32) {
        self.inharmonicity = inharmonicity.clamp(0.0, 0.1);
    }

    /// Pluck the string with given velocity and position
    ///
    /// - velocity: 0-1, affects amplitude and brightness
    /// - position: 0-1, where 0.5 is center of string
    pub fn pluck(&mut self, velocity: f32, position: f32) {
        let velocity = velocity.clamp(0.0, 1.0);
        let position = position.clamp(0.05, 0.95);

        // Generate excitation signal in separate buffer (never read from delay_line here)
        let mut excitation = vec![0.0f32; self.delay_length];

        // Fill with noise scaled by velocity (higher amplitude for richer sound)
        for i in 0..self.delay_length {
            excitation[i] = self.next_noise() * velocity;
        }

        // === Primary comb filter (pluck position) ===
        // Plucking at position P removes harmonics at 1/P, 2/P, 3/P...
        let comb_period = (self.delay_length as f32 * position) as usize;
        let comb_period = comb_period.max(1).min(self.delay_length - 1);

        let mut temp = excitation.clone();
        for i in comb_period..self.delay_length {
            temp[i] = excitation[i] - excitation[i - comb_period] * 0.85;
        }
        excitation = temp;

        // === Secondary comb filter (body resonance) ===
        // Simulates the instrument body - adds warmth
        let body_period = (self.delay_length / 3).max(2);
        let mut temp2 = excitation.clone();
        for i in body_period..self.delay_length {
            temp2[i] = excitation[i] + excitation[i - body_period] * 0.45;
        }
        excitation = temp2;

        // === Tertiary comb (octave harmonic enhancement) ===
        let octave_period = (self.delay_length / 2).max(2);
        let mut temp3 = excitation.clone();
        for i in octave_period..self.delay_length {
            temp3[i] = excitation[i] + excitation[i - octave_period] * 0.2;
        }
        excitation = temp3;

        // === Velocity-dependent brightness ===
        let num_passes = if velocity < 0.3 { 2 } else if velocity < 0.6 { 1 } else { 0 };

        for _ in 0..num_passes {
            let mut prev = 0.0f32;
            let smooth = 0.3 * (1.0 - velocity);
            for i in 0..self.delay_length {
                excitation[i] = excitation[i] * (1.0 - smooth) + prev * smooth;
                prev = excitation[i];
            }
        }

        // === Attack transient with harmonics ===
        let attack_samples = (self.delay_length / 6).max(5);
        for i in 0..attack_samples {
            let env = (i as f32 / attack_samples as f32).sqrt();
            excitation[i] *= env;
            // Add bright transient for pluck attack
            if i < attack_samples / 2 {
                excitation[i] += self.next_noise() * velocity * 0.55 * (1.0 - env);
            }
            // Add subtle harmonic "ping" at attack
            if i < attack_samples / 3 {
                let ping = (i as f32 * 0.5).sin() * velocity * 0.25;
                excitation[i] += ping * (1.0 - env);
            }
        }

        // Copy excitation to delay line
        for i in 0..self.delay_length {
            let pos = (self.write_pos + MAX_DELAY_LENGTH - i) % MAX_DELAY_LENGTH;
            self.delay_line[pos] = excitation[i];
        }

        // Reset filter states to prevent clicks from old state
        self.allpass.reset();
        self.dc_blocker.reset();

        // Set energy level
        self.energy = velocity;
    }

    /// Damp the string (reduce energy)
    pub fn damp(&mut self, amount: f32) {
        let factor = 1.0 - amount.clamp(0.0, 1.0);
        for sample in &mut self.delay_line {
            *sample *= factor;
        }
        self.energy *= factor;
    }

    /// Process one sample with optional external excitation
    ///
    /// External excitation is used for sympathetic resonance
    #[inline]
    pub fn process(&mut self, excitation: f32) -> f32 {
        // Read from delay line with fractional interpolation
        let read_pos = (self.write_pos + MAX_DELAY_LENGTH - self.delay_length) % MAX_DELAY_LENGTH;
        let sample = self.delay_line[read_pos];

        // Apply fractional delay via allpass
        let interpolated = self.allpass.process(sample);

        // Apply damping (lowpass) filter
        let damped = self.damping_filter.process(interpolated);

        // Apply feedback with damping coefficient
        let feedback_sample = damped * self.feedback;

        // Add inharmonicity (slight pitch variation for bell-like tones)
        let inharmonic = if self.inharmonicity > 0.0 {
            let offset = ((self.write_pos as f32 * self.inharmonicity * 0.1).sin() * 2.0) as i32;
            let alt_pos = (read_pos as i32 + offset).rem_euclid(MAX_DELAY_LENGTH as i32) as usize;
            feedback_sample * (1.0 - self.inharmonicity) + self.delay_line[alt_pos] * self.inharmonicity
        } else {
            feedback_sample
        };

        // Write back to delay line with external excitation
        self.delay_line[self.write_pos] = inharmonic + excitation;

        // Advance write position
        self.write_pos = (self.write_pos + 1) % MAX_DELAY_LENGTH;

        // Update energy (exponential decay tracking)
        self.energy = (self.energy * self.energy_decay).max(sample.abs());

        // DC blocking
        self.dc_blocker.process(interpolated)
    }

    /// Get current energy level (for visualization)
    pub fn get_energy(&self) -> f32 {
        self.energy
    }

    /// Get waveform data from delay line (for visualization)
    pub fn get_waveform(&self, num_samples: usize) -> Vec<f32> {
        let samples = num_samples.min(self.delay_length);
        let mut waveform = Vec::with_capacity(samples);

        for i in 0..samples {
            let pos = (self.write_pos + MAX_DELAY_LENGTH - i) % MAX_DELAY_LENGTH;
            waveform.push(self.delay_line[pos]);
        }

        waveform
    }

    /// Generate white noise sample using LCG
    #[inline]
    fn next_noise(&mut self) -> f32 {
        // Linear Congruential Generator
        self.noise_state = self.noise_state.wrapping_mul(1103515245).wrapping_add(12345);
        // Convert to float in range [-1, 1]
        (self.noise_state as f32 / u32::MAX as f32) * 2.0 - 1.0
    }
}
