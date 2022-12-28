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
