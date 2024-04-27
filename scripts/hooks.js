import { Stealthy } from "./stealthy.js";

function migrate(moduleVersion, oldVersion) {

  // ui.notifications.warn(`Updated Stealthy from ${oldVersion} to ${moduleVersion}`);
  return moduleVersion;
}

Hooks.once('setup', () => {
  const module = game.modules.get(Stealthy.MODULE_ID);
  const moduleVersion = module.version;

  game.settings.register(Stealthy.MODULE_ID, 'rollsOnToken', {
    name: game.i18n.localize("stealthy.rollsOnToken.name"),
    hint: game.i18n.localize("stealthy.rollsOnToken.hint"),
    scope: 'world',
    config: true,
    type: Boolean,
    default: false,
    onChange: value => {
      stealthy.rollsOnToken = value;
    }
  });
  stealthy.rollsOnToken = game.settings.get(Stealthy.MODULE_ID, 'rollsOnToken');

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
    config: true,
    type: String,
    default: 'stealthy.hidden.name',
    onChange: value => {
      stealthy.engine.hiddenName = value;
    }
  });

  game.settings.register(Stealthy.MODULE_ID, 'spotLabel', {
    name: game.i18n.localize("stealthy.spot.preloc.key"),
    scope: 'world',
    config: true,
    type: String,
    default: 'stealthy.spot.name',
    onChange: value => {
      stealthy.engine.spotName = value;
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

  game.settings.register(Stealthy.MODULE_ID, 'schema', {
    name: game.i18n.localize(`${Stealthy.MODULE_ID}.schema.name`),
    hint: game.i18n.localize(`${Stealthy.MODULE_ID}.schema.hint`),
    scope: 'world',
    config: true,
    type: String,
    default: `${moduleVersion}`,
    onChange: value => {
      const newValue = migrate(moduleVersion, value);
      if (value != newValue) {
        game.settings.set(MODULE_ID, 'schema', newValue);
      }
    }
  });
  const schemaVersion = game.settings.get(Stealthy.MODULE_ID, 'schema');
  if (schemaVersion !== moduleVersion) {
    Hooks.once('ready', () => {
      game.settings.set(Stealthy.MODULE_ID, 'schema', migrate(moduleVersion, schemaVersion));
    });
  }

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
    const engine = stealthy.engine;

    let stealthFlag = engine.getStealthFlag(token);
    if (stealthFlag) {
      let value = engine.getStealthValue(stealthFlag);
      const inputBox = $(
        `<input id="ste_hid_inp_box" title="${game.i18n.localize("stealthy.hidden.inputBox")}" type="text" name="hidden_value_inp_box" value="${value}"></input>`
      );
      html.find(".right").append(inputBox);
      if (game.user.isGM == true) {
        inputBox.change(async (inputbox) => {
          if (token === undefined) return;
          const newValue = (!inputbox.target.value.length && stealthy.rollsOnToken)
            ? undefined
            : Number(inputbox.target.value);
          await engine.setStealthValue(stealthFlag, newValue);
        });
      }
    }

    let perceptionFlag = engine.getPerceptionFlag(token);
    if (perceptionFlag && !perceptionFlag?.passive) {
      Stealthy.log('perceptionFlag', perceptionFlag);
      let value = engine.getPerceptionValue(perceptionFlag);
      const inputBox = $(
        `<input id="ste_spt_inp_box" title="${game.i18n.localize("stealthy.spot.inputBox")}" type="text" name="spot_value_inp_box" value="${value}"></input>`
      );
      html.find(".left").append(inputBox);
      if (game.user.isGM == true) {
        inputBox.change(async (inputbox) => {
          if (token === undefined) return;
          const newValue = (!inputbox.target.value.length && stealthy.rollsOnToken)
            ? undefined
            : Number(inputbox.target.value);
          await engine.setPerceptionValue(perceptionFlag, newValue);
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
  $('<div>').addClass('form-group group-header').html(game.i18n.localize("stealthy.config.general")).insertBefore($('[name="stealthy.rollsOnToken"]').parents('div.form-group:first'));
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
