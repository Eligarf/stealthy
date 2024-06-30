import { Stealthy } from "./stealthy.js";
import Doors from "./doors.js";
import { DetectionModesApplicationClass } from "./detectionModesMenu.js";

export default class Engine {

  constructor() {
    // Hook the relevant skills to capture spot and hidden test
    // results into effects on the actor.

    // new implementations need to add something like the following
    // at file scope so that the Stealthy can find the engine during
    // setup

    // Hooks.once('init', () => {
    //   if (game.system.id === 'system-id') {
    //     const systemEngine = new system-engine();
    //     if (systemEngine) {
    //       window[Stealthy.MODULE_ID] = new Stealthy(systemEngine);
    //       systemEngine.init();
    //     }
    //   }
    // });


    this.warnedMissingCE = false;
    this.warnedMissingCLT = false;

    this.defaultDetectionModes = [
      'basicSight',
      'lightPerception',
      'seeAll',
      'seeInvisibility',
    ];

    Hooks.once('setup', () => {
      this.setup();
    });

    Hooks.once('ready', () => {
      this.ready();
    });
  }

  init() {
    const module = game.modules.get(Stealthy.MODULE_ID);
    const moduleVersion = module.version;
    const defaults = this.getSettingsDefaults(moduleVersion);

    game.settings.register(Stealthy.MODULE_ID, 'stealthToActor', {
      name: "stealthy.stealthToActor.name",
      hint: "stealthy.stealthToActor.hint",
      scope: 'world',
      config: true,
      type: Boolean,
      default: defaults.stealthToActor,
      onChange: value => {
        stealthy.stealthToActor = value;
      }
    });

    game.settings.register(Stealthy.MODULE_ID, 'perceptionToActor', {
      name: "stealthy.perceptionToActor.name",
      hint: "stealthy.perceptionToActor.hint",
      scope: 'world',
      config: true,
      type: Boolean,
      default: defaults.perceptionToActor,
      onChange: value => {
        stealthy.perceptionToActor = value;
      }
    });

    game.settings.registerMenu(Stealthy.MODULE_ID, "detectionModesMenu", {
      name: "stealthy.detectionModesMenu.name",
      label: "stealthy.detectionModesMenu.label",
      hint: "stealthy.detectionModesMenu.hint",
      icon: "fas fa-wrench",
      type: DetectionModesApplicationClass,
      restricted: true,
    });


    game.settings.register(Stealthy.MODULE_ID, 'allowedDetectionModes', {
      scope: 'world',
      config: false,
      type: Object,
      default: defaults.allowedDetectionModes,
    });

    game.settings.register(Stealthy.MODULE_ID, 'friendlyStealth', {
      name: "stealthy.friendlyStealth.name",
      scope: 'world',
      config: true,
      type: String,
      choices: {
        'allow': "stealthy.friendlyStealth.allow",
        'inCombat': "stealthy.friendlyStealth.inCombat",
        'ignore': "stealthy.friendlyStealth.ignore"
      },
      default: defaults.friendlyStealth
    });

    game.settings.register(Stealthy.MODULE_ID, 'playerHud', {
      name: "stealthy.playerHud.name",
      hint: "stealthy.playerHud.hint",
      scope: 'world',
      config: true,
      type: Boolean,
      default: defaults.playerHud,
    });

    game.settings.register(Stealthy.MODULE_ID, 'exposure', {
      name: "stealthy.exposure.name",
      hint: "stealthy.exposure.hint",
      scope: 'client',
      config: true,
      type: Boolean,
      default: defaults.exposure,
    });

    game.settings.register(Stealthy.MODULE_ID, 'spotSecretDoors', {
      name: "stealthy.spotHiddenDoors.name",
      hint: "stealthy.spotHiddenDoors.hint",
      scope: 'world',
      requiresReload: true,
      config: true,
      type: Boolean,
      default: defaults.spotSecretDoors,
    });

    let sources = {
      'none': "stealthy.source.min",
      'ae': "stealthy.source.ae",
    };
    if (game.dfreds?.effectInterface) {
      sources['ce'] = "stealthy.source.ce.name";
    }
    if (game?.clt) {
      sources['clt'] = "stealthy.source.clt.name";
    }

    game.settings.register(Stealthy.MODULE_ID, 'hiddenSource', {
      name: "stealthy.hidden.source",
      hint: "stealthy.source.hint",
      scope: 'world',
      config: true,
      type: String,
      choices: sources,
      default: defaults.hiddenSource
    });

    game.settings.register(Stealthy.MODULE_ID, 'hiddenIcon', {
      name: "stealthy.hidden.icon",
      hint: "stealthy.hidden.iconhint",
      scope: 'world',
      requiresReload: true,
      config: true,
      type: String,
      filePicker: true,
      default: defaults.hiddenIcon
    });

    game.settings.register(Stealthy.MODULE_ID, 'spotSource', {
      name: "stealthy.spot.source",
      hint: "stealthy.source.hint",
      scope: 'world',
      config: true,
      type: String,
      choices: sources,
      default: defaults.spotSource
    });

    game.settings.register(Stealthy.MODULE_ID, 'spotIcon', {
      name: "stealthy.spot.icon",
      hint: "stealthy.spot.iconhint",
      scope: 'world',
      requiresReload: true,
      config: true,
      type: String,
      filePicker: true,
      default: defaults.spotIcon
    });

    game.settings.register(Stealthy.MODULE_ID, 'hiddenLabel', {
      name: "stealthy.hidden.preloc.key",
      hint: "stealthy.hidden.preloc.hint",
      scope: 'world',
      config: true,
      type: String,
      default: defaults.hiddenLabel,
      onChange: value => {
        stealthy.engine.hiddenName = value;
      }
    });

    game.settings.register(Stealthy.MODULE_ID, 'spotLabel', {
      name: "stealthy.spot.preloc.key",
      scope: 'world',
      config: true,
      type: String,
      default: defaults.spotLabel,
      onChange: value => {
        stealthy.engine.spotName = value;
      }
    });

    game.settings.register(Stealthy.MODULE_ID, 'logLevel', {
      name: "stealthy.logLevel.name",
      scope: 'client',
      config: true,
      type: String,
      choices: {
        'none': "stealthy.logLevel.none",
        'debug': "stealthy.logLevel.debug",
        'log': "stealthy.logLevel.log"
      },
      default: defaults.logLevel
    });

    game.settings.register(Stealthy.MODULE_ID, 'schema', {
      name: `${Stealthy.MODULE_ID}.schema.name`,
      hint: `${Stealthy.MODULE_ID}.schema.hint`,
      scope: 'world',
      config: true,
      type: String,
      default: defaults.schema,
      onChange: value => {
        const newValue = migrate(moduleVersion, value);
        if (value != newValue) {
          game.settings.set(MODULE_ID, 'schema', newValue);
        }
      }
    });

    game.settings.register(Stealthy.MODULE_ID, 'activeSpot', {
      scope: 'world',
      config: false,
      type: Boolean,
      default: defaults.activeSpot,
    });

    Stealthy.log(`${moduleVersion}: init`);
  }

  setup() {
    this.hiddenName = game.i18n.localize(game.settings.get(Stealthy.MODULE_ID, 'hiddenLabel'));
    this.spotName = game.i18n.localize(game.settings.get(Stealthy.MODULE_ID, 'spotLabel'));
    Stealthy.log(`hiddenName='${this.hiddenName}', spotName='${this.spotName}'`);
    if (game.settings.get(Stealthy.MODULE_ID, 'spotSecretDoors')) {
      Doors.setup();
    }
  }

  ready() {
  }

  getSettingsDefaults(version) {
    return {
      stealthToActor: true,
      perceptionToActor: true,
      allowedDetectionModes: {},
      friendlyStealth: 'inCombat',
      playerHud: false,
      exposure: false,
      spotSecretDoors: false,
      hiddenSource: 'ae',
      hiddenIcon: 'icons/magic/perception/shadow-stealth-eyes-purple.webp',
      spotSource: 'ae',
      spotIcon: 'icons/commodities/biological/eye-blue.webp',
      hiddenLabel: 'stealthy.hidden.name',
      spotLabel: 'stealthy.spot.name',
      logLevel: 'none',
      schema: version,
      activeSpot: true,
    }
  }

  mixInDefaults(settings) {
    let changed = false;
    for (const mode in CONFIG.Canvas.detectionModes) {
      if (!(mode in settings)) {
        settings[mode] = this.defaultDetectionModes.includes(mode);
        changed = true;
      }
    }
    return changed;
  }

  patchFoundry() {
    let allowedModes = game.settings.get(Stealthy.MODULE_ID, 'allowedDetectionModes');
    const changed = this.mixInDefaults(allowedModes);
    if (changed) {
      Hooks.once('ready', () => {
        Stealthy.log('Allowed modes settings update', allowedModes);
        game.settings.set(Stealthy.MODULE_ID, 'allowedDetectionModes', allowedModes);
      });
    }

    for (const mode in allowedModes) {
      if (!allowedModes[mode]) continue;
      if (!(mode in CONFIG.Canvas.detectionModes)) continue;

      Stealthy.log(`patching ${mode}`);
      libWrapper.register(
        Stealthy.MODULE_ID,
        `CONFIG.Canvas.detectionModes.${mode}._canDetect`,
        function (wrapped, visionSource, target) {
          if (!(wrapped(visionSource, target))) return false;
          const engine = stealthy.engine;
          if (target instanceof DoorControl)
            return engine.canSpotDoor(target, visionSource);
          const tgtToken = target?.document;
          if (tgtToken instanceof TokenDocument)
            return engine.checkDispositionAndCanDetect(visionSource, tgtToken, mode);
          return true;
        },
        libWrapper.MIXED,
        { perf_mode: libWrapper.PERF_FAST }
      );
    }
  }

  // deprecated
  isHidden(visionSource, tgtToken, detectionMode = undefined) {
    return false;
  }

  checkDispositionAndCanDetect(visionSource, tgtToken, detectionMode) {
    // Early out for buddies
    if (tgtToken?.disposition === visionSource.object.document?.disposition) {
      const friendlyStealth = game.settings.get(Stealthy.MODULE_ID, 'friendlyStealth');
      if (friendlyStealth === 'ignore' || !game.combat && friendlyStealth === 'inCombat') return true;
    }

    // Gotta have a stealth flag or we see you
    const stealthFlag = this.getStealthFlag(tgtToken);
    if (!stealthFlag) return true;

    // Otherwise, grab our flags/values and let the system decide
    const perceptionFlag = this.getPerceptionFlag(visionSource.object);
    return this.canDetect({
      visionSource,
      tgtToken,
      detectionMode,
      stealthFlag,
      stealthValue: this.getStealthValue(stealthFlag),
      perceptionFlag,
      perceptionValue: this.getPerceptionValue(perceptionFlag)
    });
  }

  canDetect({ stealthValue, perceptionValue }) {
    return perceptionValue > stealthValue;
  }

  async setValueInEffect(flag, skill, value, sourceEffect) {
    const token = flag.token;
    let effect = foundry.utils.duplicate(sourceEffect);
    if (!('stealthy' in effect.flags))
      effect.flags.stealthy = {};
    effect.flags.stealthy[skill] = value;
    const actor = token.actor;
    await actor.updateEmbeddedDocuments('ActiveEffect', [effect]);
  }

  async setValue(skill, flag, value) {
    Stealthy.log('setValue', { skill, flag, value });
    const token = flag.token;
    const sourceEffect = flag?.effect;

    // If there is an effect, stuff the flag in it
    if (sourceEffect) {
      await this.setValueInEffect(flag, skill, value, sourceEffect);
    }

    // Otherwise, if we are token based then we need to update the token value
    else if (!stealthy[`${skill}ToActor`]) {
      let update = { _id: token.id, };
      if (value === undefined) {
        update[`flags.stealthy.-=${skill}`] = true;
      } else {
        update[`flags.stealthy.${skill}`] = value;
      }
      await canvas.scene.updateEmbeddedDocuments("Token", [update]);
    }
  }

  async bankRollOnToken(tokenOrActor, skill, value) {
    Stealthy.log('bankRollOnToken', { tokenOrActor, skill, value });
    let token = tokenOrActor;
    if (token instanceof Actor) {
      token = canvas.tokens.controlled.find((t) => t.actor === tokenOrActor);
      if (!token) return;
    }
    let update = { _id: token.id, };
    update[`flags.stealthy.${skill}`] = value;
    await canvas.scene.updateEmbeddedDocuments("Token", [update]);
  }

  getStealthFlag(token) {
    let flags = undefined;
    const actor = token?.actor;
    const effect = this.findStealthEffect(actor);
    if (effect) {
      flags = effect?.flags?.stealthy;
    }
    else {
      const tokenDoc = token instanceof Token ? token.document : token;
      flags = tokenDoc.flags?.stealthy;
      if (!flags || !('stealth' in flags)) return undefined;
    }
    const stealth = flags?.stealth ?? flags?.hidden;
    return { stealth, effect, token };
  }

  getPerceptionFlag(token) {
    let flags = undefined;
    const actor = token?.actor;
    const effect = this.findPerceptionEffect(actor);
    if (effect) {
      flags = effect?.flags?.stealthy;
    }
    else {
      const tokenDoc = token instanceof Token ? token.document : token;
      flags = tokenDoc.flags?.stealthy;
      if (!flags || !('perception' in flags)) return undefined;
    }
    const perception = flags?.perception ?? flags?.spot;
    return { perception, effect, token };
  }

  getStealthValue(flag) {
    return flag?.stealth;
  }

  getPerceptionValue(flag) {
    return flag?.perception;
  }

  async setStealthValue(flag, value) {
    await this.setValue('stealth', flag, value);
    stealthy.socket.executeForEveryone('RefreshPerception');
  }

  async setPerceptionValue(flag, value) {
    await this.setValue('perception', flag, value);
    stealthy.refreshPerception();
  }

  async bankStealth(token, value) {
    if (stealthy.stealthToActor) {
      await this.updateOrCreateStealthEffect(token.actor, { stealth: value });
    } else {
      await this.bankRollOnToken(token, 'stealth', value);
    }
  }

  async bankPerception(token, value) {
    if (stealthy.perceptionToActor) {
      await this.updateOrCreatePerceptionEffect(token.actor, { perception: value });
    } else {
      await this.bankRollOnToken(token, 'perception', value);
    }
  }

  rollStealth() {
    stealthy.socket.executeForEveryone('RefreshPerception');
  }

  rollPerception() {
    stealthy.refreshPerception();
  }

  findStealthEffect(actor) {
    const beforeV11 = Math.floor(game.version) < 11;
    return actor?.effects.find((e) => !e.disabled && this.hiddenName === (beforeV11 ? e.label : e.name));
  }

  findPerceptionEffect(actor) {
    const beforeV11 = Math.floor(game.version) < 11;
    return actor?.effects.find((e) => !e.disabled && this.spotName === (beforeV11 ? e.label : e.name));
  }

  makeStealthEffectMaker(name) {
    return (flag, source) => {
      let effect = {
        icon: game.settings.get(Stealthy.MODULE_ID, 'hiddenIcon'),
        description: game.i18n.localize("stealthy.hidden.description"),
        flags: {
          stealthy: flag,
        },
        statuses: [name.toLowerCase()],
        changes: [],
      };
      effect[(Math.floor(game.version) < 11) ? 'label' : 'name'] = name;

      if (source === 'ae') {
        if (typeof ATLUpdate !== 'undefined') {
          effect.changes.push({
            key: 'ATL.alpha',
            mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
            value: '0.75'
          });
        }
      }
      return effect;
    };
  }

  makePerceptionEffectMaker(name) {
    return (flag, source) => {
      let effect = {
        icon: game.settings.get(Stealthy.MODULE_ID, 'spotIcon'),
        description: game.i18n.localize("stealthy.spot.description"),
        flags: {
          stealthy: flag,
        },
        statuses: ['spot'],
      };
      effect[(Math.floor(game.version) < 11) ? 'label' : 'name'] = name;

      return effect;
    };
  }

  async updateOrCreateEffect({ name, actor, flag, source, makeEffect }) {
    const beforeV11 = Math.floor(game.version) < 11;
    let effect = actor.effects.find((e) => name === (beforeV11 ? e.label : e.name));

    if (!effect) {
      switch (source) {
        case 'ce': {
          if (game.dfreds?.effectInterface?.findEffectByName(name)) {
            await game.dfreds.effectInterface.addEffect({ effectName: name, uuid: actor.uuid });
            effect = actor.effects.find((e) => name === (beforeV11 ? e.label : e.name));
          }
          if (!effect && !this.warnedMissingCE) {
            this.warnedMissingCE = true;
            if (game.user.isGM)
              ui.notifications.warn(
                `${game.i18n.localize('stealthy.source.ce.beforeLabel')} '${name}' ${game.i18n.localize('stealthy.source.ce.afterLabel')}`);
            console.error(`stealthy | Convenient Effects couldn't find the '${name}' effect so Stealthy will use the default one. Add your customized effect to CE or select a different effect source in Game Settings`);
          }
          break;
        }

        case 'clt': {
          if (game.clt?.getCondition(name)) {
            await game.clt.applyCondition(name, actor);
            effect = actor.effects.find(e => name === (beforeV11 ? e.label : e.name));
          }
          if (!effect && !this.warnedMissingCLT) {
            this.warnedMissingCLT = true;
            if (game.user.isGM)
              ui.notifications.warn(
                `${game.i18n.localize('stealthy.source.clt.beforeLabel')} '${name}' ${game.i18n.localize('stealthy.source.clt.afterLabel')}`);
            console.error(`stealthy | Condition Lab & Triggler couldn't find the '${name}' effect so Stealthy will use the default one. Add your customized effect to CLT or select a different effect source in Game Settings`);
          }
          break;
        }
      }

      // If we haven't found an ouside source, create the default one
      if (!effect) {
        effect = makeEffect(flag, source);
        await actor.createEmbeddedDocuments('ActiveEffect', [effect]);
        return;
      }
    }

    effect = foundry.utils.duplicate(effect);
    effect.flags.stealthy = flag;
    effect.disabled = false;
    await actor.updateEmbeddedDocuments('ActiveEffect', [effect]);
  }

  async updateOrCreateStealthEffect(actor, flag) {
    await this.updateOrCreateEffect({
      name: this.hiddenName,
      actor,
      flag,
      source: game.settings.get(Stealthy.MODULE_ID, 'hiddenSource'),
      makeEffect: this.makeStealthEffectMaker(this.hiddenName)
    });
    stealthy.socket.executeForEveryone('RefreshPerception');
  }

  async updateOrCreatePerceptionEffect(actor, flag) {
    await this.updateOrCreateEffect({
      name: this.spotName,
      actor,
      flag,
      source: game.settings.get(Stealthy.MODULE_ID, 'spotSource'),
      makeEffect: this.makePerceptionEffectMaker(this.spotName)
    });
    stealthy.refreshPerception();
  }

  getLightExposure(token) {
    token = token instanceof Token ? token : token.object;

    const scene = token.scene;
    if (scene !== canvas.scene || !scene.tokenVision) return undefined;

    let exposure = 'dark';
    const center = token.center;

    for (const light of canvas.effects.lightSources) {
      if (!light.active) continue;

      const bright = light.data.bright;
      const dim = light.data.dim;

      if (light.object === token) {
        if (bright) return 'bright';
        if (dim) exposure = 'dim';
        continue;
      }

      if (!light.shape.contains(center.x, center.y)) continue;

      if (light.ratio === 1) return 'bright';
      if (light.ratio === 0) {
        exposure = 'dim';
        continue;
      }

      const distance = new Ray(light, center).distance;
      if (distance <= bright) return 'bright';
      exposure = 'dim';
    }

    return exposure;
  }

  canSpotDoor(doorControl, visionSource) {
    // Open doors are visible
    const door = doorControl.wall.document;
    if (door.ds == 1) return true;

    // Unhidden doors are visible
    const stealthyFlags = door.flags?.stealthy;
    if (!stealthyFlags) return true;

    // Hidden doors can only be spotted if they are in range
    const maxRange = stealthyFlags?.maxRange ?? Infinity;
    const beforeV12 = Math.floor(game.version) < 12;
    const distance = (beforeV12)
      ? canvas.grid.measureDistance(visionSource.object.center, doorControl.center)
      : canvas.grid.measurePath([visionSource.object.center, doorControl.center]).distance;

    if (distance > maxRange) return false;

    // Now just compare the perception and the door's stealth
    const stealthValue = stealthyFlags.stealth;
    const perceptionFlag = this.getPerceptionFlag(visionSource.object.document);
    const perceptionValue = this.getPerceptionValue(perceptionFlag);
    return perceptionValue >= stealthValue;
  }
}

