import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// A simple articulated mannequin built from capsules + spheres. Each joint is a
// THREE.Group positioned at its parent joint's end; the mesh hangs beneath so the
// group's rotation rotates the whole downstream chain.

export function renderPose3D(root) {
  root.innerHTML = `
    <section class="panel">
      <h1>3D Pose reference</h1>
      <p style="color:var(--muted); margin-top:-4px;">
        <b>Click &amp; drag any body part</b> to pose it directly. Drag the
        <b>hand</b> or <b>foot</b> and the whole limb follows (2-bone IK). Drag the
        <b>hips</b> to turn the whole figure. Drag the empty background to orbit
        the camera; scroll to zoom. Fine-tune with the sliders or a preset, then
        save the silhouette as a tracing reference.
      </p>
      <div id="pose3d-root">
        <canvas id="pose3d-canvas"></canvas>
        <aside class="pose-ctrl" id="pose-ctrl"></aside>
      </div>
    </section>
  `;

  const canvas = root.querySelector('#pose3d-canvas');
  const ctrl = root.querySelector('#pose-ctrl');

  // renderer
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(window.devicePixelRatio || 1);
  const resize = () => {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x11111b);
  scene.fog = new THREE.Fog(0x11111b, 8, 20);

  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
  camera.position.set(0, 1.4, 5);

  // lights
  scene.add(new THREE.HemisphereLight(0xddeeff, 0x222233, 0.7));
  const sun = new THREE.DirectionalLight(0xffffff, 1.2);
  sun.position.set(3, 6, 4);
  scene.add(sun);
  const rim = new THREE.DirectionalLight(0xffb480, 0.6);
  rim.position.set(-4, 2, -3);
  scene.add(rim);

  // ground
  const ground = new THREE.Mesh(
    new THREE.CircleGeometry(6, 64),
    new THREE.MeshStandardMaterial({ color: 0x1a1a26, roughness: 1 })
  );
  ground.rotation.x = -Math.PI / 2;
  scene.add(ground);
  // subtle grid
  const grid = new THREE.GridHelper(8, 16, 0x2a2a3c, 0x1e1e2c);
  grid.position.y = 0.001;
  scene.add(grid);

  // controls
  const controls = new OrbitControls(camera, canvas);
  controls.target.set(0, 1, 0);
  controls.enableDamping = true;
  controls.dampingFactor = 0.1;
  controls.minDistance = 2;
  controls.maxDistance = 10;

  // mannequin
  const mat = new THREE.MeshStandardMaterial({ color: 0xe7c09a, roughness: 0.6, metalness: 0.05 });
  const jointMat = new THREE.MeshStandardMaterial({ color: 0xc98b66, roughness: 0.5, metalness: 0.1 });

  // group hierarchy — all measurements in "body units". 1 unit ≈ 1 m.
  const joints = {};

  function bone(parent, name, length, radius, offsetY = 0) {
    const group = new THREE.Group();
    group.position.y = offsetY; // positioned at the joint
    parent.add(group);
    // mesh hangs DOWN from group origin (joint)
    const seg = new THREE.Mesh(new THREE.CapsuleGeometry(radius, length - radius * 2, 6, 12), mat);
    seg.position.y = -length / 2;
    group.add(seg);
    const ball = new THREE.Mesh(new THREE.SphereGeometry(radius * 1.15, 16, 12), jointMat);
    group.add(ball);
    group.userData = { length };
    joints[name] = group;
    return group;
  }

  // root (pelvis)
  const pelvis = new THREE.Group();
  pelvis.position.set(0, 1.0, 0);
  scene.add(pelvis);
  joints.pelvis = pelvis;

  // Hip plate — drag this to rotate the whole figure.
  const hipBox = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.22, 0.28), mat);
  pelvis.add(hipBox);
  hipBox.userData.jointKey = 'pelvis';

  // Spine / torso — bone up, so we flip: attach and rotate manually.
  const torsoGroup = new THREE.Group();
  pelvis.add(torsoGroup);
  joints.torso = torsoGroup;
  // torso mesh goes upward from pelvis
  const torsoLen = 0.65;
  const torsoMesh = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.18, torsoLen - 0.36, 8, 16),
    mat
  );
  torsoMesh.position.y = torsoLen / 2 + 0.05;
  torsoGroup.add(torsoMesh);
  torsoGroup.userData = { length: torsoLen };

  // shoulders plate
  const shoulderPlate = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.14, 0.28), mat);
  shoulderPlate.position.y = torsoLen + 0.08;
  torsoGroup.add(shoulderPlate);
  torsoMesh.userData.jointKey = 'torso';
  shoulderPlate.userData.jointKey = 'torso';

  // Head
  const neckGroup = new THREE.Group();
  neckGroup.position.y = torsoLen + 0.15;
  torsoGroup.add(neckGroup);
  joints.neck = neckGroup;
  const neckMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 0.14, 12), mat);
  neckMesh.position.y = 0.07;
  neckGroup.add(neckMesh);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.22, 20, 16), mat);
  head.position.y = 0.26;
  head.scale.y = 1.2;
  neckGroup.add(head);
  neckMesh.userData.jointKey = 'neck';
  head.userData.jointKey = 'neck';

  // Arms (hanging down from shoulder)
  function makeArm(sideSign, name) {
    const shoulderKey = name + 'Shoulder';
    const elbowKey = name + 'Elbow';
    const shoulder = new THREE.Group();
    shoulder.position.set(sideSign * 0.28, torsoLen + 0.08, 0);
    torsoGroup.add(shoulder);
    joints[shoulderKey] = shoulder;
    // Upper arm hangs down
    const upper = new THREE.Mesh(new THREE.CapsuleGeometry(0.07, 0.24, 6, 12), mat);
    upper.position.y = -0.20;
    shoulder.add(upper);
    const shoulderBall = new THREE.Mesh(new THREE.SphereGeometry(0.09, 14, 10), jointMat);
    shoulder.add(shoulderBall);
    upper.userData.jointKey = shoulderKey;
    shoulderBall.userData.jointKey = shoulderKey;

    const elbow = new THREE.Group();
    elbow.position.y = -0.40;
    shoulder.add(elbow);
    joints[elbowKey] = elbow;
    const lower = new THREE.Mesh(new THREE.CapsuleGeometry(0.06, 0.22, 6, 12), mat);
    lower.position.y = -0.18;
    elbow.add(lower);
    const elbowBall = new THREE.Mesh(new THREE.SphereGeometry(0.075, 14, 10), jointMat);
    elbow.add(elbowBall);
    lower.userData.jointKey = elbowKey;
    elbowBall.userData.jointKey = elbowKey;

    // wrist + hand (mitten)
    const wrist = new THREE.Group();
    wrist.position.y = -0.36;
    elbow.add(wrist);
    joints[name + 'Wrist'] = wrist;
    const hand = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.17, 0.06), mat);
    hand.position.y = -0.08;
    wrist.add(hand);
    // dragging the hand runs 2-bone IK on the whole arm (shoulder + elbow)
    hand.userData.jointKey = name + 'Hand';
  }
  makeArm(1, 'right');
  makeArm(-1, 'left');

  // Legs
  function makeLeg(sideSign, name) {
    const hipKey = name + 'Hip';
    const kneeKey = name + 'Knee';
    const hip = new THREE.Group();
    hip.position.set(sideSign * 0.12, -0.05, 0);
    pelvis.add(hip);
    joints[hipKey] = hip;
    const upper = new THREE.Mesh(new THREE.CapsuleGeometry(0.09, 0.36, 6, 12), mat);
    upper.position.y = -0.26;
    hip.add(upper);
    const hipBall = new THREE.Mesh(new THREE.SphereGeometry(0.11, 14, 10), jointMat);
    hip.add(hipBall);
    upper.userData.jointKey = hipKey;
    hipBall.userData.jointKey = hipKey;

    const knee = new THREE.Group();
    knee.position.y = -0.52;
    hip.add(knee);
    joints[kneeKey] = knee;
    const lower = new THREE.Mesh(new THREE.CapsuleGeometry(0.075, 0.34, 6, 12), mat);
    lower.position.y = -0.25;
    knee.add(lower);
    const kneeBall = new THREE.Mesh(new THREE.SphereGeometry(0.09, 14, 10), jointMat);
    knee.add(kneeBall);
    lower.userData.jointKey = kneeKey;
    kneeBall.userData.jointKey = kneeKey;

    const ankle = new THREE.Group();
    ankle.position.y = -0.50;
    knee.add(ankle);
    joints[name + 'Ankle'] = ankle;
    const foot = new THREE.Mesh(new THREE.BoxGeometry(0.10, 0.06, 0.22), mat);
    foot.position.set(0, -0.03, 0.06);
    ankle.add(foot);
    // dragging the foot runs 2-bone IK on the whole leg (hip + knee)
    foot.userData.jointKey = name + 'Foot';
  }
  makeLeg(1, 'right');
  makeLeg(-1, 'left');

  // ----- joint control definitions -----
  // Each entry: {label, target-path (joint name), axis: 'x'|'y'|'z', min, max}
  const jointDefs = [
    { label: 'Pelvis rotate (facing)', key: 'pelvis', axis: 'y', min: -Math.PI, max: Math.PI },
    { label: 'Pelvis tilt (front)',    key: 'pelvis', axis: 'x', min: -0.6, max: 0.6 },
    { label: 'Pelvis lean (l/r)',      key: 'pelvis', axis: 'z', min: -0.5, max: 0.5 },

    { label: 'Head tilt (front/back)', key: 'neck', axis: 'x', min: -0.9, max: 0.9 },
    { label: 'Head turn (l/r)',        key: 'neck', axis: 'y', min: -1.5, max: 1.5 },
    { label: 'Head tilt (l/r)',        key: 'neck', axis: 'z', min: -0.6, max: 0.6 },

    { label: 'Torso bend (front/back)', key: 'torso', axis: 'x', min: -1.2, max: 1.2 },
    { label: 'Torso twist',             key: 'torso', axis: 'y', min: -1.4, max: 1.4 },
    { label: 'Torso lean (l/r)',        key: 'torso', axis: 'z', min: -0.8, max: 0.8 },

    { label: 'L shoulder fwd/back',    key: 'leftShoulder', axis: 'x', min: -3.0, max: 3.0 },
    { label: 'L shoulder out',         key: 'leftShoulder', axis: 'z', min: -2.4, max: 1.0 },
    { label: 'L shoulder rotate',      key: 'leftShoulder', axis: 'y', min: -1.9, max: 1.9 },
    { label: 'L elbow bend',           key: 'leftElbow', axis: 'x', min: 0, max: 2.8 },
    { label: 'L forearm twist',        key: 'leftElbow', axis: 'y', min: -1.6, max: 1.6 },
    { label: 'L wrist bend',           key: 'leftWrist', axis: 'x', min: -1.2, max: 1.2 },
    { label: 'L wrist side',           key: 'leftWrist', axis: 'z', min: -0.5, max: 0.5 },

    { label: 'R shoulder fwd/back',    key: 'rightShoulder', axis: 'x', min: -3.0, max: 3.0 },
    { label: 'R shoulder out',         key: 'rightShoulder', axis: 'z', min: -1.0, max: 2.4 },
    { label: 'R shoulder rotate',      key: 'rightShoulder', axis: 'y', min: -1.9, max: 1.9 },
    { label: 'R elbow bend',           key: 'rightElbow', axis: 'x', min: 0, max: 2.8 },
    { label: 'R forearm twist',        key: 'rightElbow', axis: 'y', min: -1.6, max: 1.6 },
    { label: 'R wrist bend',           key: 'rightWrist', axis: 'x', min: -1.2, max: 1.2 },
    { label: 'R wrist side',           key: 'rightWrist', axis: 'z', min: -0.5, max: 0.5 },

    { label: 'L hip fwd/back',         key: 'leftHip', axis: 'x', min: -1.8, max: 2.4 },
    { label: 'L hip out',              key: 'leftHip', axis: 'z', min: -1.6, max: 0.5 },
    { label: 'L hip rotate',           key: 'leftHip', axis: 'y', min: -1.2, max: 1.2 },
    { label: 'L knee bend',            key: 'leftKnee', axis: 'x', min: -2.8, max: 0.1 },
    { label: 'L ankle point',          key: 'leftAnkle', axis: 'x', min: -0.8, max: 1.0 },
    { label: 'L ankle tilt',           key: 'leftAnkle', axis: 'z', min: -0.4, max: 0.4 },

    { label: 'R hip fwd/back',         key: 'rightHip', axis: 'x', min: -1.8, max: 2.4 },
    { label: 'R hip out',              key: 'rightHip', axis: 'z', min: -0.5, max: 1.6 },
    { label: 'R hip rotate',           key: 'rightHip', axis: 'y', min: -1.2, max: 1.2 },
    { label: 'R knee bend',            key: 'rightKnee', axis: 'x', min: -2.8, max: 0.1 },
    { label: 'R ankle point',          key: 'rightAnkle', axis: 'x', min: -0.8, max: 1.0 },
    { label: 'R ankle tilt',           key: 'rightAnkle', axis: 'z', min: -0.4, max: 0.4 },
  ];

  // presets (all values in radians)
  const presets = {
    'Idle': {},
    'Walking': {
      leftShoulder_x: -0.7, rightShoulder_x: 0.7,
      leftHip_x: 0.6, rightHip_x: -0.4,
      leftKnee_x: -0.3, rightKnee_x: -0.8,
    },
    'Running': {
      torso_x: 0.3,
      leftShoulder_x: -1.4, rightShoulder_x: 1.3,
      leftElbow_x: 1.6, rightElbow_x: 1.6,
      leftHip_x: 1.2, rightHip_x: -0.8,
      leftKnee_x: -1.6, rightKnee_x: -1.1,
    },
    'Contrapposto': {
      torso_z: 0.2, torso_y: 0.2,
      leftHip_z: -0.15, rightHip_z: 0.15,
      rightKnee_x: -0.3,
    },
    'Power stance': {
      torso_z: 0,
      leftShoulder_z: -0.6, rightShoulder_z: 0.6,
      leftHip_z: -0.3, rightHip_z: 0.3,
      leftKnee_x: -0.2, rightKnee_x: -0.2,
    },
    'Wave': {
      rightShoulder_x: -2.0, rightShoulder_z: 1.0,
      rightElbow_x: 1.2,
    },
    'Sit': {
      torso_x: 0.1,
      leftHip_x: 1.5, rightHip_x: 1.5,
      leftKnee_x: -1.7, rightKnee_x: -1.7,
    },
  };

  // ----- UI -----
  ctrl.innerHTML = `
    <h3>Presets</h3>
    <div class="preset-row" id="preset-row"></div>
    <button class="btn" id="reset-pose" style="width:100%; margin-bottom:10px;">↺ Reset</button>
    <button class="btn primary" id="snap-pose" style="width:100%; margin-bottom:10px;">📸 Save pose as reference</button>
    <h3>Joints</h3>
    <div id="slider-host"></div>
  `;

  const sliderHost = ctrl.querySelector('#slider-host');
  const sliderEls = [];
  jointDefs.forEach(def => {
    const wrap = document.createElement('div');
    wrap.className = 'slider-group';
    const id = `${def.key}_${def.axis}`;
    wrap.innerHTML = `
      <label><span>${def.label}</span><span class="val" data-val-for="${id}">0°</span></label>
      <input type="range" min="${def.min}" max="${def.max}" step="0.01" value="0" data-joint="${id}">
    `;
    sliderHost.appendChild(wrap);
    const input = wrap.querySelector('input');
    const valEl = wrap.querySelector(`[data-val-for="${id}"]`);
    input.addEventListener('input', () => {
      const v = Number(input.value);
      joints[def.key].rotation[def.axis] = v;
      valEl.textContent = Math.round((v * 180) / Math.PI) + '°';
    });
    sliderEls.push({ input, def, valEl });
  });

  function setPose(poseMap) {
    sliderEls.forEach(({ input, def, valEl }) => {
      const id = `${def.key}_${def.axis}`;
      const v = poseMap[id] || 0;
      input.value = v;
      joints[def.key].rotation[def.axis] = v;
      valEl.textContent = Math.round((v * 180) / Math.PI) + '°';
    });
  }

  // ----- direct-manipulation (click & drag body parts) -----
  // Build per-joint axis limits; any axis not declared is locked to 0.
  const jointLimits = {};
  jointDefs.forEach(def => {
    if (!jointLimits[def.key]) {
      jointLimits[def.key] = { x: { min: 0, max: 0 }, y: { min: 0, max: 0 }, z: { min: 0, max: 0 } };
    }
    jointLimits[def.key][def.axis] = { min: def.min, max: def.max };
  });

  // Collect every mesh tagged with a jointKey so raycasting is cheap and unambiguous.
  const draggable = [];
  scene.traverse(obj => { if (obj.isMesh && obj.userData.jointKey) draggable.push(obj); });

  // 2-bone IK chains. When the user drags a hand/foot, we solve shoulder+elbow (or hip+knee)
  // so the whole limb follows. midBendSign is the rotation sign convention for the mid-joint
  // in our rig (elbow uses +x to bend, knee uses -x). pole hints which side the mid-joint
  // should bulge toward when the limb is currently straight.
  const ikChains = {
    leftHand:  { rootKey: 'leftShoulder',  midKey: 'leftElbow',  pole: new THREE.Vector3(0, -1, 0), midBendSign: +1 },
    rightHand: { rootKey: 'rightShoulder', midKey: 'rightElbow', pole: new THREE.Vector3(0, -1, 0), midBendSign: +1 },
    leftFoot:  { rootKey: 'leftHip',       midKey: 'leftKnee',   pole: new THREE.Vector3(0,  0, 1), midBendSign: -1 },
    rightFoot: { rootKey: 'rightHip',      midKey: 'rightKnee',  pole: new THREE.Vector3(0,  0, 1), midBendSign: -1 },
  };

  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const dragPlane = new THREE.Plane();
  const planeNormal = new THREE.Vector3();
  const tmpV = new THREE.Vector3();
  const parentInv = new THREE.Matrix4();
  let drag = null;
  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

  function pointerToNDC(ev) {
    const rect = canvas.getBoundingClientRect();
    ndc.x = ((ev.clientX - rect.left) / rect.width) * 2 - 1;
    ndc.y = -((ev.clientY - rect.top) / rect.height) * 2 + 1;
  }

  function syncSlidersFor(...jointKeys) {
    const set = new Set(jointKeys);
    sliderEls.forEach(({ input, def, valEl }) => {
      if (!set.has(def.key)) return;
      const v = joints[def.key].rotation[def.axis];
      input.value = v;
      valEl.textContent = Math.round((v * 180) / Math.PI) + '°';
    });
  }

  function applyLimits(joint, jointKey) {
    const lim = jointLimits[jointKey];
    if (!lim) return;
    const r = joint.rotation;
    r.set(
      clamp(r.x, lim.x.min, lim.x.max),
      clamp(r.y, lim.y.min, lim.y.max),
      clamp(r.z, lim.z.min, lim.z.max)
    );
  }

  function pickBodyPart(ev) {
    pointerToNDC(ev);
    raycaster.setFromCamera(ndc, camera);
    const hits = raycaster.intersectObjects(draggable, false);
    return hits.length ? hits[0] : null;
  }

  // Solve a 2-bone IK chain so the `anchor` point on the mid-joint chain reaches `targetWorld`.
  function solve2BoneIK(chain, anchorInMidLocal, targetWorld) {
    const rootJoint = joints[chain.rootKey];
    const midJoint = joints[chain.midKey];
    const parent = rootJoint.parent;

    const L1 = Math.abs(midJoint.position.y);
    const L2 = anchorInMidLocal.length();
    if (L1 < 1e-3 || L2 < 1e-3) return;

    // Target in the root joint's parent-local space.
    const pInv = new THREE.Matrix4().copy(parent.matrixWorld).invert();
    const T_local = targetWorld.clone().applyMatrix4(pInv);
    const S_local = rootJoint.position;
    const chord = T_local.clone().sub(S_local);
    let d = chord.length();
    const minD = Math.max(Math.abs(L1 - L2) + 1e-3, 1e-3);
    const maxD = L1 + L2 - 1e-3;
    if (d < minD) { chord.setLength(minD); d = minD; }
    else if (d > maxD) { chord.setLength(maxD); d = maxD; }
    const dir = chord.clone().divideScalar(d);

    // Preserve the current bend direction if the limb is already bent; otherwise fall back
    // to the configured pole. Lets drags feel like they continue an existing pose rather
    // than snapping to a canonical solution on every frame.
    const rootWorld = new THREE.Vector3();
    rootJoint.getWorldPosition(rootWorld);
    const midWorld = new THREE.Vector3();
    midJoint.getWorldPosition(midWorld);
    const anchorWorld = anchorInMidLocal.clone().applyMatrix4(midJoint.matrixWorld);
    const chordW = anchorWorld.clone().sub(rootWorld);
    let perpLocal;
    if (chordW.lengthSq() > 1e-6) {
      const chordDirW = chordW.clone().normalize();
      const relMid = midWorld.clone().sub(rootWorld);
      const perpW = relMid.sub(chordDirW.clone().multiplyScalar(relMid.dot(chordDirW)));
      if (perpW.lengthSq() > 1e-5) {
        const pWQ = new THREE.Quaternion();
        parent.getWorldQuaternion(pWQ).invert();
        perpLocal = perpW.normalize().applyQuaternion(pWQ);
      }
    }
    if (!perpLocal) perpLocal = chain.pole.clone();
    perpLocal.addScaledVector(dir, -perpLocal.dot(dir));
    if (perpLocal.lengthSq() < 1e-6) {
      perpLocal.set(1, 0, 0);
      if (Math.abs(perpLocal.dot(dir)) > 0.9) perpLocal.set(0, 0, 1);
      perpLocal.addScaledVector(dir, -perpLocal.dot(dir));
    }
    perpLocal.normalize();

    // Law of cosines: where does the mid-joint sit relative to the chord?
    const a = (L1 * L1 + d * d - L2 * L2) / (2 * d);
    const h = Math.sqrt(Math.max(L1 * L1 - a * a, 0));
    const upperDir = dir.clone().multiplyScalar(a).addScaledVector(perpLocal, h).normalize();

    // Build root-joint rotation so local -Y (where the bone points) aligns with upperDir,
    // and local +X = bendNormal (mid-joint's hinge axis). Flipping bendNormal for legs
    // mirrors the bend plane so the knee's negative-x rotation convention works out.
    const yAxisP = upperDir.clone().negate();
    const bendNormal = new THREE.Vector3().crossVectors(perpLocal, dir);
    if (chain.midBendSign < 0) bendNormal.negate();
    bendNormal.normalize();
    const xAxisP = bendNormal;
    const zAxisP = new THREE.Vector3().crossVectors(xAxisP, yAxisP).normalize();
    xAxisP.crossVectors(yAxisP, zAxisP).normalize();

    const m = new THREE.Matrix4().makeBasis(xAxisP, yAxisP, zAxisP);
    rootJoint.quaternion.setFromRotationMatrix(m);

    // Mid-joint bend: compute the desired lower-bone direction in mid-local and use atan2
    // so the sign falls out naturally (positive for elbow, negative for knee).
    const midPosParent = S_local.clone().add(upperDir.clone().multiplyScalar(L1));
    const tipDirParent = T_local.clone().sub(midPosParent).normalize();
    const yComp = tipDirParent.dot(yAxisP);
    const zComp = tipDirParent.dot(zAxisP);
    // rotate(0,-1,0) around +x by α = (0, -cos α, -sin α) → y = -cos α, z = -sin α
    const alpha = Math.atan2(-zComp, -yComp);
    midJoint.rotation.set(alpha, midJoint.rotation.y, midJoint.rotation.z);

    applyLimits(rootJoint, chain.rootKey);
    applyLimits(midJoint, chain.midKey);
    syncSlidersFor(chain.rootKey, chain.midKey);
  }

  function onPointerDown(ev) {
    // only start drag for primary mouse / single-finger touch / pen
    if (ev.button !== undefined && ev.button !== 0) return;
    const hit = pickBodyPart(ev);
    if (!hit) return;
    const jointKey = hit.object.userData.jointKey;
    const ikChain = ikChains[jointKey];
    const joint = ikChain ? null : joints[jointKey];
    if (!ikChain && !joint) return;

    ev.stopPropagation(); // keep OrbitControls out of it
    controls.enableRotate = false;
    canvas.setPointerCapture(ev.pointerId);

    // drag plane: through the click, facing the camera
    camera.getWorldDirection(planeNormal).negate();
    dragPlane.setFromNormalAndCoplanarPoint(planeNormal, hit.point);

    if (ikChain) {
      // anchor on the hand/foot mesh, expressed in the mid-joint's local frame
      const midJoint = joints[ikChain.midKey];
      const anchorInMidLocal = midJoint.worldToLocal(hit.point.clone());
      drag = { kind: 'ik', chain: ikChain, anchorInMidLocal };
    } else {
      // single-joint drag: rotate this one joint so the clicked point follows the mouse
      const anchorLocal = joint.worldToLocal(hit.point.clone());
      drag = { kind: 'single', joint, jointKey, anchorLocal };
    }
    canvas.style.cursor = 'grabbing';
  }

  function onPointerMove(ev) {
    if (!drag) {
      // hover feedback — also disable camera-rotate while hovering a body part, so
      // the next left-click drags the limb instead of orbiting the camera
      const hit = pickBodyPart(ev);
      if (hit) {
        canvas.style.cursor = 'grab';
        controls.enableRotate = false;
      } else {
        canvas.style.cursor = '';
        controls.enableRotate = true;
      }
      return;
    }
    pointerToNDC(ev);
    raycaster.setFromCamera(ndc, camera);
    const target = raycaster.ray.intersectPlane(dragPlane, tmpV);
    if (!target) return;

    if (drag.kind === 'ik') {
      solve2BoneIK(drag.chain, drag.anchorInMidLocal, target);
      return;
    }

    const { joint, jointKey, anchorLocal } = drag;
    // express target in the joint's PARENT local space, relative to the joint origin
    parentInv.copy(joint.parent.matrixWorld).invert();
    const targetInParent = target.clone().applyMatrix4(parentInv);
    const newDir = targetInParent.sub(joint.position).normalize();
    const oldDir = anchorLocal.clone().normalize();
    if (!isFinite(newDir.x) || newDir.lengthSq() < 1e-8) return;
    if (oldDir.lengthSq() < 1e-8) return;

    const q = new THREE.Quaternion().setFromUnitVectors(oldDir, newDir);
    joint.quaternion.copy(q);
    applyLimits(joint, jointKey);
    syncSlidersFor(jointKey);
  }

  function onPointerUp(ev) {
    if (!drag) return;
    try { canvas.releasePointerCapture(ev.pointerId); } catch (_) {}
    drag = null;
    controls.enableRotate = true;
    canvas.style.cursor = '';
    // the next pointermove will re-run hover logic and re-disable rotate if we're
    // still hovering a body part
  }

  // capture-phase pointerdown so we beat OrbitControls to the event
  canvas.addEventListener('pointerdown', onPointerDown, { capture: true });
  canvas.addEventListener('pointermove', onPointerMove);
  canvas.addEventListener('pointerup', onPointerUp);
  canvas.addEventListener('pointercancel', onPointerUp);
  canvas.addEventListener('pointerleave', () => { if (!drag) canvas.style.cursor = ''; });

  const presetRow = ctrl.querySelector('#preset-row');
  Object.keys(presets).forEach(name => {
    const b = document.createElement('button');
    b.className = 'btn';
    b.textContent = name;
    b.addEventListener('click', () => setPose(presets[name]));
    presetRow.appendChild(b);
  });

  ctrl.querySelector('#reset-pose').addEventListener('click', () => setPose({}));
  ctrl.querySelector('#snap-pose').addEventListener('click', () => {
    // snapshot as a reference image
    renderer.render(scene, camera);
    const dataUrl = canvas.toDataURL('image/png');
    localStorage.setItem('cl.poseReference', dataUrl);
    const ok = document.createElement('div');
    ok.textContent = 'Pose saved — switch to Studio and toggle Guide to see a dimmed silhouette.';
    ok.style.cssText = 'position:fixed; bottom:20px; left:50%; transform:translateX(-50%); background:var(--good); color:#0c2a1b; padding:8px 16px; border-radius:8px; z-index:1000; font-size:13px; max-width:90%;';
    document.body.appendChild(ok);
    setTimeout(() => ok.remove(), 2600);
  });

  // animation loop
  let stop = false;
  function loop() {
    if (stop) return;
    controls.update();
    renderer.render(scene, camera);
    requestAnimationFrame(loop);
  }

  // ensure canvas sized before first frame
  requestAnimationFrame(() => { resize(); loop(); });
  const resizeObs = new ResizeObserver(resize);
  resizeObs.observe(canvas);

  return () => {
    stop = true;
    resizeObs.disconnect();
    renderer.dispose();
    controls.dispose();
  };
}
