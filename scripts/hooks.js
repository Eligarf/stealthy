import { Stealthy } from "./stealthy.js";

Hooks.on('dnd5e.rollSkill', async (actor, roll, skill) => {
  if (skill === 'ste') {
    await Stealthy.rollStealth(actor, roll);
  }
  else if (skill === 'prc') {
    await Stealthy.rollPerception(actor, roll);
  }
});

Hooks.on('renderTokenHUD', (tokenHUD, html, app) => {
  if (game.user.isGM == true) {
    const token = tokenHUD.object;
    const actor = token?.actor;

    const hidden = actor?.effects.find(e => e.label === game.i18n.localize("stealthy-hidden-label") && !e.disabled);
    if (hidden) {
      const value = hidden.flags.stealthy?.hidden ?? actor.system.skills.ste.passive;
      const inputBox = $(
        `<input id="ste_hid_inp_box" title="${game.i18n.localize("stealthy-hidden-inputBox-title")}" type="text" name="hidden_value_inp_box" value="${value}"></input>`
      );
      html.find(".right").append(inputBox);
      inputBox.change(async (inputbox) => {
        if (token === undefined) return;
        let activeHide = duplicate(hidden);
        activeHide.flags.stealthy = { hidden: Number(inputbox.target.value) };
        await actor.updateEmbeddedDocuments('ActiveEffect', [activeHide]);
      });
    }

    const spot = actor?.effects.find(e => e.label === game.i18n.localize("stealthy-spot-label") && !e.disabled);
    if (spot) {
      let normal;
      let disadv;
      const active = spot.flags.stealthy?.spot?.normal ?? spot.flags.stealthy?.spot;
      if (active !== undefined) {
        normal = active;
        disadv = spot.flags.stealthy?.spot?.disadv ?? normal - 5;
      }
      else {
        normal = actor.system.skills.prc.passive;
        disadv = Stealthy.getPassivePerceptionWithDisadvantage(actor);
      }
      const inputBox = $(
        `<input id="ste_spt_inp_box" title="${game.i18n.localize("stealthy-spot-inputBox-title")}" type="text" name="spot_value_inp_box" value="${normal}"></input>`
      );
      html.find(".left").append(inputBox);
      inputBox.change(async (inputbox) => {
        if (token === undefined) return;
        let activeSpot = duplicate(spot);
        const delta = Number(inputbox.target.value) - normal;
        activeSpot.flags.stealthy = {
          spot: {
            normal: normal + delta,
            disadvantaged: disadv + delta
          }
        };
        await actor.updateEmbeddedDocuments('ActiveEffect', [activeSpot]);
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
