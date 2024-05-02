import { Stealthy } from "./stealthy.js";

export default class Doors {

  static initialize() {
    libWrapper.register(
      Stealthy.MODULE_ID,
      "WallConfig.prototype._updateObject",
      async function (wrapped, event, formData) {
        const v10 = Math.floor(game.version) < 11;
        let result = await wrapped(event, formData);
        Stealthy.log('WallConfig.prototype._updateObject', { me: this, event, formData, result });
        if (v10) {
          if (result) result = Doors.UpdateHiddenDoor(this, formData);
        } else {
          result = Doors.UpdateHiddenDoor(this, formData);
        }
        return result;
      },
      libWrapper.WRAPPER
    );

    // Inject custom settings into the wall config diallog
    Hooks.on("renderWallConfig", Doors.RenderHiddenDoor);
  }

  static async UpdateHiddenDoor(wallConfig, formData) {
    let update = false;
    let updateData = { flags: { stealthy: {} } };
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
      const v10 = Math.floor(game.version) < 11;
      if (v10) {
        const hiddenDoorBlock = `
          <fieldset>
            <legend><i class="fa-solid fa-piggy-bank"></i> Stealthy</legend>
            <div class="form-group">
              <label for="stealth">${game.i18n.localize("stealthy.door.stealth")}</label>
              <input type="number" name="stealth" value="${css.object.flags.stealthy?.stealth ?? ''}">
            </div>
            <div class="form-group">
              <label for="maxRange">${game.i18n.localize("stealthy.door.maxRange")}</label>
              <input type="number" name="maxRange" value="${css.object.flags.stealthy?.maxRange ?? ''}">
            </div>
          </fieldset>`;
        html.find(".form-group").last().after(hiddenDoorBlock);
      } else {
        html.find(`.door-options`).after(`
          <fieldset>
            <legend><i class="fa-solid fa-piggy-bank"></i> Stealthy</legend>
            <div class="form-group">
              <label>${game.i18n.localize("stealthy.door.stealth")}</label>
              <input type="number" name="stealth" value="${css.data.flags?.stealthy?.stealth ?? ''}">
            </div>
            <div class="form-group">
              <label">${game.i18n.localize("stealthy.door.maxRange")}</label>
              <input type="number" name="maxRange" value="${css.data.flags?.stealthy?.maxRange ?? ''}">
            </div>
          </fieldset>`
        );
      }

      // Force config window to resize
      wallConfig.setPosition({ height: "auto" });
    }
  }

}