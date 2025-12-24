//! Feedback Delay Network Reverb (Schroeder/Moorer)
//!
//! A stereo reverb using:
//! - 8 parallel comb filters (for density and color)
//! - 4 series allpass filters (for diffusion)
//! - Crossfeed between channels (for stereo width)
//!
//! This creates a lush, natural-sounding reverb suitable for
//! acoustic instrument simulation.

use crate::filters::{OnePole, Allpass, Comb};

/// Number of comb filters per channel
const NUM_COMBS: usize = 8;

/// Number of allpass filters per channel
const NUM_ALLPASS: usize = 4;

/// Prime delay times for comb filters (in samples at 44100 Hz)
/// Using prime numbers prevents resonance at specific frequencies
const COMB_DELAYS_LEFT: [usize; NUM_COMBS] = [
    1557, 1617, 1491, 1422, 1277, 1356, 1188, 1116
];

const COMB_DELAYS_RIGHT: [usize; NUM_COMBS] = [
    1617, 1557, 1422, 1491, 1356, 1277, 1116, 1188
];

/// Allpass delay times (shorter for diffusion)
const ALLPASS_DELAYS_LEFT: [usize; NUM_ALLPASS] = [225, 556, 441, 341];
const ALLPASS_DELAYS_RIGHT: [usize; NUM_ALLPASS] = [241, 571, 457, 349];

/// Feedback Delay Network Reverb
pub struct FDNReverb {
    /// Left channel comb filters
    combs_left: Vec<Comb>,

    /// Right channel comb filters
    combs_right: Vec<Comb>,

    /// Left channel allpass filters
    allpasses_left: Vec<ReverbAllpass>,

    /// Right channel allpass filters
    allpasses_right: Vec<ReverbAllpass>,

    /// Input lowpass filter (removes harshness)
    input_lowpass: OnePole,

    /// Room size (affects comb feedback)
    room_size: f32,

    /// Damping (affects high frequency decay)
    damping: f32,

    /// Stereo width
    width: f32,

    /// Output gain
    gain: f32,
}

/// Allpass filter with longer delay for reverb
struct ReverbAllpass {
    buffer: Vec<f32>,
    write_pos: usize,
    delay: usize,
    feedback: f32,
}

impl ReverbAllpass {
    fn new(delay: usize, feedback: f32) -> Self {
        ReverbAllpass {
            buffer: vec![0.0; delay.max(1)],
            write_pos: 0,
            delay,
            feedback,
        }
    }

    #[inline]
    fn process(&mut self, input: f32) -> f32 {
        let read_pos = (self.write_pos + self.buffer.len() - self.delay) % self.buffer.len();
        let delayed = self.buffer[read_pos];

        let output = -input + delayed;
        self.buffer[self.write_pos] = input + delayed * self.feedback;

        self.write_pos = (self.write_pos + 1) % self.buffer.len();

        output
    }

    fn clear(&mut self) {
        for sample in &mut self.buffer {
            *sample = 0.0;
        }
    }
}

impl FDNReverb {
    /// Create a new FDN reverb
    pub fn new(sample_rate: f32) -> Self {
        // Scale delay times for sample rate
        let scale = sample_rate / 44100.0;

        // Create comb filters
        let combs_left: Vec<Comb> = COMB_DELAYS_LEFT
            .iter()
            .map(|&d| {
                let delay = (d as f32 * scale) as usize;
                Comb::new(delay, 0.84, 0.2)
            })
            .collect();

        let combs_right: Vec<Comb> = COMB_DELAYS_RIGHT
            .iter()
            .map(|&d| {
                let delay = (d as f32 * scale) as usize;
                Comb::new(delay, 0.84, 0.2)
            })
            .collect();

        // Create allpass filters
        let allpasses_left: Vec<ReverbAllpass> = ALLPASS_DELAYS_LEFT
            .iter()
            .map(|&d| {
                let delay = (d as f32 * scale) as usize;
                ReverbAllpass::new(delay, 0.5)
            })
            .collect();

        let allpasses_right: Vec<ReverbAllpass> = ALLPASS_DELAYS_RIGHT
            .iter()
            .map(|&d| {
                let delay = (d as f32 * scale) as usize;
                ReverbAllpass::new(delay, 0.5)
            })
            .collect();

        FDNReverb {
            combs_left,
            combs_right,
            allpasses_left,
            allpasses_right,
            input_lowpass: OnePole::new(0.3),
            room_size: 0.5,
            damping: 0.5,
            width: 1.0,
            gain: 0.015, // Reverb is added to dry signal, so keep low
        }
    }

    /// Process one mono input sample and return stereo output
    pub fn process(&mut self, input: f32) -> (f32, f32) {
        // Input filtering
        let filtered_input = self.input_lowpass.process(input);

        // Process comb filters in parallel
        let mut left_sum = 0.0;
        let mut right_sum = 0.0;

        for comb in &mut self.combs_left {
            left_sum += comb.process(filtered_input);
        }

        for comb in &mut self.combs_right {
            right_sum += comb.process(filtered_input);
        }

        // Normalize by number of combs
        left_sum /= NUM_COMBS as f32;
        right_sum /= NUM_COMBS as f32;

        // Process through allpass chain
        let mut left_out = left_sum;
        for allpass in &mut self.allpasses_left {
            left_out = allpass.process(left_out);
        }

        let mut right_out = right_sum;
        for allpass in &mut self.allpasses_right {
            right_out = allpass.process(right_out);
        }

        // Apply stereo width
        let mono = (left_out + right_out) * 0.5;
        let stereo = (left_out - right_out) * 0.5;

        let mut final_left = (mono + stereo * self.width) * self.gain;
        let mut final_right = (mono - stereo * self.width) * self.gain;

        // Safety clamp and NaN protection
        if !final_left.is_finite() { final_left = 0.0; }
        if !final_right.is_finite() { final_right = 0.0; }

        (final_left.clamp(-1.0, 1.0), final_right.clamp(-1.0, 1.0))
    }

    /// Set room size (0-1)
    pub fn set_room_size(&mut self, size: f32) {
        self.room_size = size.clamp(0.0, 1.0);

        // Room size affects comb feedback
        // Larger room = longer decay = higher feedback
        let feedback = 0.7 + self.room_size * 0.28;

        for comb in &mut self.combs_left {
            comb.set_feedback(feedback);
        }
        for comb in &mut self.combs_right {
            comb.set_feedback(feedback);
        }
    }

    /// Set damping (0-1)
    pub fn set_damping(&mut self, damping: f32) {
        self.damping = damping.clamp(0.0, 1.0);

        // Damping affects comb filter lowpass
        for comb in &mut self.combs_left {
            comb.set_damping(self.damping);
        }
        for comb in &mut self.combs_right {
            comb.set_damping(self.damping);
        }
    }

    /// Set stereo width (0-2, where 1 is normal)
    pub fn set_width(&mut self, width: f32) {
        self.width = width.clamp(0.0, 2.0);
    }

    /// Set output gain
    pub fn set_gain(&mut self, gain: f32) {
        self.gain = gain.clamp(0.0, 1.0);
    }

    /// Clear all buffers
    pub fn clear(&mut self) {
        for comb in &mut self.combs_left {
            comb.clear();
        }
        for comb in &mut self.combs_right {
            comb.clear();
        }
        for allpass in &mut self.allpasses_left {
            allpass.clear();
        }
        for allpass in &mut self.allpasses_right {
            allpass.clear();
        }
        self.input_lowpass.reset();
    }
}

impl Default for FDNReverb {
    fn default() -> Self {
        Self::new(44100.0)
    }
}
