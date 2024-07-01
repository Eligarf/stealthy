import { Stealthy } from "./stealthy.js";

function migrate(moduleVersion, oldVersion) {

  // ui.notifications.warn(`Updated Stealthy from ${oldVersion} to ${moduleVersion}`);
  return moduleVersion;
}

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

  Stealthy.log(`${moduleVersion}: setup`);
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
      <i class="fa-solid fa-binoculars"></i>
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
    { label: "general", before: "friendlyStealth" },
    { label: "effects", before: "stealthToActor"},
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
