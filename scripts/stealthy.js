export class Stealthy {

  static MODULE_ID = 'stealthy';

  constructor(makeEngine) {
    this.engine = makeEngine();
    this.engine.patchFoundry();
    this.activeSpot = game.settings.get(Stealthy.MODULE_ID, 'activeSpot');
    this.socket = null;
    this.socket = socketlib.registerModule(Stealthy.MODULE_ID);
    this.socket.register('ToggleActiveSpot', Stealthy.ToggleActiveSpot);
    this.socket.register('GetActiveSpot', Stealthy.GetActiveSpot);
    this.socket.register('RefreshPerception', Stealthy.RefreshPerception);
  }

  getSpotValue(actor) {
    const effect = this.engine.findSpotEffect(actor);
    const { value } = this.engine.getSpotFlagAndValue(actor, effect);
    return value;
  }

  getHiddenValue(actor) {
    const effect = this.engine.findHiddenEffect(actor);
    const { value } = this.engine.getHiddenFlagAndValue(actor, effect);
    return value;
  }

  static async ToggleActiveSpot(toggled) {
    Stealthy.log(`ToggleActiveSpot <= ${toggled}`);
    stealthy.activeSpot = toggled;

    if (!toggled && game.user.isGM) {
      const label = game.i18n.localize('stealthy.spot.label');
      for (let token of canvas.tokens.placeables) {
        const actor = token.actor;
        const spot = actor.effects.find(e => e.label === label);
        if (spot) {
          actor.deleteEmbeddedDocuments('ActiveEffect', [spot.id]);
        }
      }
    }
  }

  static RefreshPerception() {
    Stealthy.log(`RefreshPerception`);
    canvas.perception.update({ initializeVision: true }, true);
  }

  static async GetActiveSpot() {
    Stealthy.log(`GetActiveSpot => ${stealthy.activeSpot}`);
    return stealthy.activeSpot;
  }

  static CONSOLE_COLORS = ['background: #222; color: #80ffff', 'color: #fff'];
  static engines = {};

  static RegisterEngine(id, makeEngine) {
    if (id !== game.system.id) return;
    console.log(`stealthy | Registering Stealth engine for '${id}'`);
    Stealthy.engines[id] = makeEngine;
  }

  static log(format, ...args) {
    const level = game.settings.get(Stealthy.MODULE_ID, 'logLevel');
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

}
