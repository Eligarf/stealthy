[![License](https://img.shields.io/github/license/eligarf/stealthy?label=License)](LICENSE)
[![Latest Version](https://img.shields.io/github/v/release/eligarf/stealthy?display_name=tag&sort=semver&label=Latest%20Version)](https://github.com/eligarf/stealthy/releases/latest)
![Foundry Version](https://img.shields.io/endpoint?url=https://foundryshields.com/version?url=https%3A%2F%2Fraw.githubusercontent.com%2Feligarf%2Fstealthy%2Fdev%2Fmodule.json)

![Latest Downloads](https://img.shields.io/github/downloads/eligarf/stealthy/latest/total?color=blue&label=latest%20downloads)
![Total Downloads](https://img.shields.io/github/downloads/eligarf/stealthy/total?color=blue&label=total%20downloads)
# Stealthy

A module for [FoundryVTT](https://foundryvtt.com) that adds perception vs stealth testing to Foundry's visibility tests. It filters out any objects with the Hidden condition if the viewing Perception value fails to beat the object's Stealth value.

## [Stealthy Wiki](https://github.com/Eligarf/stealthy/wiki)
---
# Features

## Rolling Stealth checks applies the Hidden effect
Rolling a Stealth skill check will apply the Hidden effect to the actor and record the result of the check in that effect for later comparisons, replacing the stored result if the Hidden effect is already present. Stealthy's default Hidden effect can be overriden by adding a custom Hidden effect in either Convenient Effects or CUB.

***See [Handling Hidden removal](#handling-hidden-removal)***

![stealth-roll](https://user-images.githubusercontent.com/16523503/209989026-e0d2dad2-8dc1-459c-8824-a2332ce8a9cd.gif)

## Rolling Perception checks applies the Spot effect
Rolling a Perception check will add a Spot effect to the actor which records the result of that perception check (the passive value for Perception is used if this effect isn't present on the actor).

A toggle named 'Active Spot' is available under token controls to suspend adding of the Spot condition as the GM sees fit. Toggling it off will also clear out all Spot effects.

![perception](https://user-images.githubusercontent.com/16523503/213257350-e382f584-1c5c-41a8-bf00-60705ec89bd0.gif)
![control](https://user-images.githubusercontent.com/16523503/210176825-3fcb3183-81db-4f64-836a-81f29199b580.png)

## GM Overrides
Once the Hidden or Spot effects are applied, GMs will see token buttons with an input box on the bottom which shows the rolled values, or the passive values if the effect was added directly without rolling. Perception is on the left, Stealth is on the right. Changing the value in this input box will alter the stored results for future visibility tests while that effect remains.

![override](https://user-images.githubusercontent.com/16523503/213258088-73098735-321f-4542-9c8a-433be26cd014.gif)

## Invisible characters can hide from See Invisibility
An invisible actor that also has the 'Hidden' effect will check Perception vs Stealth before showing up in the 'See Invisibility' vision mode.

![invisible](https://user-images.githubusercontent.com/16523503/210176827-03fda57a-6d09-4144-8253-b8b7cd9155ac.gif)

## Friendly tokens can still be viewed
The GM has the option for allowing Hidden tokens to be seen by other tokens of the same disposition.

## Automatic Hidden Door detection
Doors can now have an optional stealth value; tokens with a sufficiently high perception effect will be able to see a hidden door if it beats that door's stealth. Doors can also have a detection range (hidden or not) that will hide the door control until the viewing token is within the given range.

**THIS DOES NOT APPLY TO FOUNDRY'S SECRET DOORS!!!** Counter-intuitive? Yes, but I tried and failed to to get the secret doors to play nice - turns out to be way easier to hide a door than to show a secret door.


![secret-doors](https://user-images.githubusercontent.com/16523503/212574216-6cc5b0ad-f432-441e-b11a-f4aa2b15cbd1.gif)
![doorcontrol](https://user-images.githubusercontent.com/16523503/212717654-444ef8b3-3770-43b2-a324-b15769f1404f.PNG)

# Systems
Stealthy currently works in the following systems (specific notes about a given system are in the [Wiki](https://github.com/Eligarf/stealthy/wiki)):
- dnd4e
- dnd5e
- pf1

# Limitations

## Handling Hidden removal
Stealthy will not automatically remove the Hidden effect - the dnd5e [Skulker](https://www.dndbeyond.com/feats/skulker) feat demonstrates why removing Hidden gets complicated without heavier automation support provided by modules like the excellent [Midi-QOL](https://foundryvtt.com/packages/midi-qol) which handles this for my games. I suggest [DFreds Effects Panel](https://foundryvtt.com/packages/dfreds-effects-panel) as an easier way to manually remove it, especially for low automation level games. 

# Required modules
* [lib-wrapper](https://foundryvtt.com/packages/lib-wrapper)
* [socketlib](https://github.com/manuelVo/foundryvtt-socketlib)
## Optional modules
* [DFreds Convenient Effects](https://foundryvtt.com/packages/dfreds-convenient-effects)
* [Combat Utility Belt](https://foundryvtt.com/packages/combat-utility-belt)
* [Active Token Effects](https://foundryvtt.com/packages/ATL)
* [Token Light Condition](https://foundryvtt.com/packages/tokenlightcondition)
