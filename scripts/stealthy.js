export class Stealthy {

  static CONSOLE_COLORS = ['background: #222; color: #80ffff', 'color: #fff'];
  static LIGHT_LABELS = ['dark', 'dim', 'bright'];
  static socket;

  static log(format, ...args) {
    const level = game.settings.get('stealthy', 'logLevel');
    if (level !== 'none') {

      function colorizeOutput(format, ...args) {
        return [
          `%cstealthy %c|`,
          ...Stealthy.CONSOLE_COLORS,
          format,
          ...args,
        ];
      }

      if (level === 'debug')
        console.debug(...colorizeOutput(format, ...args));
      else if (level === 'log')
        console.log(...colorizeOutput(format, ...args));
    }
  }

  // check target Token Lighting conditions via effects usage
  // look for effects that indicate Dim or Dark condition on the token
  static adjustForLightingConditions5e(spotPair, visionSource, source, target) {
    let debugData = { spotPair };

    // What light band are we told we sit in?
    let lightBand = 2;
    if (target?.effects.find(e => e.label === game.i18n.localize("stealthy-dark-label") && !e.disabled)) { lightBand = 0; }
    if (target?.effects.find(e => e.label === game.i18n.localize("stealthy-dim-label") && !e.disabled)) { lightBand = 1; }
    debugData.lightLevel = Stealthy.LIGHT_LABELS[lightBand];

    // Adjust the light band based on conditions
    if (visionSource.visionMode?.id === 'darkvision') {
      lightBand = lightBand + 1;
      debugData.foundryDarkvision = Stealthy.LIGHT_LABELS[lightBand];
    }

    // Extract the normal and disadvantaged perception values from the source
    let active = spotPair?.normal ?? spotPair;
    let normal;
    let disadv;
    if (active !== undefined) {
      normal = active;
      disadv = spotPair?.disadv ?? normal - 5;
      debugData.active = { normal, disadv };
    }
    else {
      normal = source.system.skills.prc.passive;
      disadv = normal - 5;
      debugData.passive = { normal, disadv };
    }

    // dark = fail, dim = disadvantage, bright = normal
    if (lightBand <= 0) {
      perception = -100;
      debugData.cantSee = perception;
    }
    else if (lightBand === 1) {
      perception = Math.max(disadv, source.system.skills.prc.passive - 5);
      debugData.seesDim = perception;
    }
    else {
      perception = Math.max(normal, source.system.skills.prc.passive);
      debugData.seesBright = perception;
    }

    Stealthy.log('adjustForLightingConditions5e', debugData);
    return perception;
  }

  static adjustForConditions5e(spotPair, visionSource, source, target) {
    let perception = spotPair?.normal
      ?? spotPair
      ?? (source.system.skills.prc.passive + 1);
    perception = Math.max(perception, source.system.skills.prc.passive);
  }

  static isHidden5e(visionSource, hidden, target, config) {
    const source = visionSource.object?.actor;
    const stealth = hidden.flags.stealthy?.hidden ?? target.system.skills.ste.passive;
    const spot = source?.effects.find(e => e.label === game.i18n.localize("stealthy-spot-label") && !e.disabled);

    // active perception loses ties, passive perception wins ties to simulate the
    // idea that active skills need to win outright to change the status quo. Passive
    // perception means that stealth is being the active skill.
    const spotPair = spot?.flags.stealthy?.spot;
    let perception;

    if (game.settings.get('stealthy', 'tokenLighting')) {
      perception = Stealthy.adjustForLightingConditions5e(spotPair, visionSource, source, target);
    }
    else {
      perception = Stealthy.adjustForConditions5e(spotPair, visionSource, source, target);
    }

    if (perception <= stealth) {
      Stealthy.log(`${visionSource.object.name}'s ${perception} can't see ${config.object.name}'s ${stealth}`);
      return true;
    }
    return false;
  }

  static enableSpot = true;

  static async rollPerception(actor, roll) {
    if (!Stealthy.enableSpot) return;
    Stealthy.log('rollPerception', { actor, roll });

    let perception = { normal: roll.total, disadvantaged: roll.total };
    if (!roll.hasDisadvantage && game.settings.get('stealthy', 'spotPair')) {
      const dice = roll.dice[0];
      if (roll.hasAdvantage) {
        const delta = dice.results[1].result - dice.results[0].result;
        if (delta > 0) {
          perception.disadvantaged -= delta;
        }
      }
      else {
        let disadvantageRoll = await new Roll(`1d20`).evaluate();
        game.dice3d?.showForRoll(disadvantageRoll);
        const delta = dice.results[0].result - disadvantageRoll.total;
        if (delta > 0) {
          perception.disadvantaged -= delta;
        }
      }
    }

    const label = game.i18n.localize("stealthy-spot-label");
    let spot = actor.effects.find(e => e.label === label);
    let flag = { spot: perception };

    if (!spot) {
      // See if we can source from outside
      const source = game.settings.get('stealthy', 'hiddenSource');
      if (source === 'ce') {
        await game.dfreds.effectInterface.addEffect({ effectName: label, uuid: actor.uuid });
        spot = actor.effects.find(e => e.label === label);
      }
      else if (source === 'cub') {
        await game.cub.applyCondition(label, actor);
        spot = actor.effects.find(e => e.label === label);
      }

      // If we haven't found an ouside source, create the default one
      if (!spot) {
        spot = {
          label,
          icon: 'icons/commodities/biological/eye-blue.webp',
          duration: { turns: 1, seconds: 6 },
          flags: {
            convenientDescription: game.i18n.localize("stealthy-spot-description"),
            stealthy: flag,
          },
        };

        await actor.createEmbeddedDocuments('ActiveEffect', [spot]);
        return;
      }
    }

    let activeSpot = duplicate(spot);
    activeSpot.flags.stealthy = flag;
    activeSpot.disabled = false;
    await actor.updateEmbeddedDocuments('ActiveEffect', [activeSpot]);
  }

  static async rollStealth(actor, roll) {
    Stealthy.log('rollStealth', { actor, roll });
    const label = game.i18n.localize("stealthy-hidden-label");
    let hidden = actor.effects.find(e => e.label === label);
    let flag = { hidden: roll.total };

    if (!hidden) {
      // See if we can source from outside
      const source = game.settings.get('stealthy', 'hiddenSource');
      if (source === 'ce') {
        await game.dfreds.effectInterface.addEffect({ effectName: label, uuid: actor.uuid });
        hidden = actor.effects.find(e => e.label === label);
      }
      else if (source === 'cub') {
        await game.cub.applyCondition(label, actor);
        hidden = actor.effects.find(e => e.label === label);
      }

      // If we haven't found an ouside source, create the default one
      if (!hidden) {
        hidden = {
          label,
          icon: 'icons/magic/perception/shadow-stealth-eyes-purple.webp',
          changes: [],
          flags: {
            core: { statusId: '1' },
            convenientDescription: game.i18n.localize("stealthy-hidden-description"),
            stealthy: flag
          },
        };

        if (source === 'ae') {
          if (typeof TokenMagic !== 'undefined') {
            hidden.changes.push({
              key: 'macro.tokenMagic',
              mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
              value: 'fog'
            });
          }
          else if (typeof ATLUpdate !== 'undefined') {
            hidden.changes.push({
              key: 'ATL.alpha',
              mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
              value: '0.5'
            });
          }
        }

        // No need to update the effect with roll data because we just created it therein
        await actor.createEmbeddedDocuments('ActiveEffect', [hidden]);
        return;
      }
    }

    // Need to stick the roll data into a flag and update the effect
    let activeHide = duplicate(hidden);
    activeHide.flags.stealthy = flag;
    activeHide.disabled = false;
    await actor.updateEmbeddedDocuments('ActiveEffect', [activeHide]);
  }

  static testVisionStealth(visionSource, config) {
    const target = config.object?.actor;
    const ignoreFriendlyStealth =
      game.settings.get('stealthy', 'ignoreFriendlyStealth') &&
      config.object.document?.disposition === visionSource.object.document?.disposition;

    if (!ignoreFriendlyStealth) {
      const hidden = target?.effects.find(e => e.label === game.i18n.localize("stealthy-hidden-label") && !e.disabled);
      if (hidden) {
        // This will be better implemented as an interface
        // First thing to do when adding second supported system
        if (Stealthy.isHidden5e(visionSource, hidden, target, config)) return false;
      }
    }

    return true;
  }

  static async toggleSpotting(toggled) {
    Stealthy.enableSpot = toggled;

    if (!toggled && game.user.isGM) {
      const label = game.i18n.localize('stealthy-spot-label');
      for (let token of canvas.tokens.placeables) {
        const actor = token.actor;
        const spot = actor.effects.find(e => e.label === label);
        if (spot) {
          actor.deleteEmbeddedDocuments('ActiveEffect', [spot.id]);
        }
      }
    }
  }

  static async getSpotting() {
    return Stealthy.enableSpot;
  }

}

Hooks.once('setup', () => {
  libWrapper.register(
    'stealthy',
    'DetectionModeBasicSight.prototype.testVisibility',
    (wrapped, visionSource, mode, config = {}) => {
      if (!Stealthy.testVisionStealth(visionSource, config)) return false;

      const target = config.object?.actor;
      let noDarkvision = false;
      const ignoreFriendlyUmbralSight =
        game.settings.get('stealthy', 'ignoreFriendlyUmbralSight') &&
        config.object.document?.disposition === visionSource.object.document?.disposition;
      if (!ignoreFriendlyUmbralSight && visionSource.visionMode?.id === 'darkvision') {
        const umbralSight = target?.itemTypes?.feat?.find(f => f.name === game.i18n.localize('Umbral Sight'));
        if (umbralSight) noDarkvision = true;
      }

      if (noDarkvision) {
        Stealthy.log(`${visionSource.object.name}'s darkvision can't see ${config.object.name}`);
        let ourMode = duplicate(mode);
        ourMode.range = 0;
        return wrapped(visionSource, ourMode, config);
      }

      return wrapped(visionSource, mode, config);
    },
    libWrapper.MIXED,
    { perf_mode: libWrapper.PERF_FAST }
  );

  libWrapper.register(
    'stealthy',
    'DetectionModeInvisibility.prototype.testVisibility',
    (wrapped, visionSource, mode, config = {}) => {
      if (!Stealthy.testVisionStealth(visionSource, config)) return false;
      return wrapped(visionSource, mode, config);
    },
    libWrapper.MIXED,
    { perf_mode: libWrapper.PERF_FAST }
  );
});

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
        disadv = normal - 5;
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