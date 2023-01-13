import { Stealthy, StealthyBaseEngine } from '../stealthy.js';

export class StealthyPf2e extends StealthyBaseEngine {

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

  patchFoundry() {
    libWrapper.register(
      Stealthy.MODULE_ID,
      'DetectionModeBasicSight.prototype._canDetect',
      function (wrapped, visionSource, target) {
        Stealthy.log('DetectionModeBasicSight.prototype._canDetect', { visionSource, target });
        return wrapped(visionSource, target);
      },
      libWrapper.MIXED,
      { perf_mode: libWrapper.PERF_FAST }
    );
  }

  findHiddenEffect(actor) {
    return actor.getFlag(Stealthy.MODULE_ID, 'hidden');
  }

  findSpotEffect(actor) {
    return actor.getFlag(Stealthy.MODULE_ID, 'spot');
  }

  isHidden(visionSource, hiddenEffect, target, config) {
    const source = visionSource.object?.actor;
    const stealth = hiddenEffect ?? (10 + target.system.skills.ste.value);
    const spotEffect = this.findSpotEffect(source);
    const perception = spotEffect ?? (10 + target.system.attributes.perception.value);

    if (perception <= stealth) {
      Stealthy.log(`${visionSource.object.name}'s ${perception} can't see ${config.object.name}'s ${stealth}`);
      return true;
    }
    return false;
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
  }

  getSpotFlagAndValue(actor, effect) {
    const value = effect ?? (10 + actor.system.attributes.perception.value);
    return { value };
  }

  async setSpotValue(actor, effect, flag, value) {
    await actor.setFlag(Stealthy.MODULE_ID, 'spot', value);
  }

  async rollPerception(message, options, id) {
    Stealthy.log('rollPerception', { message, options, id });

    const token = canvas.tokens.get(message.speaker.token);
    const actor = token.actor;
    await this.updateOrCreateSpotEffect(actor, { spot: Number(message.content) });
  }

  async rollStealth(message, options, id) {
    Stealthy.log('rollStealth', { message, options, id });

    const token = canvas.tokens.get(message.speaker.token);
    const actor = token.actor;
    await this.updateOrCreateHiddenEffect(actor, { hidden: Number(message.content) });
  }
}

Hooks.once('init', () => {
  Stealthy.RegisterEngine('pf2e', () => new StealthyPf2e());
});
