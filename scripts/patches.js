import { Stealthy } from "./stealthy.js";
import { Stealthy5e } from "./systems/dnd5e.js";

Hooks.once('setup', () => {
  libWrapper.register(
    'stealthy',
    'DetectionModeBasicSight.prototype.testVisibility',
    (wrapped, visionSource, mode, config = {}) => {
      if (!Stealthy.testVisionStealth(visionSource, config)) return false;
      return Stealthy5e.basicVision(wrapped, visionSource, mode, config);
    },
    libWrapper.MIXED,
    { perf_mode: libWrapper.PERF_FAST }
  );

  libWrapper.register(
    'stealthy',
    'DetectionModeInvisibility.prototype.testVisibility',
    (wrapped, visionSource, mode, config = {}) => {
      if (!Stealthy.testVisionStealth(visionSource, config)) return false;
      return Stealthy5e.seeInvisibility(wrapped, visionSource, mode, config);
    },
    libWrapper.MIXED,
    { perf_mode: libWrapper.PERF_FAST }
  );
});
