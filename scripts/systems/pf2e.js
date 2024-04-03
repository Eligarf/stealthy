import { Stealthy } from '../stealthy.js';
import Engine from '../engine.js';

async function wait(ms) { return new Promise(resolve => { setTimeout(resolve, ms); }); }

export class EnginePF2e extends Engine {

  constructor() {
    super();

    const workbench = game.modules.get('xdy-pf2e-workbench')?.active;
    if (!workbench) {
      Hooks.once('ready', async () => {
        ui.notifications.error(`${game.i18n.localize('stealthy.pf2e.dependency')}`);
      });
    }

    // There is probably a better practice for figuring out skill checks in PF2E, but this "works"
    const stealthTags = [
      `<strong>${game.i18n.localize('xdy-pf2e-workbench.macros.basicActionMacros.actions.Hide')}</strong>`,
      `>${game.i18n.format("PF2E.InitiativeWithSkill", { skillName: game.i18n.localize('PF2E.StealthLabel') })}<`,
    ];
    const perceptionTags = [
      `<strong>${game.i18n.localize('xdy-pf2e-workbench.macros.basicActionMacros.actions.Seek')}</strong>`,
    ];
    Stealthy.log('Localized Chat Tags', { stealthTags, perceptionTags });

    Hooks.on('createChatMessage', async (message, options, id) => {
      // Stealthy.log("createChatMessage", message);
      if (stealthTags.some(t => message.flavor.includes(t))) {
        await this.rollStealth(message, options, id);
      }
      else if (perceptionTags.some(t => message.flavor.includes(t))) {
        await this.rollPerception(message, options, id);
      }
    });
  }

  findHiddenEffect(actor) {
    return actor?.getCondition('hidden');
  }

  findSpotEffect(actor) {
    return actor?.items.find(i => i.name === 'Seeking');
  }

  canSpotTarget(visionSource, hiddenEffect, target) {
    const stealth = hiddenEffect?.flags?.stealthy?.hidden ?? (10 + target.actor.system.skills.ste.value);
    const source = visionSource.object?.actor;
    let seeking = this.findSpotEffect(source);
    const perception = seeking?.flags?.stealthy?.spot ?? 10 + source.system.attributes.perception?.value;

    if (perception < stealth) {
      Stealthy.log(`${visionSource.object.name}'s ${perception} can't detect ${target.name}'s ${stealth}`);
      return false;
    }
    return true;
  }

  makeHiddenEffectMaker(label) {
    Stealthy.log('PF2e.makeHiddenEffectMaker not used in PF2e');
    return (flag, source) => null;
  }

  makeSpotEffectMaker(label) {
    Stealthy.log('PF2e.makeSpotEffectMaker not used in PF2e');
    return (flag, source) => null;
  }

  async updateOrCreateEffect({ label, actor, flag, source, makeEffect }) {
    Stealthy.log('PF2e.updateOrCreateEffect not used in PF2e');
    return null;
  }

  async updateOrCreateHiddenEffect(actor, flag) {
    const lowerLabel = this.hiddenLabel.toLowerCase();
    if (!actor.hasCondition(lowerLabel)) {
      await actor.toggleCondition(lowerLabel);
    }
    const condition = actor.getCondition(lowerLabel);
    let update = duplicate(condition.toObject(false));
    update.flags.stealthy = flag;
    await actor.updateEmbeddedDocuments('Item', [update]);
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
    let seeking = this.findSpotEffect(actor);
    if (!seeking) {
      const effect = {
        "name": "Seeking",
        "type": "effect",
        "effects": [],
        "system": {
          "description": {
            "gm": "",
            "value": ""
          },
          "slug": "seeking",
          "traits": {
            "value": []
          },
          "level": {
            "value": 1
          },
          "duration": {
            "value": 1,
            "unit": "rounds",
            "sustained": false,
            "expiry": "turn-start"
          },
          "tokenIcon": {
            "show": true
          },
          "unidentified": false
        },
        "img": "systems/pf2e/icons/spells/anticipate-peril.webp",
        "flags": {
          "stealthy": flag
        },
      };
      await actor.createEmbeddedDocuments('Item', [effect]);
    }
    else {
      let update = duplicate(seeking.toObject(false));
      update.flags.stealthy = flag;
      await actor.updateEmbeddedDocuments('Item', [update]);
    }
    canvas.perception.update({ initializeVision: true }, true);
  }

  getSpotFlagAndValue(actor, effect) {
    const value = effect?.flags.stealthy.spot ?? (10 + actor.system.attributes.perception?.value);
    return { flag: { spot: value }, value };
  }

  async setSpotValue(actor, effect, flag, value) {
    flag.spot = value;
    effect.flags.stealthy = flag;
    await actor.updateEmbeddedDocuments('Item', [effect]);
  }

  async rollPerception(message, options, id) {
    Stealthy.log('rollPerception', { message, options, id });
    const check = Number(message.content);

    const token = canvas.tokens.get(message.speaker.token);
    const actor = token.actor;
    await this.updateOrCreateSpotEffect(actor, { spot: check });

    super.rollPerception();
  }

  async rollStealth(message, options, id) {
    Stealthy.log('rollStealth', { message, options, id });
    const check = Number(message.content);

    const token = canvas.tokens.get(message.speaker.token);
    const actor = token.actor;
    await this.updateOrCreateHiddenEffect(actor, { hidden: check });

    super.rollStealth();
  }
}

Hooks.once('init', () => {
  Stealthy.RegisterEngine('pf2e', () => new EnginePF2e());
});
