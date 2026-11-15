window.customCards = window.customCards || [];
window.customCards.push({
  type: "dual-battery-flow-card",
  name: "dual battery flow card",
  description: "Compact grouped flow diagram in three columns: Inputs (solar + grid) on the left, Batteries (house + garage + optional car) in the middle around the Home hub, Devices (top-4) on the right; every bubble is sized by its share of the biggest power flow, with magnitude-weighted animated lines.",
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

const HOME = [50, 38];
// Layout (percent coords, centre-anchored nodes): three columns —
// inputs left (x=15), batteries middle (x=50, Home hub between house and garage),
// devices right (x=85, ranked top-down).
const SOLAR_POS = [15, 25];
const GRID_POS = [15, 75];
const BATTERY_POS = [[50, 12], [50, 63], [50, 87]];
const IND_POS = [[85, 16], [85, 40], [85, 64], [85, 87]];
// Car flow bows into the gap between the left and middle columns so it doesn't
// daisy-chain straight down through the garage bubble. Starts at HOME, ends at the car.
const CAR_CURVE = "M " + HOME[0] + "," + HOME[1] + " C 36,50 36,75 " + BATTERY_POS[2][0] + "," + BATTERY_POS[2][1];

class DualBatteryFlowCard extends LitElement {
  static get properties() {
    return {
      hass: Object,
      config: Object,
    };
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
        aspect-ratio: 100 / 78;
        min-height: 280px;
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
        max-width: 90px;
      }
      @container (max-width: 400px) {
        .label {
          font-size: 9px;
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

  _batteryIcon(battery) {
    if (!battery) {
      return "mdi:battery";
    }
    const soc = battery.soc == null ? null : Math.floor(Math.min(100, Math.max(0, battery.soc)) / 10) * 10;
    const charging = battery.charge > 10 && battery.charge >= battery.discharge;
    if (charging) {
      if (soc == null || soc >= 100) {
        return "mdi:battery-charging";
      }
      if (soc <= 0) {
        return "mdi:battery-charging-outline";
      }
      return "mdi:battery-charging-" + soc;
    }
    if (soc == null || soc >= 100) {
      return "mdi:battery";
    }
    if (soc <= 0) {
      return "mdi:battery-outline";
    }
    return "mdi:battery-" + soc;
  }

  _values() {
    const config = this.config;
    const gridImport = this._num(config.grid && config.grid.consumption);
    const gridExport = this._num(config.grid && config.grid.production);
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
      car: config.car ? this._battery(config.car, "Car") : null,
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
  _to(pos) {
    return pos ? "M " + pos[0] + "," + pos[1] + " L " + HOME[0] + "," + HOME[1] : "";
  }

  _line(d, active, reverse, watts, color) {
    return {
      d,
      cls: "flow" + (active ? " active" : "") + (reverse ? " reverse" : ""),
      style: "stroke:" + color + ";stroke-width:" + Math.min(6, Math.max(1.5, 1.5 + (Math.abs(watts) / 1000) * 0.9)).toFixed(2) + "px",
    };
  }

  _node(entity, pos, cls, color, active, icon, valueText, stateText, labelText, d) {
    const klass = "node" + (cls ? " " + cls : "") + (active ? " active" : " idle");
    const style = "left:" + pos[0] + "%;top:" + pos[1] + "%;--ring-color:" + color + ";--d:" + d + ";";
    const inner = html`
      <div class="circle">
        <ha-icon icon="${icon}"></ha-icon>
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
    individuals = individuals.slice(0, 4);

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
    // batteries (house, garage, car) get a bigger floor so the middle column doesn't waste space.
    const diaBat = (watts) => "clamp(48px, " + (11.5 + 4.1 * Math.sqrt(ratioOf(watts))).toFixed(2) + "cqw, 84px)";
    const batLine = (battery) => (batActive(battery) ? COLORS.good : COLORS.idle);

    const lineSolar = this._line(this._to(config.solar ? SOLAR_POS : null), solarActive, false, values.solar, solarActive ? COLORS.good : COLORS.idle);
    const lineGrid = this._line(this._to(config.grid ? GRID_POS : null), gridActive, !gridImport, values.gridNet, gridLine);
    const lineBat0 = this._line(this._to(bat0 ? BATTERY_POS[0] : null), batActive(bat0), !!bat0 && bat0.charge > bat0.discharge, Math.max(bat0 ? bat0.charge : 0, bat0 ? bat0.discharge : 0), batLine(bat0));
    const lineBat1 = this._line(this._to(bat1 ? BATTERY_POS[1] : null), batActive(bat1), !!bat1 && bat1.charge > bat1.discharge, Math.max(bat1 ? bat1.charge : 0, bat1 ? bat1.discharge : 0), batLine(bat1));
    // the car bypass runs HOME -> car, so its reverse polarity is flipped vs the battery lines:
    // charging runs forward along the curve, discharging reverses it.
    const lineCar = this._line(car ? CAR_CURVE : "", batActive(car), !!car && car.discharge > car.charge, Math.max(car ? car.charge : 0, car ? car.discharge : 0), batLine(car));
    const lineInd = IND_POS.map((pos, i) => {
      const item = individuals[i];
      if (!item) {
        return this._line("", false, true, 0, COLORS.idle);
      }
      return this._line(this._to(pos), item.value > threshold, true, item.value, item.value > threshold ? deviceLine : COLORS.idle);
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
      const icon = isCar ? battery.config.icon || "mdi:car-electric" : this._batteryIcon(battery);
      const name = battery.config.name || (battery.config.entity ? this._state(battery.config.entity)?.attributes?.friendly_name : "") || battery.alt;
      nodes.push(this._node(battery.config.entity, BATTERY_POS[i], "", COLORS.battery, batActive(battery), icon, this._fmt(Math.max(battery.charge, battery.discharge)), battery.soc == null ? "" : Math.round(battery.soc) + "%", name, diaBat(batWatts(battery))));
    });
    individuals.forEach((item, i) => {
      nodes.push(this._node(item.entity, IND_POS[i], "ind", COLORS.individual, item.value > threshold, item.icon, this._fmt(item.value), "", item.name, dia(item.value)));
    });

    return html`
      <ha-card>
        ${config.title ? html`<div class="title">${config.title}</div>` : ""}
        <div class="container">
          <!-- every path is static in this template (nested html templates parse SVG paths as HTML elements) -->
          <svg class="lines" viewBox="0 0 100 100" preserveAspectRatio="none">
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
          </svg>
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
