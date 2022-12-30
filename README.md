[![License](https://img.shields.io/github/license/eligarf/stealthy?label=License)](LICENSE)
[![Latest Version](https://img.shields.io/github/v/release/eligarf/stealthy?display_name=tag&sort=semver&label=Latest%20Version)](https://github.com/eligarf/stealthy/releases/latest)
![Foundry Version](https://img.shields.io/endpoint?url=https://foundryshields.com/version?url=https%3A%2F%2Fraw.githubusercontent.com%2Feligarf%2Fstealthy%2Fdev%2Fmodule.json)

# Stealthy

A module for [FoundryVTT](https://foundryvtt.com) that adds perception vs stealth testing to Foundry's visibility tests.

## Purpose

During visibility tests, Stealthy filters out any objects with the Hidden condition if the viewing Perception value fails to beat the object's Stealth value.

## Features

### **Rolling Stealth checks applies the Hidden condition**
Rolling a Stealth skill check will apply the Hidden condition to the actor and record the result of the check in that condition for later comparisons, replacing the stored result if the Hidden condition is already present. Stealthy's default Hidden effect can be overriden by adding a custom Hidden effect in either Convenient Effects or CUB.

![stealth-roll](https://user-images.githubusercontent.com/16523503/209989026-e0d2dad2-8dc1-459c-8824-a2332ce8a9cd.gif)

### **Rolling Perception checks applies the Spot condition**
Rolling a Perception check will add a 'Spot' condition to the actor which records the result of that perception check (the passive value for Perception is used if this condition isn't present on the actor).

The stored Perception value uses passive Perception as a floor to the Active roll result.

![perception](https://user-images.githubusercontent.com/16523503/209989470-aac2bdb4-fee4-44c0-a6b7-916e69353081.gif)

### **GM Stealth Override**
Once the 'Hidden' condition is applied, GMs will see a token button with an input box on the bottom right which will shows the rolled Stealth result, or show the passive Stealth value if the Hidden condition was added directly without rolling. Changing the value in this input box will alter the stored Stealth result for any future visibility tests.

![stealth-override](https://user-images.githubusercontent.com/16523503/209896031-675ab0e3-93e6-4d9c-8eeb-c11abe39fdab.gif)

### **Umbral Sight affects darkvision**
Characters with Umbral Sight will no longer be visible to the Darkvision mode, but they can still be seen if Basic Vision can see them. The GM has the option to disable this for friendly token visibility tests.

![umbral-sight](https://user-images.githubusercontent.com/16523503/209987083-487aee33-b75e-452f-9433-7302ffdaeab3.gif)

### **Invisible characters can hide from See Invisibility**
An invisible actor that also has the 'Hidden' condition will check Perception vs Stealth before showing up in the 'See Invisibility' vision mode.

### **Friendly tokens can still be viewed**
The GM has the option for allowing Hidden tokens to be seen by other tokens of the same disposition.

## Stealth vs Perception Ties
D&D 5E treats skill contest ties as preserving the status quo, so I assume that ties are won by passive Perception and lost by active Perception. Its not perfect, but seems to do a decent job.

## Experimental

### Check token lighting conditions
This option triggers a check for the following effects on the target token:
    Dark, Dim
IF the target token has these effects, then the passive perception check will be adjusted accordingly.
This takes Darkvision into account for light conditions ( light level bump ) before determining passive perception adjustment.

## Required modules
* [lib-wrapper](https://foundryvtt.com/packages/lib-wrapper)
## Optional modules
* [DFreds Convenient Effects](https://foundryvtt.com/packages/dfreds-convenient-effects)
* [Combat Utility Belt](https://foundryvtt.com/packages/combat-utility-belt)
* [Token Magic FX](https://foundryvtt.com/packages/tokenmagic)
* [Active Token Effects](https://foundryvtt.com/packages/ATL)
