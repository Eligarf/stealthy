import { Stealthy, StealthyBaseEngine } from '../stealthy.js';

export class Stealthy5e extends StealthyBaseEngine {

  constructor() {
    super();

    game.settings.register(Stealthy.MODULE_ID, 'tokenLighting', {
      name: game.i18n.localize("stealthy.dnd5e.tokenLighting.name"),
      hint: game.i18n.localize("stealthy.dnd5e.tokenLighting.hint"),
      scope: 'world',
      config: true,
      type: Boolean,
      default: false,
    });

    game.settings.register(Stealthy.MODULE_ID, 'spotPair', {
      name: game.i18n.localize("stealthy.dnd5e.spotPair.name"),
      hint: game.i18n.localize("stealthy.dnd5e.spotPair.hint"),
      scope: 'world',
      config: true,
      type: Boolean,
      default: false,
    });

    Hooks.on('dnd5e.rollSkill', async (actor, roll, skill) => {
      if (skill === 'ste') {
        await this.rollStealth(actor, roll);
      }
      else if (skill === 'prc') {
        await this.rollPerception(actor, roll);
      }
    });
  }

  static LIGHT_LABELS = ['dark', 'dim', 'bright'];

  isHidden(visionSource, hiddenEffect, target, config) {
    const source = visionSource.object?.actor;
    const stealth = hiddenEffect.flags.stealthy?.hidden ?? target.system.skills.ste.passive;
    const spotEffect = this.findSpotEffect(source);

    // active perception loses ties, passive perception wins ties to simulate the
    // idea that active skills need to win outright to change the status quo. Passive
    // perception means that stealth is being the active skill.
    const spotPair = spotEffect?.flags.stealthy?.spot;
    let perception;

    if (game.settings.get(Stealthy.MODULE_ID, 'tokenLighting')) {
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

  basicVision(wrapped, visionSource, mode, config) {
    const target = config.object?.actor;
    let noDarkvision = false;
    const ignoreFriendlyUmbralSight =
      game.settings.get(Stealthy.MODULE_ID, 'ignoreFriendlyUmbralSight') &&
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

    return super.basicVision(wrapped, visionSource, mode, config);
  }

  makeSpotEffectMaker(label) {
    return (flag, source) => {
      let effect = super.makeSpotEffectMaker(label)(flag, source);
      effect.duration = { turns: 1, seconds: 6 };
      return effect;
    };
  }

  getHiddenFlagAndValue(actor, effect) {
    const value = effect.flags.stealthy?.hidden ?? actor.system.skills.ste.passive;
    return { flag: { hidden: value }, value };
  }

  getSpotFlagAndValue(actor, effect) {
    let flag = { normal: undefined, disadvantaged: undefined };
    const active = effect.flags.stealthy?.spot?.normal ?? effect.flags.stealthy?.spot;
    if (active !== undefined) {
      flag.normal = active;
      flag.disadvantaged = effect.flags.stealthy?.spot?.disadvantaged ?? active - 5;
    }
    else {
      flag.normal = actor.system.skills.prc.passive;
      disadvantaged = Stealthy5e.GetPassivePerceptionWithDisadvantage(actor);
    }
    return { flag: { spot: flag }, value: flag.normal };
  }

  async setSpotValue(actor, effect, flag, value) {
    const delta = value - flag.spot.normal;
    flag.spot.normal = value;
    flag.spot.disadvantaged += delta;
    effect.flags.stealthy = flag;

    await actor.updateEmbeddedDocuments('ActiveEffect', [effect]);
  }

  async rollPerception(actor, roll) {
    if (!game.stealthy.activeSpot) return;
    Stealthy.log('Stealthy5e.rollPerception', { actor, roll });

    let perception = { normal: roll.total, disadvantaged: roll.total };
    if (!roll.hasDisadvantage && game.settings.get(Stealthy.MODULE_ID, 'spotPair')) {
      const dice = roll.dice[0];
      if (roll.hasAdvantage) {
        const delta = dice.results[1].result - dice.results[0].result;
        if (delta > 0) {
          perception.disadvantaged -= delta;
        }
      }
      else {
        let disadvantageRoll = await new Roll(`1d20`).evaluate({ async: true });
        game.dice3d?.showForRoll(disadvantageRoll);
        const delta = dice.results[0].result - disadvantageRoll.total;
        if (delta > 0) {
          perception.disadvantaged -= delta;
        }
      }
    }

    await this.updateOrCreateSpotEffect(actor, { spot: perception });
  }

  async rollStealth(actor, roll) {
    Stealthy.log('Stealthy5e.rollStealth', { actor, roll });

    await this.updateOrCreateHiddenEffect(actor, { hidden: roll.total });
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
    if (target?.effects.find(e => e.label === game.i18n.localize("stealthy.dnd5e.dark.label") && !e.disabled)) { lightBand = 0; }
    if (target?.effects.find(e => e.label === game.i18n.localize("stealthy.dnd5e.dim.label") && !e.disabled)) { lightBand = 1; }
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

    Stealthy.log('adjustForLightingConditions5e', debugData);
    return perception;
  }

}

Hooks.once('init', () => {
  Stealthy.RegisterEngine('dnd5e', () => new Stealthy5e());
});

Hooks.on('renderSettingsConfig', (app, html, data) => {
  $('<div>').addClass('form-group group-header').html(game.i18n.localize("stealthy.dnd5e.config.experimental")).insertBefore($('[name="stealthy.tokenLighting"]').parents('div.form-group:first'));
});
