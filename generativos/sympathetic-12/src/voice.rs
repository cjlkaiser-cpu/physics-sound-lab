//! Voice allocation and management for polyphonic synthesis
//!
//! Handles up to 128 simultaneous voices with voice stealing
//! when the pool is exhausted.

use crate::MAX_VOICES;

/// State of a single voice
#[derive(Clone, Copy)]
pub struct Voice {
    /// Is this voice currently active?
    pub active: bool,
    /// Which string (pitch class) is this voice assigned to?
    pub string_index: usize,
    /// Voice velocity (for envelope scaling)
    pub velocity: f32,
    /// Time since voice was triggered (in samples)
    pub age: u32,
    /// Time since voice started releasing
    pub release_time: u32,
    /// Is voice in release phase?
    pub releasing: bool,
}

impl Default for Voice {
    fn default() -> Self {
        Voice {
            active: false,
            string_index: 0,
            velocity: 0.0,
            age: 0,
            release_time: 0,
            releasing: false,
        }
    }
}

/// Voice pool for managing polyphonic voices
pub struct VoicePool {
    /// All voices in the pool
    voices: Vec<Voice>,
    /// Maximum number of voices
    max_voices: usize,
    /// Current number of active voices
    active_count: usize,
}

impl VoicePool {
    /// Create a new voice pool
    pub fn new(max_voices: usize) -> Self {
        let max_voices = max_voices.min(MAX_VOICES);
        VoicePool {
            voices: vec![Voice::default(); max_voices],
            max_voices,
            active_count: 0,
        }
    }

    /// Allocate a new voice for the given string
    ///
    /// Returns the voice ID if successful, or None if pool is exhausted
    /// Uses voice stealing if necessary
    pub fn allocate(&mut self, string_index: usize) -> Option<usize> {
        // First, try to find an inactive voice
        for (i, voice) in self.voices.iter_mut().enumerate() {
            if !voice.active {
                voice.active = true;
                voice.string_index = string_index;
                voice.age = 0;
                voice.release_time = 0;
                voice.releasing = false;
                self.active_count += 1;
                return Some(i);
            }
        }

        // No inactive voice found - steal the oldest releasing voice
        let mut oldest_releasing_idx = None;
        let mut oldest_releasing_time = 0;

        for (i, voice) in self.voices.iter().enumerate() {
            if voice.releasing && voice.release_time > oldest_releasing_time {
                oldest_releasing_time = voice.release_time;
                oldest_releasing_idx = Some(i);
            }
        }

        if let Some(idx) = oldest_releasing_idx {
            let voice = &mut self.voices[idx];
            voice.string_index = string_index;
            voice.age = 0;
            voice.release_time = 0;
            voice.releasing = false;
            return Some(idx);
        }

        // Still no voice - steal the oldest active voice
        let mut oldest_idx = 0;
        let mut oldest_age = 0;

        for (i, voice) in self.voices.iter().enumerate() {
            if voice.age > oldest_age {
                oldest_age = voice.age;
                oldest_idx = i;
            }
        }

        let voice = &mut self.voices[oldest_idx];
        voice.string_index = string_index;
        voice.age = 0;
        voice.release_time = 0;
        voice.releasing = false;
        Some(oldest_idx)
    }

    /// Set a voice as active with the given parameters
    pub fn set_active(&mut self, voice_id: usize, string_index: usize, velocity: f32) {
        if voice_id < self.voices.len() {
            let voice = &mut self.voices[voice_id];
            voice.active = true;
            voice.string_index = string_index;
            voice.velocity = velocity;
            voice.age = 0;
            voice.releasing = false;
        }
    }

    /// Release a voice (start release phase)
    pub fn release(&mut self, voice_id: usize) {
        if voice_id < self.voices.len() {
            self.voices[voice_id].releasing = true;
            self.voices[voice_id].release_time = 0;
        }
    }

    /// Release all voices for a given string
    pub fn release_string(&mut self, string_index: usize) {
        for voice in &mut self.voices {
            if voice.active && voice.string_index == string_index {
                voice.releasing = true;
                voice.release_time = 0;
            }
        }
    }

    /// Deactivate a voice
    pub fn deactivate(&mut self, voice_id: usize) {
        if voice_id < self.voices.len() && self.voices[voice_id].active {
            self.voices[voice_id].active = false;
            self.active_count = self.active_count.saturating_sub(1);
        }
    }

    /// Update voice ages (call once per sample block)
    pub fn tick(&mut self, samples: u32) {
        for voice in &mut self.voices {
            if voice.active {
                voice.age += samples;
                if voice.releasing {
                    voice.release_time += samples;
                }
            }
        }
    }

    /// Get the number of active voices
    pub fn active_count(&self) -> usize {
        self.active_count
    }

    /// Get all active voice IDs for a given string
    pub fn get_voices_for_string(&self, string_index: usize) -> Vec<usize> {
        self.voices
            .iter()
            .enumerate()
            .filter(|(_, v)| v.active && v.string_index == string_index)
            .map(|(i, _)| i)
            .collect()
    }

    /// Get voice info
    pub fn get_voice(&self, voice_id: usize) -> Option<&Voice> {
        self.voices.get(voice_id)
    }

    /// Clear all voices
    pub fn clear(&mut self) {
        for voice in &mut self.voices {
            *voice = Voice::default();
        }
        self.active_count = 0;
    }
}
