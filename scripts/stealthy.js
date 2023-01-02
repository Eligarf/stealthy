export class Stealthy {

  static CONSOLE_COLORS = ['background: #222; color: #80ffff', 'color: #fff'];
  static lightNumTable = ['dark', 'dim', 'bright'];
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
  static tokenLighting5e(spot, perception, visionSource, source, target) {
    let lightLevel = 2;
    let debugData = { perception };

    if (target?.effects.find(e => e.label === game.i18n.localize("stealthy-dark-label") && !e.disabled)) { lightLevel = 0; }
    if (target?.effects.find(e => e.label === game.i18n.localize("stealthy-dim-label") && !e.disabled)) { lightLevel = 1; }
    debugData.lightLevel = Stealthy.lightNumTable[lightLevel];

    // check if Darkvision is in use, bump light level accordingly
    if (visionSource.visionMode?.id === 'darkvision') {
      lightLevel = lightLevel + 1;
      debugData.darklightLevel = Stealthy.lightNumTable[lightLevel];
    }

    // adjust passive perception depending on light conditions of target token
    // don't adjust for active perception checks via 'spot' flag usage
    if (lightLevel < 2 && !spot?.flags.stealthy?.spot) {
      perception = perception - 5;
      debugData.disadvantagedPassive = perception;
    };

    Stealthy.log('tokenLighting5e', debugData);
    return perception;
  }

  static isHidden5e(visionSource, hidden, target, config) {
    const source = visionSource.object?.actor;
    const stealth = hidden.flags.stealthy?.hidden ?? target.system.skills.ste.passive;
    const spot = source?.effects.find(e => e.label === game.i18n.localize("stealthy-spot-label") && !e.disabled);

    // active perception loses ties, passive perception wins ties to simulate the
    // idea that active skills need to win outright to change the status quo. Passive
    // perception means that stealth is being the active skill.
    let perception = spot?.flags.stealthy?.spot ?? (source.system.skills.prc.passive + 1);

    if (game.settings.get('stealthy', 'tokenLighting')) {
      perception = Stealthy.tokenLighting5e(spot, perception, visionSource, source, target);
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
    const label = game.i18n.localize("stealthy-spot-label");
    let spot = actor.effects.find(e => e.label === label);
    let flag = { spot: Math.max(roll.total, actor.system.skills.prc.passive) };

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
            core: {statusId: '1'},
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
      const value = spot.flags.stealthy?.spot ?? actor.system.skills.prc.passive;
      const inputBox = $(
        `<input id="ste_spt_inp_box" title="${game.i18n.localize("stealthy-spot-inputBox-title")}" type="text" name="spot_value_inp_box" value="${value}"></input>`
      );
      html.find(".left").append(inputBox);
      inputBox.change(async (inputbox) => {
        if (token === undefined) return;
        let activeSpot = duplicate(spot);
        activeSpot.flags.stealthy = { spot: Number(inputbox.target.value) };
        await actor.updateEmbeddedDocuments('ActiveEffect', [activeSpot]);
      });
    }
  }
});

Hooks.on('renderSettingsConfig', (app, html, data) => {
  $('<div>').addClass('form-group group-header').html(game.i18n.localize("stealthy-config-general")).insertBefore($('[name="stealthy.ignoreFriendlyStealth"]').parents('div.form-group:first'));
  $('<div>').addClass('form-group group-header').html(game.i18n.localize("stealthy-config-debug")).insertBefore($('[name="stealthy.logLevel"]').parents('div.form-group:first'));
  $('<div>').addClass('form-group group-header').html(game.i18n.localize("stealthy-config-experimental")).insertBefore($('[name="stealthy.tokenLighting"]').parents('div.form-group:first'));
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