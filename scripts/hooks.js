import { Stealthy } from "./stealthy.js";

Hooks.once('setup', () => {
  const systemEngine = Stealthy.engines[game.system.id];
  if (systemEngine) {
    window.game.stealthy = new Stealthy(systemEngine);
  }
  else {
    console.error(`Stealthy doesn't yet support system id '${game.system.id}'`);
  }
});

Hooks.on('renderTokenHUD', (tokenHUD, html, app) => {
  if (game.user.isGM == true) {
    const token = tokenHUD.object;
    const actor = token?.actor;
    const engine = game.stealthy.engine;

    const hidden = actor?.effects.find(e => e.label === game.i18n.localize("stealthy-hidden-label") && !e.disabled);
    if (hidden) {
      let { flag, value } = engine.getHiddenFlagAndValue(hidden);
      const inputBox = $(
        `<input id="ste_hid_inp_box" title="${game.i18n.localize("stealthy-hidden-inputBox-title")}" type="text" name="hidden_value_inp_box" value="${value}"></input>`
      );
      html.find(".right").append(inputBox);
      inputBox.change(async (inputbox) => {
        if (token === undefined) return;
        await engine.setHiddenValue(actor, duplicate(hidden), flag, Number(inputbox.target.value));
      });
    }

    const spot = actor?.effects.find(e => e.label === game.i18n.localize("stealthy-spot-label") && !e.disabled);
    if (spot) {
      let { flag, value } = engine.getSpotFlagAndValue(spot);
      const inputBox = $(
        `<input id="ste_spt_inp_box" title="${game.i18n.localize("stealthy-spot-inputBox-title")}" type="text" name="spot_value_inp_box" value="${value}"></input>`
      );
      html.find(".left").append(inputBox);
      inputBox.change(async (inputbox) => {
        if (token === undefined) return;
        await engine.setSpotValue(actor, duplicate(spot), flag, Number(inputbox.target.value));
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
    title: game.i18n.localize("stealthy-active-spot"),
    toggle: true,
    active: game.stealthy.activeSpot,
    onClick: (toggled) => game.stealthy.socket.executeForEveryone('ToggleActiveSpot', toggled)
  });
});

Hooks.once('ready', async () => {
  if (!game.user.isGM)
    game.stealthy.activeSpot = await game.stealthy.socket.executeAsGM('GetActiveSpot');
});
