---
tags: [character, dnd5e]
---

# Elara Thornwood

*Half-elf Ranger (Gloom Stalker) 5 · Outlander · Neutral Good*
Player: *you* · Campaign: *The Sunken Crown*

> [!ttrpgsk-columns|plain]
> **Armor Class** 15 (studded leather)
> **Initiative** +5 · **Speed** 30 ft.
> **Proficiency bonus** +3
> **Passive Perception** 15
>
> **Saving throws** STR +4, DEX +6
> **Skills** Perception +5, Stealth +6, Survival +8, Nature +3
> **Senses** darkvision 90 ft. (Umbral Sight)
> **Languages** Common, Elvish, Sylvan

## Ability scores
<!-- Horizontal layout with D&D modifiers. Wraps onto two rows on narrow screens. -->
```ttrpgsk-counters
layout: horizontal
mod: true
STR: 12
DEX: 16
CON: 14
INT: 10
WIS: 15
CHA: 8
```

## Health
<!-- Two blocks side by side thanks to the columns callout. -->
> [!ttrpgsk-columns|plain]
> ```ttrpgsk-counters
> label: Hit points
> hp:
>   label: Current
>   value: 37
>   max: 44             # can't heal past the maximum
>   step: 1             # Shift+click = 5 at a time
> temp_hp: { label: Temporary, value: 0 }
> hit_dice: { label: Hit dice (d10), value: 5/5 }
> exhaustion: { label: Exhaustion, value: 0, max: 6 }
> ```
> ```ttrpgsk-counters
> label: Death saves
> successes: { label: Successes, type: track, max: 3, value: 0 }
> failures: { label: Failures, type: track, max: 3, value: 0 }
> ```
> ```ttrpgsk-counters
> label: Inspiration
> inspiration: { label: Heroic inspiration, type: track, max: 1, value: 1 }
> ```

## Spellcasting
*Spell save DC 13 · Spell attack +5 · Wisdom*

```ttrpgsk-counters
label: Spell slots
slot_1: { label: 1st level, type: track, max: 4, value: 1 }
slot_2: { label: 2nd level, type: track, max: 2, value: 0 }
```

<!-- An embedded note, split across two columns. -->
> [!ttrpgsk-columns] Known spells
> ![[Elara Thornwood - Spells]]

## Features & traits
> [!ttrpgsk-columns|plain]
> - **Favored Foe** — mark a creature for +1d4 damage, a number of times per long rest equal to your proficiency bonus.
> - **Dread Ambusher** — add your Wisdom modifier to initiative; on the first turn, +10 ft. speed and an extra attack that deals +1d8.
> - **Umbral Sight** — darkvision 90 ft.; while in darkness, invisible to creatures that rely on darkvision to see you.
> - **Extra Attack** — attack twice when taking the Attack action.
> - **Fey Ancestry** — advantage against being charmed; magic can't put you to sleep.
> - **Deft Explorer** — expertise in Survival; extra languages.

```ttrpgsk-counters
label: Uses until long rest
favored_foe: { label: Favored Foe, type: track, max: 3, value: 1 }
wanderer_charm: { label: Wanderer's Charm (homebrew), type: track, max: 1, value: 0 }
```

## Equipment
<!-- Several groups in one block, each with its own title and layout. -->
```ttrpgsk-counters
coins:
  label: Coins
  layout: horizontal
  items:
    pp: { label: Platinum, value: 2 }
    gp: { label: Gold, value: 47 }
    sp: { label: Silver, value: 15 }
    cp: { label: Copper, value: 30 }
ammo:
  label: Ammunition & consumables
  items:
    arrows: { label: Arrows, value: 18, max: 40 }
    silver_arrows: { label: Silvered arrows, value: 4 }
    healing: { label: Potions of healing, value: 2 }
    rations: { label: Rations (days), value: 6 }
```

> [!ttrpgsk-columns|3 plain]
> - Longbow
> - Two shortswords
> - Studded leather armor
> - Explorer's pack
> - Hunting trap
> - Cloak of elvenkind *(attuned)*
> - Map of the Mirewood
> - Wolf-tooth necklace
> - ~~Rope of climbing~~ *(lost in the river)*

## Progress & reputation
```ttrpgsk-counters
xp:
  label: Experience
  value: 7200
  max: 14000           # next level at 14,000 XP
  step: 100
renown:
  label: Renown with the Emerald Enclave
  value: 3
  max: 10
thieves_guild:
  label: Standing with the Thieves' Guild
  value: -2
  min: null            # can go below zero
```

## Notes
- Owes a favor to Brother Aldric at the shrine of Mielikki.
- Tracking the hag who cursed the village of Thornwood.
- Her wolf companion, Ash, was last seen near the Sunken Crown ruins.
