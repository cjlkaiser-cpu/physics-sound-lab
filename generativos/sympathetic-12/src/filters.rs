//! Digital filters for the Karplus-Strong algorithm
//!
//! Contains:
//! - OnePole: Simple first-order lowpass/highpass filter
//! - Allpass: First-order allpass for fractional delay
//! - Comb: Comb filter for resonance effects

/// One-pole filter (first-order IIR)
///
/// Transfer function: H(z) = b0 / (1 - a1 * z^-1)
///
/// Used for:
/// - Damping in the feedback loop
pub struct OnePole {
    /// Output coefficient
    a1: f32,
    /// Input coefficient
    b0: f32,
    /// Previous output (state)
    z1: f32,
}

impl OnePole {
    /// Create a new lowpass one-pole filter
    ///
    /// coefficient: 0-1, where 0 = no filtering, 1 = maximum smoothing
    pub fn new(coefficient: f32) -> Self {
        let a1 = coefficient.clamp(0.0, 0.99);
        OnePole {
            a1,
            b0: 1.0 - a1,
            z1: 0.0,
        }
    }

    /// Set the filter coefficient (for lowpass)
    pub fn set_coefficient(&mut self, coefficient: f32) {
        self.a1 = coefficient.clamp(0.0, 0.99);
        self.b0 = 1.0 - self.a1;
    }

    /// Process one sample
    #[inline]
    pub fn process(&mut self, input: f32) -> f32 {
        // y[n] = b0 * x[n] + a1 * y[n-1]
        let output = self.b0 * input + self.a1 * self.z1;
        self.z1 = output;
        output
    }

    /// Reset filter state
    pub fn reset(&mut self) {
        self.z1 = 0.0;
    }
}

/// DC Blocking filter (highpass)
///
/// y[n] = x[n] - x[n-1] + R * y[n-1]
/// where R is close to 1 (e.g., 0.995)
///
/// This removes DC offset while passing audio frequencies
pub struct DCBlocker {
    /// Pole coefficient (close to 1)
    r: f32,
    /// Previous input
    x1: f32,
    /// Previous output
    y1: f32,
}

impl DCBlocker {
    /// Create a new DC blocker
    ///
    /// cutoff_hz: frequency below which to attenuate (typically 10-20 Hz)
    pub fn new(cutoff_hz: f32, sample_rate: f32) -> Self {
        // R = 1 - (2 * pi * fc / fs)
        let r = 1.0 - (2.0 * std::f32::consts::PI * cutoff_hz / sample_rate);
        let r = r.clamp(0.9, 0.9999);
        DCBlocker {
            r,
            x1: 0.0,
            y1: 0.0,
        }
    }

    /// Process one sample
    #[inline]
    pub fn process(&mut self, input: f32) -> f32 {
        // y[n] = x[n] - x[n-1] + R * y[n-1]
        let output = input - self.x1 + self.r * self.y1;
        self.x1 = input;
        self.y1 = output;

        // Clamp output to prevent runaway
        if output.is_finite() {
            output.clamp(-2.0, 2.0)
        } else {
            self.x1 = 0.0;
            self.y1 = 0.0;
            0.0
        }
    }

    /// Reset filter state
    pub fn reset(&mut self) {
        self.x1 = 0.0;
        self.y1 = 0.0;
    }
}

/// First-order allpass filter for fractional delay
///
/// Transfer function: H(z) = (a + z^-1) / (1 + a * z^-1)
///
/// Used for interpolating between samples to achieve precise tuning
pub struct Allpass {
    /// Allpass coefficient
    coefficient: f32,
    /// Previous input (state)
    z1_in: f32,
    /// Previous output (state)
    z1_out: f32,
}

impl Allpass {
    /// Create a new allpass filter
    pub fn new(coefficient: f32) -> Self {
        Allpass {
            coefficient,
            z1_in: 0.0,
            z1_out: 0.0,
        }
    }

    /// Set the allpass coefficient
    pub fn set_coefficient(&mut self, coefficient: f32) {
        self.coefficient = coefficient.clamp(-0.99, 0.99);
    }

    /// Process one sample
    #[inline]
    pub fn process(&mut self, input: f32) -> f32 {
        // y[n] = a * x[n] + x[n-1] - a * y[n-1]
        let output = self.coefficient * input + self.z1_in - self.coefficient * self.z1_out;
        self.z1_in = input;
        self.z1_out = output;
        output
    }

    /// Reset filter state
    pub fn reset(&mut self) {
        self.z1_in = 0.0;
        self.z1_out = 0.0;
    }
}

/// Comb filter for resonance effects
///
/// y[n] = x[n] + g * y[n - delay]
pub struct Comb {
    /// Delay buffer
    buffer: Vec<f32>,
    /// Current write position
    write_pos: usize,
    /// Delay in samples
    delay: usize,
    /// Feedback gain
    feedback: f32,
    /// Damping filter in feedback
    damping: OnePole,
}

impl Comb {
    /// Create a new comb filter
    pub fn new(delay_samples: usize, feedback: f32, damping: f32) -> Self {
        Comb {
            buffer: vec![0.0; delay_samples.max(1)],
            write_pos: 0,
            delay: delay_samples,
            feedback,
            damping: OnePole::new(damping),
        }
    }

    /// Set feedback gain
    pub fn set_feedback(&mut self, feedback: f32) {
        self.feedback = feedback.clamp(0.0, 0.99);
    }

    /// Set damping amount
    pub fn set_damping(&mut self, damping: f32) {
        self.damping.set_coefficient(damping);
    }

    /// Process one sample
    #[inline]
    pub fn process(&mut self, input: f32) -> f32 {
        // Read from delay line
        let read_pos = (self.write_pos + self.buffer.len() - self.delay) % self.buffer.len();
        let delayed = self.buffer[read_pos];

        // Apply damping filter to feedback
        let filtered = self.damping.process(delayed);

        // Compute output
        let output = input + filtered * self.feedback;

        // Write to delay line
        self.buffer[self.write_pos] = output;
        self.write_pos = (self.write_pos + 1) % self.buffer.len();

        output
    }

    /// Clear the buffer
    pub fn clear(&mut self) {
        for sample in &mut self.buffer {
            *sample = 0.0;
        }
        self.damping.reset();
    }
}

/// Second-order biquad filter
///
/// Implements various filter types: lowpass, highpass, bandpass, notch
pub struct Biquad {
    // Coefficients
    b0: f32,
    b1: f32,
    b2: f32,
    a1: f32,
    a2: f32,
    // State
    z1: f32,
    z2: f32,
}

impl Biquad {
    /// Create a lowpass biquad filter
    pub fn lowpass(cutoff_hz: f32, q: f32, sample_rate: f32) -> Self {
        let omega = 2.0 * std::f32::consts::PI * cutoff_hz / sample_rate;
        let sin_omega = omega.sin();
        let cos_omega = omega.cos();
        let alpha = sin_omega / (2.0 * q);

        let b0 = (1.0 - cos_omega) / 2.0;
        let b1 = 1.0 - cos_omega;
        let b2 = (1.0 - cos_omega) / 2.0;
        let a0 = 1.0 + alpha;
        let a1 = -2.0 * cos_omega;
        let a2 = 1.0 - alpha;

        Biquad {
            b0: b0 / a0,
            b1: b1 / a0,
            b2: b2 / a0,
            a1: a1 / a0,
            a2: a2 / a0,
            z1: 0.0,
            z2: 0.0,
        }
    }

    /// Create a highpass biquad filter
    pub fn highpass(cutoff_hz: f32, q: f32, sample_rate: f32) -> Self {
        let omega = 2.0 * std::f32::consts::PI * cutoff_hz / sample_rate;
        let sin_omega = omega.sin();
        let cos_omega = omega.cos();
        let alpha = sin_omega / (2.0 * q);

        let b0 = (1.0 + cos_omega) / 2.0;
        let b1 = -(1.0 + cos_omega);
        let b2 = (1.0 + cos_omega) / 2.0;
        let a0 = 1.0 + alpha;
        let a1 = -2.0 * cos_omega;
        let a2 = 1.0 - alpha;

        Biquad {
            b0: b0 / a0,
            b1: b1 / a0,
            b2: b2 / a0,
            a1: a1 / a0,
            a2: a2 / a0,
            z1: 0.0,
            z2: 0.0,
        }
    }

    /// Process one sample (Direct Form II Transposed)
    #[inline]
    pub fn process(&mut self, input: f32) -> f32 {
        let output = self.b0 * input + self.z1;
        self.z1 = self.b1 * input - self.a1 * output + self.z2;
        self.z2 = self.b2 * input - self.a2 * output;
        output
    }

    /// Reset filter state
    pub fn reset(&mut self) {
        self.z1 = 0.0;
        self.z2 = 0.0;
    }
}
