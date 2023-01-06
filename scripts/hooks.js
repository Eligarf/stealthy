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

Hooks.once('ready', async () => {
  if (!game.user.isGM)
    game.stealthy.activeSpot = await game.stealthy.socket.executeAsGM('GetActiveSpot');
});
