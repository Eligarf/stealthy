import { Stealthy } from '../stealthy.js';
import Engine from '../engine.js';

export class EnginePF1 extends Engine {

  constructor() {
    super();
    game.settings.register(Stealthy.MODULE_ID, 'spotTake10', {
      scope: 'world',
      config: false,
      type: Boolean,
      default: false,
    });

    game.settings.register(Stealthy.MODULE_ID, 'passiveSpotOffset', {
      name: game.i18n.localize("stealthy.pf1.passiveSpotOffset.name"),
      hint: game.i18n.localize("stealthy.pf1.passiveSpotOffset.hint"),
      scope: 'world',
      config: true,
      type: Number,
      default: -999,
    });

    Hooks.once('ready', () => {
      const offset = game.settings.get(Stealthy.MODULE_ID, 'passiveSpotOffset');
      if (offset === -999) {
        game.settings.set(
          Stealthy.MODULE_ID,
          'passiveSpotOffset',
          game.settings.get(Stealthy.MODULE_ID, 'spotTake10') ? 10 : -99
        )
      }
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

  async setValueInEffect(flag, skill, value, sourceEffect) {
    const token = flag.token;
    let effect = duplicate(sourceEffect);
    if (!('stealthy' in effect.flags))
      effect.flags.stealthy = {};
    effect.flags.stealthy[skill] = value;
    const actor = token.actor;
    await actor.updateEmbeddedDocuments('Item', [effect]);
  }

  getStealthFlag(token) {
    let flag = super.getStealthFlag(token);
    if (flag && flag.stealth === undefined)
      flag.stealth = 10 + token.actor.system?.skills?.ste?.mod ?? -100;
    return flag;
  }

  getPerceptionFlag(token) {
    const flag = super.getPerceptionFlag(token);
    if (flag) return flag;
    const offset = game.settings.get(Stealthy.MODULE_ID, 'passiveSpotOffset');
    return {
      token,
      passive: true,
      perception: offset + (token.actor.system?.skills?.per?.mod ?? 0)
    };
  }

  async rollStealth(actor, message) {
    Stealthy.log('rollStealth', { actor, message });

    const token = canvas.tokens.get(message.speaker.token);
    await this.bankStealth(token, message.rolls[0].total);

    super.rollStealth();
  }

  async rollPerception(actor, message) {
    Stealthy.log('rollPerception', { actor, message });
    if (!stealthy.bankingPerception) return;

    const token = canvas.tokens.get(message.speaker.token);
    await this.bankPerception(token, message.rolls[0].total);

    super.rollPerception();
  }

  findHiddenEffect(actor) {
    const v10 = Math.floor(game.version) < 11;
    return actor?.items.find((i) => i.system.active && (v10 ? i.label : i.name) === 'Hidden');
  }

  findSpotEffect(actor) {
    const v10 = Math.floor(game.version) < 11;
    return actor?.items.find((i) => i.system.active && (v10 ? i.label : i.name) === 'Spot');
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
    hidden ??= actor?.items.find((i) => (v10 ? i.label : i.name) === 'Hidden');
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

  async updateOrCreateSpotEffect(actor, flag) {
    let spot = this.findSpotEffect(actor);

    // PF1 buffs can be disabled, if so, look for one already on the actor
    const v10 = Math.floor(game.version) < 11;
    spot ??= actor?.items.find((i) => (v10 ? i.label : i.name) === 'Spot');
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
}

Hooks.once('init', () => {
  if (game.system.id === 'pf1') {
    const systemEngine = new EnginePF1();
    if (systemEngine) {
      window[Stealthy.MODULE_ID] = new Stealthy(systemEngine);
    }
  }
});
