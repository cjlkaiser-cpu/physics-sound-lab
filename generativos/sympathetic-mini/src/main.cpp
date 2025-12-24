/**
 * Sympathetic Mini - Minimal 4-string sympathetic resonance synthesizer
 *
 * Purpose: Debug and understand sympathetic resonance behavior
 * Strings: C4, E4, G4, B4 (major 7th chord)
 */

#include <emscripten/bind.h>
#include <cmath>
#include <vector>
#include <cstdint>

constexpr float SAMPLE_RATE = 44100.0f;
constexpr int NUM_STRINGS = 4;
constexpr int MAX_DELAY = 2048;

// Frequencies for C4, E4, G4, B4
const float FREQUENCIES[NUM_STRINGS] = {
    261.63f,  // C4
    329.63f,  // E4
    392.00f,  // G4
    493.88f   // B4
};

// Interval coupling matrix (4x4)
// Based on semitone intervals: C-E=4, C-G=7, C-B=11, E-G=3, E-B=7, G-B=4
const float COUPLING[NUM_STRINGS][NUM_STRINGS] = {
    // C     E     G     B
    {1.0f, 0.4f, 0.6f, 0.2f},  // C: unison, M3, P5, M7
    {0.4f, 1.0f, 0.3f, 0.6f},  // E: M3, unison, m3, P5
    {0.6f, 0.3f, 1.0f, 0.4f},  // G: P5, m3, unison, M3
    {0.2f, 0.6f, 0.4f, 1.0f}   // B: M7, P5, M3, unison
};

//=============================================================================
// Simple Karplus-Strong String
//=============================================================================
class String {
public:
    float delayLine[MAX_DELAY] = {0};
    int writePos = 0;
    int delayLength = 0;
    float feedback = 0.995f;
    float prevSample = 0.0f;  // For simple lowpass
    float energy = 0.0f;
    uint32_t noiseState = 12345;

    void setFrequency(float freq) {
        delayLength = static_cast<int>(SAMPLE_RATE / freq);
        if (delayLength > MAX_DELAY - 1) delayLength = MAX_DELAY - 1;
        if (delayLength < 2) delayLength = 2;
    }

    void pluck(float velocity) {
        // Fill delay line with noise
        for (int i = 0; i < delayLength; i++) {
            float noise = nextNoise() * velocity;
            int pos = (writePos + MAX_DELAY - i) % MAX_DELAY;
            delayLine[pos] = noise;
        }
        energy = velocity;
    }

    float process(float excitation) {
        // Read from delay line
        int readPos = (writePos + MAX_DELAY - delayLength) % MAX_DELAY;
        float sample = delayLine[readPos];

        // Simple lowpass filter (average with previous)
        float filtered = (sample + prevSample) * 0.5f;
        prevSample = sample;

        // Apply feedback
        float feedbackSample = filtered * feedback;

        // Add external excitation (sympathetic resonance)
        float newSample = feedbackSample + excitation;

        // Safety clamp
        if (newSample > 1.0f) newSample = 1.0f;
        if (newSample < -1.0f) newSample = -1.0f;
        if (!std::isfinite(newSample)) newSample = 0.0f;

        // Write to delay line
        delayLine[writePos] = newSample;

        // Advance write position
        writePos = (writePos + 1) % MAX_DELAY;

        // Update energy
        energy = energy * 0.9995f;
        if (std::abs(sample) > energy) energy = std::abs(sample);

        return sample;
    }

    float getEnergy() const { return energy; }

private:
    float nextNoise() {
        noiseState = noiseState * 1103515245 + 12345;
        return (static_cast<float>(noiseState) / static_cast<float>(UINT32_MAX)) * 2.0f - 1.0f;
    }
};

//=============================================================================
// Sympathetic Mini Synth
//=============================================================================
class SympathyMini {
public:
    String strings[NUM_STRINGS];
    float stringOutputs[NUM_STRINGS] = {0};
    float excitationAccum[NUM_STRINGS] = {0};  // Smoothed excitation
    float sympathyAmount = 0.3f;
    float masterVolume = 0.7f;

    // Tunable parameters
    float gateThreshold = 0.01f;   // Min energy to excite others
    float excitationDecay = 0.9f;  // How fast excitation fades
    float couplingScale = 0.03f;   // Strength of coupling

    SympathyMini() {
        for (int i = 0; i < NUM_STRINGS; i++) {
            strings[i].setFrequency(FREQUENCIES[i]);
        }
    }

    void pluck(int stringIndex, float velocity) {
        if (stringIndex >= 0 && stringIndex < NUM_STRINGS) {
            strings[stringIndex].pluck(velocity);
        }
    }

    void setSympatheticAmount(float amount) {
        sympathyAmount = std::max(0.0f, std::min(1.0f, amount));
    }

    void setMasterVolume(float vol) {
        masterVolume = std::max(0.0f, std::min(1.0f, vol));
    }

    void setGateThreshold(float val) {
        gateThreshold = std::max(0.0f, std::min(0.1f, val));
    }

    void setExcitationDecay(float val) {
        excitationDecay = std::max(0.5f, std::min(0.999f, val));
    }

    void setCouplingScale(float val) {
        couplingScale = std::max(0.001f, std::min(0.2f, val));
    }

    std::vector<float> process(int numSamples) {
        std::vector<float> output(numSamples * 2, 0.0f);  // Stereo

        for (int i = 0; i < numSamples; i++) {
            // Calculate sympathetic excitation for each string
            float excitation[NUM_STRINGS] = {0};

            // Scale for sympathetic coupling
            float scale = sympathyAmount * couplingScale;

            for (int src = 0; src < NUM_STRINGS; src++) {
                // GATE: Only excite if source has real energy
                float srcEnergy = strings[src].getEnergy();
                if (srcEnergy < gateThreshold) continue;

                for (int tgt = 0; tgt < NUM_STRINGS; tgt++) {
                    if (src != tgt) {
                        excitation[tgt] += stringOutputs[src] * COUPLING[src][tgt] * scale;
                    }
                }
            }

            // Smooth excitation with configurable decay
            float blend = 1.0f - excitationDecay;
            for (int s = 0; s < NUM_STRINGS; s++) {
                excitationAccum[s] = excitationAccum[s] * excitationDecay + excitation[s] * blend;

                // Clamp
                if (excitationAccum[s] > 0.1f) excitationAccum[s] = 0.1f;
                if (excitationAccum[s] < -0.1f) excitationAccum[s] = -0.1f;
            }

            // Process each string with smoothed excitation
            float left = 0.0f, right = 0.0f;
            for (int s = 0; s < NUM_STRINGS; s++) {
                stringOutputs[s] = strings[s].process(excitationAccum[s]);

                // Simple stereo pan (spread across stereo field)
                float pan = static_cast<float>(s) / (NUM_STRINGS - 1);  // 0 to 1
                left += stringOutputs[s] * (1.0f - pan);
                right += stringOutputs[s] * pan;
            }

            // Apply master volume
            left *= masterVolume;
            right *= masterVolume;

            // Soft clip
            if (left > 0.95f) left = 0.95f + std::tanh(left - 0.95f) * 0.05f;
            if (left < -0.95f) left = -0.95f + std::tanh(left + 0.95f) * 0.05f;
            if (right > 0.95f) right = 0.95f + std::tanh(right - 0.95f) * 0.05f;
            if (right < -0.95f) right = -0.95f + std::tanh(right + 0.95f) * 0.05f;

            output[i * 2] = left;
            output[i * 2 + 1] = right;
        }

        return output;
    }

    std::vector<float> getEnergies() {
        std::vector<float> energies(NUM_STRINGS);
        for (int i = 0; i < NUM_STRINGS; i++) {
            energies[i] = strings[i].getEnergy();
        }
        return energies;
    }
};

//=============================================================================
// Emscripten Bindings
//=============================================================================
EMSCRIPTEN_BINDINGS(sympathy_mini) {
    emscripten::class_<SympathyMini>("SympathyMini")
        .constructor<>()
        .function("pluck", &SympathyMini::pluck)
        .function("setSympatheticAmount", &SympathyMini::setSympatheticAmount)
        .function("setMasterVolume", &SympathyMini::setMasterVolume)
        .function("setGateThreshold", &SympathyMini::setGateThreshold)
        .function("setExcitationDecay", &SympathyMini::setExcitationDecay)
        .function("setCouplingScale", &SympathyMini::setCouplingScale)
        .function("process", &SympathyMini::process)
        .function("getEnergies", &SympathyMini::getEnergies);

    emscripten::register_vector<float>("VectorFloat");
}
