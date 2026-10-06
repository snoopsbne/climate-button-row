# Climate Button Row

A Home Assistant Lovelace card to control a climate entity in a button row: `-` `[setpoint]` `+` `AUTO` `ON` `OFF`.

Inspired by [fan-percent-button-row](https://github.com/finity69x2/fan-percent-button-row).

## Installation

1. Install via [HACS](https://hacs.xyz/) (Lovelace > Custom repositories > add this repo), or copy `climate-button-row-card.js` to `/config/www/` and add it as a module resource.
2. Add a card to a dashboard:

```yaml
type: custom:climate-button-row
entity: climate.bedroom
auto_entity: switch.bedroom_auto
step: 1
```

## Configuration

| Option | Required | Default | Description |
|---|---|---|---|
| `entity` | yes | - | Climate entity to control |
| `auto_entity` | yes | - | Switch entity toggled by the AUTO button |
| `step` | no | 0.5 | Setpoint change per `-`/`+` press |
| `min_temp` / `max_temp` | no | entity attributes | Limits for `-`/`+` |
| `hide_auto` / `hide_off` | no | false | Hide the AUTO / OFF button |
| `default_hvac_mode` | no | heat | Mode used for ON if the entity has no `turn_on` |
| `customTheme` | no | false | Use custom colors instead of theme variables |
| `isOffColor` / `isOnColor` / `isAutoColor` / `buttonInactiveColor` | no | - | Button colors when `customTheme: true` |
| `width` / `height` | no | 30px | Button size |
| `customMinusText` / `customPlusText` / `customAutoText` / `customOnText` / `customOffText` | no | - / + / AUTO / ON / OFF | Button labels |

## How it works

- `-` / `+` call `climate.set_temperature` with the current setpoint +/- `step` (default 0.5).
- The setpoint display shows one decimal (e.g. `21.5`).
- `AUTO` toggles the switch given by `auto_entity`.
- `ON` / `OFF` call `climate.turn_on` / `climate.turn_off`, falling back to `climate.set_hvac_mode` when those services are not supported.
