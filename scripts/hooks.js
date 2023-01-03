import { Stealthy } from "./stealthy.js";
import { Stealthy5e } from "./systems/dnd5e.js";
import { StealthyPF1 } from "./systems/pf1.js";
import { StealthyPF2e } from "./systems/pf2e.js";

Hooks.once('init', () => {
  const engines = {
    'dnd5e': () => { Stealthy.engine = new Stealthy5e(); },
    'pf1': () => { Stealthy.engine = new StealthyPF1(); },
    'pf2e': () => { Stealthy.engine = new StealthyPF2e(); },
  }
  const engine = engines[game.system.id];
  if (engine) {
    engine();
  }
  else {
    console.error(`Stealthy doesn't yet support system id '${game.system.id}'`);
  }
});

Hooks.on('renderTokenHUD', (tokenHUD, html, app) => {
  if (game.user.isGM == true) {
    const token = tokenHUD.object;
    const actor = token?.actor;
    const system = Stealthy.engine;

    const hidden = actor?.effects.find(e => e.label === game.i18n.localize("stealthy-hidden-label") && !e.disabled);
    if (hidden) {
      let { flag, value } = system.getHiddenFlagAndValue(hidden);
      const inputBox = $(
        `<input id="ste_hid_inp_box" title="${game.i18n.localize("stealthy-hidden-inputBox-title")}" type="text" name="hidden_value_inp_box" value="${value}"></input>`
      );
      html.find(".right").append(inputBox);
      inputBox.change(async (inputbox) => {
        if (token === undefined) return;
        await system.setHiddenValue(actor, duplicate(hidden), flag, Number(inputbox.target.value));
      });
    }

    const spot = actor?.effects.find(e => e.label === game.i18n.localize("stealthy-spot-label") && !e.disabled);
    if (spot) {
      let { flag, value } = system.getSpotFlagAndValue(spot);
      const inputBox = $(
        `<input id="ste_spt_inp_box" title="${game.i18n.localize("stealthy-spot-inputBox-title")}" type="text" name="spot_value_inp_box" value="${value}"></input>`
      );
      html.find(".left").append(inputBox);
      inputBox.change(async (inputbox) => {
        if (token === undefined) return;
        await system.setSpotValue(actor, duplicate(spot), flag, Number(inputbox.target.value));
      });
    }
  }
});

Hooks.once('socketlib.ready', () => {
  Stealthy.socket = socketlib.registerModule('stealthy');
  Stealthy.socket.register('toggleSpotting', Stealthy.toggleSpotting);
  Stealthy.socket.register('getSpotting', Stealthy.getSpotting);
});

Hooks.on('getSceneControlButtons', (controls) => {
  if (!game.user.isGM) return;
  let tokenControls = controls.find(x => x.name === 'token');
  tokenControls.tools.push({
    icon: 'fa-solid fa-eyes',
    name: 'stealthy-spotting',
    title: game.i18n.localize("stealthy-active-spot"),
    toggle: true,
    active: Stealthy.enableSpot,
    onClick: (toggled) => Stealthy.socket.executeForEveryone('toggleSpotting', toggled)
  });
});

Hooks.once('ready', async () => {
  if (!game.user.isGM)
    Stealthy.enableSpot = await Stealthy.socket.executeAsGM('getSpotting');
});
