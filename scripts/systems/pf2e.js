import { Stealthy } from '../stealthy.js';
import Engine from '../engine.js';

async function wait(ms) { return new Promise(resolve => { setTimeout(resolve, ms); }); }

export class EnginePF2e extends Engine {

  constructor() {
    super();

    // There is probably a better practice for figuring out skill checks in PF2E, but this "works"
    Hooks.on('createChatMessage', async (message, options, id) => {
      // Stealthy.log("createChatMessage", message);
      if (['>Skill Check: Stealth<', '>Initiative: Stealth<', '>(Stealth Check)<'].some(t => message.flavor.includes(t))) {
        await this.rollStealth(message, options, id);
      }
      else if (['>Perception Check<', '>(Perception Check)<'].some(t => message.flavor.includes(t))) {
        await this.rollPerception(message, options, id);
      }
    });
  }

  findHiddenEffect(actor) {
    return actor.getCondition('hidden');
  }

  findSpotEffect(actor) {
    return null;
  }

  canSpotTarget(visionSource, hiddenEffect, target) {
    // const source = visionSource.object?.actor;
    // const stealth = hiddenEffect ?? (10 + target.actor.system.skills.ste.value);
    // const spotEffect = this.findSpotEffect(source);
    // const perception = spotEffect ?? (10 + target.actor.system.attributes.perception.value);

    // if (perception <= stealth) {
    //   Stealthy.log(`${visionSource.object.name}'s ${perception} can't see ${target.name}'s ${stealth}`);
    //   return false;
    // }
    return true;
  }

  makeHiddenEffectMaker(label) {
    return (flag, source) => null;
  }

  makeSpotEffectMaker(label) {
    return (flag, source) => null;
  }

  async updateOrCreateEffect({ label, actor, flag, source, makeEffect }) {
    const lowerLabel = label.toLowerCase();
    if (!actor.hasCondition(lowerLabel)) {
      await actor.toggleCondition(lowerLabel);
    }
    const condition = actor.getCondition(lowerLabel);
    let update = duplicate(condition.toObject(false));
    update.flags.stealthy = flag;
    await actor.updateEmbeddedDocuments('Item', [update]);
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
    // const check = Number(message.content);

    // const token = canvas.tokens.get(message.speaker.token);
    // const actor = token.actor;
    // await this.updateOrCreateSpotEffect(actor, { spot: check });

    super.rollPerception();
  }

  async rollStealth(message, options, id) {
    Stealthy.log('rollStealth', { message, options, id });
    const check = Number(message.content);

    const token = canvas.tokens.get(message.speaker.token);
    const actor = token.actor;
    await this.updateOrCreateHiddenEffect(actor, { hidden: check });
    // const label = 'hidden';
    // if (!actor.hasCondition(label)) {
    //   await actor.toggleCondition(label);
    // }
    // const hidden = actor.getCondition(label);
    // let update = duplicate(hidden.toObject(false));
    // update.flags.stealthy = check;
    // await actor.updateEmbeddedDocuments('Item', [update]);

    super.rollStealth();
  }
}

Hooks.once('init', () => {
  Stealthy.RegisterEngine('pf2e', () => new EnginePF2e());
});
