Hooks.once('init', () => {

  game.settings.register('stealthy', 'spotVsHidden', {
    name: 'Enable spot vs hidden',
    scope: 'world',
    config: true,
    type: Boolean,
    default: true,
  });

  game.settings.register('stealthy', 'ignoreFriendlyStealth', {
    name: 'Ignore friendly stealth',
    scope: 'world',
    config: true,
    type: Boolean,
    default: true,
  });

  game.settings.register('stealthy', 'ignoreFriendlyGloomstalker', {
    name: 'Ignore friendly gloomstalkers',
    scope: 'world',
    config: true,
    type: Boolean,
    default: false,
  });

});
