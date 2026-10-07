import { Dices, Fingerprint, Shapes, Sparkles } from "lucide-react";
import {
  CREATURE_OPTIONS,
  ELEMENTS,
  getCreatureSettings,
} from "./creatures.js";

function SelectField({ label, field, value, options, onChange }) {
  return (
    <label className="anatomy-select">
      <span>{label}</span>
      <select
        aria-label={label}
        value={value}
        onChange={(event) => onChange({ [field]: event.target.value })}
      >
        {Object.entries(options).map(([key, text]) => (
          <option key={key} value={key}>
            {text}
          </option>
        ))}
      </select>
    </label>
  );
}

function RangeField({
  label,
  field,
  value,
  min,
  max,
  onChange,
  disabled = false,
}) {
  return (
    <label
      className={`anatomy-range ${disabled ? "is-disabled" : ""}`}
      title={disabled ? "This body plan has no legs to lengthen." : undefined}
    >
      <div>
        <span>{label}</span>
        <output>{disabled ? "Not applicable" : `${value.toFixed(2)}×`}</output>
      </div>
      <input
        aria-label={label}
        type="range"
        min={min}
        max={max}
        step="0.05"
        value={value}
        disabled={disabled}
        onChange={(event) => onChange({ [field]: Number(event.target.value) })}
      />
    </label>
  );
}

export default function CreatureControls({
  config,
  onChange,
  onElement,
  onSurprise,
}) {
  const settings = getCreatureSettings(config);
  return (
    <section className="anatomy-panel" aria-label="Creature anatomy">
      <div className="anatomy-heading">
        <span className="anatomy-heading-icon">
          <Shapes size={22} />
        </span>
        <div>
          <span className="eyebrow">YOUR SPECIES. YOUR RULES.</span>
          <h2>Give it a little character.</h2>
          <p>
            Mix anatomy, elements, and personality to find a creature that
            belongs in your world.
          </p>
        </div>
        <button className="button secondary" onClick={onSurprise}>
          <Dices size={16} />
          Surprise me
        </button>
      </div>
      <div className="anatomy-grid">
        <div className="anatomy-group">
          <h3>
            <Shapes size={15} />
            Body & proportions
          </h3>
          <SelectField
            label="Body plan"
            field="bodyPlan"
            value={settings.bodyPlan}
            options={CREATURE_OPTIONS.bodyPlan}
            onChange={onChange}
          />
          <RangeField
            label="Head size"
            field="headSize"
            min="0.7"
            max="1.5"
            value={settings.headSize}
            onChange={onChange}
          />
          <RangeField
            label="Body width"
            field="bodyWidth"
            min="0.7"
            max="1.4"
            value={settings.bodyWidth}
            onChange={onChange}
          />
          <RangeField
            label="Leg length"
            field="legLength"
            min="0.65"
            max="1.4"
            value={settings.legLength}
            onChange={onChange}
            disabled={
              settings.bodyPlan === "serpent" || settings.bodyPlan === "orb"
            }
          />
          <label className="anatomy-range">
            <div>
              <span>Snout length</span>
              <output>{settings.snout.toFixed(2)}</output>
            </div>
            <input
              aria-label="Snout length"
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={settings.snout}
              onChange={(event) =>
                onChange({ snout: Number(event.target.value) })
              }
            />
          </label>
        </div>
        <div className="anatomy-group">
          <h3>
            <Fingerprint size={15} />
            Silhouette & features
          </h3>
          <SelectField
            label="Ear style"
            field="ears"
            value={settings.ears}
            options={CREATURE_OPTIONS.ears}
            onChange={onChange}
          />
          <SelectField
            label="Horn style"
            field="horns"
            value={settings.horns}
            options={CREATURE_OPTIONS.horns}
            onChange={onChange}
          />
          <SelectField
            label="Wing style"
            field="wings"
            value={settings.wings}
            options={CREATURE_OPTIONS.wings}
            onChange={onChange}
          />
          <SelectField
            label="Tail style"
            field="tail"
            value={settings.tail}
            options={CREATURE_OPTIONS.tail}
            onChange={onChange}
          />
          <SelectField
            label="Back details"
            field="crest"
            value={settings.crest}
            options={CREATURE_OPTIONS.crest}
            onChange={onChange}
          />
        </div>
        <div className="anatomy-group">
          <h3>
            <Sparkles size={15} />
            Element & personality
          </h3>
          <label className="anatomy-select">
            <span>Element</span>
            <select
              aria-label="Element"
              value={settings.element}
              onChange={(event) => onElement(event.target.value)}
            >
              {Object.entries(ELEMENTS).map(([key, value]) => (
                <option key={key} value={key}>
                  {value.name}
                </option>
              ))}
            </select>
          </label>
          <SelectField
            label="Body pattern"
            field="pattern"
            value={settings.pattern}
            options={CREATURE_OPTIONS.pattern}
            onChange={onChange}
          />
          <label className="anatomy-select">
            <span>Eye count</span>
            <select
              aria-label="Eye count"
              value={settings.eyeCount}
              onChange={(event) =>
                onChange({ eyeCount: Number(event.target.value) })
              }
            >
              <option value="1">One · cyclops</option>
              <option value="2">Two</option>
              <option value="3">Three · unusual</option>
            </select>
          </label>
          <label className="anatomy-range temperament">
            <div>
              <span>Temperament</span>
              <output>
                {settings.temperament < 0.4
                  ? "Friendly"
                  : settings.temperament > 0.6
                    ? "Fierce"
                    : "Watchful"}
              </output>
            </div>
            <input
              aria-label="Temperament"
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={settings.temperament}
              onChange={(event) =>
                onChange({ temperament: Number(event.target.value) })
              }
            />
            <div className="range-ticks">
              <span>Cute companion</span>
              <span>Wild monster</span>
            </div>
          </label>
          <p className="anatomy-tip">
            Try antlers on a fin-tailed creature, or crystal wings on a friendly
            cyclops. The variation seed changes proportions and markings.
          </p>
        </div>
      </div>
      <div className="anatomy-footer">
        <span>
          <Fingerprint size={13} />
          Deterministic variations · colors stay editable
        </span>
        <span>Named mesh parts · automatic rig adapts to your anatomy</span>
      </div>
    </section>
  );
}
