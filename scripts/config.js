import { Stealthy } from "./stealthy.js";

Hooks.once('ready', () => {

  const module = game.modules.get('stealthy');
  const moduleVersion = module.version;

  game.settings.register('stealthy', 'ignoreFriendlyStealth', {
    name: game.i18n.localize("stealthy.ignoreFriendlyStealth.name"),
    hint: game.i18n.localize("stealthy.ignoreFriendlyStealth.hint"),
    scope: 'world',
    config: true,
    type: Boolean,
    default: true,
  });

  if (game.system.id === 'dnd5e') {
    game.settings.register('stealthy', 'ignoreFriendlyUmbralSight', {
      name: game.i18n.localize("stealthy.dnd5e.ignoreFriendlyUmbralSight.name"),
      hint: game.i18n.localize("stealthy.dnd5e.ignoreFriendlyUmbralSight.hint"),
      scope: 'world',
      config: true,
      type: Boolean,
      default: false,
    });
  }

  let sources = {
    'none': game.i18n.localize("stealthy.source.min"),
    'ae': game.i18n.localize("stealthy.source.ae"),
    'cub': game.i18n.localize("stealthy.source.cub"),
    'ce': game.i18n.localize("stealthy.source.ce")
  };
  let defaultSource = 'ae';
  if (game.cub?.getCondition(game.i18n.localize("stealthy.hidden.label"))) {
    defaultSource = 'cub';
  }
  if (game.dfreds?.effectInterface?.findEffectByName(game.i18n.localize("stealthy.hidden.label"))) {
    defaultSource = 'ce';
  }

  game.settings.register('stealthy', 'hiddenSource', {
    name: game.i18n.localize("stealthy.source.name"),
    hint: game.i18n.localize("stealthy.source.hint"),
    scope: 'world',
    config: true,
    type: String,
    choices: sources,
    default: defaultSource
  });

  game.settings.register('stealthy', 'logLevel', {
    name: game.i18n.localize("stealthy.logLevel.name"),
    scope: 'client',
    config: true,
    type: String,
    choices: {
      'none': game.i18n.localize("stealthy.logLevel.none"),
      'debug': game.i18n.localize("stealthy.logLevel.debug"),
      'log': game.i18n.localize("stealthy.logLevel.log")
    },
    default: 'none'
  });

  if (game.system.id === 'dnd5e') {
    game.settings.register('stealthy', 'tokenLighting', {
      name: game.i18n.localize("stealthy.dnd5e.tokenLighting.name"),
      hint: game.i18n.localize("stealthy.dnd5e.tokenLighting.hint"),
      scope: 'world',
      config: true,
      type: Boolean,
      default: false,
    });

    game.settings.register('stealthy', 'spotPair', {
      name: game.i18n.localize("stealthy.dnd5e.spotPair.name"),
      hint: game.i18n.localize("stealthy.dnd5e.spotPair.hint"),
      scope: 'world',
      config: true,
      type: Boolean,
      default: false,
    });
  }

  Stealthy.log(`Initialized ${moduleVersion}`);
});

Hooks.on('renderSettingsConfig', (app, html, data) => {
  $('<div>').addClass('form-group group-header').html(game.i18n.localize("stealthy.config.general")).insertBefore($('[name="stealthy.ignoreFriendlyStealth"]').parents('div.form-group:first'));
  $('<div>').addClass('form-group group-header').html(game.i18n.localize("stealthy.config.debug")).insertBefore($('[name="stealthy.logLevel"]').parents('div.form-group:first'));
  if (game.system.id === 'dnd5e') {
    $('<div>').addClass('form-group group-header').html(game.i18n.localize("stealthy.dnd5e.config.experimental")).insertBefore($('[name="stealthy.tokenLighting"]').parents('div.form-group:first'));
  }
});
