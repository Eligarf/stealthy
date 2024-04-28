[![License](https://img.shields.io/github/license/eligarf/stealthy?label=License)](LICENSE)
[![Latest Version](https://img.shields.io/github/v/release/eligarf/stealthy?display_name=tag&sort=semver&label=Latest%20Version)](https://github.com/eligarf/stealthy/releases/latest)
![Foundry Version](https://img.shields.io/endpoint?url=https://foundryshields.com/version?url=https%3A%2F%2Fraw.githubusercontent.com%2Feligarf%2Fstealthy%2Fdev%2Fmodule.json)

![Latest Downloads](https://img.shields.io/github/downloads/eligarf/stealthy/latest/total?color=blue&label=latest%20downloads)
![Forge Installs](https://img.shields.io/badge/dynamic/json?label=Forge%20Installs&query=package.installs&suffix=%25&url=https%3A%2F%2Fforge-vtt.com%2Fapi%2Fbazaar%2Fpackage%2Fstealthy&colorB=4aa94a)

# Stealthy

A module that adds perception vs stealth testing to Foundry's visibility tests. It filters out any objects with the Hidden condition if the viewing Perception value fails to beat the object's Stealth value.

[Stealthy Wiki](https://github.com/Eligarf/stealthy/wiki)
---
# Features

## Stealth and Perception rolls are banked
The last stealth and perception rolls for each token or actor is recorded (banked) and used to control token visibility on the canvas. The roll results are displayed in the token HUD for GMs to see as token buttons with an input box on the bottom: perception is on the left, stealth is on the right. Changing the values in these input boxes will alter the stored results for any future visibility tests while that roll remains active.

Perception banking has an overall token control *Bank perception rolls* which the GM uses to control when perception check banking is enabled. Toggling it off will also clear out all banked perception rolls for the current scene.

![override](https://user-images.githubusercontent.com/16523503/213258088-73098735-321f-4542-9c8a-433be26cd014.gif)
![control](https://github.com/Eligarf/avoid-notice/assets/16523503/38d512f0-27dc-4eda-9e59-4a14078ba3f4)

## Rolls banked in token or actor 

A game setting individually controls whether stealth or perception roll results are banked in the actor or token.

### Token
* Default for perception
* Banked rolls are deleted by deleting the value in the token button
* No icons are added to the token for a cleaner look

### Actor
* Default for stealth
* Banked rolls are actually stored in an effect or item on the actor.
* Banked rolls are deleted by deleting the effect they are banked in.
* Rolling a stealth skill check will apply the *Hidden* effect to the actor and bank the result there for later comparisons, replacing an existing banking if the *Hidden* effect is already present. Stealthy's default *Hidden* effect can be overriden by adding a custom Hidden effect in *Convenient Effects*. ***See [Handling Hidden removal](#handling-hidden-removal)***
* Rolling a perception check will add a *Spot* effect to the actor to bank the roll. The default *Spot* effect can be overriden as well.

![stealth-roll](https://user-images.githubusercontent.com/16523503/209989026-e0d2dad2-8dc1-459c-8824-a2332ce8a9cd.gif)
![perception](https://user-images.githubusercontent.com/16523503/213257350-e382f584-1c5c-41a8-bf00-60705ec89bd0.gif)

## Invisible characters can hide from *See Invisibility*
An invisible token with a banked stealth roll will check vs perception before showing up in the *See Invisibility* vision mode.

![invisible](https://user-images.githubusercontent.com/16523503/210176827-03fda57a-6d09-4144-8253-b8b7cd9155ac.gif)

## Friendly tokens can still be viewed
The GM has options for allowing stealthy tokens to be seen by other tokens of the same disposition.

## Automatic Hidden Door detection
Doors can have a detection range that will hide the door control until the viewing token is within the given range. Doors can also have an optional stealth value; tokens with a sufficiently high perception effect will be able to see a hidden door if it beats that door's stealth. 

**THIS DOES NOT APPLY TO FOUNDRY'S SECRET DOORS!!!** I tried and failed to to get the secret doors to play nice - it turns out to be way easier to conditionally hide a regular door from players than to conditionally show a secret door to them.

![secret-doors](https://user-images.githubusercontent.com/16523503/212574216-6cc5b0ad-f432-441e-b11a-f4aa2b15cbd1.gif)
![hidden-door](https://user-images.githubusercontent.com/16523503/217671740-41aa7832-d495-49da-a149-948ebb6ccb2a.PNG)

# End Turn keybinding
It doesn't really belong in this module but I want to be able to press the *End* key to end my turn, and so I added an editable keybinding that will allow owners of the current combatant to do so.

# Systems
Stealthy supports the following systems (specific notes about a given system are in the [Wiki](https://github.com/Eligarf/stealthy/wiki)):
- [dnd5e](https://github.com/Eligarf/stealthy/wiki/D&D-5e)
- dnd4e
- [pf1](https://github.com/Eligarf/stealthy/wiki/Pathfinder-1e)

I've abandoned trying to get this to work on PF2e. Instead, I use *PF2e Perception* and built a new module to help with the stealth-as-initiative vs perception checks: [PF2e Avoid Notice](https://foundryvtt.com/packages/pf2e-avoid-notice) 

# Limitations

## Handling Hidden removal
Stealthy will not automatically remove a banked stealth roll - the dnd5e [Skulker](https://www.dndbeyond.com/feats/skulker) feat demonstrates why removing Hidden gets complicated without heavier automation support provided by modules like the excellent [Midi-QOL](https://foundryvtt.com/packages/midi-qol) which handles this for my games. I suggest [Visual Active Effects](https://foundryvtt.com/packages/visual-active-effects) as an easier way to manually remove it, especially for low automation level games. 

# Required modules
* [lib-wrapper](https://foundryvtt.com/packages/lib-wrapper)
* [socketlib](https://github.com/manuelVo/foundryvtt-socketlib)
## Optional modules
* [Active Token Effects](https://foundryvtt.com/packages/ATL)
* [DFreds Convenient Effects](https://foundryvtt.com/packages/dfreds-convenient-effects)
* [Vision5e](https://foundryvtt.com/packages/vision-5e)
* [Visual Active Effects](https://foundryvtt.com/packages/visual-active-effects)
