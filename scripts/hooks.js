import { Stealthy } from "./stealthy.js";

Hooks.once('setup', () => {
  const module = game.modules.get(Stealthy.MODULE_ID);
  const moduleVersion = module.version;

  game.settings.register(Stealthy.MODULE_ID, 'ignoreFriendlyStealth', {
    name: game.i18n.localize("stealthy.ignoreFriendlyStealth.name"),
    hint: game.i18n.localize("stealthy.ignoreFriendlyStealth.hint"),
    scope: 'world',
    config: true,
    type: Boolean,
    default: true,
  });

  game.settings.register(Stealthy.MODULE_ID, 'spotSecretDoors', {
    name: game.i18n.localize("stealthy.spotSecretDoors.name"),
    hint: game.i18n.localize("stealthy.spotSecretDoors.hint"),
    scope: 'world',
    config: true,
    type: Boolean,
    default: false,
    onChange: value => {
      debouncedReload();
    },
  });

  let sources = {
    'none': game.i18n.localize("stealthy.source.min"),
    'ae': game.i18n.localize("stealthy.source.ae"),
    'cub': game.i18n.localize("stealthy.source.cub.name"),
    'ce': game.i18n.localize("stealthy.source.ce.name")
  };

  game.settings.register(Stealthy.MODULE_ID, 'hiddenSource', {
    name: game.i18n.localize("stealthy.hidden.source"),
    hint: game.i18n.localize("stealthy.source.hint"),
    scope: 'world',
    config: true,
    type: String,
    choices: sources,
    default: 'ae'
  });

  game.settings.register(Stealthy.MODULE_ID, 'spotSource', {
    name: game.i18n.localize("stealthy.spot.source"),
    hint: game.i18n.localize("stealthy.source.hint"),
    scope: 'world',
    config: true,
    type: String,
    choices: sources,
    default: 'ae'
  });

  game.settings.register(Stealthy.MODULE_ID, 'hiddenLabel', {
    name: game.i18n.localize("stealthy.hidden.preloc.key"),
    hint: game.i18n.localize("stealthy.hidden.preloc.hint"),
    scope: 'world',
    config: true,
    type: String,
    default: 'stealthy.hidden.label',
    onChange: value => {
      debouncedReload();
    }
  });

  game.settings.register(Stealthy.MODULE_ID, 'spotLabel', {
    name: game.i18n.localize("stealthy.spot.preloc.key"),
    scope: 'world',
    config: true,
    type: String,
    default: 'stealthy.spot.label',
    onChange: value => {
      debouncedReload();
    }
  });

  game.settings.register(Stealthy.MODULE_ID, 'logLevel', {
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

  const systemEngine = Stealthy.engines[game.system.id];
  if (systemEngine) {
    window.game.stealthy = new Stealthy(systemEngine);
  }
  else {
    console.error(`Stealthy doesn't yet support system id '${game.system.id}'`);
  }

  Stealthy.log(`Initialized ${moduleVersion}`);
});

Hooks.on('renderTokenHUD', (tokenHUD, html, app) => {
  if (game.user.isGM == true) {
    const token = tokenHUD.object;
    const actor = token?.actor;
    const engine = game.stealthy.engine;

    const hiddenEffect = engine.findHiddenEffect(actor);
    if (hiddenEffect) {
      let { flag, value } = engine.getHiddenFlagAndValue(actor, hiddenEffect);
      const inputBox = $(
        `<input id="ste_hid_inp_box" title="${game.i18n.localize("stealthy.hidden.inputBox")}" type="text" name="hidden_value_inp_box" value="${value}"></input>`
      );
      html.find(".right").append(inputBox);
      inputBox.change(async (inputbox) => {
        if (token === undefined) return;
        await engine.setHiddenValue(actor, duplicate(hiddenEffect), flag, Number(inputbox.target.value));
      });
    }

    const spotEffect = engine.findSpotEffect(actor);
    if (spotEffect) {
      let { flag, value } = engine.getSpotFlagAndValue(actor, spotEffect);
      const inputBox = $(
        `<input id="ste_spt_inp_box" title="${game.i18n.localize("stealthy.spot.inputBox")}" type="text" name="spot_value_inp_box" value="${value}"></input>`
      );
      html.find(".left").append(inputBox);
      inputBox.change(async (inputbox) => {
        if (token === undefined) return;
        await engine.setSpotValue(actor, duplicate(spotEffect), flag, Number(inputbox.target.value));
        canvas.perception.update({ initializeVision: true }, true);
      });
    }
  }
});

Hooks.on('getSceneControlButtons', (controls) => {
  if (!game.user.isGM) return;
  let tokenControls = controls.find(x => x.name === 'token');
  tokenControls.tools.push({
    icon: 'fa-solid fa-eyes',
    name: 'stealthy-spotting',
    title: game.i18n.localize("stealthy.activeSpot"),
    toggle: true,
    active: game.stealthy.activeSpot,
    onClick: (toggled) => game.stealthy.socket.executeForEveryone('ToggleActiveSpot', toggled)
  });
});

Hooks.on('renderSettingsConfig', (app, html, data) => {
  $('<div>').addClass('form-group group-header').html(game.i18n.localize("stealthy.config.general")).insertBefore($('[name="stealthy.ignoreFriendlyStealth"]').parents('div.form-group:first'));
  $('<div>').addClass('form-group group-header').html(game.i18n.localize("stealthy.config.advanced")).insertBefore($('[name="stealthy.hiddenLabel"]').parents('div.form-group:first'));
  $('<div>').addClass('form-group group-header').html(game.i18n.localize("stealthy.config.debug")).insertBefore($('[name="stealthy.logLevel"]').parents('div.form-group:first'));
});

Hooks.once('ready', async () => {
  if (!game.modules.get('lib-wrapper')?.active && game.user.isGM)
    ui.notifications.error("Stealthy requires the 'libWrapper' module. Please install and activate it.");
  if (!game.user.isGM)
    game.stealthy.activeSpot = await game.stealthy.socket.executeAsGM('GetActiveSpot');
});
