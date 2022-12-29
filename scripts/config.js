import { Stealthy } from './stealthy.js';

Hooks.once('ready', () => {

  const module = game.modules.get(Stealthy.moduleName);
  const moduleVersion = module.version;
  console.log(`stealthy | Initializing ${moduleVersion}`);

  game.settings.register(Stealthy.moduleName, Stealthy.ignoreFriendlyStealth, {
    name: game.i18n.localize("stealthy-ignoreFriendlyStealth-name"),
    hint: game.i18n.localize("stealthy-ignoreFriendlyStealth-hint"),
    scope: 'world',
    config: true,
    type: Boolean,
    default: true,
  });

  game.settings.register(Stealthy.moduleName, Stealthy.ignoreFriendlyUmbralSight, {
    name: game.i18n.localize("stealthy-ignoreFriendlyUmbralSight-name"),
    hint: game.i18n.localize("stealthy-ignoreFriendlyUmbralSight-hint"),
    scope: 'world',
    config: true,
    type: Boolean,
    default: false,
  });

  let choices = { 'ae': game.i18n.localize("stealthy-hiddenSource-ae") };
  let defaultSource = 'ae';
  if (game.cub?.getCondition(game.i18n.localize("stealthy-hidden"))) {
    choices['cub'] = game.i18n.localize("stealthy-hiddenSource-cub");
    defaultSource = 'cub';
  }
  if (game.dfreds?.effectInterface?.findEffectByName(game.i18n.localize("stealthy-hidden"))) {
    choices['ce'] = game.i18n.localize("stealthy-hiddenSource-ce");
    defaultSource = 'ce';
  }

  game.settings.register(Stealthy.moduleName, Stealthy.hiddenSource, {
    name: game.i18n.localize("stealthy-hiddenSource-name"),
    hint: game.i18n.localize("stealthy-hiddenSource-hint"),
    scope: 'world',
    config: true,
    type: String,
    choices,
    default: defaultSource
  });

  game.settings.register(Stealthy.moduleName, Stealthy.debugLogging, {
    name: game.i18n.localize("stealthy-debugLogging-name"),
    scope: 'client',
    config: true,
    type: Boolean,
    default: false,
  });

  game.settings.register(Stealthy.moduleName, Stealthy.loglevel, {
    name: game.i18n.localize("stealthy-logLevel-name"),
    scope: 'client',
    config: true,
    type: String,
    choices: {
      'none': game.i18n.localize("stealthy-logLevel-none-choice"),
      'debug': game.i18n.localize("stealthy-logLevel-debuglevel-choice"),
      'log': game.i18n.localize("stealthy-logLevel-loglevel-choice")
    },
    default: 'debug'
  });
  
});
