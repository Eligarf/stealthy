import { Stealthy } from "./stealthy.js";
import Doors from "./doors.js";

export default class Engine {

  constructor() {
    // Hook the relevant skills to capture spot and hidden test
    // results into effects on the actor.

    // new implementations need to add something like the following
    // at file scope so that the Stealthy can find the engine during
    // setup

    // Hooks.once('init', () => {
    //   if (game.system.id === 'system-id') {
    //     const systemEngine = new system-engine();
    //     if (systemEngine) {
    //       window[Stealthy.MODULE_ID] = new Stealthy(systemEngine);
    //     }
    //   }
    // });


    this.warnedMissingCE = false;
    this.warnedMissingCUB = false;
    Hooks.once('setup', () => {
      this.hiddenLabel = game.i18n.localize(game.settings.get(Stealthy.MODULE_ID, 'hiddenLabel'));
      this.spotLabel = game.i18n.localize(game.settings.get(Stealthy.MODULE_ID, 'spotLabel'));
      Stealthy.log(`hiddenLabel='${this.hiddenLabel}', spotLabel='${this.spotLabel}'`);
      if (game.settings.get(Stealthy.MODULE_ID, 'spotSecretDoors')) {
        Doors.initialize();
      }
    });
  }

  patchFoundry() {
    // Generic Detection mode patching
    const mode = 'detectionMode';
    console.log(...Stealthy.colorizeOutput(`patching ${mode}`));
    libWrapper.register(
      Stealthy.MODULE_ID,
      'DetectionMode.prototype._canDetect',
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

  isHidden(visionSource, tgtToken, detectionMode = undefined) {
    if (tgtToken?.disposition === visionSource.object.document?.disposition) {
      const friendlyStealth = game.settings.get(Stealthy.MODULE_ID, 'friendlyStealth');
      if (friendlyStealth === 'ignore' || !game.combat && friendlyStealth === 'inCombat') return false;
    }

    const hiddenEffect = this.findHiddenEffect(tgtToken?.actor);
    if (!hiddenEffect) return false;

    return !this.canDetectHidden(visionSource, hiddenEffect, tgtToken, detectionMode);
  }

  findHiddenEffect(actor) {
    const v10 = Math.floor(game.version) < 11;
    return actor?.effects.find(e => (v10 ? e.label : e.name) === this.hiddenLabel && !e.disabled);
  }

  findSpotEffect(actor) {
    const v10 = Math.floor(game.version) < 11;
    return actor?.effects.find(e => (v10 ? e.label : e.name) === this.spotLabel && !e.disabled);
  }

  canDetectHidden(visionSource, hiddenEffect, target) {
    // Implement your system's method for testing spot data vs hidden data
    // This should would in the absence of a spot effect on the viewer, using
    // a passive or default value as necessary
    return true;
  }

  makeHiddenEffectMaker(label) {
    return (flag, source) => {
      let hidden;
      const v10 = Math.floor(game.version) < 11;
      const hiddenIcon = game.settings.get(Stealthy.MODULE_ID, 'hiddenIcon');
      if (v10) {
        hidden = {
          label,
          icon: hiddenIcon,
          changes: [],
          flags: {
            convenientDescription: game.i18n.localize("stealthy.hidden.description"),
            stealthy: flag,
            core: { statusId: '1' },
          },
        };
      } else {
        hidden = {
          name: label,
          icon: hiddenIcon,
          changes: [],
          description: game.i18n.localize("stealthy.hidden.description"),
          flags: {
            stealthy: flag,
          },
          statuses: ['hidden'],
        };
      }
      if (source === 'ae') {
        if (typeof ATLUpdate !== 'undefined') {
          hidden.changes.push({
            key: 'ATL.alpha',
            mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
            value: '0.75'
          });
        }
      }
      return hidden;
    };
  }

  makeSpotEffectMaker(label) {
    return (flag, source) => {
      let spot;
      const v10 = Math.floor(game.version) < 11;
      const spotIcon = game.settings.get(Stealthy.MODULE_ID, 'spotIcon');
      if (v10) {
        spot = {
          label,
          icon: spotIcon,
          flags: {
            convenientDescription: game.i18n.localize("stealthy.spot.description"),
            stealthy: flag,
            core: { statusId: '1' },
          },
        };
      } else {
        spot = {
          name: label,
          icon: spotIcon,
          description: game.i18n.localize("stealthy.spot.description"),
          flags: {
            stealthy: flag,
          },
          statuses: ['spot'],
        };
      }
      return spot;
    };
  }

  async updateOrCreateEffect({ label, actor, flag, source, makeEffect }) {
    const v10 = Math.floor(game.version) < 11;
    let effect = actor.effects.find(e => (v10 ? e.label : e.name) === label);

    if (!effect) {
      // See if we can source from outside
      if (source === 'ce') {
        if (game.dfreds?.effectInterface?.findEffectByName(label)) {
          await game.dfreds.effectInterface.addEffect({ effectName: label, uuid: actor.uuid });
          effect = actor.effects.find(e => (v10 ? e.label : e.name) === label);
        }
        if (!effect && !this.warnedMissingCE) {
          this.warnedMissingCE = true;
          if (game.user.isGM)
            ui.notifications.warn(
              `${game.i18n.localize('stealthy.source.ce.beforeLabel')} '${label}' ${game.i18n.localize('stealthy.source.ce.afterLabel')}`);
          console.error(`stealthy | Convenient Effects couldn't find the '${label}' effect so Stealthy will use the default one. Add your customized effect to CE or select a different effect source in Game Settings`);
        }
      }
      else if (source === 'cub') {
        if (game.cub?.getCondition(label)) {
          await game.cub.applyCondition(label, actor);
          effect = actor.effects.find(e => (v10 ? e.label : e.name) === label);
        }
        if (!effect && !this.warnedMissingCUB) {
          this.warnedMissingCUB = true;
          if (game.user.isGM)
            ui.notifications.warn(
              `${game.i18n.localize('stealthy.source.cub.beforeLabel')} '${label}' ${game.i18n.localize('stealthy.source.cub.afterLabel')}`);
          console.error(`stealthy | Combat Utility Belt couldn't find the '${label}' effect so Stealthy will use the default one. Add your customized effect to CUB or select a different effect source in Game Settings`);
        }
      }

      // If we haven't found an ouside source, create the default one
      if (!effect) {
        effect = makeEffect(flag, source);
        await actor.createEmbeddedDocuments('ActiveEffect', [effect]);
        return;
      }
    }

    effect = duplicate(effect);
    effect.flags.stealthy = flag;
    effect.disabled = false;
    await actor.updateEmbeddedDocuments('ActiveEffect', [effect]);
  }

  async updateOrCreateHiddenEffect(actor, flag) {
    await this.updateOrCreateEffect({
      label: this.hiddenLabel,
      actor,
      flag,
      source: game.settings.get(Stealthy.MODULE_ID, 'hiddenSource'),
      makeEffect: this.makeHiddenEffectMaker(this.hiddenLabel)
    });
    stealthy.socket.executeForEveryone('RefreshPerception');
  }

  getFlags(effect) {
    return effect?.flags?.stealthy;
  }

  getStealthFlag(effect) {
    const flags = this.getFlags(effect);
    const hidden = flags?.hidden;
    return hidden ? { hidden } : undefined;
  }

  getStealthValue(flag, actor) {
    return flag?.hidden;
  }

  // deprecated API
  getHiddenFlagAndValue(actor, effect) {
    return {
      flag: this.getStealthFlag(effect),
      value: this.getStealthValue(flag, actor)
    };
  }

  async setHiddenValue(actor, effect, flag, value) {
    // If the hidden value was changed, do what you need to store it
    flag.hidden = value;
    effect.flags.stealthy = flag;
    await actor.updateEmbeddedDocuments('ActiveEffect', [effect]);
    stealthy.socket.executeForEveryone('RefreshPerception');
  }

  async updateOrCreateSpotEffect(actor, flag) {
    await this.updateOrCreateEffect({
      label: this.spotLabel,
      actor,
      flag,
      source: game.settings.get(Stealthy.MODULE_ID, 'spotSource'),
      makeEffect: this.makeSpotEffectMaker(this.spotLabel)
    });
    canvas.perception.update({ initializeVision: true }, true);
  }

  getPerceptionFlag(effect) {
    const flags = this.getFlags(effect);
    const spot = flags?.spot;
    return spot ? { spot } : undefined;
  }

  getPerceptionValue(flag, actor) {
    return flag?.spot;
  }

  // Deprecated API
  getSpotFlagAndValue(actor, effect) {
    return {
      flag: this.getPerceptionFlag(effect),
      value: this.getPerceptionValue(flag, actor)
    };
  }

  async setSpotValue(actor, effect, flag, value) {
    // If the spot value was changed, do what you need to store it
    flag.spot = value;
    effect.flags.stealthy = flag;
    await actor.updateEmbeddedDocuments('ActiveEffect', [effect]);
    canvas.perception.update({ initializeVision: true }, true);
  }

  rollPerception() {
    canvas.perception.update({ initializeVision: true }, true);
  }

  rollStealth() {
    stealthy.socket.executeForEveryone('RefreshPerception');
  }

  canSpotDoor(doorControl, visionSource) {
    // Open doors are visible
    const door = doorControl.wall.document;
    if (door.ds == 1) return true;

    // Unhidden doors are visible
    const stealthyFlags = door.flags?.stealthy;
    if (!stealthyFlags) return true;

    // Hidden doors can only be spotted if they are in range
    const maxRange = stealthyFlags?.maxRange ?? Infinity;
    const ray = new Ray(doorControl.center, visionSource.object.center);
    const distance = canvas.grid.measureDistances([{ ray }])[0];
    if (distance > maxRange) return false;

    // Now just compare the perception and the door's stealth
    const stealth = stealthyFlags.stealth;
    const token = visionSource.object.document;
    const actor = token.actor;
    const effect = this.findSpotEffect(actor);
    const flag = this.getPerceptionFlag(effect);
    const perception = this.getPerceptionValue(flag, actor);
    return perception >= stealth;
  }
}

