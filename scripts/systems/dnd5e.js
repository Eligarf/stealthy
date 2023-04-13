import { Stealthy } from '../stealthy.js';
import Engine from '../engine.js';

class Engine5e extends Engine {

  constructor() {
    super();

    game.settings.register(Stealthy.MODULE_ID, 'friendlyUmbralSight', {
      name: game.i18n.localize("stealthy.dnd5e.friendlyUmbralSight.name"),
      scope: 'world',
      config: true,
      type: String,
      choices: {
        'allow': game.i18n.localize("stealthy.dnd5e.friendlyUmbralSight.allow"),
        'inCombat': game.i18n.localize("stealthy.dnd5e.friendlyUmbralSight.inCombat"),
        'ignore': game.i18n.localize("stealthy.dnd5e.friendlyUmbralSight.ignore")
      },
      default: 'inCombat'
    });

    game.settings.register(Stealthy.MODULE_ID, 'ignoreFriendlyUmbralSight', {
      name: game.i18n.localize("stealthy.dnd5e.ignoreFriendlyUmbralSight.name"),
      hint: game.i18n.localize("stealthy.dnd5e.ignoreFriendlyUmbralSight.hint"),
      scope: 'world',
      config: true,
      type: Boolean,
      default: false,
    });

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

    game.settings.register(Stealthy.MODULE_ID, 'darkLabel', {
      name: game.i18n.localize("stealthy.dnd5e.dark.key"),
      scope: 'world',
      config: true,
      type: String,
      default: 'stealthy.dnd5e.dark.label',
      onChange: value => {
        debouncedReload();
      }
    });

    game.settings.register(Stealthy.MODULE_ID, 'dimLabel', {
      name: game.i18n.localize("stealthy.dnd5e.dim.key"),
      scope: 'world',
      config: true,
      type: String,
      default: 'stealthy.dnd5e.dim.label',
      onChange: value => {
        debouncedReload();
      }
    });

    game.settings.register(Stealthy.MODULE_ID, 'dimIsBright', {
      name: game.i18n.localize("stealthy.dnd5e.dimIsBright.name"),
      hint: game.i18n.localize("stealthy.dnd5e.dimIsBright.hint"),
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

    this.dimLabel = game.i18n.localize(game.settings.get(Stealthy.MODULE_ID, 'dimLabel'));
    this.darkLabel = game.i18n.localize(game.settings.get(Stealthy.MODULE_ID, 'darkLabel'));

    Stealthy.log(`dimLabel='${this.dimLabel}', darkLabel='${this.darkLabel}'`);

    Hooks.on('renderSettingsConfig', (app, html, data) => {
      $('<div>').addClass('form-group group-header')
        .html(game.i18n.localize("stealthy.dnd5e.name"))
        .insertBefore($('[name="stealthy.friendlyUmbralSight"]')
          .parents('div.form-group:first'));
    });
  }

  static LIGHT_LABELS = ['dark', 'dim', 'bright'];

  canSpotTarget(visionSource, hiddenEffect, target) {
    const source = visionSource.object?.actor;
    const stealth = hiddenEffect.flags.stealthy?.hidden ?? target.actor.system.skills.ste.passive;
    const spotEffect = this.findSpotEffect(source);

    // active perception loses ties, passive perception wins ties to simulate the
    // idea that active skills need to win outright to change the status quo. Passive
    // perception means that stealth is being the active skill.
    const spotPair = spotEffect?.flags.stealthy?.spot;
    let perception;

    if (game.settings.get(Stealthy.MODULE_ID, 'tokenLighting')) {
      perception = this.adjustForLightingConditions(spotPair, visionSource, source, target.actor);
    }
    else {
      perception = this.adjustForDefaultConditions(spotPair, visionSource, source, target.actor);
    }

    if (perception <= stealth) {
      Stealthy.log(`${visionSource.object.name}'s ${perception} can't see ${target.name}'s ${stealth}`);
      return false;
    }
    return true;
  }

  basicVision(wrapped, visionSource, mode, config) {
    const target = config.object?.actor;
    let invisibleToDarkvision = false;
    const friendlyUmbralSight = game.settings.get(Stealthy.MODULE_ID, 'friendlyUmbralSight');
    let ignoreFriendlyUmbralSight = friendlyUmbralSight === 'ignore' || !game.combat && friendlyUmbralSight === 'inCombat';
    ignoreFriendlyUmbralSight =
      ignoreFriendlyUmbralSight && config.object.document?.disposition === visionSource.object.document?.disposition;
    if (!ignoreFriendlyUmbralSight && visionSource.visionMode?.id === 'darkvision') {
      const umbralSight = target?.itemTypes?.feat?.find(f => f.name === game.i18n.localize('Umbral Sight'));
      if (umbralSight) invisibleToDarkvision = true;
    }

    if (invisibleToDarkvision) {
      Stealthy.log(`${visionSource.object.name}'s darkvision can't see ${config.object.name}`);
      let ourMode = duplicate(mode);
      ourMode.range = 0;
      return super.basicVision(wrapped, visionSource, ourMode, config);
    }

    return super.basicVision(wrapped, visionSource, mode, config);
  }

  makeSpotEffectMaker(label) {
    return (flag, source) => {
      let effect = super.makeSpotEffectMaker(label)(flag, source);
      if (game.combat) effect.duration = { turns: 1, seconds: 6 };
      return effect;
    };
  }

  getHiddenFlagAndValue(actor, effect) {
    const value = effect?.flags.stealthy?.hidden ?? actor.system.skills.ste.passive;
    return {
      flag: { hidden: value },
      value
    };
  }

  getSpotFlagAndValue(actor, effect) {
    let flag = { normal: undefined, disadvantaged: undefined };
    const active = effect?.flags.stealthy?.spot?.normal ?? effect?.flags.stealthy?.spot;
    if (active !== undefined) {
      flag.normal = active;
      flag.disadvantaged = effect.flags.stealthy?.spot?.disadvantaged ?? active - 5;
    }
    else {
      flag.normal = actor.system.skills.prc.passive;
      flag.disadvantaged = Engine5e.GetPassivePerceptionWithDisadvantage(actor);
    }
    return {
      flag: { spot: flag },
      value: flag.normal
    };
  }

  async setSpotValue(actor, effect, flag, value) {
    const delta = value - flag.spot.normal;
    flag.spot.normal = value;
    flag.spot.disadvantaged += delta;
    effect.flags.stealthy = flag;

    await actor.updateEmbeddedDocuments('ActiveEffect', [effect]);
    canvas.perception.update({ initializeVision: true }, true);
  }

  async rollPerception(actor, roll) {
    if (!stealthy.activeSpot) return;
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

    super.rollPerception();
  }

  async rollStealth(actor, roll) {
    Stealthy.log('Stealthy5e.rollStealth', { actor, roll });

    await this.updateOrCreateHiddenEffect(actor, { hidden: roll.total });

    super.rollStealth();
  }

  static GetPassivePerceptionWithDisadvantage(source) {
    // todo: don't apply -5 if already disadvantaged
    return source.system.skills.prc.passive - 5;
  }

  adjustForDefaultConditions(spotPair, visionSource, source, target) {
    let perception = spotPair?.normal
      ?? spotPair
      ?? (source.system.skills.prc.passive + 1);
    perception = Math.max(perception, source.system.skills.prc.passive);
    return perception;
  }

  // check target Token Lighting conditions via effects usage
  // look for effects that indicate Dim or Dark condition on the token
  adjustForLightingConditions(spotPair, visionSource, source, target) {
    let debugData = { spotPair };
    let perception;

    // What light band are we told we sit in?
    let lightBand = 2;
    if (target?.effects.find(e => e.label === this.darkLabel && !e.disabled)) { lightBand = 0; }
    if (target?.effects.find(e => e.label === this.dimLabel && !e.disabled)) { lightBand = 1; }
    debugData.lightLevel = Engine5e.LIGHT_LABELS[lightBand];

    // Adjust the light band based on conditions
    if (visionSource.visionMode?.id === 'darkvision') {
      if (game.settings.get(Stealthy.MODULE_ID, 'dimIsBright')) lightBand = lightBand + 1;
      else if (!lightBand) lightBand = 1;
      debugData.foundryDarkvision = Engine5e.LIGHT_LABELS[lightBand];
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
      let passiveDisadv = Engine5e.GetPassivePerceptionWithDisadvantage(source);
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
  Stealthy.RegisterEngine('dnd5e', () => new Engine5e());
});
