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

    // Extract the normal perception values from the source
    let active = spotPair?.normal ?? spotPair;
    let value;
    if (active !== undefined) {
      value = active;
      debugData.active = value;
    }
    else {
      value = source.system.skills.prc.passive;
      debugData.passive = value;
    }

    // dark = fail, dim = disadvantage, bright = normal
    if (lightBand <= 0) {
      perception = -100;
      debugData.cantSee = perception;
    }
    else if (lightBand === 1) {
      passiveDisadv = Stealthy.getPassivePerceptionWithDisadvantage(source);
      if (active !== undefined) {
        value = spotPair?.disadv ?? value - 5;
        debugData.activeDisadv = value;
      }
      else {
        value = passiveDisadv;
        debugData.passiveDisadv = value;
      }
      perception = Math.max(value, passiveDisadv);
      debugData.seesDim = perception;
    }
    else {
      perception = Math.max(value, source.system.skills.prc.passive);
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

  static getPassivePerceptionWithDisadvantage(source) {
    // todo: don't apply -5 if already disadvantaged
    return source.system.skills.prc.passive - 5;
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
