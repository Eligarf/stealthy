import { Stealthy } from './stealthy.js';

Hooks.once('init', () => {

  game.settings.register(Stealthy.moduleName, Stealthy.ignoreFriendlyStealth, {
    name: game.i18n.localize("STEALTHY.ignoreFriendlyStealth.name"),
    scope: 'world',
    config: true,
    type: Boolean,
    default: true,
  });

  game.settings.register(Stealthy.moduleName, Stealthy.ignoreFriendlyUmbralSight, {
    name: game.i18n.localize("STEALTHY.ignoreFriendlyUmbralSight.name"),
    scope: 'world',
    config: true,
    type: Boolean,
    default: false,
  });

});
