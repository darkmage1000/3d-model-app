import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { disposeModel, modelStats } from "./models.js";

import { buildPreviewModel, restorePose } from "./rigging.js";

export default function Viewport({
  config,
  wireframe,
  grid,
  autoRotate,
  resetKey,
  onStats,
  onError,
  onRigInfo,
  motion,
  playing,
  showBones,
  viewFocus = "full",
  previewZoom = 1,
  showSizeReference = false,
}) {
  const host = useRef(null);
  const state = useRef(null);
  const callbacks = useRef({ onStats, onError, onRigInfo });
  callbacks.current = { onStats, onError, onRigInfo };
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const element = host.current;
    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        preserveDrawingBuffer: true,
      });
    } catch {
      callbacks.current.onError(
        "3D preview needs WebGL. Enable hardware acceleration or try a recent Chrome, Firefox, or Safari. You can still customize and export your model.",
      );
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.35;
    renderer.domElement.setAttribute(
      "aria-label",
      "Interactive 3D model preview. Drag to orbit, scroll to zoom, right-drag to pan.",
    );
    renderer.domElement.setAttribute("role", "img");
    renderer.domElement.setAttribute("tabindex", "0");
    element.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(37, 1, 0.01, 100);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.065;
    controls.autoRotateSpeed = 1.1;
    controls.maxPolarAngle = Math.PI * 0.87;
    scene.add(new THREE.HemisphereLight("#fff9e9", "#8caaa3", 2.3));
    const keyLight = new THREE.DirectionalLight("#fff7e8", 3.4);
    keyLight.position.set(-3, 7, 5);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.set(2048, 2048);
    keyLight.shadow.camera.left = -8;
    keyLight.shadow.camera.right = 8;
    keyLight.shadow.camera.top = 8;
    keyLight.shadow.camera.bottom = -8;
    keyLight.shadow.bias = -0.0005;
    keyLight.shadow.normalBias = 0.025;
    keyLight.shadow.radius = 5;
    scene.add(keyLight);
    const rim = new THREE.DirectionalLight("#c3ddd4", 2);
    rim.position.set(4, 4, -5);
    scene.add(rim);
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(20000, 20000),
      new THREE.ShadowMaterial({ opacity: 0.13 }),
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.03;
    floor.receiveShadow = true;
    scene.add(floor);
    const gridHelper = new THREE.GridHelper(16, 32, "#bac8c0", "#ccd5cf");
    gridHelper.material.transparent = true;
    gridHelper.material.opacity = 0.3;
    gridHelper.position.y = -0.025;
    scene.add(gridHelper);
    const reference = new THREE.Group();
    const referenceMaterial = new THREE.MeshStandardMaterial({
      color: "#88978a",
      roughness: 0.85,
      flatShading: true,
    });
    function referencePart(geometry, x, y, z) {
      const mesh = new THREE.Mesh(geometry, referenceMaterial);
      mesh.position.set(x, y, z);
      mesh.castShadow = true;
      reference.add(mesh);
    }
    referencePart(new THREE.SphereGeometry(0.11, 8, 5), 0, 1.69, 0);
    referencePart(new THREE.BoxGeometry(0.28, 0.56, 0.17), 0, 1.22, 0);
    referencePart(new THREE.CylinderGeometry(0.055, 0.05, 0.1, 6), 0, 1.55, 0);
    referencePart(new THREE.BoxGeometry(0.25, 0.17, 0.17), 0, 0.87, 0);
    for (const sign of [-1, 1]) {
      referencePart(
        new THREE.CylinderGeometry(0.066, 0.052, 0.68, 6),
        sign * 0.075,
        0.47,
        0,
      );
      referencePart(
        new THREE.BoxGeometry(0.13, 0.13, 0.25),
        sign * 0.075,
        0.065,
        0.055,
      );
      referencePart(
        new THREE.CylinderGeometry(0.048, 0.038, 0.55, 6),
        sign * 0.195,
        1.17,
        0,
      );
    }
    scene.add(reference);
    const rig = new THREE.Group();
    scene.add(rig);
    state.current = {
      scene,
      camera,
      renderer,
      controls,
      rig,
      gridHelper,
      keyLight,
      reference,
      model: null,
    };
    const observer = new ResizeObserver(() => {
      const width = element.clientWidth,
        height = element.clientHeight;
      if (!width || !height) return;
      renderer.setSize(width, height);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    });
    observer.observe(element);
    let frame;
    const clock = new THREE.Clock();
    function animate() {
      frame = requestAnimationFrame(animate);
      const delta = Math.min(clock.getDelta(), 0.1);
      const current = state.current;
      if (current?.mixer && current.playing) current.mixer.update(delta);
      if (current?.model) current.model.updateMatrixWorld(true);
      if (current?.mixer)
        element.dataset.animationTime = current.mixer.time.toFixed(3);
      controls.update();
      renderer.render(scene, camera);
    }
    animate();
    function lost(event) {
      event.preventDefault();
      callbacks.current.onError(
        "The 3D graphics context was interrupted. Reload the page to restore the preview.",
      );
    }
    renderer.domElement.addEventListener("webglcontextlost", lost);
    setReady(true);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      controls.dispose();
      if (state.current.helper) {
        state.current.helper.geometry.dispose();
        state.current.helper.material.dispose();
      }
      if (state.current.model) {
        state.current.mixer?.uncacheRoot(state.current.model);
        disposeModel(state.current.model);
      }
      reference.children.forEach((mesh) => mesh.geometry.dispose());
      referenceMaterial.dispose();
      floor.geometry.dispose();
      floor.material.dispose();
      gridHelper.geometry.dispose();
      gridHelper.material.dispose();
      renderer.domElement.removeEventListener("webglcontextlost", lost);
      renderer.dispose();
      renderer.forceContextLoss();
      element.removeChild(renderer.domElement);
      state.current = null;
    };
  }, []);

  useEffect(() => {
    if (!ready || !state.current) return;
    const s = state.current;
    if (s.model) {
      s.mixer?.stopAllAction();
      s.mixer?.uncacheRoot(s.model);
      if (s.helper) {
        s.scene.remove(s.helper);
        s.helper.geometry.dispose();
        s.helper.material.dispose();
        s.helper = null;
      }
      s.rig.remove(s.model);
      disposeModel(s.model);
    }
    s.model = buildPreviewModel(config);
    s.rig.add(s.model);
    s.model.traverse((part) => {
      if (part.isMesh) part.material.wireframe = wireframe;
    });
    s.mixer = s.model.rig ? new THREE.AnimationMixer(s.model) : null;
    if (s.model.rig) {
      s.helper = new THREE.SkeletonHelper(s.model);
      s.helper.material.depthTest = false;
      s.helper.material.transparent = true;
      s.helper.material.opacity = 0.9;
      s.helper.renderOrder = 10;
      s.helper.visible = showBones;
      s.scene.add(s.helper);
    }
    callbacks.current.onRigInfo?.({
      joints:
        s.model.rig?.bones.map((b) => ({
          name: b.name,
          label: b.name.replace("Rig_", "").replaceAll("_", " "),
        })) || [],
      clips: s.model.animations.map((c) => c.name),
      meshes: s.model.children.filter((c) => c.isSkinnedMesh).length,
    });
    callbacks.current.onStats(modelStats(s.model));
  }, [config, ready]);

  useEffect(() => {
    const s = state.current;
    if (!s?.model) return;
    s.mixer?.stopAllAction();
    restorePose(s.model);
    const clip = s.model.animations.find((c) => c.name === motion);
    if (clip && s.mixer) s.mixer.clipAction(clip).play();
    s.playing = playing && !!clip;
    host.current.dataset.animation = clip?.name || "Rest";
    if (s.helper) s.helper.visible = showBones;
  }, [config, ready, motion]);

  useEffect(() => {
    const s = state.current;
    if (!s) return;
    s.playing = playing && motion !== "Rest";
    if (s.helper) s.helper.visible = showBones;
  }, [playing, showBones, config, ready, motion]);

  useEffect(() => {
    if (!ready || !state.current?.model) return;
    const s = state.current;
    const focusPart =
      viewFocus === "face" ? s.model.getObjectByName("head") : null;
    const fullBounds = new THREE.Box3().setFromObject(s.model);
    const wholeSize = fullBounds.getSize(new THREE.Vector3());
    s.reference.visible = showSizeReference && !focusPart;
    s.reference.position.set(
      fullBounds.max.x + 0.65,
      0,
      (fullBounds.min.z + fullBounds.max.z) / 2,
    );
    s.reference.updateMatrixWorld(true);
    const bounds = focusPart
      ? new THREE.Box3().setFromObject(focusPart)
      : fullBounds.clone();
    if (s.reference.visible)
      bounds.union(new THREE.Box3().setFromObject(s.reference));
    const span = Math.max(wholeSize.x, wholeSize.y, wholeSize.z, 1);
    const lightScale = Math.max(1, span / 3);
    s.keyLight.position.set(-3 * lightScale, 7 * lightScale, 5 * lightScale);
    const shadowSpan = Math.max(8, span * 1.5);
    Object.assign(s.keyLight.shadow.camera, {
      left: -shadowSpan,
      right: shadowSpan,
      top: shadowSpan,
      bottom: -shadowSpan,
      far: Math.max(500, span * 20),
    });
    s.keyLight.shadow.camera.updateProjectionMatrix();
    s.keyLight.shadow.normalBias = 0.025 * lightScale;
    s.gridHelper.scale.setScalar(Math.max(1, span / 8));
    host.current.dataset.referenceVisible = String(s.reference.visible);
    const size = bounds.getSize(new THREE.Vector3());
    const center = bounds.getCenter(new THREE.Vector3());
    const framing = Math.max(
      size.y,
      size.x / Math.min(s.camera.aspect || 1, 1.5),
      size.z,
      focusPart ? 0.45 : 1,
    );
    const distance =
      (framing / (2 * Math.tan(THREE.MathUtils.degToRad(s.camera.fov / 2)))) *
      1.2;
    s.camera.near = Math.max(0.01, span / 10000);
    s.camera.far = Math.max(100, distance + span * 20);
    s.camera.updateProjectionMatrix();
    s.camera.position
      .copy(center)
      .add(
        new THREE.Vector3(focusPart ? 0 : 0.8, focusPart ? 0.03 : 0.38, 1)
          .normalize()
          .multiplyScalar(distance),
      );
    s.controls.target.copy(center);
    s.controls.minDistance = framing * 0.1;
    s.controls.maxDistance = framing * 8;
    s.controls.update();
  }, [
    config.type,
    config.scale,
    config.creature,
    config.human,
    viewFocus,
    showSizeReference,
    config.seed,
    resetKey,
    ready,
  ]);

  useEffect(() => {
    const s = state.current;
    if (!s) return;
    s.camera.zoom = previewZoom;
    s.camera.updateProjectionMatrix();
    host.current.dataset.previewZoom = String(previewZoom);
  }, [previewZoom, ready]);

  useEffect(() => {
    const s = state.current;
    if (!s) return;
    s.gridHelper.visible = grid;
    s.controls.autoRotate = autoRotate;
    s.model?.traverse((part) => {
      if (part.isMesh) part.material.wireframe = wireframe;
    });
  }, [grid, autoRotate, wireframe, ready]);

  return <div className="canvas-host" ref={host} data-testid="viewport" />;
}
