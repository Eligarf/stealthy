import { Stealthy } from "./stealthy.js";

Hooks.once('setup', () => {
  libWrapper.register(
    'stealthy',
    'DetectionModeBasicSight.prototype.testVisibility',
    (wrapped, visionSource, mode, config = {}) => {
      const system = Stealthy.engine;
      if (!system.testStealth(visionSource, config)) return false;
      return system.basicVision(wrapped, visionSource, mode, config);
    },
    libWrapper.MIXED,
    { perf_mode: libWrapper.PERF_FAST }
  );

  libWrapper.register(
    'stealthy',
    'DetectionModeInvisibility.prototype.testVisibility',
    (wrapped, visionSource, mode, config = {}) => {
      const system = Stealthy.engine;
      if (!system.testStealth(visionSource, config)) return false;
      return system.seeInvisibility(wrapped, visionSource, mode, config);
    },
    libWrapper.MIXED,
    { perf_mode: libWrapper.PERF_FAST }
  );
});
