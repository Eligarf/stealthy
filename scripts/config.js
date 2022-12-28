import { Stealthy } from './stealthy.js';

Hooks.once('init', () => {

  game.settings.register(Stealthy.moduleName, Stealthy.ignoreFriendlyStealth, {
    name: game.i18n.localize("stealthy.ignoreFriendlyStealth.name"),
    hint: game.i18n.localize("stealthy.ignoreFriendlyStealth.hint"),
    scope: 'world',
    config: true,
    type: Boolean,
    default: true,
  });

  game.settings.register(Stealthy.moduleName, Stealthy.ignoreFriendlyUmbralSight, {
    name: game.i18n.localize("stealthy.ignoreFriendlyUmbralSight.name"),
    hint: game.i18n.localize("stealthy.ignoreFriendlyUmbralSight.hint"),
    scope: 'world',
    config: true,
    type: Boolean,
    default: false,
  });

});
