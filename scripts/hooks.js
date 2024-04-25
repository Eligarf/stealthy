import { Stealthy } from "./stealthy.js";

Hooks.once('setup', () => {
  const module = game.modules.get(Stealthy.MODULE_ID);
  const moduleVersion = module.version;

  game.settings.register(Stealthy.MODULE_ID, 'friendlyStealth', {
    name: game.i18n.localize("stealthy.friendlyStealth.name"),
    scope: 'world',
    config: true,
    type: String,
    choices: {
      'allow': game.i18n.localize("stealthy.friendlyStealth.allow"),
      'inCombat': game.i18n.localize("stealthy.friendlyStealth.inCombat"),
      'ignore': game.i18n.localize("stealthy.friendlyStealth.ignore")
    },
    default: 'inCombat'
  });

  game.settings.register(Stealthy.MODULE_ID, 'playerHud', {
    name: game.i18n.localize("stealthy.playerHud.name"),
    scope: 'world',
    config: true,
    type: Boolean,
    default: false,
  });

  game.settings.register(Stealthy.MODULE_ID, 'spotSecretDoors', {
    name: game.i18n.localize("stealthy.spotHiddenDoors.name"),
    hint: game.i18n.localize("stealthy.spotHiddenDoors.hint"),
    scope: 'world',
    requiresReload: true,
    config: true,
    type: Boolean,
    default: false,
  });

  let sources = {
    'none': game.i18n.localize("stealthy.source.min"),
    'ae': game.i18n.localize("stealthy.source.ae"),
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

  game.settings.register(Stealthy.MODULE_ID, 'hiddenIcon', {
    name: game.i18n.localize("stealthy.hidden.icon"),
    hint: game.i18n.localize("stealthy.hidden.iconhint"),
    scope: 'world',
    requiresReload: true,
    config: true,
    type: String,
    filePicker: true,
    default: 'icons/magic/perception/shadow-stealth-eyes-purple.webp'
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

  game.settings.register(Stealthy.MODULE_ID, 'spotIcon', {
    name: game.i18n.localize("stealthy.spot.icon"),
    hint: game.i18n.localize("stealthy.spot.iconhint"),
    scope: 'world',
    requiresReload: true,
    config: true,
    type: String,
    filePicker: true,
    default: 'icons/commodities/biological/eye-blue.webp'
  });

  game.settings.register(Stealthy.MODULE_ID, 'hiddenLabel', {
    name: game.i18n.localize("stealthy.hidden.preloc.key"),
    hint: game.i18n.localize("stealthy.hidden.preloc.hint"),
    scope: 'world',
    requiresReload: true,
    config: true,
    type: String,
    default: 'stealthy.hidden.name',
  });

  game.settings.register(Stealthy.MODULE_ID, 'spotLabel', {
    name: game.i18n.localize("stealthy.spot.preloc.key"),
    scope: 'world',
    requiresReload: true,
    config: true,
    type: String,
    default: 'stealthy.spot.name',
  });

  game.settings.register(Stealthy.MODULE_ID, 'useTokenFlags', {
    name: game.i18n.localize("stealthy.useTokenFlags.name"),
    hint: game.i18n.localize("stealthy.useTokenFlags.hint"),
    scope: 'world',
    requiresReload: true,
    config: true,
    type: Boolean,
    default: false,
  });
  Stealthy.useTokenFlags = game.settings.get(Stealthy.MODULE_ID, 'useTokenFlags');

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

  game.settings.register(Stealthy.MODULE_ID, 'activeSpot', {
    scope: 'world',
    config: false,
    type: Boolean,
    default: true,
  });
  stealthy.activeSpot = game.settings.get(Stealthy.MODULE_ID, 'activeSpot');

  Stealthy.log(`Initialized ${moduleVersion}`);
});

Hooks.on('renderTokenHUD', (tokenHUD, html, app) => {
  if (game.user.isGM == true || game.settings.get(Stealthy.MODULE_ID, 'playerHud')) {
    const token = tokenHUD.object;
    const actor = token?.actor;
    const engine = stealthy.engine;

    const hiddenEffect = engine.findHiddenEffect(actor);
    let stealthFlag = engine.getStealthFlag(hiddenEffect);
    if (stealthFlag) {
      let value = engine.getStealthValue(stealthFlag, actor);
      const inputBox = $(
        `<input id="ste_hid_inp_box" title="${game.i18n.localize("stealthy.hidden.inputBox")}" type="text" name="hidden_value_inp_box" value="${value}"></input>`
      );
      html.find(".right").append(inputBox);
      if (game.user.isGM == true) {
        inputBox.change(async (inputbox) => {
          if (token === undefined) return;
          await engine.setHiddenValue(actor, duplicate(hiddenEffect), stealthFlag, Number(inputbox.target.value));
        });
      }
    }

    const spotEffect = engine.findSpotEffect(actor);
    let perceptionFlag = engine.getPerceptionFlag(spotEffect);
    if (perceptionFlag) {
      let value = engine.getPerceptionValue(perceptionFlag, actor);
      const inputBox = $(
        `<input id="ste_spt_inp_box" title="${game.i18n.localize("stealthy.spot.inputBox")}" type="text" name="spot_value_inp_box" value="${value}"></input>`
      );
      html.find(".left").append(inputBox);
      if (game.user.isGM == true) {
        inputBox.change(async (inputbox) => {
          if (token === undefined) return;
          await engine.setSpotValue(actor, duplicate(spotEffect), perceptionFlag, Number(inputbox.target.value));
        });
      }
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
    active: stealthy.activeSpot,
    onClick: (toggled) => {
      game.settings.set(Stealthy.MODULE_ID, 'activeSpot', toggled);
      stealthy.socket.executeForEveryone('ToggleActiveSpot', toggled);
    }
  });
});

Hooks.on('renderSettingsConfig', (app, html, data) => {
  $('<div>').addClass('form-group group-header').html(game.i18n.localize("stealthy.config.general")).insertBefore($('[name="stealthy.friendlyStealth"]').parents('div.form-group:first'));
  $('<div>').addClass('form-group group-header').html(game.i18n.localize("stealthy.config.advanced")).insertBefore($('[name="stealthy.hiddenLabel"]').parents('div.form-group:first'));
  $('<div>').addClass('form-group group-header').html(game.i18n.localize("stealthy.config.debug")).insertBefore($('[name="stealthy.logLevel"]').parents('div.form-group:first'));
});

Hooks.once('ready', async () => {
  if (!game.user.isGM) {
    stealthy.activeSpot = await stealthy.socket.executeAsGM('GetActiveSpot');
    return;
  }

  if (!game.modules.get('lib-wrapper')?.active) {
    ui.notifications.error("Stealthy requires the 'libWrapper' module. Please install and activate it.");
  }
});
