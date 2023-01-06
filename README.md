[![License](https://img.shields.io/github/license/eligarf/stealthy?label=License)](LICENSE)
[![Latest Version](https://img.shields.io/github/v/release/eligarf/stealthy?display_name=tag&sort=semver&label=Latest%20Version)](https://github.com/eligarf/stealthy/releases/latest)
![Foundry Version](https://img.shields.io/endpoint?url=https://foundryshields.com/version?url=https%3A%2F%2Fraw.githubusercontent.com%2Feligarf%2Fstealthy%2Fdev%2Fmodule.json)

![Latest Downloads](https://img.shields.io/github/downloads/eligarf/stealthy/latest/total?color=blue&label=latest%20downloads)
![Total Downloads](https://img.shields.io/github/downloads/eligarf/stealthy/total?color=blue&label=total%20downloads)
# Stealthy

A module for [FoundryVTT](https://foundryvtt.com) that adds perception vs stealth testing to Foundry's visibility tests. It filters out any objects with the Hidden condition if the viewing Perception value fails to beat the object's Stealth value.

## Features

## **Rolling Stealth checks applies the Hidden effect**
Rolling a Stealth skill check will apply the Hidden effect to the actor and record the result of the check in that effect for later comparisons, replacing the stored result if the Hidden effect is already present. Stealthy's default Hidden effect can be overriden by adding a custom Hidden effect in either Convenient Effects or CUB.

***See [Handling Hidden removal](#handling-hidden-removal)***

![stealth-roll](https://user-images.githubusercontent.com/16523503/209989026-e0d2dad2-8dc1-459c-8824-a2332ce8a9cd.gif)

## **Rolling Perception checks applies the Spot effect**
Rolling a Perception check will add a Spot effect to the actor which records the result of that perception check (the passive value for Perception is used if this effect isn't present on the actor).

A toggle named 'Active Spot' is available under token controls to suspend adding of the Spot condition as the GM sees fit. Toggling it off will also clear out all Spot effects.

![perception](https://user-images.githubusercontent.com/16523503/209989470-aac2bdb4-fee4-44c0-a6b7-916e69353081.gif)
![control](https://user-images.githubusercontent.com/16523503/210176825-3fcb3183-81db-4f64-836a-81f29199b580.png)

## **GM Overrides**
Once the Hidden or Spot effects are applied, GMs will see token buttons with an input box on the bottom which shows the rolled values, or the passive values if the effect was added directly without rolling. Perception is on the left, Stealth is on the right. Changing the value in this input box will alter the stored results for future visibility tests while that effect remains.

![stealth-override](https://user-images.githubusercontent.com/16523503/209896031-675ab0e3-93e6-4d9c-8eeb-c11abe39fdab.gif)

## **Invisible characters can hide from See Invisibility**
An invisible actor that also has the 'Hidden' effect will check Perception vs Stealth before showing up in the 'See Invisibility' vision mode.

![invisible](https://user-images.githubusercontent.com/16523503/210176827-03fda57a-6d09-4144-8253-b8b7cd9155ac.gif)

## **Friendly tokens can still be viewed**
The GM has the option for allowing Hidden tokens to be seen by other tokens of the same disposition.

# Systems
Stealthy currently works in the following systems (specific notes about a given system are below):
- dnd4e
- dnd5e
- pf1

## dnd5e
### *Umbral Sight affects darkvision
Characters with Umbral Sight will no longer be visible to the Darkvision mode, but they can still be seen if Basic Vision can see them. The GM has the option to disable this for friendly token visibility tests.

![umbral-sight](https://user-images.githubusercontent.com/16523503/209987083-487aee33-b75e-452f-9433-7302ffdaeab3.gif)

### Spot details
- Stealthy's default Spot effect has a one turn/six second duration. This isn't from RAW, but is an approximation I've chosen that seems to work well in my games.
- The initial stored Perception value from the roll uses passive Perception as a floor.

### Stealth vs Perception Ties
D&D 5E treats skill contest ties as preserving the status quo, so use of passive value for either skill makes a claim of owning the status quo and thus winning ties. If Perception and Stealth are both passive, I assume Stealth takes the active role of wanting to change the status quo from visible to hidden. An active Perception check is only necessary if the passive Perception was beaten by Stealth, so in this case Hidden is now the status quo condition and Stealth wins ties with the active result. More simply, **ties are won by passive Perception and lost by active Perception.**

### Experimental - Lighting effects on Perception vs Hidden token
For this approach we are only looking at dnd5e and we've broken this down into three pieces:
- Detecting the light level on the token itself, which is independant of viewer. Stealthy looks for 'Dim' or 'Dark' status effects on the token and does no light calculations itself; [Token Light Condition](https://foundryvtt.com/packages/tokenlightcondition) was written as a separate module to handle this.
- Remapping the dim/dark light level per viewer based on their viewing mode. At least 3 different mapping tables are needed:
  - Foundry Darkvision: Dark -> Dim; Dim -> Bright **(Current Implementation)**
  - RAW 5E Darkvision: Dark -> Dim
  - Demonsight: Dark -> Bright

  After the light level is remapped, objects in 'Dark' get rejected and objects in 'Dim' would be tested against using disadvantaged perception.
- Capturing the advantage/disadvantage state of the viewers perception in order to do the right thing when applying disadvantage in dim vision. We get these flags on the active rolls, and can generate an extra roll result we can store in our flag so that we have a result for disadvantage should we need it. **We don't have a cost-effective way to figure out pre-existing passive disadvantage on perception, so this edge case will cause those tokens to end up taking the -5 penalty twice. You have been warned.**

## pf1
  - I assume take-10 perception for tokens without an active spot effect. It isn't RAW, but perhaps this is acceptable to the PF1 community.
  - The Spot and Hidden effects aren't "Buff"-style effects, so the PF1 actor sheet UI doesn't have a way to delete the effects once they've been added by rolling. You could use [DFreds Effects Panel](https://foundryvtt.com/packages/dfreds-effects-panel), or I made this macro (I assume there is a smarter way)

'Remove Hidden' Script Macro:
```
const controlled = canvas.tokens.controlled;
const label = game.i18n.localize('stealthy.hidden.label');
controlled.forEach(token => {
  const actor = token.actor;
  const effects = actor.effects.filter(e => e.label === label).map(e => e.id);
  if (effects.length > 0) {
    actor.deleteEmbeddedDocuments('ActiveEffect', effects);
  }
});
```
*Remove Spot is the same with a 'stealthy.spot.label' substitution*

## pf2e
In progress. There are complications getting Stealthy to work in PF2e given the level of customization within that system.

# Limitations

## Handling Hidden removal
Stealthy will not automatically remove the Hidden effect - the dnd5e [Skulker](https://www.dndbeyond.com/feats/skulker) feat demonstrates why removing Hidden gets complicated without heavier automation support provided by modules like the excellent [Midi-QOL](https://foundryvtt.com/packages/midi-qol) which handles this for my games. I suggest [DFreds Effects Panel](https://foundryvtt.com/packages/dfreds-effects-panel) as an easier way to manually remove it, especially for low automation level games. 

## Visibility changes are only reflected on token updates
The visibility results are cached, so changes in visibility brought about by making skill checks, adjusting the result values manually, or removing the Spot/Hidden effects don't immediately change the visible state. This means sometimes you have force a token update by moving the token or selecting a different token. 

# Required modules
* [lib-wrapper](https://foundryvtt.com/packages/lib-wrapper)
* [socketlib](https://github.com/manuelVo/foundryvtt-socketlib)
## Optional modules
* [DFreds Convenient Effects](https://foundryvtt.com/packages/dfreds-convenient-effects)
* [Combat Utility Belt](https://foundryvtt.com/packages/combat-utility-belt)
* [Token Magic FX](https://foundryvtt.com/packages/tokenmagic)
* [Active Token Effects](https://foundryvtt.com/packages/ATL)
