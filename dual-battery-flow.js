window.customCards = window.customCards || [];
window.customCards.push({
  type: "dual-battery-flow-card",
  name: "dual battery flow card",
  description: "Compact grouped flow diagram: Inputs, Batteries (house + garage + optional car) and top Devices flow into the Home hub with magnitude-weighted animated lines.",
  preview: false,
});

const LitElement = customElements.get("ha-panel-lovelace") ? Object.getPrototypeOf(customElements.get("ha-panel-lovelace")) : Object.getPrototypeOf(customElements.get("hc-lovelace"));
const html = LitElement.prototype.html;
const css = LitElement.prototype.css;

const COLORS = {
  solar: "#f6a623",
  import: "#ef6c00",
  export: "#43a047",
  charge: "#29b6f6",
  discharge: "#43a047",
  home: "#546e7a",
  individual: "#8e24aa",
  idle: "var(--disabled-text-color, #9e9e9e)",
};

const HOME = [48, 40];

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
      ha-card {
        padding-bottom: 10px;
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
        aspect-ratio: 100 / 64;
        min-height: 240px;
        max-height: 400px;
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
        gap: 4px;
      }
      .node.idle {
        opacity: 0.6;
      }
      .circle {
        display: flex;
        align-items: center;
        justify-content: center;
        width: clamp(56px, 15cqw, 76px);
        height: clamp(56px, 15cqw, 76px);
        border-radius: 50%;
        background: var(--ha-card-background, var(--card-background-color, #fff));
        box-shadow: 0 0 0 2px var(--ring-color), 0 2px 6px rgba(0, 0, 0, 0.25);
        transition: box-shadow 0.2s;
      }
      .node.hero .circle {
        width: clamp(62px, 17cqw, 84px);
        height: clamp(62px, 17cqw, 84px);
      }
      .node.ind .circle {
        width: clamp(48px, 12cqw, 66px);
        height: clamp(48px, 12cqw, 66px);
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
        --mdc-icon-size: clamp(16px, 3.6cqw, 22px);
        color: var(--ring-color);
      }
      .node.ind .circle ha-icon {
        --mdc-icon-size: clamp(13px, 3cqw, 18px);
      }
      .value {
        font-size: clamp(12px, 3.1cqw, 16px);
        font-weight: 700;
        font-variant-numeric: tabular-nums;
        color: var(--primary-text-color);
        background: var(--ha-card-background, var(--card-background-color, #fff));
        padding: 0 4px;
        border-radius: 4px;
      }
      .node.ind .value {
        font-size: clamp(10px, 2.6cqw, 13px);
      }
      .state {
        font-size: 10px;
        color: var(--secondary-text-color);
      }
      .label {
        font-size: clamp(10px, 2.4cqw, 12px);
        max-width: 110px;
        text-align: center;
        color: var(--secondary-text-color);
        background: var(--ha-card-background, var(--card-background-color, #fff));
        padding: 0 4px;
        border-radius: 4px;
      }
      @container (max-width: 400px) {
        .circle {
          width: 44px;
          height: 44px;
        }
        .node.hero .circle {
          width: 50px;
          height: 50px;
        }
        .node.ind .circle {
          width: 40px;
          height: 40px;
        }
        .circle ha-icon {
          --mdc-icon-size: 13px;
        }
        .node.ind .circle ha-icon {
          --mdc-icon-size: 11px;
        }
        .value {
          font-size: 10px;
        }
        .node.ind .value {
          font-size: 9px;
        }
        .label {
          font-size: 9px;
        }
      }
      @media (max-width: 480px) {
        .circle {
          width: 44px;
          height: 44px;
        }
        .node.hero .circle {
          width: 50px;
          height: 50px;
        }
        .node.ind .circle {
          width: 40px;
          height: 40px;
        }
        .circle ha-icon {
          --mdc-icon-size: 13px;
        }
        .node.ind .circle ha-icon {
          --mdc-icon-size: 11px;
        }
        .value {
          font-size: 10px;
        }
        .node.ind .value {
          font-size: 9px;
        }
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
    return 3;
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

  _batteryColor(battery) {
    if (!battery) {
      return COLORS.idle;
    }
    if (battery.charge > 10 && battery.charge >= battery.discharge) {
      return COLORS.charge;
    }
    if (battery.discharge > 10) {
      return COLORS.discharge;
    }
    return COLORS.idle;
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
  _line(pos, active, reverse, watts, color) {
    return {
      d: pos ? "M " + pos[0] + "," + pos[1] + " L " + HOME[0] + "," + HOME[1] : "",
      cls: "flow" + (active ? " active" : "") + (reverse ? " reverse" : ""),
      style: "stroke:" + color + ";stroke-width:" + Math.min(6, Math.max(1.5, 1.5 + (Math.abs(watts) / 1000) * 0.9)).toFixed(2) + "px",
    };
  }

  _node(entity, pos, cls, color, active, icon, valueText, stateText, labelText, extraStyle) {
    const klass = "node" + (cls ? " " + cls : "") + (active ? " active" : " idle");
    const style = "left:" + pos[0] + "%;top:" + pos[1] + "%;--ring-color:" + color + (extraStyle ? ";" + extraStyle : "") + ";";
    const inner = html`
      <div class="circle"><ha-icon icon="${icon}"></ha-icon></div>
      <div class="value">${valueText}</div>
      ${stateText ? html`<div class="state">${stateText}</div>` : ""}
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
    const gridColor = gridActive ? (gridImport ? COLORS.import : COLORS.export) : COLORS.idle;
    const homeActive = values.home > threshold;

    const members = values.car ? [...values.batteries, values.car] : values.batteries;
    const batteryPos = [[34, 82], [52, 82], [70, 82]];
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
    const indPos = [[87, 18], [87, 40], [87, 62], [87, 84]];

    const lineSolar = this._line(config.solar ? [14, 20] : null, solarActive, false, values.solar, solarActive ? COLORS.solar : COLORS.idle);
    const lineGrid = this._line(config.grid ? [14, 60] : null, gridActive, !gridImport, values.gridNet, gridColor);
    const lineBat0 = this._line(bat0 ? batteryPos[0] : null, batActive(bat0), !!bat0 && bat0.charge > bat0.discharge, Math.max(bat0 ? bat0.charge : 0, bat0 ? bat0.discharge : 0), this._batteryColor(bat0));
    const lineBat1 = this._line(bat1 ? batteryPos[1] : null, batActive(bat1), !!bat1 && bat1.charge > bat1.discharge, Math.max(bat1 ? bat1.charge : 0, bat1 ? bat1.discharge : 0), this._batteryColor(bat1));
    const lineCar = this._line(car ? batteryPos[2] : null, batActive(car), !!car && car.charge > car.discharge, Math.max(car ? car.charge : 0, car ? car.discharge : 0), this._batteryColor(car));
    const lineInd = indPos.map((pos, i) => {
      const item = individuals[i];
      if (!item) {
        return this._line(null, false, true, 0, COLORS.idle);
      }
      return this._line(pos, item.value > threshold, true, item.value, item.value > threshold ? COLORS.individual : COLORS.idle);
    });

    const nodes = [];
    if (config.solar) {
      nodes.push(this._node(config.solar, [14, 20], "", solarActive ? COLORS.solar : COLORS.idle, solarActive, "mdi:weather-sunny", this._fmt(values.solar), "", "Solar"));
    }
    if (config.grid) {
      nodes.push(this._node(config.grid.consumption || config.grid.production, [14, 60], "", gridColor, gridActive, "mdi:transmission-tower", this._fmt(Math.abs(values.gridNet)), gridActive ? (gridImport ? "import" : "export") : "idle", "Grid"));
    }
    nodes.push(this._node(config.home, [48, 40], "hero", COLORS.home, homeActive, "mdi:home", this._fmt(values.home), "", "Home"));
    members.forEach((battery, i) => {
      const isCar = battery === values.car;
      const icon = isCar ? battery.config.icon || "mdi:car-electric" : this._batteryIcon(battery);
      const name = battery.config.name || (battery.config.entity ? this._state(battery.config.entity)?.attributes?.friendly_name : "") || battery.alt;
      const color = this._batteryColor(battery);
      nodes.push(this._node(battery.config.entity, batteryPos[i], "", color, batActive(battery), icon, this._fmt(Math.max(battery.charge, battery.discharge)), battery.soc == null ? "" : Math.round(battery.soc) + "%", name));
    });
    individuals.forEach((item, i) => {
      nodes.push(this._node(item.entity, indPos[i], "ind", item.value > threshold ? COLORS.individual : COLORS.idle, item.value > threshold, item.icon, this._fmt(item.value), "", item.name, "z-index:" + (5 - i)));
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
          <span class="group-tag" style="left:2%;bottom:1%">Batteries</span>
          <span class="group-tag" style="right:2%;top:2%">Devices</span>
          ${nodes}
        </div>
      </ha-card>
    `;
  }
}

customElements.define("dual-battery-flow-card", DualBatteryFlowCard);
