/**
 * Sympathetic Strings v3 - Rigid Bridge Model
 *
 * Physical Model: Two parallel strings sharing a RIGID bridge
 * ============================================================
 *
 *    Cejilla (fijo)                           Puente RÍGIDO
 *         |                                        |
 *         |========== Cuerda 1 (T1, μ1) ===========|
 *         |                                        |
 *         |========== Cuerda 2 (T2, μ2) ===========|
 *         |                                        |
 *       x=0                                      x=L
 *
 * Key Physics:
 * - The bridge is RIGID: it transmits vibration instantaneously
 * - Both strings share the same displacement at x=L
 * - Constraint: y1[end] = y2[end] = y_bridge
 *
 * How it works:
 * 1. Each string wants to move its right endpoint based on wave equation
 * 2. The rigid bridge FORCES both endpoints to be equal
 * 3. The bridge position is determined by force equilibrium
 * 4. Energy transfers through this shared constraint
 *
 * Bridge equilibrium (massless rigid bridge):
 *   T1 * (∂y1/∂x) + T2 * (∂y2/∂x) = 0  at bridge
 *   => y_bridge = weighted average based on string tensions
 *
 * This is how real sympathetic resonance works in pianos, sitars, etc.
 */

#include <emscripten/bind.h>
#include <cmath>
#include <vector>
#include <array>
#include <algorithm>

constexpr int NUM_POINTS = 200;
constexpr int HISTORY_LENGTH = 500;
constexpr float PI = 3.14159265359f;

// ============================================================================
// String State
// ============================================================================
struct StringState {
    std::array<float, NUM_POINTS> y;
    std::array<float, NUM_POINTS> y_prev;
    std::array<float, NUM_POINTS> v;

    float frequency;
    float tension;
    float density;
    float damping;
    float waveSpeed;
    float length;  // Normalized length

    float kineticEnergy;
    float potentialEnergy;
    float totalEnergy;

    // Force exerted on bridge (computed each step)
    float forceOnBridge;

    StringState() {
        y.fill(0.0f);
        y_prev.fill(0.0f);
        v.fill(0.0f);
        frequency = 261.63f;
        tension = 100.0f;
        density = 0.001f;
        damping = 0.00001f;  // Very low damping for sustained sound
        length = 1.0f;
        waveSpeed = std::sqrt(tension / density);
        kineticEnergy = 0.0f;
        potentialEnergy = 0.0f;
        totalEnergy = 0.0f;
        forceOnBridge = 0.0f;
    }

    void setFrequency(float freq) {
        frequency = freq;
        // f = c / (2L) => c = 2Lf, T = μc² = 4μL²f²
        tension = 4.0f * density * length * length * freq * freq;
        waveSpeed = std::sqrt(tension / density);
    }
};

// ============================================================================
// Sympathetic Strings Simulation with Movable Bridge
// ============================================================================
class SympatheticStrings {
public:
    StringState string1;
    StringState string2;

    // Rigid bridge state
    float bridgeY;           // Bridge displacement (shared by both strings)
    float bridgeV;           // Bridge velocity (for display only)
    float bridgeStiffness;   // How rigidly strings couple (1.0 = perfect)

    // Simulation
    float dt;
    float time;
    int stepCount;

    // History
    std::vector<float> energy1History;
    std::vector<float> energy2History;
    std::vector<float> bridgeHistory;

    SympatheticStrings() {
        dt = 1.0f / (44100.0f * 8.0f);  // 8x oversampling for stability
        time = 0.0f;
        stepCount = 0;

        bridgeY = 0.0f;
        bridgeV = 0.0f;
        bridgeStiffness = 1.0f;  // 1.0 = perfectly rigid coupling

        // Default: C4 and G4 (perfect fifth, ratio 3:2)
        string1.setFrequency(261.63f);
        string2.setFrequency(392.00f);

        energy1History.reserve(HISTORY_LENGTH);
        energy2History.reserve(HISTORY_LENGTH);
        bridgeHistory.reserve(HISTORY_LENGTH);
    }

    // ========================================================================
    // Pluck a string
    // ========================================================================
    void pluck(int stringIndex, float position, float amplitude) {
        StringState& s = (stringIndex == 0) ? string1 : string2;

        position = std::max(0.1f, std::min(0.9f, position));
        amplitude = std::max(0.0f, std::min(1.0f, amplitude));

        // Triangular initial shape
        for (int i = 0; i < NUM_POINTS; i++) {
            float x = static_cast<float>(i) / (NUM_POINTS - 1);

            if (x < position) {
                s.y[i] = amplitude * x / position;
            } else {
                s.y[i] = amplitude * (1.0f - x) / (1.0f - position);
            }
            s.y_prev[i] = s.y[i];
            s.v[i] = 0.0f;
        }

        // Boundary: fixed end at 0
        s.y[0] = 0.0f;
        s.y_prev[0] = 0.0f;

        // Bridge end will be set by bridge position
        computeEnergy(s);
    }

    // ========================================================================
    // Physics Step
    // ========================================================================
    void step(int numSteps = 1) {
        for (int n = 0; n < numSteps; n++) {
            stepOnce();
        }
    }

    void stepOnce() {
        float dx = 1.0f / (NUM_POINTS - 1);
        int N = NUM_POINTS;

        // Courant numbers (with 8x oversampling, should be well under 1.0)
        float r1 = string1.waveSpeed * dt / dx;
        float r2 = string2.waveSpeed * dt / dx;
        // No capping - 8x oversampling gives r < 0.3 for up to 500 Hz
        float r1_sq = r1 * r1;
        float r2_sq = r2 * r2;

        std::array<float, NUM_POINTS> y1_new;
        std::array<float, NUM_POINTS> y2_new;

        // ================================================================
        // Step 1: Update interior points with wave equation
        // Both strings: fixed at left (x=0), will share bridge at right (x=L)
        // ================================================================

        // Fixed left boundary
        y1_new[0] = 0.0f;
        y2_new[0] = 0.0f;

        // Interior points - standard wave equation
        for (int i = 1; i < N - 1; i++) {
            // String 1
            float lap1 = string1.y[i+1] - 2.0f * string1.y[i] + string1.y[i-1];
            float vel1 = (string1.y[i] - string1.y_prev[i]) / dt;
            y1_new[i] = 2.0f * string1.y[i] - string1.y_prev[i]
                       + r1_sq * lap1
                       - string1.damping * dt * vel1;

            // String 2
            float lap2 = string2.y[i+1] - 2.0f * string2.y[i] + string2.y[i-1];
            float vel2 = (string2.y[i] - string2.y_prev[i]) / dt;
            y2_new[i] = 2.0f * string2.y[i] - string2.y_prev[i]
                       + r2_sq * lap2
                       - string2.damping * dt * vel2;
        }

        // ================================================================
        // Step 2: Compute what each string "wants" at the bridge
        // Using the wave equation extrapolated to the boundary
        // ================================================================

        // What string 1 would want at right end (based on neighbor)
        float y1_want = 2.0f * string1.y[N-1] - string1.y_prev[N-1]
                       + r1_sq * (string1.y[N-2] - 2.0f * string1.y[N-1] + string1.y[N-1])
                       - string1.damping * dt * (string1.y[N-1] - string1.y_prev[N-1]) / dt;

        // What string 2 would want at right end
        float y2_want = 2.0f * string2.y[N-1] - string2.y_prev[N-1]
                       + r2_sq * (string2.y[N-2] - 2.0f * string2.y[N-1] + string2.y[N-1])
                       - string2.damping * dt * (string2.y[N-1] - string2.y_prev[N-1]) / dt;

        // ================================================================
        // Step 3: RIGID BRIDGE CONSTRAINT
        // Both strings must have the same displacement at the bridge
        // Position is weighted average based on tension (stiffness)
        // ================================================================

        float totalTension = string1.tension + string2.tension;
        float newBridgeY = (string1.tension * y1_want + string2.tension * y2_want) / totalTension;

        // Apply stiffness parameter (1.0 = perfectly rigid)
        newBridgeY = bridgeStiffness * newBridgeY + (1.0f - bridgeStiffness) * bridgeY;

        // Safety clamp
        newBridgeY = std::max(-0.5f, std::min(0.5f, newBridgeY));
        if (!std::isfinite(newBridgeY)) newBridgeY = 0.0f;

        // Track velocity for display
        bridgeV = (newBridgeY - bridgeY) / dt;
        bridgeY = newBridgeY;

        // ================================================================
        // Step 4: Apply constraint - both strings share bridge position
        // ================================================================
        y1_new[N-1] = bridgeY;
        y2_new[N-1] = bridgeY;

        // Store forces for visualization
        float slope1 = (y1_new[N-1] - y1_new[N-2]) / dx;
        float slope2 = (y2_new[N-1] - y2_new[N-2]) / dx;
        string1.forceOnBridge = -string1.tension * slope1;
        string2.forceOnBridge = -string2.tension * slope2;

        // ================================================================
        // Step 5: Commit updates
        // ================================================================
        for (int i = 0; i < N; i++) {
            string1.v[i] = (y1_new[i] - string1.y[i]) / dt;
            string2.v[i] = (y2_new[i] - string2.y[i]) / dt;

            string1.y_prev[i] = string1.y[i];
            string1.y[i] = y1_new[i];

            string2.y_prev[i] = string2.y[i];
            string2.y[i] = y2_new[i];
        }

        // Compute energies
        computeEnergy(string1);
        computeEnergy(string2);

        time += dt;
        stepCount++;

        // Record history
        if (stepCount % 100 == 0) {
            recordHistory();
        }
    }

    // ========================================================================
    // Energy
    // ========================================================================
    void computeEnergy(StringState& s) {
        float dx = 1.0f / (NUM_POINTS - 1);
        float ke = 0.0f;
        float pe = 0.0f;

        for (int i = 0; i < NUM_POINTS; i++) {
            ke += 0.5f * s.density * dx * s.v[i] * s.v[i];

            if (i < NUM_POINTS - 1) {
                float strain = (s.y[i+1] - s.y[i]) / dx;
                pe += 0.5f * s.tension * strain * strain * dx;
            }
        }

        s.kineticEnergy = ke;
        s.potentialEnergy = pe;
        s.totalEnergy = ke + pe;
    }

    void recordHistory() {
        if (energy1History.size() >= HISTORY_LENGTH) {
            energy1History.erase(energy1History.begin());
            energy2History.erase(energy2History.begin());
            bridgeHistory.erase(bridgeHistory.begin());
        }

        energy1History.push_back(string1.totalEnergy);
        energy2History.push_back(string2.totalEnergy);
        bridgeHistory.push_back(bridgeY);
    }

    // ========================================================================
    // Setters
    // ========================================================================
    void setString1Frequency(float freq) {
        string1.setFrequency(std::max(50.0f, std::min(1000.0f, freq)));
    }

    void setString2Frequency(float freq) {
        string2.setFrequency(std::max(50.0f, std::min(1000.0f, freq)));
    }

    void setDamping(float d) {
        float damping = std::max(0.0f, std::min(0.01f, d));
        string1.damping = damping;
        string2.damping = damping;
    }

    void setBridgeStiffness(float s) {
        bridgeStiffness = std::max(0.0f, std::min(1.0f, s));
    }

    // ========================================================================
    // Getters
    // ========================================================================
    std::vector<float> getString1Displacement() {
        return std::vector<float>(string1.y.begin(), string1.y.end());
    }

    std::vector<float> getString2Displacement() {
        return std::vector<float>(string2.y.begin(), string2.y.end());
    }

    std::vector<float> getString1Velocity() {
        return std::vector<float>(string1.v.begin(), string1.v.end());
    }

    std::vector<float> getString2Velocity() {
        return std::vector<float>(string2.v.begin(), string2.v.end());
    }

    std::vector<float> getEnergy1History() { return energy1History; }
    std::vector<float> getEnergy2History() { return energy2History; }
    std::vector<float> getBridgeHistory() { return bridgeHistory; }

    float getTime() { return time; }
    float getEnergy1() { return string1.totalEnergy; }
    float getEnergy2() { return string2.totalEnergy; }
    float getKinetic1() { return string1.kineticEnergy; }
    float getKinetic2() { return string2.kineticEnergy; }
    float getPotential1() { return string1.potentialEnergy; }
    float getPotential2() { return string2.potentialEnergy; }
    float getTotalEnergy() { return string1.totalEnergy + string2.totalEnergy; }
    float getBridgeY() { return bridgeY; }
    float getBridgeV() { return bridgeV; }
    float getForce1() { return string1.forceOnBridge; }
    float getForce2() { return string2.forceOnBridge; }
    float getString1Frequency() { return string1.frequency; }
    float getString2Frequency() { return string2.frequency; }

    void reset() {
        string1 = StringState();
        string2 = StringState();
        string1.setFrequency(261.63f);
        string2.setFrequency(392.00f);
        bridgeY = 0.0f;
        bridgeV = 0.0f;
        bridgeStiffness = 1.0f;
        time = 0.0f;
        stepCount = 0;
        energy1History.clear();
        energy2History.clear();
        bridgeHistory.clear();
    }

    float getBridgeStiffness() { return bridgeStiffness; }
};

// ============================================================================
// Emscripten Bindings
// ============================================================================
EMSCRIPTEN_BINDINGS(sympathetic_strings) {
    emscripten::class_<SympatheticStrings>("SympatheticStrings")
        .constructor<>()
        .function("pluck", &SympatheticStrings::pluck)
        .function("step", &SympatheticStrings::step)
        .function("reset", &SympatheticStrings::reset)
        .function("setString1Frequency", &SympatheticStrings::setString1Frequency)
        .function("setString2Frequency", &SympatheticStrings::setString2Frequency)
        .function("setDamping", &SympatheticStrings::setDamping)
        .function("setBridgeStiffness", &SympatheticStrings::setBridgeStiffness)
        .function("getString1Displacement", &SympatheticStrings::getString1Displacement)
        .function("getString2Displacement", &SympatheticStrings::getString2Displacement)
        .function("getString1Velocity", &SympatheticStrings::getString1Velocity)
        .function("getString2Velocity", &SympatheticStrings::getString2Velocity)
        .function("getEnergy1History", &SympatheticStrings::getEnergy1History)
        .function("getEnergy2History", &SympatheticStrings::getEnergy2History)
        .function("getBridgeHistory", &SympatheticStrings::getBridgeHistory)
        .function("getTime", &SympatheticStrings::getTime)
        .function("getEnergy1", &SympatheticStrings::getEnergy1)
        .function("getEnergy2", &SympatheticStrings::getEnergy2)
        .function("getKinetic1", &SympatheticStrings::getKinetic1)
        .function("getKinetic2", &SympatheticStrings::getKinetic2)
        .function("getPotential1", &SympatheticStrings::getPotential1)
        .function("getPotential2", &SympatheticStrings::getPotential2)
        .function("getTotalEnergy", &SympatheticStrings::getTotalEnergy)
        .function("getBridgeY", &SympatheticStrings::getBridgeY)
        .function("getBridgeV", &SympatheticStrings::getBridgeV)
        .function("getForce1", &SympatheticStrings::getForce1)
        .function("getForce2", &SympatheticStrings::getForce2)
        .function("getString1Frequency", &SympatheticStrings::getString1Frequency)
        .function("getString2Frequency", &SympatheticStrings::getString2Frequency)
        .function("getBridgeStiffness", &SympatheticStrings::getBridgeStiffness);

    emscripten::register_vector<float>("VectorFloat");
}
