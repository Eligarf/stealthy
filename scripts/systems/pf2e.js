import { Stealthy } from '../stealthy.js';
import Engine from '../engine.js';

export class EnginePF2e extends Engine {

  constructor() {
    super();

    // There is probably a better practice for figuring out skill checks in PF2E, but this "works"
    Hooks.on('createChatMessage', async (message, options, id) => {
      if (message.flavor.includes('>Skill Check: Stealth<')) {
        await this.rollStealth(message, options, id);
      }
      else if (message.flavor.includes('>Perception Check<')) {
        await this.rollPerception(message, options, id);
      }
    });
  }

  findHiddenEffect(actor) {
    return actor.getFlag(Stealthy.MODULE_ID, 'hidden');
  }

  findSpotEffect(actor) {
    return actor.getFlag(Stealthy.MODULE_ID, 'spot');
  }

  canSpotTarget(visionSource, hiddenEffect, target) {
    const source = visionSource.object?.actor;
    const stealth = hiddenEffect ?? (10 + target.actor.system.skills.ste.value);
    const spotEffect = this.findSpotEffect(source);
    const perception = spotEffect ?? (10 + target.actor.system.attributes.perception.value);

    if (perception <= stealth) {
      Stealthy.log(`${visionSource.object.name}'s ${perception} can't see ${target.name}'s ${stealth}`);
      return false;
    }
    return true;
  }

  makeHiddenEffectMaker(label) {
    return (flag, source) => null;
  }

  makeSpotEffectMaker(label) {
    return (flag, source) => null;
  }

  async updateOrCreateEffect({ label, actor, flag, source, makeEffect }) {
    for (const [key, value] of Object.entries(flag)) {
      await actor.setFlag(Stealthy.MODULE_ID, key, value);
      break;
    }
  }

  getHiddenFlagAndValue(actor, effect) {
    const value = effect ?? (10 + actor.system.skills.ste.value);
    return { value };
  }

  async setHiddenValue(actor, effect, flag, value) {
    await actor.setFlag(Stealthy.MODULE_ID, 'hidden', value);
    stealthy.socket.executeForEveryone('RefreshPerception');
  }

  getSpotFlagAndValue(actor, effect) {
    const value = effect ?? (10 + actor.system.attributes.perception.value);
    return { value };
  }

  async setSpotValue(actor, effect, flag, value) {
    await actor.setFlag(Stealthy.MODULE_ID, 'spot', value);
    canvas.perception.update({ initializeVision: true }, true);
  }

  async rollPerception(message, options, id) {
    Stealthy.log('rollPerception', { message, options, id });

    const token = canvas.tokens.get(message.speaker.token);
    const actor = token.actor;
    await this.updateOrCreateSpotEffect(actor, { spot: Number(message.content) });

    super.rollPerception();
  }

  async rollStealth(message, options, id) {
    Stealthy.log('rollStealth', { message, options, id });

    const token = canvas.tokens.get(message.speaker.token);
    const actor = token.actor;
    await this.updateOrCreateHiddenEffect(actor, { hidden: Number(message.content) });

    super.rollStealth();
  }
}

Hooks.once('init', () => {
  Stealthy.RegisterEngine('pf2e', () => new EnginePF2e());
});
