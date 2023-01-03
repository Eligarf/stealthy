import { Stealthy, StealthyBaseEngine } from '../stealthy.js';

export class Stealthy5e extends StealthyBaseEngine {

  constructor() {
    super();
    Hooks.on('dnd5e.rollSkill', async (actor, roll, skill) => {
      if (skill === 'ste') {
        await Stealthy5e.rollStealth(actor, roll);
      }
      else if (skill === 'prc') {
        await Stealthy5e.rollPerception(actor, roll);
      }
    });
  }

  static LIGHT_LABELS = ['dark', 'dim', 'bright'];

  isHidden(visionSource, hidden, target, config) {
    const source = visionSource.object?.actor;
    const stealth = hidden.flags.stealthy?.hidden ?? target.system.skills.ste.passive;
    const spot = source?.effects.find(e => e.label === game.i18n.localize("stealthy-spot-label") && !e.disabled);

    // active perception loses ties, passive perception wins ties to simulate the
    // idea that active skills need to win outright to change the status quo. Passive
    // perception means that stealth is being the active skill.
    const spotPair = spot?.flags.stealthy?.spot;
    let perception;

    if (game.settings.get('stealthy', 'tokenLighting')) {
      perception = Stealthy5e.AdjustForLightingConditions(spotPair, visionSource, source, target);
    }
    else {
      perception = Stealthy5e.AdjustForDefaultConditions(spotPair, visionSource, source, target);
    }

    if (perception <= stealth) {
      Stealthy.log(`${visionSource.object.name}'s ${perception} can't see ${config.object.name}'s ${stealth}`);
      return true;
    }
    return false;
  }

  basicVision(wrapped, visionSource, mode, config)
  {
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
  }

  seeInvisibility(wrapped, visionSource, mode, config) {
    return wrapped(visionSource, mode, config);
  }

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
    await Stealthy.UpdateOrCreateEffect({
      label,
      actor,
      flag: { spot: perception },
      makeEffect: (flag, source) => ({
        label,
        icon: 'icons/commodities/biological/eye-blue.webp',
        duration: { turns: 1, seconds: 6 },
        flags: {
          convenientDescription: game.i18n.localize("stealthy-spot-description"),
          stealthy: flag
        },
      })
    });
  }

  static async rollStealth(actor, roll) {
    Stealthy.log('rollStealth', { actor, roll });

    const label = game.i18n.localize("stealthy-hidden-label");
    await Stealthy.UpdateOrCreateEffect({
      label,
      actor,
      flag: { hidden: roll.total },
      makeEffect: (flag, source) => {
        let hidden = {
          label,
          icon: 'icons/magic/perception/shadow-stealth-eyes-purple.webp',
          changes: [],
          flags: {
            convenientDescription: game.i18n.localize("stealthy-hidden-description"),
            stealthy: flag,
            core: { statusId: '1' },
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
        return hidden;
      }
    });
  }

  getHiddenFlagAndValue(hidden) {
    const value = hidden.flags.stealthy?.hidden ?? actor.system.skills.ste.passive;
    return { flag: {hidden: value}, value };
  }

  async setHiddenValue(actor, effect, flag, value) {
    flag.hidden = value;
    effect.flags.stealthy = flag;
    await actor.updateEmbeddedDocuments('ActiveEffect', [effect]);
  }

  getSpotFlagAndValue(spot) {
    let flag = { normal: undefined, disadvantaged: undefined };
    const active = spot.flags.stealthy?.spot?.normal ?? spot.flags.stealthy?.spot;
    if (active !== undefined) {
      flag.normal = active;
      flag.disadvantaged = spot.flags.stealthy?.spot?.disadvantaged ?? active - 5;
    }
    else {
      flag.normal = actor.system.skills.prc.passive;
      disadvantaged = Stealthy5e.GetPassivePerceptionWithDisadvantage(actor);
    }
    return { flag: {spot: flag}, value: flag.normal };
  }

  async setSpotValue(actor, effect, flag, value) {
    const delta = value - flag.spot.normal;
    flag.spot.normal = value;
    flag.spot.disadvantaged += delta;
    effect.flags.stealthy = flag;

    await actor.updateEmbeddedDocuments('ActiveEffect', [effect]);
  }

  static GetPassivePerceptionWithDisadvantage(source) {
    // todo: don't apply -5 if already disadvantaged
    return source.system.skills.prc.passive - 5;
  }
  
  static AdjustForDefaultConditions(spotPair, visionSource, source, target) {
    let perception = spotPair?.normal
      ?? spotPair
      ?? (source.system.skills.prc.passive + 1);
    perception = Math.max(perception, source.system.skills.prc.passive);
    return perception;
  }

  // check target Token Lighting conditions via effects usage
  // look for effects that indicate Dim or Dark condition on the token
  static AdjustForLightingConditions(spotPair, visionSource, source, target) {
    let debugData = { spotPair };
    let perception;

    // What light band are we told we sit in?
    let lightBand = 2;
    if (target?.effects.find(e => e.label === game.i18n.localize("stealthy-dark-label") && !e.disabled)) { lightBand = 0; }
    if (target?.effects.find(e => e.label === game.i18n.localize("stealthy-dim-label") && !e.disabled)) { lightBand = 1; }
    debugData.lightLevel = Stealthy5e.LIGHT_LABELS[lightBand];

    // Adjust the light band based on conditions
    if (visionSource.visionMode?.id === 'darkvision') {
      lightBand = lightBand + 1;
      debugData.foundryDarkvision = Stealthy5e.LIGHT_LABELS[lightBand];
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
      let passiveDisadv = Stealthy5e.GetPassivePerceptionWithDisadvantage(source);
      if (active !== undefined) {
        value = spotPair?.disadvantaged ?? value - 5;
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

    // Stealthy.log('adjustForLightingConditions5e', debugData);
    return perception;
  }

}
