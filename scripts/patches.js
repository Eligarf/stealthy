import { Stealthy } from "./stealthy.js";

Hooks.once('setup', () => {
  libWrapper.register(
    'stealthy',
    'DetectionModeBasicSight.prototype.testVisibility',
    (wrapped, visionSource, mode, config = {}) => {
      const engine = game.stealthy.engine;
      if (!engine.testStealth(visionSource, config)) return false;
      return engine.basicVision(wrapped, visionSource, mode, config);
    },
    libWrapper.MIXED,
    { perf_mode: libWrapper.PERF_FAST }
  );

  libWrapper.register(
    'stealthy',
    'DetectionModeInvisibility.prototype.testVisibility',
    (wrapped, visionSource, mode, config = {}) => {
      const engine = game.stealthy.engine;
      if (!engine.testStealth(visionSource, config)) return false;
      return engine.seeInvisibility(wrapped, visionSource, mode, config);
    },
    libWrapper.MIXED,
    { perf_mode: libWrapper.PERF_FAST }
  );
});
