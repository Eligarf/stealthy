export class Stealthy {
  static MODULE_ID = "stealthy";
  static ALLOWED_DETECTION_MODES = "allowedDetectionModesV2";

  constructor(engine) {
    this.engine = engine;
    this.socket = null;

    this.refreshOptions = {
      refreshLighting: true,
      refreshVision: true,
      refreshSounds: true,
      refreshOcclusion: true,
    };

    Hooks.once("setup", () => {
      this.setup();
    });
  }

  setup() {
    this.socket = socketlib.registerModule(Stealthy.MODULE_ID);
    this.socket.register(
      "TogglePerceptionBanking",
      this.togglePerceptionBanking,
    );
    this.socket.register("GetPerceptionBanking", this.getPerceptionBanking);
    this.socket.register("RefreshPerception", this.refreshPerception);
  }

  getBankedPerception(token) {
    const flag = this.engine.getPerceptionFlag(token);
    return this.engine.getPerceptionValue(flag);
  }

  getBankedStealth(token) {
    const flag = this.engine.getStealthFlag(token);
    return this.engine.getStealthValue(flag);
  }

  async bankPerception(token, value) {
    Stealthy.log(`stealthy.bankPerception`, { token, value });
    await this.engine.bankPerception(token, value);
  }

  async bankStealth(token, value) {
    Stealthy.log(`stealthy.bankStealth`, { token, value });
    await this.engine.bankStealth(token, value);
  }

  async clearPerception(token) {
    Stealthy.log(`stealthy.clearPerception`, { token });
    await this.engine.clearPerception(token);
  }

  async clearStealth(token) {
    Stealthy.log(`stealthy.clearStealth`, { token });
    await this.engine.clearStealth(token);
  }

  async togglePerceptionBanking(toggled) {
    Stealthy.log(`ToggletPerceptionBanking <= ${toggled}`);
    stealthy.bankingPerception = toggled;
    if (toggled || !game.user.isGM) return;

    const name = game.i18n.localize("stealthy.spot.name");
    let updates = [];
    for (let token of canvas.tokens.placeables) {
      const actor = token.actor;
      const spot = actor.effects.find((e) => name === e.name);
      if (spot) {
        actor.deleteEmbeddedDocuments("ActiveEffect", [spot.id]);
      }
      const tokenDoc =
        token instanceof foundry.canvas.placeables.Token
          ? token.document
          : token;
      if (tokenDoc.flags?.stealthy?.perception) {
        let update = { _id: token.id };
        if (_del !== "undefined") update[`flags.stealthy.perception`] = _del;
        else update["flags.stealthy.-=perception"] = null;
        updates.push(update);
      }
    }
    if (updates.length > 0)
      await canvas.scene.updateEmbeddedDocuments("Token", updates);
  }

  refreshPerception() {
    Stealthy.log(`RefreshPerception`);
    canvas.perception.update(stealthy.refreshOptions);
  }

  async getPerceptionBanking() {
    return stealthy.bankingPerception;
  }

  static CONSOLE_COLORS = ["background: #222; color: #80ffff", "color: #fff"];
  static engines = {};

  static colorizeOutput(format, ...args) {
    return [`%cstealthy %c|`, ...Stealthy.CONSOLE_COLORS, format, ...args];
  }

  static log(format, ...args) {
    const level = game.settings.get(Stealthy.MODULE_ID, "logLevel");
    if (level !== "none") {
      if (level === "debug")
        console.debug(...Stealthy.colorizeOutput(format, ...args));
      else if (level === "log")
        console.log(...Stealthy.colorizeOutput(format, ...args));
    }
  }

  static logIfDebug(format, ...args) {
    const level = game.settings.get(Stealthy.MODULE_ID, "logLevel");
    if (level === "debug") {
      console.debug(...Stealthy.colorizeOutput(format, ...args));
    }
  }
}
