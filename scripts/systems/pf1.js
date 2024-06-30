import { Stealthy } from '../stealthy.js';
import Engine from '../engine.js';

export class EnginePF1 extends Engine {

  constructor() {
    super();
  }

  init() {
    super.init();

    game.settings.register(Stealthy.MODULE_ID, 'spotTake10', {
      scope: 'world',
      config: false,
      type: Boolean,
      default: false,
    });

    game.settings.register(Stealthy.MODULE_ID, 'passiveSpotOffset', {
      name: "stealthy.pf1.passiveSpotOffset.name",
      hint: "stealthy.pf1.passiveSpotOffset.hint",
      scope: 'world',
      config: true,
      type: Number,
      default: -999,
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
        .insertBefore($('[name="stealthy.passiveSpotOffset"]')
          .parents('div.form-group:first'));
    });
  }

  ready() {
    super.init();

    const offset = game.settings.get(Stealthy.MODULE_ID, 'passiveSpotOffset');
    if (offset === -999) {
      game.settings.set(
        Stealthy.MODULE_ID,
        'passiveSpotOffset',
        game.settings.get(Stealthy.MODULE_ID, 'spotTake10') ? 10 : -99
      );
    }
  }

  async setValueInEffect(flag, skill, value, sourceEffect) {
    const token = flag.token;
    let effect = foundry.utils.duplicate(sourceEffect);
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

  findStealthEffect(actor) {
    const beforeV11 = Math.floor(game.version) < 11;
    return actor?.items.find((i) => i.system.active && (beforeV11 ? i.label : i.name) === 'Hidden');
  }

  findPerceptionEffect(actor) {
    const beforeV11 = Math.floor(game.version) < 11;
    return actor?.items.find((i) => i.system.active && (beforeV11 ? i.label : i.name) === 'Spot');
  }

  makeStealthEffectMaker(name) {
    Stealthy.log('PF1.makeStealthEffectMaker not used in PF1');
    return (flag, source) => null;
  }

  makePerceptionEffectMaker(name) {
    Stealthy.log('PF1.makePerceptionEffectMaker not used in PF1');
    return (flag, source) => null;
  }

  async updateOrCreateEffect({ name, actor, flag, source, makeEffect }) {
    Stealthy.log('PF1.updateOrCreateEffect not used in PF1');
    return null;
  }

  async updateOrCreateStealthEffect(actor, flag) {
    let hidden = this.findStealthEffect(actor);
    const beforeV11 = Math.floor(game.version) < 11;
    hidden ??= actor?.items.find((i) => (beforeV11 ? i.label : i.name) === 'Hidden');
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
      let update = foundry.utils.duplicate(hidden.toObject(false));
      update.system.active = true;
      update.flags.stealthy = flag;
      await actor.updateEmbeddedDocuments('Item', [update]);
    }
    stealthy.socket.executeForEveryone('RefreshPerception');
  }

  async updateOrCreatePerceptionEffect(actor, flag) {
    let spot = this.findPerceptionEffect(actor);

    // PF1 buffs can be disabled, if so, look for one already on the actor
    const beforeV11 = Math.floor(game.version) < 11;
    spot ??= actor?.items.find((i) => (beforeV11 ? i.label : i.name) === 'Spot');
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
      let update = foundry.utils.duplicate(spot.toObject(false));
      update.system.active = true;
      update.flags.stealthy = flag;
      await actor.updateEmbeddedDocuments('Item', [update]);
    }
    stealthy.refreshPerception();
  }
}

Hooks.once('init', () => {
  if (game.system.id === 'pf1') {
    const systemEngine = new EnginePF1();
    if (systemEngine) {
      window[Stealthy.MODULE_ID] = new Stealthy(systemEngine);
      systemEngine.init();
    }
  }
});
