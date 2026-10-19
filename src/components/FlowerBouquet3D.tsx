"use client";

import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { FlowerConfig, FlowerType } from "@/types/surprise";

interface FlowerBouquet3DProps {
  nickname: string;
  config: FlowerConfig;
  onChange: (newConfig: FlowerConfig) => void;
  onPlaySound?: (type: "pop" | "boing" | "sparkle") => void;
  onShowToast?: (msg: string) => void;
  onBack: () => void;
  onFinish: (snapshotDataUrl: string) => void;
}

const MAX_FLOWERS = 23;
const FLOWER_TYPES: FlowerType[] = ["rose", "sunflower", "tulip", "daisy"];

const WRAPPER_COLORS = [
  { name: "Black", hex: "#1A1A1D", ribbon: "#7A1F2B", opacity: 1 },
  { name: "White", hex: "#F8F5EF", ribbon: "#7A1F2B", opacity: 1 },
  { name: "Clear", hex: "#EAF4F8", ribbon: "#B03A48", opacity: 0.22 },
  { name: "Translucent", hex: "#FFFFFF", ribbon: "#9B72CF", opacity: 0.6 },
  { name: "Peach Pink", hex: "#FFD1DC", ribbon: "#FF7597", opacity: 1 },
  { name: "Lavender", hex: "#E8DFF5", ribbon: "#9B72CF", opacity: 1 },
];

/* ------------------------------------------------------------------ */
/*  3D helpers (module level)                                          */
/* ------------------------------------------------------------------ */

// One curved, cup-shaped petal with a base->tip colour gradient.
// Base sits at the origin, height runs along +Z, outward is +Y.
const petalGeo = (() => {
  const SU = 10;
  const SV = 8;
  const pos: number[] = [];
  const col: number[] = [];
  const idx: number[] = [];

  for (let j = 0; j <= SV; j++) {
    const v = j / SV;
    const w =
      (0.35 + 0.65 * Math.sin(v * Math.PI * 0.5)) *
      Math.sqrt(Math.max(0, 1 - Math.pow(Math.max(0, (v - 0.72) / 0.28), 2)));
    for (let i = 0; i <= SU; i++) {
      const u = (i / SU) * 2 - 1;
      const xx = u * w * 0.65;
      const y = -0.9 * xx * xx + 0.35 * v * v * v; // cup + flared lip
      pos.push(xx, y, v);
      const b = 0.45 + 0.55 * v + 0.08 * Math.abs(u) * v; // darker at the base
      col.push(b, b * 0.97, b * 0.97);
    }
  }
  for (let j = 0; j < SV; j++) {
    for (let i = 0; i < SU; i++) {
      const a = j * (SU + 1) + i;
      const b = a + 1;
      const c = a + SU + 1;
      const d = c + 1;
      idx.push(a, c, b, b, c, d);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
})();

const SHARED_GEOMETRIES = new Set<THREE.BufferGeometry>([petalGeo]);

// Small deterministic RNG so the arrangement stays stable between rebuilds
function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function disposeObject(obj: THREE.Object3D) {
  obj.traverse((child) => {
    const mesh = child as THREE.Mesh;
    if (mesh.geometry && !SHARED_GEOMETRIES.has(mesh.geometry)) {
      mesh.geometry.dispose();
    }
    const mat = mesh.material as THREE.Material | THREE.Material[] | undefined;
    if (mat) {
      (Array.isArray(mat) ? mat : [mat]).forEach((m) => {
        const map = (m as THREE.MeshStandardMaterial).map;
        if (map) map.dispose();
        m.dispose();
      });
    }
    if ((child as THREE.InstancedMesh).isInstancedMesh) {
      (child as THREE.InstancedMesh).dispose();
    }
  });
}

// Spiral rose: petals unfold from a tight bud to open outer petals. Face = +Z
function buildRose(mat: THREE.Material, rand: () => number) {
  const g = new THREE.Group();
  const N = 22;
  const zAxis = new THREE.Vector3(0, 0, 1);
  const xAxis = new THREE.Vector3(1, 0, 0);
  const qa = new THREE.Quaternion();
  const qt = new THREE.Quaternion();
  const qw = new THREE.Quaternion();

  for (let k = 0; k < N; k++) {
    const t = k / (N - 1);
    const a = k * 2.39996;
    const r0 = 0.012 + 0.07 * t;
    const tilt = 0.1 + 1.25 * Math.pow(t, 1.3);
    const size = (0.07 + 0.085 * t) * (0.94 + rand() * 0.12);
    const twist = (rand() - 0.5) * (0.15 + 0.35 * t);

    const petal = new THREE.Mesh(petalGeo, mat);
    petal.position.set(Math.cos(a) * r0, Math.sin(a) * r0, -0.045 * t);
    qa.setFromAxisAngle(zAxis, a - Math.PI / 2);
    qt.setFromAxisAngle(xAxis, -tilt); // if petals open the wrong way use +tilt
    qw.setFromAxisAngle(zAxis, twist);
    petal.quaternion.copy(qa).multiply(qt).multiply(qw);
    petal.scale.set(size * 1.25, size, size);
    g.add(petal);
  }
  return g;
}

// Non-rose flower heads, built at the origin facing +Z
function buildFlowerHead(type: FlowerType, index: number) {
  const head = new THREE.Group();

  if (type === "sunflower") {
    const centerGeo = new THREE.CylinderGeometry(0.17, 0.15, 0.08, 18);
    centerGeo.rotateX(Math.PI / 2);
    head.add(
      new THREE.Mesh(
        centerGeo,
        new THREE.MeshStandardMaterial({ color: 0x5c3a21, roughness: 0.7 }),
      ),
    );
    const rayMat = new THREE.MeshStandardMaterial({
      color: 0xffca3a,
      roughness: 0.38,
    });
    for (let r = 0; r < 14; r++) {
      const a = (r / 14) * Math.PI * 2;
      const rayGeo = new THREE.SphereGeometry(0.09, 10, 10);
      rayGeo.scale(1.5, 0.55, 0.32);
      const ray = new THREE.Mesh(rayGeo, rayMat);
      ray.position.set(Math.cos(a) * 0.23, Math.sin(a) * 0.23, -0.01);
      ray.rotation.z = a;
      head.add(ray);
    }
  } else if (type === "tulip") {
    const tulipColors = [0xc084fc, 0xff85a2, 0xf4a261];
    const tMat = new THREE.MeshStandardMaterial({
      color: tulipColors[index % tulipColors.length],
      roughness: 0.35,
    });
    for (let p = 0; p < 6; p++) {
      const a = (p / 6) * Math.PI * 2;
      const cupGeo = new THREE.SphereGeometry(0.12, 12, 12);
      cupGeo.scale(0.85, 0.5, 1.45);
      const cup = new THREE.Mesh(cupGeo, tMat);
      cup.position.set(Math.cos(a) * 0.09, Math.sin(a) * 0.09, 0.06);
      cup.rotation.z = a;
      head.add(cup);
    }
  } else {
    head.add(
      new THREE.Mesh(
        new THREE.SphereGeometry(0.11, 14, 14),
        new THREE.MeshStandardMaterial({ color: 0xffd166, roughness: 0.4 }),
      ),
    );
    const petalMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.3,
    });
    for (let p = 0; p < 10; p++) {
      const a = (p / 10) * Math.PI * 2;
      const dGeo = new THREE.SphereGeometry(0.085, 10, 10);
      dGeo.scale(1.45, 0.55, 0.32);
      const dMesh = new THREE.Mesh(dGeo, petalMat);
      dMesh.position.set(Math.cos(a) * 0.18, Math.sin(a) * 0.18, -0.01);
      dMesh.rotation.z = a;
      head.add(dMesh);
    }
  }
  return head;
}

// Point on a dome. t: 0..1 (centre -> rim), az: azimuth, R: radius
function domePoint(t: number, az: number, R: number, maxPolar = 1.0) {
  const polar = Math.acos(1 - t * (1 - Math.cos(maxPolar)));
  const dir = new THREE.Vector3(
    Math.sin(polar) * Math.cos(az),
    Math.cos(polar),
    Math.sin(polar) * Math.sin(az),
  );
  return {
    dir,
    pos: dir
      .clone()
      .multiplyScalar(R)
      .add(new THREE.Vector3(0, -0.2, 0)),
  };
}

// Wrapping paper sheet: funnel with sharp folded corners, rim lower than the
// flower dome so the flowers stay visible. No duplicated seam -> smooth normals.
function makeSheet(
  hex: number,
  opacity: number,
  phase: number,
  scale: number,
  lobes: number,
  yTopBase: number,
  baseR: number,
) {
  const NT = 180;
  const NV = 28;
  const yBot = -1.2;
  const positions = new Float32Array(NT * (NV + 1) * 3);

  for (let j = 0; j <= NV; j++) {
    const v = j / NV;
    for (let i = 0; i < NT; i++) {
      const th = (i / NT) * Math.PI * 2;
      const corner = Math.pow(0.5 + 0.5 * Math.cos(lobes * th + phase), 3); // sharp tips
      const fold =
        0.045 * Math.sin(lobes * 2 * th + phase * 1.7) +
        0.015 * Math.sin(th * 11 + phase);
      const rTop = 1.1 * scale + corner * 0.4;
      let r = baseR + (rTop - baseR) * Math.pow(v, 1.25);
      r *= 1 + v * v * fold * 3;
      const yTop = yTopBase + corner * 0.5;
      let y = yBot + (yTop - yBot) * v;
      y -= 0.08 * Math.pow(v, 6) * (1 - corner); // droop between corners

      const o = (j * NT + i) * 3;
      positions[o] = r * Math.cos(th);
      positions[o + 1] = y;
      positions[o + 2] = r * Math.sin(th);
    }
  }

  const index: number[] = [];
  for (let j = 0; j < NV; j++) {
    for (let i = 0; i < NT; i++) {
      const i2 = (i + 1) % NT;
      const a = j * NT + i;
      const b = j * NT + i2;
      const c = (j + 1) * NT + i;
      const d = (j + 1) * NT + i2;
      index.push(a, c, b, b, c, d);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geo.setIndex(index);
  geo.computeVertexNormals();

  const transparent = opacity < 1;
  const mesh = new THREE.Mesh(
    geo,
    new THREE.MeshStandardMaterial({
      color: hex,
      roughness: 0.42,
      side: THREE.DoubleSide,
      transparent,
      opacity,
      depthWrite: !transparent,
    }),
  );
  if (transparent) mesh.renderOrder = 10;
  return mesh;
}

// Ribbon: band around the paper, bow loops and hanging tails
function makeBow(hex: number) {
  const g = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color: hex, roughness: 0.3 });

  const bandGeo = new THREE.TorusGeometry(0.3, 0.04, 10, 40);
  bandGeo.rotateX(Math.PI / 2);
  g.add(new THREE.Mesh(bandGeo, mat));

  const zOff = 0.33;
  [-1, 1].forEach((s) => {
    const loop = new THREE.Mesh(
      new THREE.TorusGeometry(0.16, 0.035, 10, 24),
      mat,
    );
    loop.scale.set(1.2, 0.8, 0.5);
    loop.position.set(s * 0.17, 0.02, zOff);
    loop.rotation.z = s * 0.5;
    g.add(loop);

    const tail = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.8, 0.012), mat);
    tail.position.set(s * 0.1, -0.4, zOff + 0.005);
    tail.rotation.z = s * 0.16;
    g.add(tail);
  });
  const knot = new THREE.Mesh(new THREE.SphereGeometry(0.07, 12, 12), mat);
  knot.position.set(0, 0.02, zOff + 0.01);
  g.add(knot);
  return g;
}

// Black message card (canvas texture)
function makeCard(text: string) {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 320;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "#16161A";
  ctx.fillRect(0, 0, 256, 320);
  ctx.strokeStyle = "#E8D9B5";
  ctx.lineWidth = 3;
  ctx.strokeRect(10, 10, 236, 300);
  ctx.fillStyle = "#E8D9B5";
  ctx.textAlign = "center";
  ctx.font = "bold 56px serif";
  ctx.fillText("♥", 128, 100);
  ctx.font = '24px "Noto Sans Thai", "Sarabun", sans-serif';
  const clean = text.slice(0, 42);
  const lines: string[] = [];
  for (let i = 0; i < clean.length && lines.length < 3; i += 14) {
    lines.push(clean.slice(i, i + 14));
  }
  lines.forEach((line, i) => ctx.fillText(line, 128, 175 + i * 34));

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  const m = new THREE.Mesh(
    new THREE.PlaneGeometry(0.36, 0.45),
    new THREE.MeshStandardMaterial({
      map: tex,
      side: THREE.DoubleSide,
      roughness: 0.6,
    }),
  );
  return m;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function FlowerBouquet3D({
  nickname,
  config,
  onChange,
  onPlaySound,
  onShowToast,
  onBack,
  onFinish,
}: FlowerBouquet3DProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const cardInputRef = useRef<HTMLInputElement>(null);
  const [renderMode, setRenderMode] = useState<"3d" | "2d">("3d");
  const [autoRotate, setAutoRotate] = useState(true);

  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const rootGroupRef = useRef<THREE.Group | null>(null);
  const autoRotateRef = useRef(autoRotate);
  autoRotateRef.current = autoRotate;

  const orbitRef = useRef({
    isDragging: false,
    prevX: 0,
    prevY: 0,
    rotY: 0.25,
    rotX: 0.12,
    distance: 4.3,
  });

  // ---------- Initialize Three.js scene ----------
  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const width = host.clientWidth || 520;
    const height = host.clientHeight || 400;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
    camera.position.set(0, 1.0, orbitRef.current.distance);
    camera.lookAt(0, -0.05, 0);

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        preserveDrawingBuffer: true,
      });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.05;
      host.innerHTML = "";
      host.appendChild(renderer.domElement);
    } catch {
      setRenderMode("2d");
      return;
    }

    // Image-based lighting: gives paper, petals and ribbon real reflections
    const pmrem = new THREE.PMREMGenerator(renderer);
    const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = envTex;
    (
      scene as unknown as { environmentIntensity?: number }
    ).environmentIntensity = 0.8;

    scene.add(new THREE.AmbientLight(0xfff5f8, 0.25));
    scene.add(new THREE.HemisphereLight(0xfff0f0, 0x2a1a1f, 0.35));
    const dir1 = new THREE.DirectionalLight(0xffffff, 1.0);
    dir1.position.set(4, 7, 5);
    scene.add(dir1);
    const dir2 = new THREE.DirectionalLight(0xffd1dc, 0.5);
    dir2.position.set(-4, 3, -3);
    scene.add(dir2);

    const rootGroup = new THREE.Group();
    scene.add(rootGroup);

    sceneRef.current = scene;
    cameraRef.current = camera;
    rendererRef.current = renderer;
    rootGroupRef.current = rootGroup;

    const dom = renderer.domElement;
    const onDown = (e: PointerEvent) => {
      orbitRef.current.isDragging = true;
      orbitRef.current.prevX = e.clientX;
      orbitRef.current.prevY = e.clientY;
    };
    const onMove = (e: PointerEvent) => {
      if (!orbitRef.current.isDragging) return;
      const dx = e.clientX - orbitRef.current.prevX;
      const dy = e.clientY - orbitRef.current.prevY;
      orbitRef.current.prevX = e.clientX;
      orbitRef.current.prevY = e.clientY;
      orbitRef.current.rotY += dx * 0.01;
      orbitRef.current.rotX = Math.max(
        -0.35,
        Math.min(0.65, orbitRef.current.rotX + dy * 0.008),
      );
    };
    const onUp = () => {
      orbitRef.current.isDragging = false;
    };
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      orbitRef.current.distance = Math.max(
        2.5,
        Math.min(6.2, orbitRef.current.distance + e.deltaY * 0.003),
      );
    };

    dom.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    dom.addEventListener("wheel", onWheel, { passive: false });

    let animId = 0;
    let clock = 0;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      clock += 0.015;
      if (rootGroupRef.current) {
        if (autoRotateRef.current && !orbitRef.current.isDragging) {
          orbitRef.current.rotY += 0.0055;
        }
        rootGroupRef.current.rotation.y = orbitRef.current.rotY;
        rootGroupRef.current.rotation.x = orbitRef.current.rotX;
        rootGroupRef.current.position.y = Math.sin(clock * 1.4) * 0.04;
      }
      camera.position.z = orbitRef.current.distance;
      camera.lookAt(0, -0.05, 0);
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      const w = host.clientWidth;
      const h = host.clientHeight;
      if (w > 0 && h > 0) {
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      }
    };
    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animId);
      dom.removeEventListener("pointerdown", onDown);
      dom.removeEventListener("wheel", onWheel);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("resize", handleResize);
      disposeObject(rootGroup);
      envTex.dispose();
      pmrem.dispose();
      renderer.dispose();
      if (dom.parentNode) dom.parentNode.removeChild(dom);
    };
  }, []);

  // ---------- Rebuild bouquet whenever config changes ----------
  useEffect(() => {
    const root = rootGroupRef.current;
    if (!root) return;

    while (root.children.length) {
      const c = root.children[0];
      root.remove(c);
      disposeObject(c);
    }

    const wrapperHex = parseInt(config.wrapperColor.replace("#", ""), 16);
    const ribbonHex = parseInt(config.ribbonColor.replace("#", ""), 16);
    const opacity =
      WRAPPER_COLORS.find(
        (w) => w.hex.toLowerCase() === config.wrapperColor.toLowerCase(),
      )?.opacity ?? 1;

    const rand = mulberry32(1234);
    const zAxis = new THREE.Vector3(0, 0, 1);
    const yAxis = new THREE.Vector3(0, 1, 0);

    // --- Holder ---
    if (config.holderStyle === "wrap") {
      // [scale, lobes, phase, rim height]
      const layers: [number, number, number, number][] = [
        [1.0, 5, 0.0, 0.1],
        [0.95, 6, 1.3, 0.18],
        [0.9, 5, 2.6, 0.06],
        [0.86, 7, 3.9, 0.14],
      ];
      layers.forEach(([s, lobes, phase, yTop], i) => {
        const sheet = makeSheet(
          wrapperHex,
          opacity,
          phase,
          s,
          lobes,
          yTop,
          0.15 + i * 0.018,
        );
        sheet.rotation.y = i * 0.7;
        root.add(sheet);
      });
      const bow = makeBow(ribbonHex);
      bow.position.y = -0.95;
      root.add(bow);
    } else {
      const vaseBody = new THREE.Mesh(
        new THREE.CylinderGeometry(0.55, 0.42, 1.45, 28),
        new THREE.MeshStandardMaterial({
          color: wrapperHex,
          roughness: 0.2,
          metalness: 0.05,
        }),
      );
      vaseBody.position.y = -0.58;
      root.add(vaseBody);

      const neckRingGeo = new THREE.TorusGeometry(0.56, 0.05, 14, 28);
      neckRingGeo.rotateX(Math.PI / 2);
      const neckRing = new THREE.Mesh(
        neckRingGeo,
        new THREE.MeshStandardMaterial({ color: ribbonHex, roughness: 0.35 }),
      );
      neckRing.position.y = 0.14;
      root.add(neckRing);
    }

    // --- Dark foliage bed under the flowers (hides gaps) ---
    const bed = new THREE.Mesh(
      new THREE.SphereGeometry(0.88, 36, 18, 0, Math.PI * 2, 0, 1.15),
      new THREE.MeshStandardMaterial({
        color: 0x1f3a2c,
        roughness: 0.9,
        side: THREE.DoubleSide,
      }),
    );
    bed.position.y = -0.2;
    root.add(bed);

    // --- Flowers on a dome (mixed by a fixed shuffle) ---
    const flat: FlowerType[] = [];
    FLOWER_TYPES.forEach((t) => {
      for (let i = 0; i < (config.counts[t] || 0); i++) flat.push(t);
    });
    const shuf = mulberry32(77);
    for (let i = flat.length - 1; i > 0; i--) {
      const j = Math.floor(shuf() * (i + 1));
      [flat[i], flat[j]] = [flat[j], flat[i]];
    }

    const stemMat = new THREE.MeshStandardMaterial({
      color: 0x3f7d5a,
      roughness: 0.7,
    });
    const roseTints = [0xb5122f, 0xc4163a, 0xa30f2a];
    const roseMats = roseTints.map(
      (c) =>
        new THREE.MeshPhysicalMaterial({
          color: c,
          vertexColors: true,
          roughness: 0.55,
          sheen: 1,
          sheenColor: new THREE.Color(0xff6a80),
          sheenRoughness: 0.45,
          side: THREE.DoubleSide,
        }),
    );
    const base = new THREE.Vector3(0, -0.9, 0);

    flat.forEach((type, i) => {
      const { dir, pos } = domePoint((i + 0.5) / flat.length, i * 2.39996, 1.0);
      const head =
        type === "rose"
          ? buildRose(roseMats[i % 3], rand)
          : buildFlowerHead(type, i);
      head.position.copy(pos);
      head.quaternion
        .setFromUnitVectors(zAxis, dir)
        .multiply(
          new THREE.Quaternion().setFromAxisAngle(zAxis, rand() * Math.PI * 2),
        );
      head.scale.setScalar(type === "rose" ? 0.95 + rand() * 0.2 : 0.9);
      root.add(head);

      const d = new THREE.Vector3().subVectors(pos, base);
      const stem = new THREE.Mesh(
        new THREE.CylinderGeometry(0.025, 0.03, d.length(), 8),
        stemMat,
      );
      stem.position.copy(base).addScaledVector(d, 0.5);
      stem.quaternion.setFromUnitVectors(yAxis, d.normalize());
      root.add(stem);
    });

    // --- Gypsophila: branching sprigs with tiny blossoms (instanced) ---
    const SPRIGS = 70;
    const TWIGS = 3;
    const BLOOMS = 5;
    const gypMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0x555555,
      roughness: 0.85,
    });
    const blossoms = new THREE.InstancedMesh(
      new THREE.SphereGeometry(0.022, 6, 5),
      gypMat,
      SPRIGS * TWIGS * BLOOMS,
    );
    const twigs = new THREE.InstancedMesh(
      new THREE.CylinderGeometry(0.004, 0.004, 1, 4),
      new THREE.MeshStandardMaterial({ color: 0x6f8f6a, roughness: 0.8 }),
      SPRIGS * TWIGS,
    );
    const dummy = new THREE.Object3D();
    let bi = 0;
    let ti = 0;
    for (let s = 0; s < SPRIGS; s++) {
      const { dir, pos: p0 } = domePoint(
        Math.pow(rand(), 0.7),
        rand() * Math.PI * 2,
        0.85,
        1.2,
      );
      const tip = p0.clone().addScaledVector(dir, 0.2 + rand() * 0.18);
      for (let k = 0; k < TWIGS; k++) {
        const end = tip
          .clone()
          .add(
            new THREE.Vector3(
              rand() - 0.5,
              rand() - 0.5,
              rand() - 0.5,
            ).multiplyScalar(0.22),
          );
        const vec = end.clone().sub(p0);
        const len = vec.length();
        dummy.position.copy(p0).addScaledVector(vec, 0.5);
        dummy.quaternion.setFromUnitVectors(yAxis, vec.normalize());
        dummy.scale.set(1, len, 1);
        dummy.updateMatrix();
        twigs.setMatrixAt(ti++, dummy.matrix);

        for (let b = 0; b < BLOOMS; b++) {
          dummy.position
            .copy(end)
            .add(
              new THREE.Vector3(
                rand() - 0.5,
                rand() - 0.5,
                rand() - 0.5,
              ).multiplyScalar(0.08),
            );
          dummy.quaternion.identity();
          dummy.scale.setScalar(0.7 + rand() * 0.9);
          dummy.updateMatrix();
          blossoms.setMatrixAt(bi++, dummy.matrix);
        }
      }
    }
    root.add(twigs);
    root.add(blossoms);

    // --- Eucalyptus branches with paired round leaves ---
    const leafMats = [0x8fae9a, 0x9bb5a3, 0x7fa08c].map(
      (c) =>
        new THREE.MeshStandardMaterial({
          color: c,
          roughness: 0.5,
          side: THREE.DoubleSide,
        }),
    );
    const eucStemMat = new THREE.MeshStandardMaterial({
      color: 0x5b7a62,
      roughness: 0.7,
    });
    const leafGeo = new THREE.CircleGeometry(1, 16);
    const up = new THREE.Vector3(0, 1, 0);

    for (let b = 0; b < 7; b++) {
      const az = b * 0.9 + 0.4 + rand() * 0.3;
      const { dir, pos: start } = domePoint(
        0.75 + rand() * 0.25,
        az,
        0.95,
        1.15,
      );
      const radial = new THREE.Vector3(Math.cos(az), 0, Math.sin(az));
      const d = dir
        .clone()
        .multiplyScalar(0.7)
        .addScaledVector(radial, 0.7)
        .normalize();
      const L = 0.55 + rand() * 0.2;

      const stem = new THREE.Mesh(
        new THREE.CylinderGeometry(0.006, 0.01, L, 5),
        eucStemMat,
      );
      stem.position.copy(start).addScaledVector(d, L / 2);
      stem.quaternion.setFromUnitVectors(yAxis, d);
      root.add(stem);

      const perp = new THREE.Vector3().crossVectors(d, up).normalize();
      const n0 = up
        .clone()
        .multiplyScalar(0.6)
        .addScaledVector(radial, 0.4)
        .normalize();

      [0.2, 0.35, 0.5, 0.65, 0.8, 1.0].forEach((s, li) => {
        const sides = li === 5 ? [0] : [-1, 1];
        sides.forEach((side) => {
          const center = start
            .clone()
            .addScaledVector(d, L * s)
            .addScaledVector(perp, side * 0.035);
          const nrm = n0
            .clone()
            .addScaledVector(perp, side * 0.5)
            .normalize();
          const X = new THREE.Vector3().crossVectors(d, nrm).normalize();
          const Y = new THREE.Vector3().crossVectors(nrm, X).normalize();
          const leaf = new THREE.Mesh(
            leafGeo,
            leafMats[Math.floor(rand() * 3)],
          );
          leaf.position.copy(center);
          leaf.quaternion.setFromRotationMatrix(
            new THREE.Matrix4().makeBasis(X, Y, nrm),
          );
          const r = 0.07 * (1.1 - 0.35 * s);
          leaf.scale.set(r * 0.9, r * 1.15, 1);
          root.add(leaf);
        });
      });
    }

    // --- Message card tucked at the rim ---
    const card = makeCard(config.address || "with love");
    card.position.set(0.78, 0.55, 0.45);
    card.rotation.set(-0.3, 0.55, 0.12);
    root.add(card);
  }, [config]);

  const totalFlowers =
    config.counts.rose +
    config.counts.sunflower +
    config.counts.tulip +
    config.counts.daisy;

  const adjustFlower = (type: FlowerType, delta: number) => {
    if (delta > 0 && totalFlowers >= MAX_FLOWERS) {
      onShowToast?.(`💐 จัดได้สูงสุด ${MAX_FLOWERS} ดอกต่อช่อน้า`);
      return;
    }
    if (delta < 0 && totalFlowers <= 1) {
      onShowToast?.("🌸 ต้องมีดอกไม้อย่างน้อย 1 ดอกในช่อน้า");
      return;
    }
    const nextVal = Math.max(0, (config.counts[type] || 0) + delta);
    onPlaySound?.("pop");
    onChange({
      ...config,
      counts: { ...config.counts, [type]: nextVal },
    });
  };

  const wrapperPatch = (name: string) => {
    const w = WRAPPER_COLORS.find((c) => c.name === name) ?? WRAPPER_COLORS[0];
    return { wrapperColor: w.hex, wrapperName: w.name, ribbonColor: w.ribbon };
  };

  const applyPreset = (
    preset: "romantic" | "sunshine" | "pastel" | "fullbloom",
  ) => {
    onPlaySound?.("sparkle");
    if (preset === "romantic") {
      onChange({
        ...config,
        counts: { rose: 8, sunflower: 0, tulip: 3, daisy: 2 },
        ...wrapperPatch("Black"),
      });
    } else if (preset === "sunshine") {
      onChange({
        ...config,
        counts: { rose: 1, sunflower: 6, tulip: 1, daisy: 4 },
        ...wrapperPatch("White"),
      });
    } else if (preset === "pastel") {
      onChange({
        ...config,
        counts: { rose: 3, sunflower: 1, tulip: 6, daisy: 3 },
        ...wrapperPatch("Lavender"),
      });
    } else {
      onChange({
        ...config,
        counts: { rose: 12, sunflower: 2, tulip: 2, daisy: 2 },
        ...wrapperPatch("Peach Pink"),
      });
    }
  };

  const handleFinish = () => {
    // 1. ดักจับถ้ายังไม่ได้พิมพ์ที่อยู่
    if (!config.address || config.address.trim() === "") {
      onShowToast?.("📍 อย่าลืมกรอกที่อยู่สำหรับรับดอกไม้น้าา!");
      cardInputRef.current?.focus(); // บังคับเด้งเคอร์เซอร์ไปที่ช่องกรอก
      return; // ⛔️ หยุดการทำงานตรงนี้ ไม่ให้ไปหน้าต่อไป
    }

    // 2. ถ้าพิมพ์แล้ว ให้รันโค้ดเดิมเพื่อไปต่อ
    let dataUrl = "";
    try {
      if (
        rendererRef.current &&
        sceneRef.current &&
        cameraRef.current &&
        renderMode === "3d"
      ) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
        dataUrl = rendererRef.current.domElement.toDataURL("image/png");
      }
    } catch {
      // Fallback
    }
    onFinish(dataUrl);
  };

  const flatTypes2D: FlowerType[] = [];
  FLOWER_TYPES.forEach((t) => {
    for (let i = 0; i < (config.counts[t] || 0); i++) flatTypes2D.push(t);
  });

  return (
    <section className="w-full">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left 7 Cols: 3D Stage */}
        <div className="lg:col-span-7 glass-card rounded-3xl p-4 sm:p-5 relative overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <div>
              <span className="text-[11px] font-semibold text-rose-500 uppercase tracking-wider block">
                Realtime 3D Bouquet Studio
              </span>
              <h2 className="text-base sm:text-lg font-bold text-stone-800">
                ช่อดอกไม้ของ <span className="text-rose-500">{nickname}</span>{" "}
                💐
              </h2>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => {
                  onPlaySound?.("pop");
                  setAutoRotate(!autoRotate);
                }}
                className="px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-medium border border-pink-200 transition"
              >
                🔄 หมุนอัตโนมัติ: {autoRotate ? "เปิด" : "ปิด"}
              </button>
              <button
                type="button"
                onClick={() => {
                  onPlaySound?.("pop");
                  setRenderMode(renderMode === "3d" ? "2d" : "3d");
                }}
                className="px-2.5 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-medium border border-purple-200 transition"
              >
                {renderMode === "3d"
                  ? "✨ โหมด: 3D WebGL"
                  : "🎨 โหมด: 2.5D Cozy"}
              </button>
            </div>
          </div>

          <div className="relative w-full h-[360px] sm:h-[430px] rounded-2xl bg-gradient-to-b from-[#FFF7FA] via-[#FFFDF7] to-[#F3E8FF] border border-pink-100 overflow-hidden select-none">
            <div
              ref={hostRef}
              style={{ touchAction: "none" }}
              className={`w-full h-full cursor-grab active:cursor-grabbing ${
                renderMode === "2d" ? "hidden" : ""
              }`}
            />

            {renderMode === "2d" && (
              <div className="w-full h-full flex flex-col items-center justify-center p-4">
                <svg
                  viewBox="0 0 360 360"
                  className="w-64 h-64 sm:w-72 sm:h-72 drop-shadow-md"
                >
                  <circle cx="180" cy="145" r="110" fill="#FFF0F5" />
                  {config.holderStyle === "wrap" ? (
                    <>
                      <polygon
                        points="85,150 275,150 205,320 155,320"
                        fill={config.wrapperColor}
                        stroke="#ffffff"
                        strokeWidth="3"
                      />
                      <rect
                        x="148"
                        y="255"
                        width="64"
                        height="16"
                        rx="8"
                        fill={config.ribbonColor}
                      />
                    </>
                  ) : (
                    <rect
                      x="120"
                      y="185"
                      width="120"
                      height="135"
                      rx="28"
                      fill={config.wrapperColor}
                      stroke={config.ribbonColor}
                      strokeWidth="4"
                    />
                  )}
                  {flatTypes2D.map((t, i) => {
                    const angle = i * 2.39996;
                    const rad =
                      flatTypes2D.length <= 1
                        ? 0
                        : Math.sqrt(i / flatTypes2D.length) * 78;
                    const cx = 180 + Math.cos(angle) * rad;
                    const cy = 135 + Math.sin(angle) * (rad * 0.62);
                    const emoji =
                      t === "rose"
                        ? "🌹"
                        : t === "sunflower"
                          ? "🌻"
                          : t === "tulip"
                            ? "🌷"
                            : "🌼";
                    return (
                      <g key={i}>
                        <line
                          x1="180"
                          y1="260"
                          x2={cx}
                          y2={cy}
                          stroke="#52b788"
                          strokeWidth="4"
                          strokeLinecap="round"
                        />
                        <text
                          x={cx}
                          y={cy}
                          fontSize="34"
                          textAnchor="middle"
                          dominantBaseline="central"
                        >
                          {emoji}
                        </text>
                      </g>
                    );
                  })}
                </svg>
                <span className="text-[11px] text-stone-500 bg-white/80 px-3 py-1 rounded-full border border-pink-100 mt-1">
                  🎨 2.5D Cozy Illustrated Mode (รองรับทุกอุปกรณ์ 100%)
                </span>
              </div>
            )}

            {/* Camera Controls */}
            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between pointer-events-none">
              <div className="px-3 py-1.5 rounded-xl bg-white/85 backdrop-blur-md border border-pink-100 text-[11px] text-stone-600 shadow-sm pointer-events-auto">
                👆 ลากเพื่อหมุน 360° • เลื่อนลูกกลิ้งเพื่อซูม
              </div>
              <div className="flex items-center gap-1 pointer-events-auto">
                <button
                  type="button"
                  onClick={() => {
                    orbitRef.current.distance = Math.max(
                      2.5,
                      orbitRef.current.distance - 0.35,
                    );
                    onPlaySound?.("pop");
                  }}
                  className="w-8 h-8 rounded-xl bg-white/90 hover:bg-white text-stone-700 font-bold text-sm shadow border border-pink-100"
                >
                  ＋
                </button>
                <button
                  type="button"
                  onClick={() => {
                    orbitRef.current.distance = Math.min(
                      6.0,
                      orbitRef.current.distance + 0.35,
                    );
                    onPlaySound?.("pop");
                  }}
                  className="w-8 h-8 rounded-xl bg-white/90 hover:bg-white text-stone-700 font-bold text-sm shadow border border-pink-100"
                >
                  －
                </button>
                <button
                  type="button"
                  onClick={() => {
                    orbitRef.current.rotX = 0.12;
                    orbitRef.current.rotY = 0.25;
                    orbitRef.current.distance = 4.3;
                    onPlaySound?.("pop");
                  }}
                  className="px-2.5 h-8 rounded-xl bg-white/90 hover:bg-white text-stone-700 font-semibold text-xs shadow border border-pink-100"
                >
                  รีเซ็ต
                </button>
              </div>
            </div>
          </div>

          {/* Presets Bar */}
          <div className="mt-3 flex items-center gap-1.5 overflow-x-auto pb-1">
            <span className="text-[11px] font-semibold text-stone-500 whitespace-nowrap mr-1">
              ✨ จัดเซ็ตด่วน:
            </span>
            <button
              type="button"
              onClick={() => applyPreset("romantic")}
              className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-medium border border-pink-200 whitespace-nowrap transition"
            >
              🌹 โรแมนติกโรส
            </button>
            <button
              type="button"
              onClick={() => applyPreset("sunshine")}
              className="px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-700 text-xs font-medium border border-amber-200 whitespace-nowrap transition"
            >
              🌻 ซันไชน์สดใส
            </button>
            <button
              type="button"
              onClick={() => applyPreset("pastel")}
              className="px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-medium border border-purple-200 whitespace-nowrap transition"
            >
              🌷 พาสเทลละมุน
            </button>
            <button
              type="button"
              onClick={() => applyPreset("fullbloom")}
              className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-medium border border-emerald-200 whitespace-nowrap transition"
            >
              💐 จัดเต็มช่อใหญ่
            </button>
          </div>
        </div>

        {/* Right 5 Cols: Controls */}
        <div className="lg:col-span-5 glass-card rounded-3xl p-5 sm:p-6 space-y-5">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-stone-800">
                1. เลือกดอกไม้ในช่อ (สูงสุด {MAX_FLOWERS} ดอก)
              </h3>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-600">
                รวม {totalFlowers} ดอก
              </span>
            </div>

            <div className="grid grid-cols-1 gap-2.5">
              {[
                {
                  type: "rose" as FlowerType,
                  icon: "🌹",
                  title: "กุหลาบแดงซ้อนกลีบ (Rose)",
                  sub: "แทนคำว่ารักโรแมนติกสุดหัวใจ",
                  bg: "bg-rose-50/60 border-pink-100",
                  btn: "bg-rose-400 hover:bg-rose-500",
                },
                {
                  type: "sunflower" as FlowerType,
                  icon: "🌻",
                  title: "ทานตะวัน (Sunflower)",
                  sub: "ความสดใสและรักเดียวใจเดียว",
                  bg: "bg-amber-50/60 border-amber-100",
                  btn: "bg-amber-400 hover:bg-amber-500",
                },
                {
                  type: "tulip" as FlowerType,
                  icon: "🌷",
                  title: "ทิวลิปชมพูม่วง (Tulip)",
                  sub: "ความอบอุ่นทะนุถนอมและจริงใจ",
                  bg: "bg-purple-50/60 border-purple-100",
                  btn: "bg-purple-400 hover:bg-purple-500",
                },
                {
                  type: "daisy" as FlowerType,
                  icon: "🌼",
                  title: "เดซี่ขาวละมุน (Daisy)",
                  sub: "ความรักที่บริสุทธิ์และน่ารักสดใส",
                  bg: "bg-stone-50/90 border-stone-200/80",
                  btn: "bg-stone-700 hover:bg-stone-800",
                },
              ].map((f) => (
                <div
                  key={f.type}
                  className={`flex items-center justify-between p-3 rounded-2xl border ${f.bg}`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl">{f.icon}</span>
                    <div>
                      <div className="text-xs font-bold text-stone-800">
                        {f.title}
                      </div>
                      <div className="text-[11px] text-stone-500">{f.sub}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => adjustFlower(f.type, -1)}
                      className="w-7 h-7 rounded-lg bg-white border border-stone-200 text-stone-600 font-bold"
                    >
                      −
                    </button>
                    <span className="w-5 text-center text-sm font-bold text-stone-800">
                      {config.counts[f.type]}
                    </span>
                    <button
                      type="button"
                      onClick={() => adjustFlower(f.type, 1)}
                      className={`w-7 h-7 rounded-lg text-white font-bold ${f.btn}`}
                    >
                      ＋
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Wrapper Style & Colors */}
          <div className="space-y-3 pt-2 border-t border-pink-100">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-stone-800">
                2. รูปแบบการห่อ &amp; สีกระดาษ
              </h3>
              <div className="inline-flex rounded-xl bg-pink-50 p-0.5 border border-pink-200">
                <button
                  type="button"
                  onClick={() => {
                    onPlaySound?.("pop");
                    onChange({ ...config, holderStyle: "wrap" });
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                    config.holderStyle === "wrap"
                      ? "bg-white text-rose-500 shadow-sm"
                      : "text-stone-500"
                  }`}
                >
                  🎀 กระดาษห่อช่อ
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onPlaySound?.("pop");
                    onChange({ ...config, holderStyle: "vase" });
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                    config.holderStyle === "vase"
                      ? "bg-white text-rose-500 shadow-sm"
                      : "text-stone-500"
                  }`}
                >
                  🏺 แจกันเซรามิก
                </button>
              </div>
            </div>

            <div className="grid grid-cols-6 gap-2 pt-1">
              {WRAPPER_COLORS.map((c) => {
                const active =
                  config.wrapperColor.toLowerCase() === c.hex.toLowerCase();
                const isDark = c.name === "Black";
                return (
                  <button
                    key={c.name}
                    type="button"
                    title={c.name}
                    style={{ backgroundColor: c.hex }}
                    onClick={() => {
                      onPlaySound?.("pop");
                      onChange({
                        ...config,
                        wrapperColor: c.hex,
                        wrapperName: c.name,
                        ribbonColor: c.ribbon,
                      });
                    }}
                    className={`h-9 rounded-xl border-2 transition flex items-center justify-center ${
                      active
                        ? "border-rose-500 scale-105 shadow-sm"
                        : "border-stone-200 hover:scale-105"
                    }`}
                  >
                    {active && (
                      <span
                        className={`text-xs font-bold ${isDark ? "text-white" : "text-stone-700"}`}
                      >
                        ✓
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Address Input */}
          <div className="space-y-2 pt-2 border-t border-pink-100">
            <label className="block text-sm font-bold text-stone-800">
              3. ที่อยู่ที่จะให้ส่งดอกไม้ไปให้ 🏷️
            </label>
            <input
              ref={cardInputRef}
              type="text"
              maxLength={80}
              value={config.address}
              onChange={(e) => onChange({ ...config, address: e.target.value })}
              placeholder="ดอกไม้ที่ได้อาจจะไม่ได้เป็นเหมือนในรูปนะ555555555"
              className="w-full px-3.5 py-2.5 rounded-xl bg-rose-50/50 border border-pink-200 focus:border-rose-400 focus:bg-white focus:outline-none text-xs text-stone-700"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between gap-3 pt-2">
            <button
              type="button"
              onClick={() => {
                onPlaySound?.("pop");
                onBack();
              }}
              className="px-4 py-3 rounded-2xl bg-stone-100 hover:bg-stone-200 text-stone-600 text-xs font-semibold transition"
            >
              ← แก้คำตอบ
            </button>
            <button
              type="button"
              onClick={handleFinish}
              className="flex-1 py-3.5 px-5 rounded-2xl pastel-btn text-xs sm:text-sm font-bold flex items-center justify-center gap-2"
            >
              <span>จัดช่อเสร็จแล้ว ดูการ์ดสรุปกัน! 🎉</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
