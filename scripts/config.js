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

  game.settings.register(
    Stealthy.moduleName,
    'debugLogging',
    {
      name: 'Enable debug logging', // game.i18n.localize('rules5estuff.settings.debug.text'),
      scope: 'client',
      config: true,
      type: Boolean,
      default: false,
  });

  game.settings.register(
    Stealthy.moduleName,
    'logLevel',
    {
      name: 'console logging level', // game.i18n.localize('rules5estuff.settings.debug.text'),
      scope: 'client',
      config: true,
      type: String,
      choices: {
        'none': 'No logging',
        'debug': 'Debug level',
        'log': 'Log level',
      },
      default: 'debug'
  });
  
});
