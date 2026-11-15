window.customCards = window.customCards || [];
window.customCards.push({
  type: "dual-battery-flow-card",
  name: "dual battery flow card",
  description: "Compact grouped flow diagram in three columns: Inputs (solar + grid) on the left, Batteries (house + garage + optional car) in the middle around the Home hub, Devices (top-6) in a 2x3 grid on the right (biggest consumers on the top row); every bubble is sized by its share of the biggest power flow (the house battery gets a larger floor), with magnitude-weighted animated lines and direction chevrons riding each active flow; the house and garage bubbles draw a vertical 4-bar SoC battery glyph (25% per bar, bottom bar first) whose frontier bar fills in a loop bottom-to-top while charging; the glyph is green charging, red discharging, blue idle (the bubble ring stays battery blue).",
  preview: false,
});

const LitElement = customElements.get("ha-panel-lovelace") ? Object.getPrototypeOf(customElements.get("ha-panel-lovelace")) : Object.getPrototypeOf(customElements.get("hc-lovelace"));
const html = LitElement.prototype.html;
const css = LitElement.prototype.css;

// Node identity is class-based: the ring colour tells you what the node IS
// (grid red, solar yellow, batteries/car blue, devices purple, home slate);
// idle nodes just dim via .node.idle. Flow lines are semantic: green = good,
// red = bad (grid import; device feeds while the home is importing).
const COLORS = {
  solar: "#fdd835",
  grid: "#e53935",
  battery: "#2196f3",
  home: "#546e7a",
  individual: "#ab47bc",
  good: "#43a047",
  bad: "#e53935",
  idle: "var(--disabled-text-color, #9e9e9e)",
};

const HOME = [50, 40];
// Layout (percent coords, centre-anchored nodes): three columns —
// inputs left (x=15), batteries middle (x=50, Home hub between house and garage),
// devices right in a 2x3 grid (biggest consumers on the TOP row: rank1 upper-left,
// rank2 upper-right, rank3 middle-left, rank4 middle-right, rank5 lower-left,
// rank6 lower-right — filled row-major). The house battery bubble
// is larger than the garage/car, so the middle column is spaced wider than before.
const SOLAR_POS = [15, 25];
const GRID_POS = [15, 75];
// Slots: house / garage / car. Without a car the car slot is simply unused
// (2-member fallback: house + garage; 1-member: house only).
const BATTERY_POS = [[50, 14], [50, 64], [50, 88]];
// Rows sit at 22/50/78% — 28% pitch, so even max-size (84px) bubbles keep a
// clear gap between rows on the 100/76 canvas.
const IND_POS = [[76, 22], [91, 22], [76, 50], [91, 50], [76, 78], [91, 78]];
// Car flow bows into the gap between the left and middle columns so it doesn't
// daisy-chain straight down through the garage bubble. Starts at HOME, ends at
// the car; control points at x=36%, y=50%/75% (built in pixels in render()).
const CAR_CTRL = [[36, 50], [36, 75]];
// The right device grid is two columns wide, so the outer column (rank2/rank4/
// rank6, the right-hand cells) gets arcs instead of daisy-chaining straight
// through the inner bubbles: rank2 bows OVER the top row, rank4 threads the
// needle gap between the top and middle INNER bubbles (its straight line would
// cut through rank3), and rank6 bows UNDER the bottom row. The inner column
// (rank1/rank3/rank5) stays straight. Like every other line, the path runs
// DEVICE -> HOME (render() reverses the control points), so one reverse flag
// drives travel home->device for the dashes AND chevrons. Control points are
// percent coords written in home->device order here and built in pixels in
// render(), so the chevrons reuse the exact same d.
const IND_CURVE_CTRL = {
  1: [[64, 6], [80, 6]], // HOME -> rank2 (top-right cell): bows over the y=22% top-row bubbles; render() uses these reversed (rank2 -> HOME)
  3: [[66, 36], [80, 36]], // HOME -> rank4 (middle-right cell): needles between the inner top (y=22) and middle (y=50) bubbles; render() uses these reversed (rank4 -> HOME)
  5: [[64, 94], [80, 94]], // HOME -> rank6 (bottom-right cell): bows under the y=78% bottom-row bubbles; render() uses these reversed (rank6 -> HOME)
};

class DualBatteryFlowCard extends LitElement {
  static get properties() {
    return {
      hass: Object,
      config: Object,
      // Pixel size of the .container, kept in sync by a ResizeObserver so the
      // SVG viewBox and the CSS motion paths share one pixel coordinate space.
      // Defaults match the jsdom harness (no ResizeObserver there): the
      // container is aspect 100/76 at 537px wide -> 408px tall.
      _w: Number,
      _h: Number,
    };
  }

  constructor() {
    super();
    this._w = 537;
    this._h = 408;
    this._ro = null;
  }

  firstUpdated() {
    this._observeContainer();
  }

  connectedCallback() {
    super.connectedCallback();
    // HA re-parents card elements while a view settles; re-attach the observer
    // on every connect or _w/_h would stay stale after a disconnect.
    this._observeContainer();
  }

  _observeContainer() {
    if (typeof ResizeObserver === "undefined" || this._ro) {
      return;
    }
    const container = this.shadowRoot && this.shadowRoot.querySelector(".container");
    if (!container) {
      return;
    }
    this._ro = new ResizeObserver((entries) => {
      const rect = entries[0].contentRect;
      const w = Math.round(rect.width);
      const h = Math.round(rect.height);
      if (w > 0 && h > 0 && (w !== this._w || h !== this._h)) {
        this._w = w;
        this._h = h;
      }
    });
    this._ro.observe(container);
  }

  disconnectedCallback() {
    if (this._ro) {
      this._ro.disconnect();
      this._ro = null;
    }
    super.disconnectedCallback();
  }

  static get styles() {
    return css`
      :host {
        display: block;
      }
      .title {
        font-size: 14px;
        font-weight: 600;
        color: var(--primary-text-color);
        padding: 4px 4px 0;
      }
      .container {
        position: relative;
        width: 100%;
        aspect-ratio: 100 / 76;
        min-height: 270px;
        max-height: 440px;
        container-type: inline-size;
      }
      svg.lines {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
      }
      path.track {
        fill: none;
        stroke: var(--divider-color, rgba(0, 0, 0, 0.12));
        stroke-width: 1.2px;
        opacity: 0.25;
      }
      path.flow {
        fill: none;
        stroke-dasharray: 6 10;
        stroke-linecap: round;
        opacity: 0.12;
      }
      path.flow.active {
        opacity: 0.95;
        animation: flow 1.1s linear infinite;
      }
      path.flow.reverse {
        animation-direction: reverse;
      }
      @keyframes flow {
        to {
          stroke-dashoffset: -16;
        }
      }
      /* Direction chevrons: two per flow line riding the same pixel path via
         CSS motion-path (shadow-DOM safe — no SMIL, no url(#) refs). The
         top+right border corner rotated 45deg points along +x; offset-rotate
         auto aims it along the travel direction, .reverse flips both the
         travel and the arrowhead so chevrons always point where electrons go.
         Nodes sit at z-index 2 so chevrons vanish under the bubbles at the ends. */
      .e-arrow {
        position: absolute;
        width: 7px;
        height: 7px;
        border-right: 2px solid;
        border-top: 2px solid;
        transform: rotate(45deg);
        offset-rotate: auto;
        animation: travel linear infinite;
        opacity: 0;
        pointer-events: none;
        z-index: 1;
      }
      .e-arrow.on {
        opacity: 0.95;
      }
      .e-arrow.reverse {
        animation-direction: reverse;
        offset-rotate: reverse;
      }
      @keyframes travel {
        from {
          offset-distance: 0%;
        }
        to {
          offset-distance: 100%;
        }
      }
      .group-tag {
        position: absolute;
        z-index: 6;
        font-size: 9px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.14em;
        color: var(--secondary-text-color);
        background: var(--ha-card-background, var(--card-background-color, #fff));
        padding: 0 4px;
        border-radius: 4px;
      }
      .node {
        position: absolute;
        z-index: 2;
        width: max-content;
        transform: translate(-50%, -50%);
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 3px;
      }
      .node.idle {
        opacity: 0.6;
      }
      .circle {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 1px;
        width: var(--d);
        height: var(--d);
        border-radius: 50%;
        background: var(--ha-card-background, var(--card-background-color, #fff));
        box-shadow: 0 0 0 2px var(--ring-color), 0 2px 6px rgba(0, 0, 0, 0.25);
        transition: box-shadow 0.2s;
      }
      .node.active .circle {
        box-shadow: 0 0 0 2px var(--ring-color), 0 2px 6px rgba(0, 0, 0, 0.25), 0 0 14px color-mix(in srgb, var(--ring-color) 55%, transparent);
      }
      .node[role="button"] {
        cursor: pointer;
      }
      .node[role="button"]:hover .circle,
      .node[role="button"]:focus-visible .circle {
        box-shadow: 0 0 0 3px var(--ring-color), 0 3px 10px rgba(0, 0, 0, 0.3);
      }
      .node[role="button"]:focus-visible {
        outline: none;
      }
      .circle ha-icon {
        --mdc-icon-size: clamp(11px, calc(var(--d) * 0.22), 20px);
        color: var(--ring-color);
      }
      /* SoC battery glyph (house + garage nodes replace the mdi battery icon):
         a VERTICAL battery (the old horizontal glyph rotated 90 deg CCW) —
         terminal nub on TOP, outlined body below it holding four HORIZONTAL
         quartile bars stacked so bar 1 (0-25%) sits at the BOTTOM and bar 4
         (75-100%) at the TOP (.batt-body is flex column-reverse, DOM order
         stays b1..b4). Built from divs so the frontier bar can animate. The
         glyph carries an icon-level state colour set inline on .batt — green
         charging, red discharging, blue idle — while the bubble ring stays
         battery blue. Static: bars below round(soc/25) are .lit, the rest
         .dim. Charging: bars below floor(soc/25) .lit, the frontier bar .fill
         (it stretches left->right within its row, looping; the sequence of
         rows reads bottom->top), the rest .dim; at 100% (or unknown SoC while
         charging) all bars .lit + .pulse trickle shimmer. */
      .batt {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 1px;
      }
      .batt-tip {
        width: 40%;
        height: 2px;
        border-radius: 2px 2px 0 0;
        background: currentColor;
      }
      .batt-body {
        display: flex;
        flex-direction: column-reverse;
        gap: 1px;
        width: clamp(10px, calc(var(--d) * 0.20), 16px);
        height: clamp(14px, calc(var(--d) * 0.30), 26px);
        border: 1.5px solid currentColor;
        border-radius: 3px;
        padding: 1.5px;
        box-sizing: border-box;
      }
      .batt-bar {
        width: 100%;
        height: clamp(2px, calc(var(--d) * 0.05), 3.5px);
        border-radius: 1px;
        background: currentColor;
        opacity: 0.18;
        transform-origin: left center;
      }
      .batt-bar.lit {
        opacity: 1;
      }
      .batt-bar.dim {
        opacity: 0.18;
      }
      .batt-bar.fill {
        opacity: 0.4;
        animation: fillbar 1.6s ease-in-out infinite;
      }
      @keyframes fillbar {
        0% {
          transform: scaleX(0.15);
          opacity: 0.4;
        }
        65% {
          transform: scaleX(1);
          opacity: 1;
        }
        85% {
          transform: scaleX(1);
          opacity: 1;
        }
        100% {
          transform: scaleX(0.15);
          opacity: 0.4;
        }
      }
      .batt-bar.pulse {
        opacity: 1;
        animation: batt-pulse 1.2s ease-in-out infinite;
      }
      @keyframes batt-pulse {
        0%,
        100% {
          opacity: 0.55;
        }
        50% {
          opacity: 1;
        }
      }
      .value {
        font-size: clamp(9px, calc(var(--d) * 0.17), 15px);
        font-weight: 700;
        font-variant-numeric: tabular-nums;
        color: var(--primary-text-color);
        white-space: nowrap;
      }
      .state {
        font-size: clamp(8px, calc(var(--d) * 0.12), 10px);
        color: var(--secondary-text-color);
      }
      .label {
        font-size: clamp(10px, 2cqw, 11px);
        max-width: 110px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        text-align: center;
        color: var(--secondary-text-color);
        background: var(--ha-card-background, var(--card-background-color, #fff));
        padding: 0 4px;
        border-radius: 4px;
      }
      .node.ind .label {
        max-width: 76px;
      }
      @container (max-width: 400px) {
        .label {
          font-size: 9px;
        }
        .node.ind .label {
          max-width: 64px;
        }
      }
      @media (max-width: 480px) {
        .label {
          font-size: 9px;
        }
      }
    `;
  }

  setConfig(config) {
    if (!config.solar && !config.home && !config.grid) {
      throw new Error("dual-battery-flow-card: define at least solar, home or grid");
    }
    this.config = config;
  }

  getCardSize() {
    return 4;
  }

  _state(entityId) {
    return entityId ? this.hass.states[entityId] : undefined;
  }

  _num(entityId) {
    const state = this._state(entityId);
    if (!state) {
      return 0;
    }
    const value = parseFloat(state.state);
    return Number.isFinite(value) ? value : 0;
  }

  _fmt(watts) {
    const value = Number(watts) || 0;
    const abs = Math.abs(value);
    if (abs >= 1000) {
      return (value / 1000).toFixed(2).replace(/\.00$/, "").replace(/(\.\d)0$/, "$1") + " kW";
    }
    return Math.round(value) + " W";
  }

  _battery(config, alt) {
    if (!config) {
      return null;
    }
    const state = this._state(config.entity);
    const soc = state ? parseFloat(state.state) : NaN;
    let charge = this._num(config.charge);
    let discharge = this._num(config.discharge);
    if (config.power) {
      const sign = config.invert ? -1 : 1;
      const value = sign * this._num(config.power);
      charge = value > 0 ? value : 0;
      discharge = value < 0 ? -value : 0;
    }
    return {
      config,
      alt,
      soc: Number.isFinite(soc) ? soc : null,
      charge,
      discharge,
    };
  }

  // Battery-glyph quartile model (consumed by _node's ${battery} branch):
  // lit/dim/fill/pulse per bar (bar index 0 = bottom quartile — .batt-body is
  // column-reverse so it renders at the BOTTOM), SoC-truthful, plus the glyph
  // state colour: green while charging (charge > 10 && charge >= discharge),
  // red while discharging (discharge > 10), battery blue when idle.
  // - not charging (idle or discharging): bars below round(soc/25) .lit, rest
  //   .dim; soc unknown -> all dim; soc >= 100 -> all lit (static).
  // - charging (charge > 10 && charge >= discharge), soc < 100: bars below
  //   floor(soc/25) .lit, the frontier bar .fill (stretches left->right in its
  //   row, so the charge animates bottom->top), the rest .dim.
  // - charging at 100% (or SoC unknown while charging): all bars .lit + .pulse.
  _batteryBars(battery) {
    if (!battery) {
      return null;
    }
    const charging = battery.charge > 10 && battery.charge >= battery.discharge;
    const soc = battery.soc == null ? null : Math.min(100, Math.max(0, battery.soc));
    let cls = ["dim", "dim", "dim", "dim"];
    if (charging) {
      if (soc == null || soc >= 100) {
        cls = ["lit pulse", "lit pulse", "lit pulse", "lit pulse"];
      } else {
        const filled = Math.floor(soc / 25);
        cls = [0, 1, 2, 3].map((i) => (i < filled ? "lit" : i === filled ? "fill" : "dim"));
      }
    } else if (soc != null) {
      const lit = Math.round(soc / 25);
      cls = [0, 1, 2, 3].map((i) => (i < lit ? "lit" : "dim"));
    }
    return {
      bars: cls.map((c) => "batt-bar " + c),
      tip: "batt-tip",
      color: charging ? COLORS.good : battery.discharge > 10 ? COLORS.bad : COLORS.battery,
    };
  }

  _values() {
    const config = this.config;
    const gridImport = this._num(config.grid && config.grid.consumption);
    const gridExport = this._num(config.grid && config.grid.production);
    const car = config.car ? this._battery(config.car, "Car") : null;
    // The car (BYD Dolphin) has no V2L: negative `car.power` is the vehicle's
    // own loads, NOT power feeding the house. Charge-only — only charging
    // renders as a home->car flow; vehicle-side drain shows an idle 0 W node.
    if (car) {
      car.discharge = 0;
    }
    return {
      solar: this._num(config.solar),
      home: this._num(config.home),
      gridImport,
      gridExport,
      gridNet: gridImport - gridExport,
      batteries: [
        this._battery(config.battery, "House Battery"),
        this._battery(config.battery_2, "Garage Battery"),
      ].filter(Boolean),
      car,
      individuals: (config.individual || []).map((item) => {
        const entity = typeof item === "string" ? item : item.entity;
        return {
          entity,
          name: (typeof item === "object" && item.name) || (this._state(entity) || {}).attributes?.friendly_name || entity,
          icon: (typeof item === "object" && item.icon) || "mdi:car-electric",
          threshold: typeof item === "object" && item.threshold != null ? Number(item.threshold) : null,
          value: this._num(entity),
        };
      }),
    };
  }

  _nodeActivated = (ev) => {
    const node = ev.currentTarget;
    const entityId = node && node.getAttribute("data-entity");
    if (entityId) {
      this.dispatchEvent(new CustomEvent("hass-more-info", { detail: { entityId }, bubbles: true, composed: true }));
    }
  };

  _nodeKeydown = (ev) => {
    if (ev.key === "Enter" || ev.key === " " || ev.key === "Spacebar") {
      ev.preventDefault();
      this._nodeActivated(ev);
    }
  };
  // Pixel geometry helpers: every endpoint/control point is percent/100 x the
  // observed container size, so the SVG viewBox (0 0 _w _h) is 1:1 with CSS px
  // and the chevrons' offset-path strings can reuse the exact same `d`.
  _pt(pos) {
    return [+(pos[0] * this._w / 100).toFixed(2), +(pos[1] * this._h / 100).toFixed(2)];
  }

  _straight(pos) {
    if (!pos) {
      return { d: "", len: 0 };
    }
    const a = this._pt(pos);
    const b = this._pt(HOME);
    return { d: "M " + a[0] + "," + a[1] + " L " + b[0] + "," + b[1], len: Math.hypot(b[0] - a[0], b[1] - a[1]) };
  }

  // Generic cubic path from a percent start through two percent control points
  // to a percent end (used by the car bypass and the curved device feeds).
  _curve(start, c1pos, c2pos, end) {
    const a = this._pt(start);
    const c1 = this._pt(c1pos);
    const c2 = this._pt(c2pos);
    const b = this._pt(end);
    // cubic length by sampling (getTotalLength is unavailable pre-render/jsdom)
    let len = 0;
    let prev = a;
    for (let i = 1; i <= 32; i++) {
      const t = i / 32;
      const u = 1 - t;
      const p = [
        u * u * u * a[0] + 3 * u * u * t * c1[0] + 3 * u * t * t * c2[0] + t * t * t * b[0],
        u * u * u * a[1] + 3 * u * u * t * c1[1] + 3 * u * t * t * c2[1] + t * t * t * b[1],
      ];
      len += Math.hypot(p[0] - prev[0], p[1] - prev[1]);
      prev = p;
    }
    return { d: "M " + a[0] + "," + a[1] + " C " + c1[0] + "," + c1[1] + " " + c2[0] + "," + c2[1] + " " + b[0] + "," + b[1], len };
  }

  _carCurve() {
    return this._curve(HOME, CAR_CTRL[0], CAR_CTRL[1], BATTERY_POS[2]);
  }

  _line(geom, active, reverse, watts, color) {
    return {
      d: geom.d,
      active,
      reverse,
      color,
      // chevrons take ~1.2–3s per traversal, scaled by pixel length
      dur: Math.min(3, Math.max(1.2, geom.len / 140)),
      cls: "flow" + (active ? " active" : "") + (reverse ? " reverse" : ""),
      style: "stroke:" + color + ";stroke-width:" + Math.min(6, Math.max(1.5, 1.5 + (Math.abs(watts) / 1000) * 0.9)).toFixed(2) + "px",
    };
  }

  // Two static chevrons per line (22 total), always in the template when the
  // browser supports motion paths; display:none while the line has no `d`.
  // The second chevron is phase-shifted half a duration so flows read as a
  // steady stream. `.on` exactly when the line is active; `.reverse` exactly
  // mirrors the line's reverse flag.
  _arrows(line, key) {
    if (!line.d) {
      return html`
        <div class="e-arrow" data-arrow="${key}" style="display:none"></div>
        <div class="e-arrow" data-arrow="${key}" style="display:none"></div>
      `;
    }
    const cls = "e-arrow" + (line.active ? " on" : "") + (line.reverse ? " reverse" : "");
    const base = "offset-path:path('" + line.d + "');border-color:" + line.color + ";animation-duration:" + line.dur.toFixed(2) + "s;";
    return html`
      <div class="${cls}" data-arrow="${key}" style="${base}"></div>
      <div class="${cls}" data-arrow="${key}" style="${base}animation-delay:-${(line.dur / 2).toFixed(2)}s"></div>
    `;
  }

  _node(entity, pos, cls, color, active, icon, valueText, stateText, labelText, d, battery) {
    const klass = "node" + (cls ? " " + cls : "") + (active ? " active" : " idle");
    const style = "left:" + pos[0] + "%;top:" + pos[1] + "%;--ring-color:" + color + ";--d:" + d + ";";
    const inner = html`
      <div class="circle">
        ${battery
          ? html`
              <div class="batt" style="color:${battery.color}">
                <div class="${battery.tip}"></div>
                <div class="batt-body">
                  <div class="${battery.bars[0]}"></div>
                  <div class="${battery.bars[1]}"></div>
                  <div class="${battery.bars[2]}"></div>
                  <div class="${battery.bars[3]}"></div>
                </div>
              </div>
            `
          : html`<ha-icon icon="${icon}"></ha-icon>`}
        <div class="value">${valueText}</div>
        ${stateText ? html`<div class="state">${stateText}</div>` : ""}
      </div>
      <div class="label">${labelText}</div>
    `;
    if (entity) {
      return html`
        <div
          class="${klass}"
          style="${style}"
          data-entity="${entity}"
          role="button"
          tabindex="0"
          title="${labelText} — ${entity}"
          @click=${this._nodeActivated}
          @keydown=${this._nodeKeydown}
        >
          ${inner}
        </div>
      `;
    }
    return html`<div class="${klass}" style="${style}">${inner}</div>`;
  }

  render() {
    const config = this.config;
    const values = this._values();
    const threshold = 10;
    const solarActive = values.solar > threshold;
    const gridActive = Math.abs(values.gridNet) > threshold;
    const gridImport = values.gridNet >= 0;
    const gridLine = gridActive ? (gridImport ? COLORS.bad : COLORS.good) : COLORS.idle;
    // importing right now (gridNet > threshold) makes the device feeds "bad";
    // while the home is self-covered they are "good".
    const importing = values.gridNet > threshold;
    const deviceLine = importing ? COLORS.bad : COLORS.good;
    const homeActive = values.home > threshold;

    const members = values.car ? [...values.batteries, values.car] : values.batteries;
    const bat0 = members[0] || null;
    const bat1 = members[1] || null;
    const car = members[2] || null;
    const batActive = (battery) => !!battery && (battery.charge > threshold || battery.discharge > threshold);

    let individuals = values.individuals.filter((item) => item.threshold == null || item.value > item.threshold);
    const individualCount = config.individual_count != null ? Number(config.individual_count) : null;
    if (individualCount != null && Number.isFinite(individualCount) && individualCount > 0) {
      individuals = [...individuals].sort((a, b) => b.value - a.value).slice(0, individualCount);
    }
    individuals = individuals.slice(0, 6);

    // usage-scaled bubbles: the biggest producer/consumer gets the largest bubble;
    // diameters scale with the sqrt of the power ratio (area proportional to watts),
    // clamped between the idle min and max; watts at/below the activity threshold sit at min.
    const batWatts = (battery) => (battery ? Math.max(battery.charge, battery.discharge) : 0);
    const maxW = Math.max(1, values.solar, Math.abs(values.gridNet), values.home, ...members.map(batWatts), ...individuals.map((item) => Math.abs(item.value)));
    const ratioOf = (watts) => {
      const w = Math.abs(watts);
      return w > threshold ? w / maxW : 0;
    };
    const dia = (watts) => "clamp(34px, " + (8.2 + 7.4 * Math.sqrt(ratioOf(watts))).toFixed(2) + "cqw, 84px)";
    // batteries (garage, car) get a bigger floor so the middle column doesn't waste space;
    // the HOUSE battery (members[0]) is enlarged further — it is the asset people watch.
    const diaBat = (watts) => "clamp(48px, " + (11.5 + 4.1 * Math.sqrt(ratioOf(watts))).toFixed(2) + "cqw, 84px)";
    const diaHouse = (watts) => "clamp(56px, " + (14 + 4.6 * Math.sqrt(ratioOf(watts))).toFixed(2) + "cqw, 96px)";
    const batLine = (battery) => (batActive(battery) ? COLORS.good : COLORS.idle);

    const lineSolar = this._line(this._straight(config.solar ? SOLAR_POS : null), solarActive, false, values.solar, solarActive ? COLORS.good : COLORS.idle);
    const lineGrid = this._line(this._straight(config.grid ? GRID_POS : null), gridActive, !gridImport, values.gridNet, gridLine);
    const lineBat0 = this._line(this._straight(bat0 ? BATTERY_POS[0] : null), batActive(bat0), !!bat0 && bat0.charge > bat0.discharge, Math.max(bat0 ? bat0.charge : 0, bat0 ? bat0.discharge : 0), batLine(bat0));
    const lineBat1 = this._line(this._straight(bat1 ? BATTERY_POS[1] : null), batActive(bat1), !!bat1 && bat1.charge > bat1.discharge, Math.max(bat1 ? bat1.charge : 0, bat1 ? bat1.discharge : 0), batLine(bat1));
    // the car bypass runs HOME -> car, so its reverse polarity is flipped vs the battery lines:
    // charging runs forward along the curve. The car never discharges here — it is
    // charge-only (no V2L), so lineCar only goes active while charging (home -> car).
    const lineCar = this._line(car ? this._carCurve() : { d: "", len: 0 }, batActive(car), !!car && car.discharge > car.charge, Math.max(car ? car.charge : 0, car ? car.discharge : 0), batLine(car));
    const lineInd = IND_POS.map((pos, i) => {
      const item = individuals[i];
      if (!item) {
        return this._line({ d: "", len: 0 }, false, true, 0, COLORS.idle);
      }
      const ctrl = IND_CURVE_CTRL[i];
      // device -> HOME like the straight feeds (control points reversed), so
      // the shared reverse=true means home -> device travel on every line
      const geom = ctrl ? this._curve(pos, ctrl[1], ctrl[0], HOME) : this._straight(pos);
      return this._line(geom, item.value > threshold, true, item.value, item.value > threshold ? deviceLine : COLORS.idle);
    });

    const nodes = [];
    if (config.solar) {
      nodes.push(this._node(config.solar, SOLAR_POS, "", COLORS.solar, solarActive, "mdi:weather-sunny", this._fmt(values.solar), "", "Solar", dia(values.solar)));
    }
    if (config.grid) {
      nodes.push(this._node(config.grid.consumption || config.grid.production, GRID_POS, "", COLORS.grid, gridActive, "mdi:transmission-tower", this._fmt(Math.abs(values.gridNet)), gridActive ? (gridImport ? "import" : "export") : "idle", "Grid", dia(Math.abs(values.gridNet))));
    }
    nodes.push(this._node(config.home, HOME, "hero", COLORS.home, homeActive, "mdi:home", this._fmt(values.home), "", "Home", dia(values.home)));
    members.forEach((battery, i) => {
      const isCar = battery === values.car;
      const name = battery.config.name || (battery.config.entity ? this._state(battery.config.entity)?.attributes?.friendly_name : "") || battery.alt;
      // house/garage render the SoC battery glyph; the car keeps its mdi icon
      // (its charging is already shown by the home->car flow).
      nodes.push(this._node(battery.config.entity, BATTERY_POS[i], "", COLORS.battery, batActive(battery), isCar ? battery.config.icon || "mdi:car-electric" : "", this._fmt(Math.max(battery.charge, battery.discharge)), battery.soc == null ? "" : Math.round(battery.soc) + "%", name, i === 0 ? diaHouse(batWatts(battery)) : diaBat(batWatts(battery)), isCar ? null : this._batteryBars(battery)));
    });
    individuals.forEach((item, i) => {
      nodes.push(this._node(item.entity, IND_POS[i], "ind", COLORS.individual, item.value > threshold, item.icon, this._fmt(item.value), "", item.name, dia(item.value)));
    });

    // Chevrons only where CSS motion paths exist (jsdom has no CSS.supports,
    // so the harness's Part A exercises the graceful no-arrow fallback).
    const motionOK = typeof CSS !== "undefined" && typeof CSS.supports === "function" && CSS.supports("offset-path", 'path("M0,0 L1,1")');
    const arrowKeys = [["solar", lineSolar], ["grid", lineGrid], ["bat0", lineBat0], ["bat1", lineBat1], ["car", lineCar], ["ind0", lineInd[0]], ["ind1", lineInd[1]], ["ind2", lineInd[2]], ["ind3", lineInd[3]], ["ind4", lineInd[4]], ["ind5", lineInd[5]]];

    return html`
      <ha-card>
        ${config.title ? html`<div class="title">${config.title}</div>` : ""}
        <div class="container">
          <!-- every path is static in this template (nested html templates parse SVG paths as HTML elements);
               viewBox is in observed container pixels so paths and chevrons share one coordinate space -->
          <svg class="lines" viewBox="0 0 ${this._w} ${this._h}" preserveAspectRatio="none">
            <path class="track" d="${lineSolar.d}" pathLength="100" vector-effect="non-scaling-stroke" />
            <path class="${lineSolar.cls}" data-line="solar" d="${lineSolar.d}" style="${lineSolar.style}" pathLength="100" vector-effect="non-scaling-stroke" />
            <path class="track" d="${lineGrid.d}" pathLength="100" vector-effect="non-scaling-stroke" />
            <path class="${lineGrid.cls}" data-line="grid" d="${lineGrid.d}" style="${lineGrid.style}" pathLength="100" vector-effect="non-scaling-stroke" />
            <path class="track" d="${lineBat0.d}" pathLength="100" vector-effect="non-scaling-stroke" />
            <path class="${lineBat0.cls}" data-line="bat0" d="${lineBat0.d}" style="${lineBat0.style}" pathLength="100" vector-effect="non-scaling-stroke" />
            <path class="track" d="${lineBat1.d}" pathLength="100" vector-effect="non-scaling-stroke" />
            <path class="${lineBat1.cls}" data-line="bat1" d="${lineBat1.d}" style="${lineBat1.style}" pathLength="100" vector-effect="non-scaling-stroke" />
            <path class="track" d="${lineCar.d}" pathLength="100" vector-effect="non-scaling-stroke" />
            <path class="${lineCar.cls}" data-line="car" d="${lineCar.d}" style="${lineCar.style}" pathLength="100" vector-effect="non-scaling-stroke" />
            <path class="track" d="${lineInd[0].d}" pathLength="100" vector-effect="non-scaling-stroke" />
            <path class="${lineInd[0].cls}" data-line="ind0" d="${lineInd[0].d}" style="${lineInd[0].style}" pathLength="100" vector-effect="non-scaling-stroke" />
            <path class="track" d="${lineInd[1].d}" pathLength="100" vector-effect="non-scaling-stroke" />
            <path class="${lineInd[1].cls}" data-line="ind1" d="${lineInd[1].d}" style="${lineInd[1].style}" pathLength="100" vector-effect="non-scaling-stroke" />
            <path class="track" d="${lineInd[2].d}" pathLength="100" vector-effect="non-scaling-stroke" />
            <path class="${lineInd[2].cls}" data-line="ind2" d="${lineInd[2].d}" style="${lineInd[2].style}" pathLength="100" vector-effect="non-scaling-stroke" />
            <path class="track" d="${lineInd[3].d}" pathLength="100" vector-effect="non-scaling-stroke" />
            <path class="${lineInd[3].cls}" data-line="ind3" d="${lineInd[3].d}" style="${lineInd[3].style}" pathLength="100" vector-effect="non-scaling-stroke" />
            <path class="track" d="${lineInd[4].d}" pathLength="100" vector-effect="non-scaling-stroke" />
            <path class="${lineInd[4].cls}" data-line="ind4" d="${lineInd[4].d}" style="${lineInd[4].style}" pathLength="100" vector-effect="non-scaling-stroke" />
            <path class="track" d="${lineInd[5].d}" pathLength="100" vector-effect="non-scaling-stroke" />
            <path class="${lineInd[5].cls}" data-line="ind5" d="${lineInd[5].d}" style="${lineInd[5].style}" pathLength="100" vector-effect="non-scaling-stroke" />
          </svg>
          ${motionOK ? arrowKeys.map(([key, line]) => this._arrows(line, key)) : ""}
          <span class="group-tag" style="left:2%;top:2%">Inputs</span>
          <span class="group-tag" style="left:27%;top:2%">Batteries</span>
          <span class="group-tag" style="right:2%;top:1%">Devices</span>
          ${nodes}
        </div>
      </ha-card>
    `;
  }
}

customElements.define("dual-battery-flow-card", DualBatteryFlowCard);
