import { Stealthy } from './stealthy.js';

Hooks.once('init', () => {

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

});
