# Button Rows

Custom Lovelace button rows for Home Assistant:

- `custom:climate-button-row` – control a climate entity: `-` `[setpoint]` `+` `AUTO` `ON` `OFF`.
- `custom:fan-light-button-row` – fan percent buttons (`HIGH` `MED` `LOW` `OFF`) with an optional paired light toggle (`LIGHT`), forked from [fan-percent-button-row](https://github.com/finity69x2/fan-percent-button-row).

## Installation

1. Install via [HACS](https://hacs.xyz/) (Lovelace > Custom repositories > add this repo), or copy the JS files to `/config/www/` and add them as module resources.
2. Add a card to a dashboard:

```yaml
type: custom:climate-button-row
entity: climate.bedroom
auto_entity: switch.bedroom_auto
step: 1
```

```yaml
type: custom:fan-light-button-row
entity: fan.kitchen
light_entity: light.kitchen_fan_light
```

## fan-light-button-row

All original fan-percent-button-row options work (`customSetpoints`, `reverseButtons`, `isTwoSpeedFan`, `hideOff`, `sendStateWithSpeed`, `allowDisablingButtons`, `offPercentage`/`lowPercentage`/`medPercentage`/`hiPercentage`, `width`/`height`, `customTheme` and colors, `customOffText`/`customLowText`/`customMedText`/`customHiText`). Extra options:

| Option | Required | Default | Description |
|---|---|---|---|
| `entity` | yes | - | Fan entity to control |
| `light_entity` | no | - | Light entity toggled by the LIGHT button (button hidden if not set) |
| `hideLight` | no | false | Hide the LIGHT button |
| `customLightText` | no | LIGHT | LIGHT button label |
| `isLightOnColor` | no | #43A047 | LIGHT button color when on (with `customTheme: true`) |

The light button simply calls `light.turn_on` / `light.turn_off` on `light_entity`; it does not affect the fan.

## climate-button-row

### Climate Configuration

| Option | Required | Default | Description |
|---|---|---|---|
| `entity` | yes | - | Climate entity to control |
| `auto_entity` | no | - | Switch/input_boolean toggled by the AUTO button (button hidden if not set) |
| `step` | no | 0.5 | Setpoint change per `-`/`+` press |
| `min_temp` / `max_temp` | no | entity attributes | Limits for `-`/`+` |
| `hide_auto` / `hide_off` | no | false | Hide the AUTO / OFF button |
| `default_hvac_mode` | no | heat | Mode used for ON if the entity has no `turn_on` |
| `customTheme` | no | false | Use custom colors instead of theme variables |
| `isOffColor` / `isOnColor` / `isAutoColor` / `buttonInactiveColor` | no | - | Button colors when `customTheme: true` |
| `width` / `height` | no | 30px | Button size |
| `customMinusText` / `customPlusText` / `customAutoText` / `customOnText` / `customOffText` | no | - / + / AUTO / ON / OFF | Button labels |

### Climate How it works

- `-` / `+` call `climate.set_temperature` with the current setpoint +/- `step` (default 0.5).
- The setpoint display shows one decimal (e.g. `21.5`).
- `AUTO` toggles the switch given by `auto_entity`.
- `ON` / `OFF` call `climate.turn_on` / `climate.turn_off`, falling back to `climate.set_hvac_mode` when those services are not supported.
- Pressing `OFF` also turns off `auto_entity` if it is on.
- When `auto_entity` is on, `ON`/`OFF` are hidden; press `AUTO` to turn auto off.
