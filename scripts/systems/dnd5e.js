import { Stealthy } from '../stealthy.js';
import Engine from '../engine.js';
import Doors from "../doors.js";

class Engine5e extends Engine {

  constructor() {
    super();

    game.keybindings.register(Stealthy.MODULE_ID, "endTurn", {
      name: game.i18n.localize("stealthy.dnd5e.endTurn.name"),
      hint: game.i18n.localize("stealthy.dnd5e.endTurn.hint"),
      editable: [
        { key: "End" }
      ],
      onDown: () => {
        const combat = game.combat;
        if (!combat?.active) return;
        const combatant = combat.combatants.get(combat.current.combatantId);
        if (!combatant?.isOwner) return;
        return combat.nextTurn();
      }
    });

    Hooks.once('setup', () => {
      game.settings.register(Stealthy.MODULE_ID, 'ignorePassiveFloor', {
        name: game.i18n.localize("stealthy.dnd5e.ignorePassiveFloor.name"),
        hint: game.i18n.localize("stealthy.dnd5e.ignorePassiveFloor.hint"),
        scope: 'world',
        config: true,
        type: Boolean,
        default: false,
      });

      game.settings.register(Stealthy.MODULE_ID, 'friendlyUmbralSight', {
        name: game.i18n.localize("stealthy.dnd5e.friendlyUmbralSight.name"),
        scope: 'world',
        config: false,
        type: String,
        choices: {
          'allow': game.i18n.localize("stealthy.dnd5e.friendlyUmbralSight.allow"),
          'inCombat': game.i18n.localize("stealthy.dnd5e.friendlyUmbralSight.inCombat"),
          'ignore': game.i18n.localize("stealthy.dnd5e.friendlyUmbralSight.ignore")
        },
        default: 'inCombat'
      });

      const tlcActive = game.modules.get("tokenlightcondition")?.active;

      game.settings.register(Stealthy.MODULE_ID, 'tokenLighting', {
        name: game.i18n.localize("stealthy.dnd5e.tokenLighting.name"),
        hint: game.i18n.localize("stealthy.dnd5e.tokenLighting.hint"),
        scope: 'world',
        config: tlcActive,
        type: Boolean,
        default: false,
      });

      game.settings.register(Stealthy.MODULE_ID, 'spotPair', {
        name: game.i18n.localize("stealthy.dnd5e.spotPair.name"),
        hint: game.i18n.localize("stealthy.dnd5e.spotPair.hint"),
        scope: 'world',
        config: tlcActive,
        type: Boolean,
        default: false,
      });

      if (tlcActive) {
        game.settings.register(Stealthy.MODULE_ID, 'darkLabel', {
          name: game.i18n.localize("stealthy.dnd5e.dark.key"),
          scope: 'world',
          requiresReload: true,
          config: true,
          type: String,
          default: 'stealthy.dnd5e.dark.name',
        });

        game.settings.register(Stealthy.MODULE_ID, 'dimLabel', {
          name: game.i18n.localize("stealthy.dnd5e.dim.key"),
          scope: 'world',
          requiresReload: true,
          config: true,
          type: String,
          default: 'stealthy.dnd5e.dim.name',
        });

        this.dimName = game.i18n.localize(game.settings.get(Stealthy.MODULE_ID, 'dimLabel'));
        this.darkName = game.i18n.localize(game.settings.get(Stealthy.MODULE_ID, 'darkLabel'));
        Stealthy.log(`dimName='${this.dimName}', darkName='${this.darkName}'`);

        Hooks.on('renderSettingsConfig', (app, html, data) => {
          $('<div>').addClass('form-group group-header')
            .html('Token Lighting')
            .insertBefore($('[name="stealthy.tokenLighting"]')
              .parents('div.form-group:first'));
        });
      }
      else {
        Hooks.once('ready', () => {
          game.settings.set(Stealthy.MODULE_ID, 'tokenLighting', false);
          game.settings.set(Stealthy.MODULE_ID, 'spotPair', false);
        });
      }
    });

    Hooks.on('dnd5e.rollSkill', async (actor, roll, skill) => {
      if (skill === 'ste') {
        await this.rollStealth(actor, roll);
      }
      else if (skill === 'prc') {
        await this.rollPerception(actor, roll);
      }
    });

    Hooks.on('renderSettingsConfig', (app, html, data) => {
      $('<div>').addClass('form-group group-header')
        .html(game.i18n.localize("stealthy.dnd5e.name"))
        .insertBefore($('[name="stealthy.ignorePassiveFloor"]')
          .parents('div.form-group:first'));
    });
  }

  patchFoundry() {
    super.patchFoundry();

    // If vision-5e isn't active, just keep the default behavior
    if (!game.modules.get("vision-5e")?.active) return;

    // Pick the sight modes in vision-5e that we want Stealthy to affect
    Hooks.once('setup', () => {
      const sightModes = [
        'basicSight',
        'devilsSight',
        'etherealSight',
        'hearing',
        'lightPerception',
        'seeAll',
        'seeInvisibility',
        'witchSight',
      ];
      for (const mode of sightModes) {
        Stealthy.log(`patching ${mode}`);
        libWrapper.register(
          Stealthy.MODULE_ID,
          `CONFIG.Canvas.detectionModes.${mode}._canDetect`,
          function (wrapped, visionSource, target) {
            do {
              const engine = stealthy.engine;
              if (target instanceof DoorControl) {
                if (!engine.canSpotDoor(target, visionSource)) return false;
                break;
              }
              const tgtToken = target?.document;
              if (tgtToken instanceof TokenDocument) {
                if (engine.isHidden(visionSource, tgtToken, mode)) return false;
              }
            } while (false);
            return wrapped(visionSource, target);
          },
          libWrapper.MIXED,
          { perf_mode: libWrapper.PERF_FAST }
        );
      }
    });
  }

  static LIGHT_LABELS = ['dark', 'dim', 'bright', 'bright'];

  canDetectHidden(visionSource, tgtToken, detectionMode) {
    const stealthFlag = this.getStealthFlag(tgtToken);
    if (!stealthFlag) return true;
   
    const srcToken = visionSource.object.document;
    const source = srcToken?.actor;
    const perceptionFlag = this.getPerceptionFlag(srcToken);

    // active perception loses ties, passive perception wins ties to simulate the
    // idea that active skills need to win outright to change the status quo. Passive
    // perception means that stealth is being the active skill.
    const valuePair = perceptionFlag?.perception;
    let perceptionValue;
    if (game.settings.get(Stealthy.MODULE_ID, 'tokenLighting')) {
      perceptionValue = this.adjustForLightingConditions(valuePair, visionSource, source, tgtToken.actor, detectionMode);
    }
    else {
      perceptionValue = this.adjustForDefaultConditions(valuePair, visionSource, source, tgtToken.actor, detectionMode);
    }

    const stealthValue = this.getStealthValue(stealthFlag);
    Stealthy.logIfDebug('canDetectHidden', { stealthFlag: stealthFlag, stealth: stealthValue, perceptionFlag: perceptionFlag, perception: perceptionValue });
    return perceptionValue > stealthValue;
  }

  makeSpotEffectMaker(name) {
    return (flag, source) => {
      let effect = super.makeSpotEffectMaker(name)(flag, source);
      if (game.combat) effect.duration = { turns: 1, seconds: 6 };
      return effect;
    };
  }

  getStealthValue(flag) {
    return super.getStealthValue(flag) ?? flag?.token?.actor.system.skills.ste.passive;
  }

  getPerceptionFlag(token) {
    const actor = token?.actor;
    const effect = this.findSpotEffect(actor);
    if (!effect) return undefined;
    const flags = this.getFlags(effect);
    let perception = flags?.perception ?? flags?.spot;
    const active = perception?.normal ?? perception;
    if (active !== undefined) {
      perception.normal = active;
      perception.disadvantaged = perception?.disadvantaged ?? active - 5;
    }
    return { perception, effect, token };
  }

  getPerceptionValue(flag) {
    return flag?.perception?.normal ??
      flag?.perception ??
      flag?.token?.actor.system.skills.prc.passive;
  }

  async setPerceptionValue(flag, value) {
    Stealthy.log('setPerceptionValue', { flag, value });
    let effect = duplicate(flag?.effect);
    const pair = { normal: value, disadvantaged: value - 5 };
    if (!('stealthy' in effect.flags)) effect.flags.stealthy = { perception: pair };
    else effect.flags.stealthy.perception = pair;

    const actor = flag?.token?.actor;
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
        const delta = dice.results[0].result - disadvantageRoll.total;
        if (delta > 0) {
          perception.disadvantaged -= delta;
        }
      }
    }

    if (stealthy.useTokenFlags) {
      const token = canvas.tokens.controlled.find((t) => t.actor === actor);
      if (!token) return;
      let update = {
        _id: token.id,
        'flags.stealthy.perception': perception
      };
      Stealthy.log('update', update);
      await canvas.scene.updateEmbeddedDocuments("Token", [update]);
    } else {
      await this.updateOrCreateSpotEffect(actor, { perception });
    }

    super.rollPerception();
  }

  async rollStealth(actor, roll) {
    Stealthy.log('Stealthy5e.rollStealth', { actor, roll });

    if (stealthy.useTokenFlags) {
      const token = canvas.tokens.controlled.find((t) => t.actor === actor);
      if (!token) return;
      let update = {
        _id: token.id,
        'flags.stealthy.stealth': roll.total
      };
      await canvas.scene.updateEmbeddedDocuments("Token", [update]);
    } else {
      await this.updateOrCreateHiddenEffect(actor, { stealth: roll.total });
    }

    super.rollStealth();
  }

  static GetPassivePerceptionWithDisadvantage(source) {
    // todo: don't apply -5 if already disadvantaged
    return source.system.skills.prc.passive - 5;
  }

  adjustForDefaultConditions(spotPair, visionSource, source, target, detectionMode) {
    const passivePrc = source?.system?.skills?.prc?.passive ?? -100;
    let debugData = { passivePrc };
    let perception = spotPair?.normal
      ?? spotPair
      ?? (passivePrc + 1);
    debugData.perception = perception;
    if (!game.settings.get(Stealthy.MODULE_ID, 'ignorePassiveFloor')) {
      perception = Math.max(perception, passivePrc);
      debugData.clampedPerception = perception;
    }
    Stealthy.logIfDebug('adjustForDefaultConditions', debugData);
    return perception;
  }

  // check target Token Lighting conditions via effects usage
  // look for effects that indicate Dim or Dark condition on the token
  adjustForLightingConditions(spotPair, visionSource, source, target, detectionMode) {
    let debugData = { spotPair };
    let perception;

    // What light band are we told we sit in?
    let lightBand = 2;
    if (target?.effects.find(e => e.name === this.darkName && !e.disabled)) { lightBand = 0; }
    if (target?.effects.find(e => e.name === this.dimName && !e.disabled)) { lightBand = 1; }
    debugData.initialLightLevel = Engine5e.LIGHT_LABELS[lightBand];

    // Adjust the light band based on conditions
    if (detectionMode) {
      debugData.detectionMode = detectionMode;
      if (detectionMode === 'basicSight') {
        lightBand = lightBand + 1;
        debugData.adjustedLightLevel = Engine5e.LIGHT_LABELS[lightBand];
      }
    }
    else {
      debugData.id = visionSource.visionMode?.id;
      if (visionSource.visionMode?.id === 'darkvision') {
        lightBand = lightBand + 1;
        debugData.adjustedLightLevel = Engine5e.LIGHT_LABELS[lightBand];
      }
    }

    // Extract the normal perception values from the source
    const ignorePassiveFloor = game.settings.get(Stealthy.MODULE_ID, 'ignorePassiveFloor');
    let active = spotPair?.normal ?? spotPair;
    let value;
    const passivePrc = source?.system?.skills?.prc?.passive ?? -100;
    if (active !== undefined) {
      value = active;
      debugData.active = value;
    }
    else {
      value = passivePrc;
      debugData.passive = value;
    }

    // dark = fail, dim = disadvantage, bright = normal
    if (lightBand <= 0) {
      perception = -100;
    }
    else if (lightBand === 1) {
      let passiveDisadv = Engine5e.GetPassivePerceptionWithDisadvantage(source);
      debugData.passiveDisadv = passiveDisadv;
      if (active !== undefined) {
        value = spotPair?.disadvantaged ?? value - 5;
        debugData.activeDisadv = value;
      }
      else {
        value = passiveDisadv;
      }
      perception = (ignorePassiveFloor) ? value : Math.max(value, passiveDisadv);
    }
    else {
      perception = (ignorePassiveFloor) ? value : Math.max(value, passivePrc);
    }
    debugData.perception = perception;

    Stealthy.logIfDebug('adjustForLightingConditions', debugData);
    return perception;
  }

}

Hooks.once('init', () => {
  if (game.system.id === 'dnd5e') {
    const systemEngine = new Engine5e();
    if (systemEngine) {
      window[Stealthy.MODULE_ID] = new Stealthy(systemEngine);
    }
  }
});
