import { Stealthy, StealthyBaseEngine } from '../stealthy.js';

export class StealthyPF2e extends StealthyBaseEngine {

  constructor() {
    // Hook the relevant skills to capture spot and hidden test
    // results into effects on the actor.
    super();
    console.warn(`Stealthy for '${game.system.id}' is stubbed out, needs development`);
  }

  isHidden(visionSource, hidden, target, config) {
    // Implement your system's method for testing spot data vs hidden data
    // This should would in the absence of a spot effect on the viewer, using
    // a passive or default value as necessary
    return false;
  }

  makeHiddenEffect(label) {
    console.error(`'${game.system.id}' can't make a Hidden effect. Heavy lifting goes here.`);
  }

  makeSpotEffect(label) {
    console.error(`'${game.system.id}' can't make a Spot effect. Heavy lifting goes here.`);
  }

  async updateOrCreateEffect({ label, actor, flag, makeEffect }) {
    console.error(`'${game.system.id}' isn't compatible with Active Effect use. Heavy lifting goes here.`);
  }

  getHiddenFlagAndValue(hidden) {
    // Return the data necessary for storing data about hidden, and the
    // value that should be shown on the token button input
    return { flag: { hidden: undefined }, value: undefined };
  }

  async setHiddenValue(actor, effect, flag, value) {
    // If the hidden value was changed, do what you need to store it
    flag.hidden = value;
    effect.flags.stealthy = flag;
    await actor.updateEmbeddedDocuments('ActiveEffect', [effect]);
  }

  getSpotFlagAndValue(spot) {
    // Return the data necessary for storing data about spot, and the
    // value that should be shown on the token button input
    return { flag: { spot: undefined }, value: undefined };
  }

  async setSpotValue(actor, effect, flag, value) {
    // If the spot value was changed, do what you need to store it
    flag.spot = value;
    effect.flags.stealthy = flag;
    await actor.updateEmbeddedDocuments('ActiveEffect', [effect]);
  }
}

Hooks.once('init', () => {
  Stealthy.RegisterEngine('pf2e', () => new StealthyPF2e());
});
