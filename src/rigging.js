import * as THREE from "three";
import { buildModel } from "./models.js";
import { getCreatureSettings, isCreatureType } from "./creatures.js";

import { isHumanType } from "./humans.js";

const clamp = THREE.MathUtils.clamp;
export function getRigSettings(config) {
  const rig = config.rig || {};
  return {
    enabled: rig.enabled !== false,
    speed: clamp(Number(rig.speed) || 1, 0.25, 2),
    intensity: clamp(Number(rig.intensity) || 1, 0.25, 1.5),
    pose: rig.pose || {},
  };
}
export function validRigSettings(rig) {
  if (rig === undefined) return true;
  if (!rig || typeof rig !== "object" || Array.isArray(rig)) return false;
  if (rig.enabled !== undefined && typeof rig.enabled !== "boolean")
    return false;
  for (const [key, min, max] of [
    ["speed", 0.25, 2],
    ["intensity", 0.25, 1.5],
  ]) {
    if (
      rig[key] !== undefined &&
      (!Number.isFinite(rig[key]) || rig[key] < min || rig[key] > max)
    )
      return false;
  }
  return (
    rig.pose === undefined ||
    (!!rig.pose &&
      typeof rig.pose === "object" &&
      !Array.isArray(rig.pose) &&
      Object.entries(rig.pose).every(
        ([name, values]) =>
          /^Rig_[a-zA-Z0-9_]+$/.test(name) &&
          Array.isArray(values) &&
          values.length === 3 &&
          values.every((v) => Number.isFinite(v) && Math.abs(v) <= 90),
      ))
  );
}

export function buildPreviewModel(config) {
  return (isCreatureType(config.type) || isHumanType(config.type)) &&
    getRigSettings(config).enabled
    ? buildRiggedModel(config)
    : buildModel(config);
}

export function buildRiggedModel(config) {
  const model = buildModel(config);
  const human = isHumanType(config.type);
  if (!isCreatureType(config.type) && !human) return model;
  const anatomy = human
      ? { bodyPlan: "biped", wings: "none" }
      : getCreatureSettings(config),
    settings = getRigSettings(config);
  const parts = [...model.children];
  const byPart = new Map(parts.map((part) => [part.name, part]));
  const bones = [],
    byName = {},
    absolute = new Map(),
    assignments = new Map();
  const limbs = [],
    tails = [],
    wings = [],
    ears = [],
    segments = [];
  function joint(name, position, parent) {
    const bone = new THREE.Bone();
    bone.name = `Rig_${name}`;
    const p = position.clone();
    bone.position
      .copy(p)
      .sub(parent ? absolute.get(parent) : new THREE.Vector3());
    (parent || model).add(bone);
    absolute.set(bone, p);
    byName[bone.name] = bone;
    bones.push(bone);
    return bone;
  }
  const body = byPart.get("body"),
    headPart = byPart.get("head");
  const root = joint("root", new THREE.Vector3(), null);
  const humanPosition = (key) => new THREE.Vector3(...model.humanRig[key]);
  const hips = joint(
    "hips",
    human ? humanPosition("hips") : body.position,
    root,
  );
  const spine = joint(
    "spine",
    human
      ? humanPosition("spine")
      : body.position
          .clone()
          .add(
            new THREE.Vector3(
              0,
              body.scale.y * 0.45,
              anatomy.bodyPlan === "quadruped" ? 0.35 : 0,
            ),
          ),
    hips,
  );
  const neck = joint(
    "neck",
    human
      ? humanPosition("neck")
      : headPart.position.clone().lerp(absolute.get(spine), 0.45),
    spine,
  );
  const head = joint(
    "head",
    human
      ? humanPosition("head")
      : headPart.position
          .clone()
          .add(new THREE.Vector3(0, -headPart.scale.y * 0.45, 0)),
    neck,
  );
  function endpoints(part) {
    part.updateMatrix();
    const h = part.geometry.parameters.height / 2;
    return [
      new THREE.Vector3(0, -h, 0).applyMatrix4(part.matrix),
      new THREE.Vector3(0, h, 0).applyMatrix4(part.matrix),
    ];
  }
  const legs = parts.filter((p) => /^(leg_|bird_leg_)/.test(p.name));
  legs.forEach((part, index) => {
    const [ankle, hip] = endpoints(part);
    const tag = part.name
      .replace("bird_leg_-1", "leg_L")
      .replace("bird_leg_1", "leg_R");
    const upper = joint(`${tag}_upper`, hip, hips);
    const lower = joint(
      `${tag}_lower`,
      hip
        .clone()
        .lerp(ankle, 0.52)
        .add(new THREE.Vector3(0, 0, 0.035)),
      upper,
    );
    const footPart = byPart.get(`foot_${index}`);
    const foot = joint(`${tag}_foot`, footPart.position, lower);
    limbs.push({
      upper,
      lower,
      foot,
      phase:
        anatomy.bodyPlan === "quadruped"
          ? [0, Math.PI, Math.PI, 0][index]
          : index * Math.PI,
      arm: false,
    });
    assignments.set(part.name, {
      chain: [upper, lower],
      start: hip,
      end: ankle,
    });
    assignments.set(footPart.name, { bone: foot });
    for (const p of parts.filter((p) => p.name.startsWith(`claw_${index}_`)))
      assignments.set(p.name, { bone: foot });
  });
  parts
    .filter((p) => p.name.startsWith("arm_"))
    .forEach((part, index) => {
      const [shoulder, wrist] = endpoints(part);
      const upper = joint(`${part.name}_upper`, shoulder, spine);
      const lower = joint(
        `${part.name}_lower`,
        shoulder.clone().lerp(wrist, 0.5),
        upper,
      );
      const hand = joint(`${part.name}_hand`, wrist, lower);
      limbs.push({
        upper,
        lower,
        foot: hand,
        phase: (index + 1) * Math.PI,
        arm: true,
      });
      assignments.set(part.name, {
        chain: [upper, lower],
        start: shoulder,
        end: wrist,
      });
      assignments.set(part.name.replace("arm_", "hand_"), { bone: hand });
    });
  for (const sign of [-1, 1]) {
    const earPart = byPart.get(`ear_${sign}`);
    if (earPart) {
      const ear = joint(
        `ear_${sign < 0 ? "L" : "R"}`,
        earPart.position
          .clone()
          .add(new THREE.Vector3(0, -earPart.scale.y * 0.55, 0)),
        head,
      );
      ears.push(ear);
      assignments.set(earPart.name, { bone: ear });
      assignments.set(`inner_ear_${sign}`, { bone: ear });
    }
    if (anatomy.wings !== "none") {
      const anchor = new THREE.Vector3(
        sign * body.scale.x * 0.63,
        body.position.y + body.scale.y * 0.48,
        -0.22,
      );
      const shoulder = joint(
        `wing_${sign < 0 ? "L" : "R"}_shoulder`,
        anchor,
        spine,
      );
      const elbow = joint(
        `wing_${sign < 0 ? "L" : "R"}_elbow`,
        anchor.clone().add(new THREE.Vector3(sign * 0.65, 0.2, 0)),
        shoulder,
      );
      const tip = joint(
        `wing_${sign < 0 ? "L" : "R"}_tip`,
        anchor.clone().add(new THREE.Vector3(sign * 1.5, 0.25, 0)),
        elbow,
      );
      wings.push({ chain: [shoulder, elbow, tip], sign, anchor });
      for (const part of parts.filter((p) =>
        new RegExp(
          `^(wing_(membrane|finger|shoulder|feather)|crystal_wing)_${sign}($|_)`,
        ).test(p.name),
      )) {
        assignments.set(part.name, { wing: wings.at(-1) });
      }
    }
  }
  const tailPart = byPart.get("tail");
  if (tailPart) {
    for (let i = 0; i < 4; i++)
      tails.push(
        joint(
          `tail_${i}`,
          tailPart.geometry.parameters.path.getPoint(i / 3),
          i ? tails[i - 1] : hips,
        ),
      );
    assignments.set("tail", { tail: tails });
    for (const p of parts.filter((p) => p.name.startsWith("tail_")))
      assignments.set(p.name, { bone: tails.at(-1) });
  }
  for (let i = 3; i >= 0; i--) {
    const part = byPart.get(`serpent_segment_${i}`);
    if (!part) continue;
    const bone = joint(`serpent_${i}`, part.position, segments.at(-1) || hips);
    segments.push(bone);
    assignments.set(part.name, { bone });
  }
  if (human) {
    for (const [part, target] of Object.entries(model.humanRig.bindings)) {
      if (assignments.has(target))
        assignments.set(part, assignments.get(target));
    }
    for (const part of parts) {
      if (/^(pelvis|skirt|tunic_hem|belt|buckle)/.test(part.name))
        assignments.set(part.name, { bone: hips });
      else if (
        /^(cape|backpack|pack_strap|necklace|pendant|lapel)/.test(part.name)
      )
        assignments.set(part.name, { bone: spine });
    }
  }
  model.updateMatrixWorld(true);
  const skeleton = new THREE.Skeleton(bones);
  const indexOf = new Map(bones.map((b, i) => [b, i]));
  function blended(chain, progress) {
    const t = clamp(progress, 0, chain.length - 1),
      first = Math.floor(t),
      next = Math.min(first + 1, chain.length - 1);
    return [
      [chain[first], 1 - (t - first)],
      [chain[next], t - first],
    ];
  }
  const v = new THREE.Vector3();
  for (const part of parts) {
    part.updateMatrix();
    const assignment = assignments.get(part.name);
    let geometry;
    if (
      part.geometry.type === "CylinderGeometry" &&
      (assignment?.chain || assignment?.wing)
    ) {
      const p = part.geometry.parameters;
      geometry = new THREE.CylinderGeometry(
        p.radiusTop,
        p.radiusBottom,
        p.height,
        p.radialSegments,
        6,
        p.openEnded,
        p.thetaStart,
        p.thetaLength,
      );
    } else geometry = part.geometry.clone();
    geometry.applyMatrix4(part.matrix);
    const positions = geometry.getAttribute("position"),
      indices = [],
      weights = [];
    for (let i = 0; i < positions.count; i++) {
      v.fromBufferAttribute(positions, i);
      let influences;
      if (assignment?.bone) influences = [[assignment.bone, 1]];
      else if (assignment?.chain) {
        const direction = assignment.end.clone().sub(assignment.start);
        const t =
          v.clone().sub(assignment.start).dot(direction) / direction.lengthSq();
        influences = blended(assignment.chain, clamp(t * 1.8, 0, 1));
      } else if (assignment?.wing) {
        const w = assignment.wing;
        influences = blended(w.chain, ((v.x - w.anchor.x) * w.sign) / 0.75);
      } else if (assignment?.tail) {
        influences = blended(tails, geometry.getAttribute("uv").getX(i) * 3);
      } else if (
        /^(body|belly|spot|stripe|back|dorsal|shirt|waist|chest_detail|chest_bridge)/.test(
          part.name,
        )
      ) {
        influences = blended(
          [hips, spine],
          (v.y - body.position.y) / Math.max(body.scale.y, 0.1) + 0.5,
        );
      } else if (/neck/.test(part.name)) influences = [[neck, 1]];
      else if (/^(foot|claw)/.test(part.name)) influences = [[hips, 1]];
      else influences = [[head, 1]];
      const ids = [0, 0, 0, 0],
        ws = [0, 0, 0, 0];
      influences.forEach(([bone, weight], slot) => {
        ids[slot] = indexOf.get(bone);
        ws[slot] = weight;
      });
      indices.push(...ids);
      weights.push(...ws);
    }
    geometry.setAttribute(
      "skinIndex",
      new THREE.Uint16BufferAttribute(indices, 4),
    );
    geometry.setAttribute(
      "skinWeight",
      new THREE.Float32BufferAttribute(weights, 4),
    );
    const mesh = new THREE.SkinnedMesh(geometry, part.material);
    mesh.name = part.name;
    mesh.castShadow = mesh.receiveShadow = true;
    model.remove(part);
    part.geometry.dispose();
    model.add(mesh);
    mesh.bind(skeleton, model.matrixWorld);
    // Animated parts need fresh bounds; frustum culling of small attachments is unsafe.
    mesh.frustumCulled = false;
  }
  const base = new Map();
  for (const bone of bones) {
    const pose = settings.pose[bone.name] || [0, 0, 0];
    bone.quaternion.setFromEuler(
      new THREE.Euler(
        ...pose.map((d) =>
          THREE.MathUtils.degToRad(clamp(Number(d) || 0, -90, 90)),
        ),
      ),
    );
    base.set(bone, {
      position: bone.position.clone(),
      quaternion: bone.quaternion.clone(),
      scale: bone.scale.clone(),
    });
  }
  model.rig = {
    skeleton,
    bones,
    byName,
    base,
    root,
    hips,
    head,
    spine,
    limbs,
    wings,
    tails,
    segments,
    ears,
  };
  model.animations = makeClips(model.rig, anatomy, settings);
  Object.assign(model.userData, {
    rigged: true,
    rigType: human ? "procedural-human" : "procedural-creature",
    boneCount: bones.length,
    animationClips: model.animations.map((c) => c.name),
  });
  model.updateMatrixWorld(true);
  skeleton.update();
  return model;
}

export function restorePose(model) {
  if (!model.rig) return;
  for (const [bone, pose] of model.rig.base) {
    bone.position.copy(pose.position);
    bone.quaternion.copy(pose.quaternion);
    bone.scale.copy(pose.scale);
  }
  model.updateMatrixWorld(true);
  model.rig.skeleton.update();
}

function makeClips(rig, anatomy, settings) {
  const moving =
    anatomy.bodyPlan === "serpent"
      ? "Slither"
      : anatomy.bodyPlan === "orb"
        ? "Bounce"
        : "Walk";
  const names = ["Idle", moving, ...(rig.wings.length ? ["Fly"] : [])];
  return names.map((name) => {
    const duration =
      (name === "Idle" ? 3.2 : name === "Fly" ? 1.1 : 1.4) / settings.speed;
    const tracks = [],
      samples = 32,
      times = Array.from(
        { length: samples + 1 },
        (_, i) => (i / samples) * duration,
      );
    const intensity = settings.intensity;
    for (const bone of rig.bones) {
      const quaternions = [],
        positions = [],
        scales = [];
      for (let i = 0; i <= samples; i++) {
        const phase = (i / samples) * Math.PI * 2,
          wave = Math.sin(phase),
          bob = 1 - Math.cos(phase * 2);
        let x = 0,
          y = 0,
          z = 0;
        if (bone === rig.spine) z = wave * (name === "Idle" ? 0.015 : 0.025);
        if (bone === rig.head) {
          y = wave * 0.06;
          x = Math.sin(phase + 0.5) * 0.025;
        }
        const earIndex = rig.ears.indexOf(bone);
        if (earIndex >= 0) z = Math.sin(phase + earIndex) * 0.04;
        const tailIndex = rig.tails.indexOf(bone);
        if (tailIndex >= 0)
          y =
            Math.sin(phase - tailIndex * 0.45) *
            (name === "Idle" ? 0.08 : 0.16);
        const segmentIndex = rig.segments.indexOf(bone);
        if (segmentIndex >= 0)
          y =
            Math.sin(phase - segmentIndex * 0.6) *
            (name === "Slither" ? 0.18 : 0.025);
        for (const limb of rig.limbs) {
          const stride = Math.sin(phase + limb.phase) * intensity;
          const upper =
            name === "Walk"
              ? stride * (limb.arm ? 0.3 : 0.38)
              : name === "Fly"
                ? 0.3 * intensity
                : 0;
          const lower =
            name === "Walk"
              ? Math.max(0, stride) * 0.55
              : name === "Fly"
                ? 0.6 * intensity
                : 0;
          if (bone === limb.upper) x += upper / intensity;
          if (bone === limb.lower) x += lower / intensity;
          if (bone === limb.foot) x -= (upper + lower) / intensity;
        }
        for (const wing of rig.wings) {
          const wingIndex = wing.chain.indexOf(bone);
          if (wingIndex >= 0)
            z +=
              wing.sign *
              (name === "Fly"
                ? wave * [0.65, 0.23, 0.12][wingIndex]
                : wave * 0.025);
        }
        const base = rig.base.get(bone);
        const delta = new THREE.Quaternion().setFromEuler(
          new THREE.Euler(x * intensity, y * intensity, z * intensity),
        );
        const q = base.quaternion.clone().multiply(delta);
        quaternions.push(q.x, q.y, q.z, q.w);
        if (bone === rig.root) {
          const amount =
            name === "Fly"
              ? 0.12 + wave * 0.07
              : name === "Bounce"
                ? bob * 0.1
                : name === "Idle"
                  ? (wave + 1) * 0.008
                  : bob * 0.018;
          const p = base.position.clone();
          p.y += amount * intensity;
          positions.push(...p.toArray());
        }
        if (bone === rig.hips && name === "Bounce")
          scales.push(
            1 + wave * 0.06 * intensity,
            1 - wave * 0.09 * intensity,
            1 + wave * 0.06 * intensity,
          );
      }
      tracks.push(
        new THREE.QuaternionKeyframeTrack(
          `${bone.name}.quaternion`,
          times,
          quaternions,
        ),
      );
      if (positions.length)
        tracks.push(
          new THREE.VectorKeyframeTrack(
            `${bone.name}.position`,
            times,
            positions,
          ),
        );
      if (scales.length)
        tracks.push(
          new THREE.VectorKeyframeTrack(`${bone.name}.scale`, times, scales),
        );
    }
    return new THREE.AnimationClip(name, duration, tracks);
  });
}

// OBJ cannot carry a skeleton. Capture the configured pose into ordinary vertices.
export function bakeSkinnedPose(model) {
  if (!model.rig) return model;
  model.updateMatrixWorld(true);
  model.rig.skeleton.update();
  const baked = new THREE.Group();
  baked.name = model.name;
  baked.position.copy(model.position);
  baked.quaternion.copy(model.quaternion);
  baked.scale.copy(model.scale);
  const materials = new Map(),
    vertex = new THREE.Vector3();
  for (const part of model.children.filter((p) => p.isSkinnedMesh)) {
    const geometry = part.geometry.clone(),
      positions = geometry.getAttribute("position");
    for (let i = 0; i < positions.count; i++) {
      part.getVertexPosition(i, vertex);
      positions.setXYZ(i, vertex.x, vertex.y, vertex.z);
    }
    geometry.deleteAttribute("skinIndex");
    geometry.deleteAttribute("skinWeight");
    geometry.computeVertexNormals();
    if (!materials.has(part.material))
      materials.set(part.material, part.material.clone());
    const mesh = new THREE.Mesh(geometry, materials.get(part.material));
    mesh.name = part.name;
    baked.add(mesh);
  }
  baked.updateMatrixWorld(true);
  return baked;
}
