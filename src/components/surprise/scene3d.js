// The 3D stage of "Hộp quà bí mật": a velvet gift box with a gold ribbon on
// a dark pedestal, gold dust in the air, and a little designer-toy mascot
// (bear, bunny or cat) that reacts to what she does. Plain three.js, no
// React: the page drives it through setState().
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

const PALETTES = {
  bear: { fur: 0xa06a45, light: 0xead2b4, inner: 0xd99a7a, nose: 0x2a1a17 },
  bunny: { fur: 0xf1e9e2, light: 0xfffaf4, inner: 0xeeb0bd, nose: 0xe08aa0 },
  cat: { fur: 0x77707c, light: 0xe6ded7, inner: 0xe6a3b0, nose: 0xe08aa0 },
};
const GOLD = 0xe3be78;
const BOX = 0x4c0b22;

const damp = (from, to, rate, dt) => from + (to - from) * (1 - Math.exp(-rate * dt));

function canvasTexture(size, draw) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  draw(canvas.getContext('2d'), size);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/** A soft round dot for the gold dust. */
const dotTexture = () => canvasTexture(64, (ctx, s) => {
  const g = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.35, 'rgba(255,240,210,0.55)');
  g.addColorStop(1, 'rgba(255,230,190,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, s, s);
});

function place(parent, geometry, material, position, scale, rotation) {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(...position);
  if (scale) {
    mesh.scale.set(...(Array.isArray(scale) ? scale : [scale, scale, scale]));
  }
  if (rotation) {
    mesh.rotation.set(...rotation);
  }
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

function buildMascot(kind, gold) {
  const p = PALETTES[kind] ?? PALETTES.bear;
  // Glossy vinyl, like a collectible figure
  const fur = new THREE.MeshPhysicalMaterial({
    color: p.fur, roughness: 0.42, clearcoat: 0.75, clearcoatRoughness: 0.2, sheen: 0.35, sheenColor: new THREE.Color(0xffffff),
  });
  const light = fur.clone();
  light.color.set(p.light);
  const inner = new THREE.MeshPhysicalMaterial({ color: p.inner, roughness: 0.5, clearcoat: 0.4 });
  const blush = new THREE.MeshBasicMaterial({ color: p.inner, transparent: true, opacity: 0.45, depthWrite: false });
  const eye = new THREE.MeshPhysicalMaterial({ color: 0x0f0b0d, roughness: 0.1, clearcoat: 1 });
  const nose = new THREE.MeshPhysicalMaterial({ color: p.nose, roughness: 0.3, clearcoat: 0.9 });
  const shine = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const sphere = new THREE.SphereGeometry(1, 48, 32);

  const root = new THREE.Group();
  const body = new THREE.Group();
  root.add(body);
  place(body, sphere, fur, [0, 0.42, 0], [0.34, 0.38, 0.31]);
  place(body, sphere, light, [0, 0.4, 0.17], [0.23, 0.25, 0.15]);
  const leg = new THREE.CapsuleGeometry(0.1, 0.1, 8, 16);
  place(body, leg, fur, [-0.15, 0.13, 0.04]);
  place(body, leg, fur, [0.15, 0.13, 0.04]);

  // Arms hang from the shoulders; rotating the pivot lifts them
  const armGeometry = new THREE.CapsuleGeometry(0.085, 0.26, 8, 16);
  const arms = [-1, 1].map(side => {
    const pivot = new THREE.Group();
    pivot.position.set(0.29 * side, 0.68, 0.03);
    place(pivot, armGeometry, fur, [0, -0.2, 0]);
    place(pivot, sphere, light, [0, -0.36, 0.03], [0.072, 0.064, 0.06]);
    body.add(pivot);
    return pivot;
  });

  // A thin gold collar with a pendant
  place(body, new THREE.TorusGeometry(0.205, 0.02, 16, 64), gold, [0, 0.72, 0], null, [Math.PI / 2, 0, 0]);
  place(body, sphere, gold, [0, 0.685, 0.215], 0.04);

  const head = new THREE.Group();
  head.position.set(0, 0.95, 0);
  body.add(head);
  place(head, sphere, fur, [0, 0, 0], [0.31, 0.28, 0.29]);
  place(head, sphere, light, [0, -0.075, 0.235], [0.13, 0.09, 0.08]);
  place(head, sphere, nose, [0, -0.04, 0.312], [0.036, 0.026, 0.022]);
  for (const side of [-1, 1]) {
    place(head, sphere, blush, [0.18 * side, -0.06, 0.225], [0.05, 0.028, 0.014], [0, 0.55 * side, 0]).castShadow = false;
  }
  const eyes = [-1, 1].map(side => {
    const group = new THREE.Group();
    group.position.set(0.11 * side, 0.03, 0.252);
    place(group, sphere, eye, [0, 0, 0], [0.042, 0.048, 0.03]);
    place(group, sphere, shine, [-0.013, 0.017, 0.026], 0.011).castShadow = false;
    head.add(group);
    return group;
  });

  const ears = [];
  if (kind === 'bunny') {
    const earGeometry = new THREE.CapsuleGeometry(0.065, 0.3, 8, 16);
    const innerGeometry = new THREE.CapsuleGeometry(0.034, 0.24, 8, 16);
    for (const side of [-1, 1]) {
      const pivot = new THREE.Group();
      pivot.position.set(0.1 * side, 0.2, -0.02);
      pivot.rotation.z = -0.16 * side;
      place(pivot, earGeometry, fur, [0, 0.2, 0], [1, 1, 0.7]);
      place(pivot, innerGeometry, inner, [0, 0.2, 0.034], [1, 1, 0.4]);
      head.add(pivot);
      ears.push(pivot);
    }
    place(body, sphere, light, [0, 0.3, -0.31], 0.085);
  } else if (kind === 'cat') {
    const earGeometry = new THREE.ConeGeometry(0.1, 0.2, 32);
    const innerGeometry = new THREE.ConeGeometry(0.058, 0.13, 32);
    for (const side of [-1, 1]) {
      const pivot = new THREE.Group();
      pivot.position.set(0.17 * side, 0.2, 0);
      pivot.rotation.z = -0.38 * side;
      place(pivot, earGeometry, fur, [0, 0.06, 0]);
      place(pivot, innerGeometry, inner, [0, 0.04, 0.045]);
      head.add(pivot);
      ears.push(pivot);
    }
    const tail = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0.22, -0.26), new THREE.Vector3(0.16, 0.24, -0.38),
      new THREE.Vector3(0.26, 0.46, -0.4), new THREE.Vector3(0.2, 0.64, -0.34),
    ]);
    place(body, new THREE.TubeGeometry(tail, 32, 0.04, 12), fur, [0, 0, 0]);
    place(body, sphere, fur, [0.2, 0.64, -0.34], 0.04);
  } else {
    for (const side of [-1, 1]) {
      const pivot = new THREE.Group();
      pivot.position.set(0.2 * side, 0.19, -0.02);
      place(pivot, sphere, fur, [0, 0, 0], [0.1, 0.1, 0.06]);
      place(pivot, sphere, inner, [0, 0, 0.035], [0.058, 0.058, 0.03]);
      head.add(pivot);
      ears.push(pivot);
    }
    place(body, sphere, fur, [0, 0.27, -0.3], 0.055);
  }
  return { root, body, head, arms, eyes, ears, kind };
}

function buildBox(gold, envMap) {
  const velvet = new THREE.MeshPhysicalMaterial({
    color: BOX, roughness: 0.7, sheen: 0.7, sheenRoughness: 0.45, sheenColor: new THREE.Color(0xb8406a), envMap, envMapIntensity: 0.6,
  });
  const group = new THREE.Group();
  place(group, new RoundedBoxGeometry(1, 0.8, 1, 4, 0.04), velvet, [0, 0.4, 0]);
  place(group, new THREE.BoxGeometry(0.16, 0.805, 1.006), gold, [0, 0.4, 0]);
  place(group, new THREE.BoxGeometry(1.006, 0.805, 0.16), gold, [0, 0.4, 0]);

  // The lid opens on a hinge along its back edge
  const lid = new THREE.Group();
  lid.position.set(0, 0.8, -0.55);
  group.add(lid);
  place(lid, new RoundedBoxGeometry(1.1, 0.2, 1.1, 4, 0.04), velvet, [0, 0.1, 0.55]);
  place(lid, new THREE.BoxGeometry(0.17, 0.206, 1.106), gold, [0, 0.1, 0.55]);
  place(lid, new THREE.BoxGeometry(1.106, 0.206, 0.17), gold, [0, 0.1, 0.55]);
  const loop = new THREE.TorusGeometry(0.15, 0.042, 20, 48);
  place(lid, loop, gold, [-0.15, 0.3, 0.55], [1, 0.75, 1], [0, 0.35, 0.5]);
  place(lid, loop, gold, [0.15, 0.3, 0.55], [1, 0.75, 1], [0, -0.35, -0.5]);
  place(lid, new THREE.SphereGeometry(0.075, 24, 16), gold, [0, 0.25, 0.55]);
  const tail = new THREE.BoxGeometry(0.07, 0.2, 0.02);
  place(lid, tail, gold, [-0.08, 0.17, 0.66], null, [0.3, 0, 0.5]);
  place(lid, tail, gold, [0.08, 0.17, 0.66], null, [0.3, 0, -0.5]);

  // What spills out when it opens
  const glow = new THREE.PointLight(0xffcf87, 0, 4.5);
  glow.position.set(0, 0.75, 0);
  group.add(glow);
  // A soft cone of light: fades toward the top and toward its edges
  const beam = new THREE.Mesh(
    new THREE.CylinderGeometry(0.85, 0.4, 2.6, 64, 1, true),
    new THREE.ShaderMaterial({
      uniforms: { color: { value: new THREE.Color(0xffdca0) }, opacity: { value: 0 } },
      vertexShader: `
        varying vec2 vUv;
        varying float vFacing;
        void main() {
          vUv = uv;
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          vFacing = abs(dot(normalize(normalMatrix * normal), normalize(-mv.xyz)));
          gl_Position = projectionMatrix * mv;
        }`,
      fragmentShader: `
        uniform vec3 color;
        uniform float opacity;
        varying vec2 vUv;
        varying float vFacing;
        void main() {
          float fade = pow(1.0 - vUv.y, 1.6);
          gl_FragColor = vec4(color, opacity * fade * pow(vFacing, 2.2));
        }`,
      transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide,
    }),
  );
  beam.position.set(0, 0.8 + 1.3, 0);
  group.add(beam);
  return { group, lid, glow, beam };
}

function buildDust(texture, count) {
  const positions = new Float32Array(count * 3);
  const speeds = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    const r = 0.5 + Math.random() * 2.4;
    const a = Math.random() * Math.PI * 2;
    positions.set([Math.cos(a) * r, Math.random() * 3.4, Math.sin(a) * r - 0.4], i * 3);
    speeds[i] = 0.06 + Math.random() * 0.16;
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const points = new THREE.Points(geometry, new THREE.PointsMaterial({
    size: 0.055, map: texture, color: 0xf3d9a0, transparent: true, opacity: 0.85,
    depthWrite: false, blending: THREE.AdditiveBlending,
  }));
  return { points, positions, speeds };
}

function buildSparks(texture, count) {
  const positions = new Float32Array(count * 3);
  const velocities = new Float32Array(count * 3);
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const points = new THREE.Points(geometry, new THREE.PointsMaterial({
    size: 0.075, map: texture, color: 0xffe6b0, transparent: true, opacity: 0,
    depthWrite: false, blending: THREE.AdditiveBlending,
  }));
  return { points, positions, velocities, count };
}

/** Where each mood puts the arms, head and eyes (the loop eases toward it). */
function poseFor(mood) {
  const pose = { aX: 0, aZ: -0.2, bX: 0, bZ: 0.2, nod: 0, tilt: 0, eyes: 1, crouch: 0, dim: 0, ears: 0 };
  switch (mood) {
    case 'cover': // paws over the eyes while she types
      return { ...pose, aX: -2.3, aZ: 0.52, bX: -2.3, bZ: -0.52, nod: 0.28 };
    case 'peek': // one paw down: it saw
      return { ...pose, aX: -2.3, aZ: 0.52, bX: -1.1, bZ: -0.25, nod: 0.12, tilt: -0.12 };
    case 'sad':
      return { ...pose, aZ: -0.06, bZ: 0.06, nod: 0.32, eyes: 0.55, crouch: 0.04, ears: 1 };
    case 'sleep':
      return { ...pose, aZ: -0.1, bZ: 0.1, nod: 0.22, tilt: 0.32, eyes: 0.1, dim: 1, ears: 0.6 };
    case 'happy':
      return { ...pose, aX: -0.2, aZ: -2.3, bX: -0.2, bZ: 2.3 };
    case 'love':
      return { ...pose, aX: -0.5, aZ: -1.2, bX: -0.5, bZ: 1.2, tilt: 0.08 };
    default:
      return pose;
  }
}

/**
 * @param {HTMLCanvasElement} canvas
 * @param {{ kind?: string, variant?: 'stage'|'portrait', reducedMotion?: boolean }} [opts]
 *   portrait: the mascot alone, framed close (for still pictures)
 */
export function createGiftScene(canvas, { kind = 'bear', variant = 'stage', reducedMotion = false } = {}) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: variant === 'portrait' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(0x000000, 0);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  const room = new RoomEnvironment();
  const envMap = pmrem.fromScene(room, 0.04).texture;
  scene.environment = envMap;
  scene.environmentIntensity = 0.55;

  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 50);
  const lookAt = new THREE.Vector3(0, variant === 'portrait' ? 0.74 : 0.7, 0);

  scene.add(new THREE.HemisphereLight(0xffe9d6, 0x1a0f1f, 0.5));
  const key = new THREE.DirectionalLight(0xfff0dc, 2.6);
  key.position.set(2.4, 5, 3.6);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  Object.assign(key.shadow.camera, { left: -2.5, right: 2.5, top: 2.5, bottom: -2.5, near: 0.5, far: 15 });
  key.shadow.bias = -0.0004;
  key.shadow.normalBias = 0.02;
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xff9ec0, 1.8);
  rim.position.set(-2.5, 2.6, -3.5);
  scene.add(rim);
  const fill = new THREE.DirectionalLight(0xaab8ff, 0.45);
  fill.position.set(-3.5, 1.5, 2.5);
  scene.add(fill);

  const gold = new THREE.MeshStandardMaterial({ color: GOLD, metalness: 1, roughness: 0.22 });
  const stage = new THREE.Group();
  scene.add(stage);

  const mascot = buildMascot(kind, gold);
  let box = null;
  let dust = null;
  let sparks = null;
  const dot = dotTexture();
  if (variant === 'portrait') {
    mascot.root.rotation.y = -0.3;
    stage.add(mascot.root);
  } else {
    const pedestal = new THREE.Mesh(
      new THREE.CylinderGeometry(1.75, 1.85, 0.25, 96),
      new THREE.MeshPhysicalMaterial({
        // Its own envMap: a material's envMapIntensity only counts with one
        color: 0x050406, roughness: 0.5, metalness: 0, clearcoat: 0.35, clearcoatRoughness: 0.35, envMap, envMapIntensity: 0.12,
      }),
    );
    pedestal.position.y = -0.125;
    pedestal.receiveShadow = true;
    stage.add(pedestal);
    place(stage, new THREE.TorusGeometry(1.752, 0.012, 12, 160), gold, [0, 0, 0], null, [Math.PI / 2, 0, 0]);

    box = buildBox(gold, envMap);
    box.group.position.set(-0.5, 0, -0.15);
    box.group.rotation.y = 0.45;
    stage.add(box.group);

    mascot.root.position.set(0.78, 0, 0.35);
    mascot.root.scale.setScalar(1.1);
    mascot.root.rotation.y = -0.4;
    stage.add(mascot.root);

    dust = buildDust(dot, 150);
    scene.add(dust.points);
    sparks = buildSparks(dot, 110);
    scene.add(sparks.points);
  }

  const state = { mood: 'idle', opened: false, moodAt: 0, openedAt: -1 };
  const pose = { ...poseFor('idle'), lid: 0, glow: 0 };
  const pointer = { x: 0, y: 0, lx: 0, ly: 0 };
  const clock = new THREE.Clock();
  let nextBlink = 2;
  let frame = 0;
  let running = false;

  function onPointer(e) {
    pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
    pointer.y = (e.clientY / window.innerHeight) * 2 - 1;
  }
  window.addEventListener('pointermove', onPointer, { passive: true });

  function launchSparks() {
    const { positions, velocities, count } = sparks;
    const origin = new THREE.Vector3(0, 0.85, 0).applyMatrix4(box.group.matrixWorld);
    for (let i = 0; i < count; i++) {
      positions.set([origin.x, origin.y, origin.z], i * 3);
      const a = Math.random() * Math.PI * 2;
      const spread = Math.random() * 0.9;
      velocities.set([Math.cos(a) * spread, 1.6 + Math.random() * 1.8, Math.sin(a) * spread], i * 3);
    }
    sparks.points.geometry.attributes.position.needsUpdate = true;
  }

  function update(dt, t) {
    const target = poseFor(state.mood);
    const rate = reducedMotion ? 30 : 7;
    for (const k of Object.keys(target)) {
      pose[k] = damp(pose[k], target[k], rate, dt);
    }
    pose.lid = damp(pose.lid, state.opened ? 1 : 0, reducedMotion ? 30 : 3.2, dt);
    pose.glow = damp(pose.glow, state.opened ? 1 : 0, reducedMotion ? 30 : 2, dt);

    const motion = reducedMotion ? 0 : 1;
    pointer.lx = damp(pointer.lx, pointer.x, 4, dt);
    pointer.ly = damp(pointer.ly, pointer.y, 4, dt);

    // Mascot
    const { arms, head, body, eyes, ears } = mascot;
    const since = t - state.moodAt;
    arms[0].rotation.set(pose.aX, 0, pose.aZ + Math.sin(t * 1.6) * 0.04 * motion);
    arms[1].rotation.set(pose.bX, 0, pose.bZ - Math.sin(t * 1.6) * 0.04 * motion);
    const shake = state.mood === 'sad' ? Math.sin(since * 20) * 0.32 * Math.exp(-since * 2.4) * motion : 0;
    const looking = state.mood === 'idle' || state.mood === 'peek' || state.mood === 'love';
    head.rotation.set(
      pose.nod + (looking ? pointer.ly * 0.18 : 0),
      shake + (looking ? pointer.lx * 0.35 : 0),
      pose.tilt + Math.sin(t * 0.9) * 0.03 * motion,
    );
    const jump = state.mood === 'happy' ? Math.abs(Math.sin(t * 5)) * 0.12 * motion : 0;
    const breathe = state.mood === 'sleep' ? Math.sin(t * 1.4) * 0.012 : Math.sin(t * 2) * 0.012;
    body.position.y = jump + breathe * motion - pose.crouch;
    let blink = 1;
    if (!reducedMotion && state.mood !== 'sleep') {
      if (t > nextBlink + 0.14) {
        nextBlink = t + 2.5 + Math.random() * 3;
      } else if (t > nextBlink) {
        blink = 0.1;
      }
    }
    for (const e of eyes) {
      e.scale.y = Math.max(0.08, pose.eyes * blink);
    }
    ears.forEach((ear, i) => {
      if (mascot.kind === 'bunny') {
        ear.rotation.x = -0.9 * pose.ears;
        ear.rotation.z = (i ? -1 : 1) * (0.16 + 0.5 * pose.ears);
      }
    });

    if (box) {
      box.lid.rotation.x = -1.95 * pose.lid;
      box.lid.position.y = 0.8 + 0.12 * Math.sin(Math.min(pose.lid, 1) * Math.PI);
      box.glow.intensity = 9 * pose.glow;
      box.beam.material.uniforms.opacity.value = 0.55 * pose.glow * (0.85 + 0.15 * Math.sin(t * 3) * motion);
      key.intensity = 2.6 * (1 - 0.5 * pose.dim);
      rim.intensity = 1.8 * (1 - 0.3 * pose.dim);
      stage.rotation.y = (Math.sin(t * 0.25) * 0.12 + pointer.lx * 0.22) * motion;

      const { positions, speeds } = dust;
      const slow = state.mood === 'sleep' ? 0.35 : 1;
      for (let i = 0; i < speeds.length; i++) {
        let y = positions[i * 3 + 1] + speeds[i] * dt * slow * motion;
        if (y > 3.4) {
          y = 0;
        }
        positions[i * 3 + 1] = y;
      }
      dust.points.geometry.attributes.position.needsUpdate = true;
      dust.points.material.opacity = 0.85 * (1 - 0.4 * pose.dim);

      const age = state.openedAt >= 0 ? t - state.openedAt : 99;
      if (age < 3.5 && motion) {
        const p = sparks.positions;
        const v = sparks.velocities;
        for (let i = 0; i < sparks.count; i++) {
          v[i * 3 + 1] -= 1.2 * dt;
          p[i * 3] += v[i * 3] * dt;
          p[i * 3 + 1] += v[i * 3 + 1] * dt;
          p[i * 3 + 2] += v[i * 3 + 2] * dt;
        }
        sparks.points.geometry.attributes.position.needsUpdate = true;
        sparks.points.material.opacity = Math.max(0, 1 - age / 3.5);
      } else {
        sparks.points.material.opacity = 0;
      }
    }
  }

  function render() {
    const dt = Math.min(clock.getDelta(), 0.05);
    update(dt, clock.elapsedTime);
    renderer.render(scene, camera);
  }

  function loop() {
    render();
    frame = requestAnimationFrame(loop);
  }

  function resize(width, height) {
    if (!width || !height) {
      return;
    }
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    const halfW = variant === 'portrait' ? 0.72 : 2.0;
    const halfH = variant === 'portrait' ? 0.92 : 1.4;
    const tan = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    const dist = Math.max(halfW / (tan * camera.aspect), halfH / tan);
    camera.position.set(0, lookAt.y + dist * (variant === 'portrait' ? 0.08 : 0.2), dist);
    camera.lookAt(lookAt);
    camera.updateProjectionMatrix();
    if (!running) {
      render();
    }
  }

  return {
    setState({ mood = state.mood, opened = state.opened }) {
      const t = clock.elapsedTime;
      if (mood !== state.mood) {
        state.mood = mood;
        state.moodAt = t;
      }
      if (opened && !state.opened && sparks) {
        state.openedAt = t;
        stage.updateMatrixWorld(true);
        launchSparks();
      }
      state.opened = opened;
      if (!running) {
        render();
      }
    },
    resize,
    start() {
      if (!running) {
        running = true;
        clock.getDelta();
        loop();
      }
    },
    stop() {
      running = false;
      cancelAnimationFrame(frame);
    },
    /** Runs the animation for `seconds` without the clock (for still pictures). */
    settle(seconds = 2) {
      for (let s = 0; s < seconds; s += 1 / 60) {
        update(1 / 60, s);
      }
      renderer.render(scene, camera);
    },
    dispose() {
      running = false;
      cancelAnimationFrame(frame);
      window.removeEventListener('pointermove', onPointer);
      scene.traverse(obj => {
        obj.geometry?.dispose();
        const materials = Array.isArray(obj.material) ? obj.material : [obj.material];
        materials.forEach(m => {
          m?.map?.dispose();
          m?.dispose();
        });
      });
      envMap.dispose();
      pmrem.dispose();
      room.dispose?.();
      renderer.dispose();
      renderer.forceContextLoss();
    },
  };
}
