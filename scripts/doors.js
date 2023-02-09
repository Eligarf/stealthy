import { Stealthy } from "./stealthy.js";

export default class Doors {

  static initialize() {
    libWrapper.register(
      Stealthy.MODULE_ID,
      'DoorControl.prototype.isVisible',
      function (wrapped) {
        if (!wrapped()) return false;
        return Doors.CanDisplayDoorControl(this);
      },
      libWrapper.MIXED
    );

    libWrapper.register(
      Stealthy.MODULE_ID,
      "WallConfig.prototype._updateObject",
      async function (wrapped, event, formData) {
        let result = await wrapped(event, formData);
        if (result) result = Doors.UpdateHiddenDoor(this, formData);
        return result;
      },
      libWrapper.WRAPPER
    );

    // Inject custom settings into the wall config diallog
    Hooks.on("renderWallConfig", Doors.RenderHiddenDoor);
  }

  static CanDisplayDoorControl(doorControl) {
    const wallDoc = doorControl.wall.document;
    if (wallDoc.door === CONST.WALL_DOOR_TYPES.DOOR) {
      let tokens = canvas.tokens.controlled;
      if (tokens.length === 1) {
        const token = tokens[0];
        const maxRange = doorControl.wall.document.flags.stealthy?.maxRange ?? Infinity;
        const ray = new Ray(doorControl.center, token.center);
        const distance = canvas.grid.measureDistances([{ ray }])[0];
        if (distance > maxRange) return false;

        // If the door doesn't have a stealthy flag, everybody sees it
        const stealth = wallDoc.flags.stealthy?.stealth;
        if (stealth === undefined || stealth === null) return true;
        const engine = stealthy.engine;
        return engine.canSpotDoor(doorControl, token);
      }
    }
    return true;
  }

  static async UpdateHiddenDoor(wallConfig, formData) {
    let update = false;
    const updateData = { flags: { stealthy: {} } };
    if (formData.stealth !== undefined) {
      updateData.flags.stealthy.stealth = formData.stealth;
      update = true;
    }
    if (formData.maxRange !== undefined) {
      updateData.flags.stealthy.maxRange = formData.maxRange;
      update = true;
    }
    if (!update) return true;

    // Update all the edited walls
    let ids = wallConfig.editTargets;
    if (ids.length == 0) {
      ids = [wallConfig.object.id];
    }
    const updateDataset = ids.map(id => { return { _id: id, ...updateData }; });
    return await canvas.scene.updateEmbeddedDocuments("Wall", updateDataset);
  }

  static RenderHiddenDoor(wallConfig, html, css) {
    Stealthy.log('RenderHiddenDoor', { wallConfig, html, css });
    if (css.document.door == 1) {
      const hiddenDoorBlock = `
      <fieldset>
        <legend>Stealthy</legend>
        <div class="form-group">
          <label for="stealth">${game.i18n.localize("stealthy.door.stealth")}</label>
          <input type="number" name="stealth"/ value="${css.object.flags.stealthy?.stealth}">
        </div>
        <div class="form-group">
          <label for="maxRange">${game.i18n.localize("stealthy.door.maxRange")}</label>
          <input type="number" name="maxRange"/ value="${css.object.flags.stealthy?.maxRange}">
        </div>
      </fieldset>`;
      html.find(".form-group").last().after(hiddenDoorBlock);

      // Force config window to resize
      wallConfig.setPosition({ height: "auto" });
    }
  }

}