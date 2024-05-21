import { Stealthy } from "./stealthy.js";

function migrate(moduleVersion, oldVersion) {

  // ui.notifications.warn(`Updated Stealthy from ${oldVersion} to ${moduleVersion}`);
  return moduleVersion;
}

Hooks.once('init', () => {
  const module = game.modules.get(Stealthy.MODULE_ID);
  const moduleVersion = module.version;

  game.settings.register(Stealthy.MODULE_ID, 'stealthToActor', {
    name: game.i18n.localize("stealthy.stealthToActor.name"),
    hint: game.i18n.localize("stealthy.stealthToActor.hint"),
    scope: 'world',
    config: true,
    type: Boolean,
    default: true,
    onChange: value => {
      stealthy.stealthToActor = value;
    }
  });

  game.settings.register(Stealthy.MODULE_ID, 'perceptionToActor', {
    name: game.i18n.localize("stealthy.perceptionToActor.name"),
    hint: game.i18n.localize("stealthy.perceptionToActor.hint"),
    scope: 'world',
    config: true,
    type: Boolean,
    default: false,
    onChange: value => {
      stealthy.perceptionToActor = value;
    }
  });

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
    name: game.i18n.localize("stealthy.playerHud.hint"),
    scope: 'world',
    config: true,
    type: Boolean,
    default: false,
  });

  game.settings.register(Stealthy.MODULE_ID, 'exposure', {
    name: game.i18n.localize("stealthy.exposure.name"),
    name: game.i18n.localize("stealthy.exposure.hint"),
    scope: 'client',
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
  };
  if (game.dfreds?.effectInterface) {
    sources['ce'] = game.i18n.localize("stealthy.source.ce.name");
  }

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

  game.settings.register(Stealthy.MODULE_ID, 'activeSpot', {
    scope: 'world',
    config: false,
    type: Boolean,
    default: true,
  });

  Stealthy.log(`Initialized ${moduleVersion}`);
});

Hooks.once('setup', () => {
  const module = game.modules.get(Stealthy.MODULE_ID);
  const moduleVersion = module.version;

  stealthy.stealthToActor = game.settings.get(Stealthy.MODULE_ID, 'stealthToActor');
  stealthy.perceptionToActor = game.settings.get(Stealthy.MODULE_ID, 'perceptionToActor');

  const schemaVersion = game.settings.get(Stealthy.MODULE_ID, 'schema');
  if (schemaVersion !== moduleVersion) {
    Hooks.once('ready', () => {
      game.settings.set(Stealthy.MODULE_ID, 'schema', migrate(moduleVersion, schemaVersion));
    });
  }

  stealthy.bankingPerception = game.settings.get(Stealthy.MODULE_ID, 'activeSpot');

  Stealthy.log(`Setup ${moduleVersion}`);
});

const LIGHT_ICONS = {
  bright: '<i class="fa-solid fa-circle"></i>',
  dim: '<i class="fa-solid fa-circle-half-stroke"></i>',
  dark: '<i class="fa-regular fa-circle"></i>'
};

function appendExposure(html, engine, token) {
  const exposure = engine.getLightExposure(token);
  if (exposure === undefined) return;
  const icon = LIGHT_ICONS[exposure];
  const title = game.i18n.localize(`stealthy.exposure.${exposure}`);
  html.find(".right").append($(`<div class="control-icon" title="${title}">${icon}</div>`));
}

Hooks.on('renderTokenHUD', (tokenHUD, html, app) => {
  const engine = stealthy.engine;
  const token = tokenHUD.object;

  if (game.settings.get(Stealthy.MODULE_ID, 'exposure'))
    appendExposure(html, engine, token);

  if (!(game.user.isGM == true) && !game.settings.get(Stealthy.MODULE_ID, 'playerHud')) return;
  const editMode = game.user.isGM ? '' : 'disabled ';

  let stealthFlag = engine.getStealthFlag(token);
  if (stealthFlag) {
    let value = engine.getStealthValue(stealthFlag);
    const title = game.i18n.localize("stealthy.hidden.description");
    const inputBox = $(`
      <input ${editMode}id="ste_ste_inp_box" title="${title}" type="text" name="ste_inp_box" value="${value}">
      </input>
    `);
    html.find(".right").append(inputBox);
    if (game.user.isGM == true) {
      inputBox.change(async (inputbox) => {
        if (token === undefined) return;
        const newValue = (!inputbox.target.value.length && !stealthy.stealthToActor)
          ? undefined
          : Number(inputbox.target.value);
        await engine.setStealthValue(stealthFlag, newValue);
      });
    }
  }

  let perceptionFlag = engine.getPerceptionFlag(token);
  if (perceptionFlag && !perceptionFlag?.passive) {
    let value = engine.getPerceptionValue(perceptionFlag);
    const title = game.i18n.localize("stealthy.spot.description");
    const inputBox = $(`
      <input ${editMode}id="ste_prc_inp_box" title="${title}" type="text" name="prc_inp_box" value="${value}">
      </input>
    `);
    html.find(".left").append(inputBox);
    if (game.user.isGM == true) {
      inputBox.change(async (inputbox) => {
        if (token === undefined) return;
        const newValue = (!inputbox.target.value.length && !stealthy.perceptionToActor)
          ? undefined
          : Number(inputbox.target.value);
        await engine.setPerceptionValue(perceptionFlag, newValue);
      });
    }
  }
});

Hooks.on('getSceneControlButtons', (controls) => {
  if (!game.user.isGM) return;
  let tokenControls = controls.find(x => x.name === 'token');
  tokenControls.tools.push({
    icon: 'fa-solid fa-piggy-bank',
    name: 'stealthy-perception-toggle',
    title: game.i18n.localize("stealthy.bankPerception"),
    toggle: true,
    active: stealthy.bankingPerception,
    onClick: (toggled) => {
      game.settings.set(Stealthy.MODULE_ID, 'activeSpot', toggled);
      stealthy.socket.executeForEveryone('TogglePerceptionBanking', toggled);
    }
  });
});

Hooks.on('renderSettingsConfig', (app, html, data) => {
  const sections = [
    { label: "general", before: "stealthToActor" },
    { label: "advanced", before: "hiddenLabel" },
    { label: "debug", before: "logLevel" },
  ];
  for (const section of sections) {
    $('<div>')
      .addClass('form-group group-header')
      .html(game.i18n.localize(`stealthy.config.${section.label}`))
      .insertBefore($(`[name="stealthy.${section.before}"]`)
        .parents('div.form-group:first'));
  }
});

Hooks.once('ready', async () => {
  if (!game.user.isGM) {
    stealthy.bankingPerception = await stealthy.socket.executeAsGM('GetPerceptionBanking');
    return;
  }

  if (!game.modules.get('lib-wrapper')?.active) {
    ui.notifications.error("Stealthy requires the 'libWrapper' module. Please install and activate it.");
  }
});
