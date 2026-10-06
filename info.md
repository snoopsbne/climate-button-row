A Lovelace card to control a climate entity in a button row: `-` `[setpoint]` `+` `AUTO` `ON` `OFF`.

## Configuration

```yaml
type: custom:climate-button-row
entity: climate.bedroom
auto_entity: switch.bedroom_auto
step: 1
```

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

## Usage

1. Install this repository with HACS (Lovelace > Custom repositories).
2. Add a card to a dashboard:

```yaml
type: custom:climate-button-row
entity: climate.bedroom
auto_entity: switch.bedroom_auto
```

`-`/`+` call `climate.set_temperature` (setpoint shown with one decimal), `AUTO` toggles `auto_entity` (switch or input_boolean), `ON`/`OFF` call `climate.turn_on`/`turn_off` (falling back to `set_hvac_mode`). Pressing `OFF` also turns off `auto_entity` if it is on. When `auto_entity` is on, `ON`/`OFF` are hidden; press `AUTO` to turn auto off.
