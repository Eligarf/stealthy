<h1>Stealthy</h1>

A module for <a href="https://foundryvtt.com/">FoundryVTT</a> that adds perception vs stealth testing to visibility tests.

<h2>Purpose</h2>


<h2>Features</h2>

Hide any enemies with the 'Hidden' condition based on comparing Perception and Stealth rolls.

**Rolling Stealth applies the Hidden condition** - Rolling the Stealth skill check will apply the 'hidden' condition to the actor and record the result of the check in that condition for later comparisons.

**Allow GM Stealth Override** - Once the 'Hidden' condition is applied, GMs will see tokens with an input box on the bottom right which will shows the rolled Stealth result, or show the passive Stealth value if no roll occurred. This input box can be changed to alter the value that is checked against future Perception results.

**Perception rolls** - Rolling a Perception check will add a 'Spot' condition to the actor which records the result of that perception check. The passive value for Perception is used if this condition isn't present on the actor. <i>The stored Perception result uses the passive value as a floor</i>

**Gloom Stalkers don't show up in darkvision** - Any gloom
stalker character will no longer be visible to the Darkvision mode. It can still be seen if Basic Vision can
see it.

**Invisible characters can still hide** - An invisible actor that also has the 'Hidden' condition will check Perception vs Stealth before showing up in the 'See Invisibility' vision mode.

<h2>Install</h2>

<h2>ChangeLog</h2>

<h4>Version 1.1.0</h4>
<ul>
  <li>remove requirement to use Convenient Effects</li>
</ul>

<h4>Version 1.0.0</h4>
<ul>
  <li>Initial implementation</li>
</ul>