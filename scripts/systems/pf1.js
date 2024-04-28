import { Stealthy } from '../stealthy.js';
import Engine from '../engine.js';

export class EnginePF1 extends Engine {

  constructor() {
    super();

    Hooks.once('setup', () => {
      game.settings.register(Stealthy.MODULE_ID, 'spotTake10', {
        name: game.i18n.localize("stealthy.pf1.spotTake10.name"),
        hint: game.i18n.localize("stealthy.pf1.spotTake10.hint"),
        scope: 'world',
        config: true,
        type: Boolean,
        default: false,
      });
    });

    Hooks.on('pf1ActorRollSkill', async (actor, message, skill) => {
      if (skill === 'ste') {
        await this.rollStealth(actor, message);
      }
      else if (skill === 'per') {
        await this.rollPerception(actor, message);
      }
    });

    Hooks.on('renderSettingsConfig', (app, html, data) => {
      $('<div>').addClass('form-group group-header')
        .html(game.i18n.localize("stealthy.pf1.name"))
        .insertBefore($('[name="stealthy.spotTake10"]')
          .parents('div.form-group:first'));
    });
  }

  patchFoundry() {
    super.patchFoundry();

    // Pick the sight modes in vision-5e that we want Stealthy to affect
    // Hooks.once('setup', () => {
    const sightModes = [
      'basicSight',
      'seeAll',
      'seeInvisibility',
    ];
    for (const mode of sightModes) {
      console.log(`patching ${mode}`);
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
    // });
  }

  findHiddenEffect(actor) {
    const v10 = Math.floor(game.version) < 11;
    return actor?.items.find((i) => i.system.active && (v10 ? i.label : i.name) === 'Hidden');
  }

  findSpotEffect(actor) {
    const v10 = Math.floor(game.version) < 11;
    return actor?.items.find((i) => i.system.active && (v10 ? i.label : i.name) === 'Spot');
  }

  canDetectHidden(visionSource, tgtToken, detectionMode) {
    const stealthFlag = this.getStealthFlag(tgtToken);
    if (!stealthFlag) return true;

    const stealthValue = this.getStealthValue(stealthFlag);
    const perceptionFlag = this.getPerceptionFlag(visionSource.object);
    const perceptionValue = this.getPerceptionValue(perceptionFlag);

    return !(perceptionValue === undefined || perceptionValue <= stealthValue);
  }

  makeHiddenEffectMaker(name) {
    Stealthy.log('PF1.makeHiddenEffectMaker not used in PF1');
    return (flag, source) => null;
  }

  makeSpotEffectMaker(name) {
    Stealthy.log('PF1.makeSpotEffectMaker not used in PF1');
    return (flag, source) => null;
  }

  async updateOrCreateEffect({ name, actor, flag, source, makeEffect }) {
    Stealthy.log('PF1.updateOrCreateEffect not used in PF1');
    return null;
  }

  async updateOrCreateHiddenEffect(actor, flag) {
    let hidden = this.findHiddenEffect(actor);
    const v10 = Math.floor(game.version) < 11;
    if (!hidden) hidden = actor?.items.find((i) => (v10 ? i.label : i.name) === 'Hidden');
    if (!hidden) {
      const effect = {
        "name": "Hidden",
        "type": "buff",
        "img": game.settings.get(Stealthy.MODULE_ID, 'hiddenIcon'),
        "system": {
          "subType": "temp",
          "active": true,
          "hideFromToken": false,
        },
        "flags": {
          "stealthy": flag
        },
      };
      await actor.createEmbeddedDocuments('Item', [effect]);
    }
    else {
      let update = duplicate(hidden.toObject(false));
      update.system.active = true;
      update.flags.stealthy = flag;
      await actor.updateEmbeddedDocuments('Item', [update]);
    }
    stealthy.socket.executeForEveryone('RefreshPerception');
  }

  getStealthFlag(token) {
    let flag = super.getStealthFlag(token);
    if (flag && flag.stealth === undefined)
      flag.stealth = 10 + token.actor.system.skills.ste.mod;
    return flag;
  }

  async setValueInEffect(flag, skill, value, sourceEffect) {
    const token = flag.token;
    let effect = duplicate(sourceEffect);
    if (!('stealthy' in effect.flags))
      effect.flags.stealthy = {};
    effect.flags.stealthy[skill] = value;
    const actor = token.actor;
    await actor.updateEmbeddedDocuments('Item', [effect]);
  }

  async updateOrCreateSpotEffect(actor, flag) {
    let spot = this.findSpotEffect(actor);

    // PF1 buffs can be disabled, if so, look for one already on the actor
    const v10 = Math.floor(game.version) < 11;
    if (!spot) spot = actor?.items.find((i) => (v10 ? i.label : i.name) === 'Spot');
    if (!spot) {
      const effect = {
        "name": "Spot",
        "type": "buff",
        "img": game.settings.get(Stealthy.MODULE_ID, 'spotIcon'),
        "system": {
          "subType": "temp",
          "active": true,
          "level": null,
          "duration": {
            "value": "",
            "units": "turn",
            "start": 0
          },
          "hideFromToken": false,
        },
        "flags": {
          "stealthy": flag
        },
      };
      await actor.createEmbeddedDocuments('Item', [effect]);
    }
    else {
      let update = duplicate(spot.toObject(false));
      update.system.active = true;
      update.flags.stealthy = flag;
      await actor.updateEmbeddedDocuments('Item', [update]);
    }
    canvas.perception.update({ initializeVision: true }, true);
  }

  getPerceptionFlag(token) {
    const flag = super.getPerceptionFlag(token);
    if (flag) return flag;
    if (!game.settings.get(Stealthy.MODULE_ID, 'spotTake10')) return undefined;
    return {
      token,
      passive: true,
      perception: 10 + token.actor.system.skills.per.mod
    };
  }

  async rollPerception(actor, message) {
    Stealthy.log('rollPerception', { actor, message });
    if (!stealthy.bankingPerception) return;

    const token = canvas.tokens.get(message.speaker.token);
    if (stealthy.perceptionToActor) {
      await this.updateOrCreateSpotEffect(actor, { perception: message.rolls[0].total });
    } else {
      await this.putRollOnToken(token, 'perception', message.rolls[0].total);
    }

    super.rollPerception();
  }

  async rollStealth(actor, message) {
    Stealthy.log('rollStealth', { actor, message });

    const token = canvas.tokens.get(message.speaker.token);
    if (stealthy.stealthToActor) {
      await this.updateOrCreateHiddenEffect(actor, { stealth: message.rolls[0].total });
    } else {
      await this.putRollOnToken(token, 'stealth', message.rolls[0].total);
    }

    super.rollStealth();
  }
}

Hooks.once('init', () => {
  if (game.system.id === 'pf1') {
    const systemEngine = new EnginePF1();
    if (systemEngine) {
      window[Stealthy.MODULE_ID] = new Stealthy(systemEngine);
    }
  }
});
