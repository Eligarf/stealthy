import { Stealthy } from '../stealthy.js';
import Engine from '../engine.js';

export class EnginePF1 extends Engine {

  constructor() {
    super();

    game.settings.register(Stealthy.MODULE_ID, 'spotTake10', {
      name: game.i18n.localize("stealthy.pf1.spotTake10.name"),
      hint: game.i18n.localize("stealthy.pf1.spotTake10.hint"),
      scope: 'world',
      config: true,
      type: Boolean,
      default: false,
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

  findHiddenEffect(actor) {
    return actor?.items.find(i => i.name === 'Hidden' && i.system.active);
  }

  findSpotEffect(actor) {
    return actor?.items.find(i => i.name === 'Spot' && i.system.active);
  }

  canSpotTarget(visionSource, hiddenEffect, target) {
    const source = visionSource.object?.actor;
    const stealth = hiddenEffect.flags.stealthy?.hidden ?? (10 + target.actor.system.skills.ste.mod);
    const spotEffect = this.findSpotEffect(source);
    const spotTake10 = game.settings.get(Stealthy.MODULE_ID, 'spotTake10');
    const perception = spotEffect?.flags.stealthy?.spot
      ?? (spotTake10 ? 10 + source.system.skills.per.mod : undefined);

    if (perception === undefined || perception <= stealth) {
      Stealthy.log(`${visionSource.object.name}'s ${perception} can't detect ${target.name}'s ${stealth}`);
      return false;
    }
    return true;
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
        "img": "icons/magic/perception/shadow-stealth-eyes-purple.webp",
        "system": {
          "description": {
            "value": "",
            "unidentified": ""
          },
          "tags": [],
          "changes": [],
          "changeFlags": {
            "loseDexToAC": false,
            "noEncumbrance": false,
            "mediumArmorFullSpeed": false,
            "heavyArmorFullSpeed": false
          },
          "contextNotes": [],
          "links": {
            "children": []
          },
          "tag": "",
          "useCustomTag": false,
          "flags": {
            "boolean": {},
            "dictionary": {}
          },
          "scriptCalls": [],
          "subType": "temp",
          "active": true,
          "level": null,
          "duration": {
            "value": "",
            "units": "",
            "start": 0
          },
          "hideFromToken": false,
          "uses": {
            "per": ""
          }
        },
        "effects": [],
        "folder": null,
        "flags": {
          "core": {},
          "stealthy": flag
        },
        "_stats": {
          "systemId": "pf1",
          "systemVersion": "9.2",
          "coreVersion": "11.306",
          "createdTime": 1690224122722,
          "modifiedTime": 1690225389387,
          "lastModifiedBy": "FDk5oLXCkN7Yj8YE"
        }
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

  getHiddenFlagAndValue(actor, effect) {
    const value = effect.flags.stealthy?.hidden ?? (10 + actor.system.skills.ste.value);
    return { flag: { hidden: value }, value };
  }

  async setHiddenValue(actor, effect, flag, value) {
    flag.hidden = value;
    effect.flags.stealthy = flag;
    await actor.updateEmbeddedDocuments('Item', [effect]);
    stealthy.socket.executeForEveryone('RefreshPerception');
  }

  async updateOrCreateSpotEffect(actor, flag) {
    let spot = this.findSpotEffect(actor);
    if (!spot) spot = actor?.items.find(i => i.name === 'Spot');
    if (!spot) {
      const effect = {
        "name": "Spot",
        "type": "buff",
        "img": "systems/pf2e/icons/spells/anticipate-peril.webp",
        "system": {
          "description": {
            "value": "",
            "unidentified": ""
          },
          "tags": [],
          "changes": [],
          "changeFlags": {
            "loseDexToAC": false,
            "noEncumbrance": false,
            "mediumArmorFullSpeed": false,
            "heavyArmorFullSpeed": false
          },
          "contextNotes": [],
          "links": {
            "children": []
          },
          "tag": "",
          "useCustomTag": false,
          "flags": {
            "boolean": {},
            "dictionary": {}
          },
          "scriptCalls": [],
          "subType": "temp",
          "active": true,
          "level": null,
          "duration": {
            "value": "",
            "units": "turn",
            "start": 0
          },
          "hideFromToken": false,
          "uses": {
            "per": ""
          }
        },
        "effects": [],
        "folder": null,
        "flags": {
          "core": {},
          "stealthy": flag
        },
        "_stats": {
          "systemId": "pf1",
          "systemVersion": "9.2",
          "coreVersion": "11.306",
          "createdTime": 1690223875160,
          "modifiedTime": 1690227032032,
          "lastModifiedBy": "FDk5oLXCkN7Yj8YE"
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

  getSpotFlagAndValue(actor, effect) {
    const spotTake10 = game.settings.get(Stealthy.MODULE_ID, 'spotTake10');
    const value = effect?.flags?.stealthy?.spot
      ?? (spotTake10 ? 10 + actor.system.skills.per.mod : undefined);
    return { flag: { spot: value }, value };
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
  Stealthy.RegisterEngine('pf1', () => new EnginePF1());
});
