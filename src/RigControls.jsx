import { Bone, Play, Pause, RotateCcw, Activity } from "lucide-react";
import { isHumanType } from "./humans.js";
import { getRigSettings } from "./rigging.js";

export default function RigControls({
  config,
  info,
  motion,
  onMotion,
  playing,
  onPlaying,
  showBones,
  onShowBones,
  joint,
  onJoint,
  onChange,
  onPose,
}) {
  const settings = getRigSettings(config);
  const joints = info?.joints || [];
  const selected = joints.some((j) => j.name === joint)
    ? joint
    : joints[0]?.name || "";
  const pose = settings.pose[selected] || [0, 0, 0];
  return (
    <section id="creature-rig" className="anatomy-section rig-section">
      <div className="section-heading">
        <div>
          <h2>
            <Bone size={21} />{" "}
            {isHumanType(config.type) ? "Character rig" : "Creature rig"}{" "}
            <span>Give your creation a little life</span>
          </h2>
        </div>
        <label className="rig-toggle">
          <input
            type="checkbox"
            checked={settings.enabled}
            onChange={(e) => onChange({ enabled: e.target.checked })}
          />{" "}
          Auto rig
        </label>
      </div>
      {settings.enabled ? (
        <>
          <div className="rig-layout">
            <div className="rig-motion">
              <span className="eyebrow">ANIMATION PREVIEW</span>
              <div
                className="rig-clips"
                role="group"
                aria-label="Animation preview"
              >
                {["Rest", ...(info?.clips || [])].map((clip) => (
                  <button
                    key={clip}
                    className={`button ${motion === clip ? "primary" : "secondary"}`}
                    aria-pressed={motion === clip}
                    onClick={() => onMotion(clip)}
                  >
                    {clip === "Rest" ? (
                      <Bone size={15} />
                    ) : (
                      <Activity size={15} />
                    )}{" "}
                    {clip}
                  </button>
                ))}
              </div>
              <div className="rig-playback">
                <button
                  className="button secondary"
                  disabled={motion === "Rest"}
                  onClick={() => onPlaying(!playing)}
                  aria-label={playing ? "Pause animation" : "Play animation"}
                >
                  {playing ? <Pause size={15} /> : <Play size={15} />}{" "}
                  {playing ? "Pause" : "Play"}
                </button>
                <label className="rig-toggle">
                  <input
                    type="checkbox"
                    checked={showBones}
                    onChange={(e) => onShowBones(e.target.checked)}
                  />{" "}
                  Show skeleton
                </label>
              </div>
              <label className="rig-range">
                Animation speed <span>{settings.speed.toFixed(2)}×</span>
                <input
                  aria-label="Animation speed"
                  type="range"
                  min="0.25"
                  max="2"
                  step="0.05"
                  value={settings.speed}
                  onChange={(e) => onChange({ speed: Number(e.target.value) })}
                />
              </label>
              <label className="rig-range">
                Movement amount <span>{settings.intensity.toFixed(2)}×</span>
                <input
                  aria-label="Movement amount"
                  type="range"
                  min="0.25"
                  max="1.5"
                  step="0.05"
                  value={settings.intensity}
                  onChange={(e) =>
                    onChange({ intensity: Number(e.target.value) })
                  }
                />
              </label>
              <p className="anatomy-tip">
                Loops play in place. Speed and movement amount are saved into
                the exported clips.
              </p>
            </div>
            <div className="rig-pose">
              <span className="eyebrow">JOINT POSE</span>
              <label className="rig-joint">
                Selected joint
                <select
                  aria-label="Selected joint"
                  value={selected}
                  onChange={(e) => onJoint(e.target.value)}
                >
                  {joints.map((j) => (
                    <option key={j.name} value={j.name}>
                      {j.label}
                    </option>
                  ))}
                </select>
              </label>
              {["X", "Y", "Z"].map((axis, index) => (
                <label key={axis} className="rig-range">
                  {axis} rotation <span>{pose[index]}°</span>
                  <input
                    aria-label={`${axis} joint rotation`}
                    type="range"
                    min="-90"
                    max="90"
                    step="1"
                    value={pose[index]}
                    disabled={!selected}
                    onChange={(e) => {
                      const next = [...pose];
                      next[index] = Number(e.target.value);
                      onPose(selected, next);
                    }}
                  />
                </label>
              ))}
              <button
                className="button secondary"
                onClick={() => {
                  onMotion("Rest");
                  onChange({ pose: {} });
                }}
              >
                <RotateCcw size={15} /> Reset joint poses
              </button>
              <p className="anatomy-tip">
                Joint edits switch to Rest. Your pose becomes the base for every
                animation. Select “head” to turn the face and its attached
                details together.
              </p>
            </div>
          </div>
          <div className="anatomy-footer">
            <span>
              <Bone size={14} /> {joints.length} joints · {info?.meshes || 0}{" "}
              weighted parts
            </span>
            <span>
              GLB: skeleton + animation clips · OBJ: current joint pose
            </span>
          </div>
        </>
      ) : (
        <p className="anatomy-tip">
          Enable Auto rig to create skin weights, editable joints, and animation
          clips for this character. With it off, exports contain a static mesh.
        </p>
      )}
    </section>
  );
}
