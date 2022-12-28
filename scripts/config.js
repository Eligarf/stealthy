import { Stealthy } from './stealthy.js';

Hooks.once('init', () => {

  const module = game.modules.get(Stealthy.moduleName);
  const moduleVersion = module.version;
  console.log(`stealthy | Initializing ${moduleVersion}`);

  game.settings.register(
    Stealthy.moduleName,
    Stealthy.spotVsHidden,
    {
      name: 'Enable spot vs hidden',
      scope: 'world',
      config: true,
      type: Boolean,
      default: true,
    });

  game.settings.register(
    Stealthy.moduleName,
    Stealthy.ignoreFriendlyStealth,
    {
      name: 'Ignore friendly stealth',
      scope: 'world',
      config: true,
      type: Boolean,
      default: true,
    });

  game.settings.register(
    Stealthy.moduleName,
    Stealthy.ignoreFriendlyGloomstalker,
    {
      name: 'Ignore friendly gloomstalkers',
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
