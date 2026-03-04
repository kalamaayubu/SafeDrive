const EAR_THRESHOLD = 0.25; // Eyes closed below this value

// Level durations in milliseconds
const LEVEL_1_MS = 800;
const LEVEL_2_MS = 2000;
const LEVEL_3_MS = 3000;

export function createFatigueDetector() {
  let currentLevel = 0;
  let closedDuration = 0; // how long eyes have been closed in ms
  let lastTimestamp = performance.now();

  function update(ear) {
    const now = performance.now();
    const delta = now - lastTimestamp;
    lastTimestamp = now;

    if (ear < EAR_THRESHOLD) {
      closedDuration += delta;
    } else {
      closedDuration = 0;
      currentLevel = 0;
      return 0;
    }

    if (closedDuration >= LEVEL_3_MS) {
      currentLevel = 3;
    } else if (closedDuration >= LEVEL_2_MS) {
      currentLevel = 2;
    } else if (closedDuration >= LEVEL_1_MS) {
      currentLevel = 1;
    }

    return currentLevel;
  }

  return { update };
}
