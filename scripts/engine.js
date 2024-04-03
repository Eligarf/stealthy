import { Stealthy } from "./stealthy.js";
import StealthyDoors from "./doors.js";

export default class Engine {

  constructor() {
    // Hook the relevant skills to capture spot and hidden test
    // results into effects on the actor.

    // new implementations need to add something like the following
    // at file scope so that the Stealthy can find the engine during
    // setup

    // Hooks.once('init', () => {
    //   Stealthy.RegisterEngine('system-id', () => new StealthyNewSystem());
    // });

    this.warnedMissingCE = false;
    this.warnedMissingCUB = false;
    this.hiddenLabel = game.i18n.localize(game.settings.get(Stealthy.MODULE_ID, 'hiddenLabel'));
    this.spotLabel = game.i18n.localize(game.settings.get(Stealthy.MODULE_ID, 'spotLabel'));
    Stealthy.log(`hiddenLabel='${this.hiddenLabel}', spotLabel='${this.spotLabel}'`);
  }

  patchFoundry() {
    // Detection mode patching
    if (game.settings.get(Stealthy.MODULE_ID, 'useCanDetect')) {
      libWrapper.register(
        Stealthy.MODULE_ID,
        'DetectionMode.prototype._canDetect',
        function (wrapped, visionSource, target) {
          switch (this.type) {
            case DetectionMode.DETECTION_TYPES.SIGHT:
            case DetectionMode.DETECTION_TYPES.SOUND:
              const src = visionSource.object.document;
              if (src instanceof TokenDocument) {
                const tgt = target?.document;
                if (tgt instanceof TokenDocument) {
                  const engine = stealthy.engine;
                  if (engine.isHidden(visionSource, tgt)) return false;
                }
              }
          }
          return wrapped(visionSource, target);
        },
        libWrapper.MIXED,
        { perf_mode: libWrapper.PERF_FAST }
      );
    }
    else {
      libWrapper.register(
        Stealthy.MODULE_ID,
        'DetectionModeBasicSight.prototype.testVisibility',
        function (wrapped, visionSource, mode, config = {}) {
          const engine = stealthy.engine;
          if (engine.isHidden(visionSource, config.object)) return false;
          return wrapped(visionSource, mode, config);
        },
        libWrapper.MIXED,
        { perf_mode: libWrapper.PERF_FAST }
      );

      libWrapper.register(
        Stealthy.MODULE_ID,
        'DetectionModeInvisibility.prototype.testVisibility',
        function (wrapped, visionSource, mode, config = {}) {
          const engine = stealthy.engine;
          if (engine.isHidden(visionSource, config.object)) return false;
          return wrapped(visionSource, mode, config);
        },
        libWrapper.MIXED,
        { perf_mode: libWrapper.PERF_FAST }
      );
    }

    if (game.settings.get(Stealthy.MODULE_ID, 'spotSecretDoors')) {
      StealthyDoors.initialize();
    }
  }

  isHidden(visionSource, target) {
    const friendlyStealth = game.settings.get(Stealthy.MODULE_ID, 'friendlyStealth');
    let ignoreFriendlyStealth = friendlyStealth === 'ignore' || !game.combat && friendlyStealth === 'inCombat';
    ignoreFriendlyStealth =
      ignoreFriendlyStealth &&
      target.document?.disposition === visionSource.object.document?.disposition;

    if (!ignoreFriendlyStealth) {
      const hiddenEffect = this.findHiddenEffect(target?.actor);
      if (hiddenEffect) {
        return !this.canSpotTarget(visionSource, hiddenEffect, target);
      }
    }

    return false;
  }

  findHiddenEffect(actor) {
    const v10 = Math.floor(game.version) < 11;
    return actor?.effects.find(e => (v10 ? e.label : e.name) === this.hiddenLabel && !e.disabled);
  }

  findSpotEffect(actor) {
    const v10 = Math.floor(game.version) < 11;
    return actor?.effects.find(e => (v10 ? e.label : e.name) === this.spotLabel && !e.disabled);
  }

  canSpotTarget(visionSource, hiddenEffect, target) {
    // Implement your system's method for testing spot data vs hidden data
    // This should would in the absence of a spot effect on the viewer, using
    // a passive or default value as necessary
    return true;
  }

  makeHiddenEffectMaker(label) {
    return (flag, source) => {
      let hidden;
      const v10 = Math.floor(game.version) < 11;
      if (v10) {
        hidden = {
          label,
          icon: 'icons/magic/perception/shadow-stealth-eyes-purple.webp',
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
          icon: 'icons/magic/perception/shadow-stealth-eyes-purple.webp',
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
      if (v10) {
        spot = {
          label,
          icon: 'icons/commodities/biological/eye-blue.webp',
          flags: {
            convenientDescription: game.i18n.localize("stealthy.spot.description"),
            stealthy: flag,
            core: { statusId: '1' },
          },
        };
      } else {
        spot = {
          name: label,
          icon: 'icons/commodities/biological/eye-blue.webp',
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

  getHiddenFlagAndValue(actor, effect) {
    // Return the data necessary for storing data about hidden, and the
    // value that should be shown on the token button input
    return { flag: { hidden: undefined }, value: undefined };
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

  getSpotFlagAndValue(actor, effect) {
    // Return the data necessary for storing data about spot, and the
    // value that should be shown on the token button input
    return { flag: { spot: undefined }, value: undefined };
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

  canSpotDoor(doorControl, token) {
    const stealth = doorControl.wall.document.flags.stealthy.stealth;
    const actor = token.actor;
    const { value: perception } = this.getSpotFlagAndValue(actor, this.findSpotEffect(actor));
    return perception >= stealth;
  }
}

