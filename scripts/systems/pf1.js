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
    return actor?.items.find(i => i.name === 'Hidden' && i.system.active);
  }

  findSpotEffect(actor) {
    return actor?.items.find(i => i.name === 'Spot' && i.system.active);
  }

  canDetectHidden(visionSource, hiddenEffect, tgtToken, detectionMode) {
    const source = visionSource.object?.actor;
    const stealth = hiddenEffect.flags.stealthy?.hidden ?? (10 + tgtToken.actor.system.skills.ste.mod);
    const spotEffect = this.findSpotEffect(source);
    const spotTake10 = game.settings.get(Stealthy.MODULE_ID, 'spotTake10');
    const perception = spotEffect?.flags.stealthy?.spot
      ?? (spotTake10 ? 10 + source.system.skills.per.mod : undefined);

    return !(perception === undefined || perception <= stealth);
  }

  makeHiddenEffectMaker(label) {
    Stealthy.log('PF1.makeHiddenEffectMaker not used in PF1');
    return (flag, source) => null;
  }

  makeSpotEffectMaker(label) {
    Stealthy.log('PF1.makeSpotEffectMaker not used in PF1');
    return (flag, source) => null;
  }

  async updateOrCreateEffect({ label, actor, flag, source, makeEffect }) {
    Stealthy.log('PF1.updateOrCreateEffect not used in PF1');
    return null;
  }

  async updateOrCreateHiddenEffect(actor, flag) {
    let hidden = this.findHiddenEffect(actor);
    if (!hidden) hidden = actor?.items.find(i => i.name === 'Hidden');
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

  getStealthValue(flag, actor) {
    return super.getStealthValue(flag, actor) ?? (10 + actor.system.skills.ste.value);
  }

  async setHiddenValue(actor, effect, flag, value) {
    flag.hidden = value;
    effect.flags.stealthy = flag;
    await actor.updateEmbeddedDocuments('Item', [effect]);
    stealthy.socket.executeForEveryone('RefreshPerception');
  }

  async updateOrCreateSpotEffect(actor, flag) {
    let spot = this.findSpotEffect(actor);

    // PF1 buffs can be disabled, if so, look for one already on the actor
    if (!spot) spot = actor?.items.find(i => i.name === 'Spot');
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

  getPerceptionValue(flag, actor) {
    const spotTake10 = game.settings.get(Stealthy.MODULE_ID, 'spotTake10');
    return super.getPerceptionValue(flag, actor) ?? (spotTake10 ? 10 + actor.system.skills.per.mod : undefined);
  }

  async setSpotValue(actor, effect, flag, value) {
    flag.spot = value;
    effect.flags.stealthy = flag;
    await actor.updateEmbeddedDocuments('Item', [effect]);
    canvas.perception.update({ initializeVision: true }, true);
  }

  async rollPerception(actor, message) {
    Stealthy.log('rollPerception', { actor, message });

    await this.updateOrCreateSpotEffect(actor, { spot: message.rolls[0].total });

    super.rollPerception();
  }

  async rollStealth(actor, message) {
    Stealthy.log('rollStealth', { actor, message });

    await this.updateOrCreateHiddenEffect(actor, { hidden: message.rolls[0].total });

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
