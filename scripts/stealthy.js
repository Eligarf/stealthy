export class Stealthy {

  static moduleName = 'stealthy';
  static ignoreFriendlyStealth = 'ignoreFriendlyStealth';
  static ignoreFriendlyGloomstalker = 'ignoreFriendlyGloomstalker';
  static spotVsHidden = 'spotVsHidden';

  static testVisionStealth(visionSource, config) {
    const target = config.object?.actor;
    const ignoreFriendlyStealth =
      game.settings.get(Stealthy.moduleName, Stealthy.ignoreFriendlyStealth) &&
      config.object.document?.disposition === visionSource.object.document?.disposition;

    if (!ignoreFriendlyStealth && game.settings.get(Stealthy.moduleName, Stealthy.spotVsHidden)) {
      const hidden = target?.effects.find(e => e.label === 'Hidden');
      if (hidden) {
        let stealth = hidden.flags.stealthy?.hidden ?? target.system.skills.ste.passive;
        const source = visionSource.object?.actor;
        const spot = source?.effects.find(e => e.label === 'Spot');

        // active perception loses ties, passive perception wins ties to simulate the
        // idea that active skills need to win outright to change the status quo. Passive
        // perception means that stealth is being the active skill.
        let perception = spot?.flags.stealthy?.spot ?? (source.system.skills.prc.passive + 1);
        if (perception <= stealth) {
          return false;
        }
      }
    }

    return true;
  }
}

Hooks.once('setup', () => {
  libWrapper.register(
    Stealthy.moduleName,
    "DetectionModeBasicSight.prototype.testVisibility",
    (wrapped, visionSource, mode, config = {}) => {
      if (!Stealthy.testVisionStealth(visionSource, config)) return false;

      const target = config.object?.actor;
      let noDarkvision = false;
      const ignoreFriendlyGloomstalker =
        game.settings.get(Stealthy.moduleName, Stealthy.ignoreFriendlyGloomstalker) &&
        config.object.document?.disposition === visionSource.object.document?.disposition;
      if (!ignoreFriendlyGloomstalker && visionSource.visionMode?.id === 'darkvision') {
        const gloomstalker = target?.itemTypes?.subclass?.find(c => c.name === 'Gloom Stalker');
        if (gloomstalker) noDarkvision = true;
      }

      if (noDarkvision) {
        let ourMode = duplicate(mode);
        ourMode.id = 'basicSight';
        ourMode.range = 0;
        return wrapped(visionSource, ourMode, config);
      }

      return wrapped(visionSource, mode, config);
    },
    libWrapper.WRAPPER,
    { perf_mode: libWrapper.PERF_FAST }
  );

  libWrapper.register(
    Stealthy.moduleName,
    "DetectionModeInvisibility.prototype.testVisibility",
    (wrapped, visionSource, mode, config = {}) => {
      if (!Stealthy.testVisionStealth(visionSource, config)) return false;
      return wrapped(visionSource, mode, config);
    },
    libWrapper.WRAPPER,
    { perf_mode: libWrapper.PERF_FAST }
  );
});

Hooks.on('dnd5e.rollSkill', async (actor, roll, skill) => {
  if (!game.settings.get(Stealthy.moduleName, Stealthy.spotVsHidden)) return;

  if (skill === 'ste') {
    let hidden = actor.effects.find(e => e.label === 'Hidden');
    if (!hidden) {
      await game.dfreds.effectInterface.addEffect({ effectName: 'Hidden', uuid: actor.uuid });
      hidden = actor.effects.find(e => e.label === 'Hidden');
    }
    let activeHide = duplicate(hidden);
    activeHide.flags['stealthy.hidden'] = roll.total;
    await actor.updateEmbeddedDocuments('ActiveEffect', [activeHide]);
  }
  else if (skill === 'prc') {
    let spot = actor.effects.find(e => e.label === 'Spot');
    if (!spot) {
      const newEffect = [{
        label: 'Spot',
        icon: 'icons/magic/perception/eye-ringed-green.webp',
        duration: { turns: 1 },
      }];
      await actor.createEmbeddedDocuments('ActiveEffect', newEffect);
      spot = actor.effects.find(e => e.label === 'Spot');
    }
    let activeSpot = duplicate(spot);
    activeSpot.flags['stealthy.spot'] = Math.max(roll.total, actor.system.skills.prc.passive);
    await actor.updateEmbeddedDocuments('ActiveEffect', [activeSpot]);
  }
});

Hooks.on("renderTokenHUD", (tokenHUD, html, app) => {
  if (game.user.isGM == true) {
    const token = tokenHUD.object;
    const actor = token?.actor;
    const hidden = actor?.effects.find(e => e.label === 'Hidden');
    if (hidden) {
      const stealth = hidden.flags.stealthy?.hidden ?? actor.system.skills.ste.passive;
      const divToAdd = $(
        `<input id="stealth_inp_box" title="Current Stealth Score" type="text" name="stealth_score_inp_box" value="${stealth}"></input>`
      );
      html.find(".right").append(divToAdd);
      divToAdd.change(async (inputbox) => {
        if (token === undefined) return;
        let activeHide = duplicate(hidden);
        activeHide.flags['stealthy.hidden'] = inputbox.target.value;
        await actor.updateEmbeddedDocuments('ActiveEffect', [activeHide]);
      });
    }
  }
});
