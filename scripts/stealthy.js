export class StealthyBaseEngine {

  constructor() {
    // Hook the relevant skills to capture spot and hidden test
    // results into effects on the actor.

    // new implementations need to add something like the following
    // at file scope so that the Stealthy can find the engine during
    // setup

    // Hooks.once('init', () => {
    //   Stealthy.engines['game-system-id'] = () => new StealthyGameSystem();
    // });
  }

  testStealth(visionSource, config) {
    const target = config.object?.actor;
    const ignoreFriendlyStealth =
      game.settings.get('stealthy', 'ignoreFriendlyStealth') &&
      config.object.document?.disposition === visionSource.object.document?.disposition;

    if (!ignoreFriendlyStealth) {
      const hidden = target?.effects.find(e => e.label === game.i18n.localize("stealthy-hidden-label") && !e.disabled);
      if (hidden) {
        if (this.isHidden(visionSource, hidden, target, config)) return false;
      }
    }

    return true;
  }

  isHidden(visionSource, hidden, target, config) {
    // Implement your system's method for testing spot data vs hidden data
    // This should would in the absence of a spot effect on the viewer, using
    // a passive or default value as necessary
    return false;
  }

  basicVision(wrapped, visionSource, mode, config) {
    // Any special filtering beyond stealth testing is handled here, like being invisible to darkvision/etc.
    return wrapped(visionSource, mode, config);
  }

  seeInvisibility(wrapped, visionSource, mode, config) {
    // Any special filtering beyond stealth testing is handled here.
    return wrapped(visionSource, mode, config);
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

export class Stealthy {

  constructor(makeEngine) {
    this.engine = makeEngine();
    this.activeSpot = true;
    this.socket = null;
    this.socket = socketlib.registerModule('stealthy');
    this.socket.register('ToggleActiveSpot', Stealthy.ToggleActiveSpot);
    this.socket.register('GetActiveSpot', Stealthy.GetActiveSpot);
  }

  static async ToggleActiveSpot(toggled) {
    Stealthy.log(`ToggleActiveSpot <= ${toggled}`);
    game.stealthy.activeSpot = toggled;

    if (!toggled && game.user.isGM) {
      const label = game.i18n.localize('stealthy-spot-label');
      for (let token of canvas.tokens.placeables) {
        const actor = token.actor;
        const spot = actor.effects.find(e => e.label === label);
        if (spot) {
          actor.deleteEmbeddedDocuments('ActiveEffect', [spot.id]);
        }
      }
    }
  }

  static async GetActiveSpot() {
    Stealthy.log(`GetActiveSpot => ${game.stealthy.activeSpot}`);
    return game.stealthy.activeSpot;
  }

  static CONSOLE_COLORS = ['background: #222; color: #80ffff', 'color: #fff'];
  static engines = {};

  static log(format, ...args) {
    const level = game.settings.get('stealthy', 'logLevel');
    if (level !== 'none') {

      function colorizeOutput(format, ...args) {
        return [
          `%cstealthy %c|`,
          ...Stealthy.CONSOLE_COLORS,
          format,
          ...args,
        ];
      }

      if (level === 'debug')
        console.debug(...colorizeOutput(format, ...args));
      else if (level === 'log')
        console.log(...colorizeOutput(format, ...args));
    }
  }

  static async UpdateOrCreateEffect({ label, actor, flag, makeEffect }) {
    let effect = actor.effects.find(e => e.label === label);

    if (!effect) {
      // See if we can source from outside
      const source = game.settings.get('stealthy', 'hiddenSource');
      if (source === 'ce') {
        await game.dfreds.effectInterface.addEffect({ effectName: label, uuid: actor.uuid });
        effect = actor.effects.find(e => e.label === label);
      }
      else if (source === 'cub') {
        await game.cub.applyCondition(label, actor);
        effect = actor.effects.find(e => e.label === label);
      }

      // If we haven't found an ouside source, create the default one
      if (!effect) {
        effect = makeEffect(flag, source);
        await actor.createEmbeddedDocuments('ActiveEffect', [effect]);
        return;
      }
    }

    effect = duplicate(effect);
    effect.flags.stealthy = flag;
    effect.disabled = false;
    await actor.updateEmbeddedDocuments('ActiveEffect', [effect]);
  }

}
