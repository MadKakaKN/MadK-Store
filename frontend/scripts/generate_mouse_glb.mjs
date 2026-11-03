import fs from 'fs';
import path from 'path';

// Polyfill FileReader for Node.js environment
class FileReaderPolyfill {
  async readAsArrayBuffer(blob) {
    const buf = await blob.arrayBuffer();
    this.result = buf;
    if (this.onloadend) this.onloadend();
  }
}
globalThis.FileReader = FileReaderPolyfill;

import * as THREE from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';

const scene = new THREE.Scene();
scene.name = 'RazerBasiliskScene';

// ── PBR MATERIALS ──
// Body / Shell takes the variant color dynamically in the viewer
const bodyMat = new THREE.MeshStandardMaterial({
  name: 'Body',
  color: 0x18181b, // Matte Raven Black
  roughness: 0.28,
  metalness: 0.22,
});

const chassisMat = new THREE.MeshStandardMaterial({
  name: 'Chassis',
  color: 0x09090b,
  roughness: 0.75,
  metalness: 0.15,
});

const rubberMat = new THREE.MeshStandardMaterial({
  name: 'RubberGrip',
  color: 0x050507,
  roughness: 0.95,
  metalness: 0.05,
});

const ptfeMat = new THREE.MeshStandardMaterial({
  name: 'PTFE_Feet',
  color: 0xffffff,
  roughness: 0.1,
  metalness: 0.05,
});

const metalMat = new THREE.MeshStandardMaterial({
  name: 'MetalAccent',
  color: 0xc4cbd4,
  roughness: 0.18,
  metalness: 0.95,
});

const glossButtonMat = new THREE.MeshStandardMaterial({
  name: 'GlossButton',
  color: 0x0d0d12,
  roughness: 0.15,
  metalness: 0.85,
});

const chromaRgbMat = new THREE.MeshStandardMaterial({
  name: 'Chroma_LED',
  color: 0x00ff73, // Razer Chroma Signature Acid Green
  emissive: 0x00ff73,
  emissiveIntensity: 2.8,
  roughness: 0.2,
});

const wheelRgbMat = new THREE.MeshStandardMaterial({
  name: 'Wheel_Chroma_LED',
  color: 0x00ff73,
  emissive: 0x00ff73,
  emissiveIntensity: 2.5,
  roughness: 0.2,
});

const sensorLaserMat = new THREE.MeshStandardMaterial({
  name: 'Laser_Sensor',
  color: 0xff2222,
  emissive: 0xff2222,
  emissiveIntensity: 3.0,
});

const mouseGroup = new THREE.Group();
mouseGroup.name = 'GamingMouse_RazerBasilisk';
scene.add(mouseGroup);

// ─────────────────────────────────────────────────────────────────────────────
// 1. BASEPLATE & CHASSIS UNDERSIDE (Resting flat at y = 0)
// ─────────────────────────────────────────────────────────────────────────────
const baseGroup = new THREE.Group();
baseGroup.name = 'BaseChassis';
mouseGroup.add(baseGroup);

// Main bottom tub plate
const baseShape = new THREE.Shape();
baseShape.moveTo(-0.55, 0.95);
baseShape.lineTo(0.55, 0.95);
baseShape.quadraticCurveTo(0.68, 0.4, 0.65, -0.2);
baseShape.quadraticCurveTo(0.62, -0.7, 0.45, -1.15);
baseShape.lineTo(-0.45, -1.15);
baseShape.quadraticCurveTo(-0.62, -0.7, -0.72, -0.1);
baseShape.quadraticCurveTo(-0.85, 0.35, -0.78, 0.7);
baseShape.lineTo(-0.55, 0.95);

const basePlateGeom = new THREE.ExtrudeGeometry(baseShape, {
  depth: 0.07,
  bevelEnabled: true,
  bevelSegments: 4,
  steps: 1,
  bevelSize: 0.03,
  bevelThickness: 0.02,
});
basePlateGeom.rotateX(-Math.PI / 2);
const basePlateMesh = new THREE.Mesh(basePlateGeom, chassisMat);
basePlateMesh.position.set(0, 0.02, 0);
basePlateMesh.name = 'ChassisTub';
baseGroup.add(basePlateMesh);

// ─────────────────────────────────────────────────────────────────────────────
// 2. 100% PURE VIRGIN-GRADE PTFE SKATES (Thick rounded glide pads)
// ─────────────────────────────────────────────────────────────────────────────
// Front Smile Skate
const frontSkateShape = new THREE.Shape();
frontSkateShape.moveTo(-0.44, 0.05);
frontSkateShape.quadraticCurveTo(0, 0.2, 0.44, 0.05);
frontSkateShape.lineTo(0.40, -0.12);
frontSkateShape.quadraticCurveTo(0, 0.02, -0.40, -0.12);
frontSkateShape.closePath();

const frontSkateGeom = new THREE.ExtrudeGeometry(frontSkateShape, {
  depth: 0.015,
  bevelEnabled: true,
  bevelSegments: 3,
  bevelSize: 0.012,
  bevelThickness: 0.008,
});
frontSkateGeom.rotateX(-Math.PI / 2);
const frontSkateMesh = new THREE.Mesh(frontSkateGeom, ptfeMat);
frontSkateMesh.position.set(0, 0.005, -0.98);
frontSkateMesh.name = 'PTFE_Front';
baseGroup.add(frontSkateMesh);

// Rear Wide Crescent Horseshoe Skate
const rearSkateShape = new THREE.Shape();
rearSkateShape.moveTo(-0.48, 0.15);
rearSkateShape.quadraticCurveTo(0, 0.28, 0.48, 0.15);
rearSkateShape.lineTo(0.50, -0.14);
rearSkateShape.quadraticCurveTo(0, -0.02, -0.50, -0.14);
rearSkateShape.closePath();

const rearSkateGeom = new THREE.ExtrudeGeometry(rearSkateShape, {
  depth: 0.015,
  bevelEnabled: true,
  bevelSegments: 3,
  bevelSize: 0.012,
  bevelThickness: 0.008,
});
rearSkateGeom.rotateX(-Math.PI / 2);
const rearSkateMesh = new THREE.Mesh(rearSkateGeom, ptfeMat);
rearSkateMesh.position.set(0, 0.005, 0.95);
rearSkateMesh.name = 'PTFE_Rear';
baseGroup.add(rearSkateMesh);

// Thumb Wing Skate
const thumbSkate = new THREE.Mesh(
  new THREE.CapsuleGeometry(0.065, 0.42, 8, 16),
  ptfeMat
);
thumbSkate.position.set(-0.76, 0.005, 0.15);
thumbSkate.rotation.set(-Math.PI / 2, 0, 0);
thumbSkate.name = 'PTFE_Thumb';
baseGroup.add(thumbSkate);

// Focus Pro 30K Optical Sensor Aperture & Enclosing Ring
const sensorRing = new THREE.Mesh(
  new THREE.RingGeometry(0.11, 0.19, 28),
  ptfeMat
);
sensorRing.position.set(0, 0.005, 0.02);
sensorRing.rotation.set(-Math.PI / 2, 0, 0);
sensorRing.name = 'PTFE_SensorRing';
baseGroup.add(sensorRing);

const sensorAperture = new THREE.Mesh(
  new THREE.CircleGeometry(0.065, 20),
  sensorLaserMat
);
sensorAperture.position.set(0, 0.008, 0.02);
sensorAperture.rotation.set(-Math.PI / 2, 0, 0);
sensorAperture.name = 'SensorLaser';
baseGroup.add(sensorAperture);

// Profile switch & 2.4GHz / BLE toggle switch on bottom
const profileBtn = new THREE.Mesh(
  new THREE.CylinderGeometry(0.045, 0.045, 0.025, 16),
  metalMat
);
profileBtn.position.set(0.28, 0.015, 0.22);
baseGroup.add(profileBtn);

// Magnetic Qi Wireless Charging Puck Circle
const puckRing = new THREE.Mesh(
  new THREE.RingGeometry(0.28, 0.30, 32),
  metalMat
);
puckRing.position.set(0, 0.005, 0.55);
puckRing.rotation.set(-Math.PI / 2, 0, 0);
baseGroup.add(puckRing);

// ─────────────────────────────────────────────────────────────────────────────
// 3. 13-ZONE RAZER CHROMA RGB UNDERGLOW PERIMETER LIGHT TUBE
// ─────────────────────────────────────────────────────────────────────────────
const underglowCurve = new THREE.CatmullRomCurve3([
  new THREE.Vector3(-0.78, 0.06, 0.65),
  new THREE.Vector3(-0.84, 0.06, 0.25),
  new THREE.Vector3(-0.78, 0.06, -0.15),
  new THREE.Vector3(-0.62, 0.06, -0.70),
  new THREE.Vector3(-0.42, 0.06, -1.05),
  new THREE.Vector3(0, 0.06, -1.12),
  new THREE.Vector3(0.42, 0.06, -1.05),
  new THREE.Vector3(0.60, 0.06, -0.68),
  new THREE.Vector3(0.66, 0.06, -0.15),
  new THREE.Vector3(0.68, 0.06, 0.35),
  new THREE.Vector3(0.55, 0.06, 0.85),
  new THREE.Vector3(0, 0.06, 1.05),
  new THREE.Vector3(-0.55, 0.06, 0.85),
]);
const underglowGeom = new THREE.TubeGeometry(underglowCurve, 64, 0.022, 12, true);
const underglowMesh = new THREE.Mesh(underglowGeom, chromaRgbMat);
underglowMesh.name = 'Chroma_Underglow_Strip';
mouseGroup.add(underglowMesh);

// ─────────────────────────────────────────────────────────────────────────────
// 4. FLARED ERGONOMIC THUMB REST WING & SNIPER CLUTCH
// ─────────────────────────────────────────────────────────────────────────────
const thumbWingGroup = new THREE.Group();
thumbWingGroup.position.set(-0.74, 0.08, 0.12);
thumbWingGroup.rotation.set(0, 0, -0.06);
mouseGroup.add(thumbWingGroup);

// Sculpted thumb shelf surface
const thumbWingShape = new THREE.Shape();
thumbWingShape.moveTo(0.18, -0.60);
thumbWingShape.lineTo(-0.25, -0.25);
thumbWingShape.quadraticCurveTo(-0.40, 0.20, -0.18, 0.65);
thumbWingShape.lineTo(0.18, 0.55);
thumbWingShape.closePath();

const thumbWingGeom = new THREE.ExtrudeGeometry(thumbWingShape, {
  depth: 0.10,
  bevelEnabled: true,
  bevelSegments: 4,
  bevelSize: 0.04,
  bevelThickness: 0.03,
});
thumbWingGeom.rotateX(-Math.PI / 2);
const thumbWingPlatform = new THREE.Mesh(thumbWingGeom, chassisMat);
thumbWingPlatform.name = 'ThumbRestPlatform';
thumbWingGroup.add(thumbWingPlatform);

// Rubber traction ribs on thumb rest
[-0.26, -0.13, 0, 0.13, 0.26, 0.39].forEach((z) => {
  const rib = new THREE.Mesh(
    new THREE.BoxGeometry(0.24, 0.02, 0.035),
    rubberMat
  );
  rib.position.set(-0.06, 0.085, z);
  rib.rotation.set(0, -0.18, 0);
  thumbWingGroup.add(rib);
});

// Signature Multi-Function Sniper DPI Clutch Lever Paddle
const clutchGroup = new THREE.Group();
clutchGroup.position.set(-0.05, 0.12, -0.55);
clutchGroup.rotation.set(0, 0, -0.08);
thumbWingGroup.add(clutchGroup);

const clutchLever = new THREE.Mesh(
  new THREE.BoxGeometry(0.08, 0.06, 0.22),
  metalMat
);
clutchLever.name = 'Sniper_DPI_Clutch';
clutchGroup.add(clutchLever);

// ─────────────────────────────────────────────────────────────────────────────
// 5. ERGONOMIC ASYMMETRICAL PALM ARCH (Aggressive Gamer Contours)
// ─────────────────────────────────────────────────────────────────────────────
const palmGroup = new THREE.Group();
palmGroup.position.set(0, 0.26, 0.22);
palmGroup.rotation.set(-0.16, 0, -0.08); // Real right-handed slope
mouseGroup.add(palmGroup);

// Sculpted arched palm shell with sharp aggressive bevel
const palmShape = new THREE.Shape();
palmShape.moveTo(-0.52, -0.70);
palmShape.lineTo(0.48, -0.70);
palmShape.quadraticCurveTo(0.60, -0.10, 0.58, 0.40);
palmShape.quadraticCurveTo(0.48, 0.88, 0.02, 0.95);
palmShape.quadraticCurveTo(-0.48, 0.88, -0.58, 0.40);
palmShape.quadraticCurveTo(-0.62, -0.10, -0.52, -0.70);

const palmGeom = new THREE.ExtrudeGeometry(palmShape, {
  depth: 0.32,
  bevelEnabled: true,
  bevelSegments: 8,
  steps: 2,
  bevelSize: 0.14,
  bevelThickness: 0.18,
});
palmGeom.rotateX(-Math.PI / 2);
const palmMesh = new THREE.Mesh(palmGeom, bodyMat);
palmMesh.name = 'PalmShell_Body';
palmGroup.add(palmMesh);

// Illuminated Razer Chroma Snake Crest on Palm Rest
const logoGroup = new THREE.Group();
logoGroup.position.set(0, 0.54, 0.42);
logoGroup.rotation.set(-0.35, 0, 0);
palmGroup.add(logoGroup);

const logoBacking = new THREE.Mesh(
  new THREE.CircleGeometry(0.18, 32),
  chromaRgbMat
);
logoBacking.name = 'Chroma_Palm_Logo';
logoGroup.add(logoBacking);

// Stenciled emblem ring
const logoRing = new THREE.Mesh(
  new THREE.RingGeometry(0.16, 0.18, 32),
  glossButtonMat
);
logoRing.position.set(0, 0, 0.005);
logoGroup.add(logoRing);

// ─────────────────────────────────────────────────────────────────────────────
// 6. SHARP AGGRESSIVE SPLIT CLICK BUTTONS (Independent Left & Right Paddles)
// ─────────────────────────────────────────────────────────────────────────────
const clicksGroup = new THREE.Group();
mouseGroup.add(clicksGroup);

// --- LEFT CLICK BUTTON (Ergonomic finger trough & pointed fang tip) ---
const leftClickShape = new THREE.Shape();
leftClickShape.moveTo(-0.06, 0.65); // Pivot at center
leftClickShape.lineTo(-0.52, 0.55); // Outer rear
leftClickShape.quadraticCurveTo(-0.56, 0.0, -0.52, -0.55); // Outer edge
leftClickShape.lineTo(-0.38, -1.08); // Sharp pointed outer tip
leftClickShape.lineTo(-0.08, -1.02); // Inner click tip
leftClickShape.lineTo(-0.06, -0.20); // Inner cockpit cutout edge
leftClickShape.closePath();

const leftClickGeom = new THREE.ExtrudeGeometry(leftClickShape, {
  depth: 0.12,
  bevelEnabled: true,
  bevelSegments: 6,
  steps: 2,
  bevelSize: 0.06,
  bevelThickness: 0.06,
});
leftClickGeom.rotateX(-Math.PI / 2);
leftClickGeom.rotateZ(-0.02);

const leftClickMesh = new THREE.Mesh(leftClickGeom, bodyMat);
leftClickMesh.position.set(-0.02, 0.40, -0.15);
leftClickMesh.rotation.set(0.18, 0, 0.03);
leftClickMesh.name = 'LeftClickPaddle_Body';
clicksGroup.add(leftClickMesh);

// --- RIGHT CLICK BUTTON (Sloped downward with sharp pointed tip) ---
const rightClickShape = new THREE.Shape();
rightClickShape.moveTo(0.06, 0.65);
rightClickShape.lineTo(0.50, 0.55);
rightClickShape.quadraticCurveTo(0.54, 0.0, 0.48, -0.55);
rightClickShape.lineTo(0.34, -1.06);
rightClickShape.lineTo(0.08, -1.00);
rightClickShape.lineTo(0.06, -0.20);
rightClickShape.closePath();

const rightClickGeom = new THREE.ExtrudeGeometry(rightClickShape, {
  depth: 0.11,
  bevelEnabled: true,
  bevelSegments: 6,
  steps: 2,
  bevelSize: 0.06,
  bevelThickness: 0.06,
});
rightClickGeom.rotateX(-Math.PI / 2);
rightClickGeom.rotateZ(0.02);

const rightClickMesh = new THREE.Mesh(rightClickGeom, bodyMat);
rightClickMesh.position.set(0.02, 0.38, -0.15);
rightClickMesh.rotation.set(0.20, 0, -0.05); // Noticeably lower on the right
rightClickMesh.name = 'RightClickPaddle_Body';
clicksGroup.add(rightClickMesh);

// Central recessed separation channel floor
const channelFloor = new THREE.Mesh(
  new THREE.BoxGeometry(0.16, 0.12, 1.35),
  chassisMat
);
channelFloor.position.set(0, 0.30, -0.65);
clicksGroup.add(channelFloor);

// ─────────────────────────────────────────────────────────────────────────────
// 7. HYPERSCROLL TILT WHEEL & COCKPIT CONTROLS
// ─────────────────────────────────────────────────────────────────────────────
const wheelGroup = new THREE.Group();
wheelGroup.position.set(0, 0.46, -0.68);
mouseGroup.add(wheelGroup);

// Wheel Hub Axle (Spoked metallic rim)
const wheelHub = new THREE.Mesh(
  new THREE.CylinderGeometry(0.165, 0.165, 0.09, 32),
  metalMat
);
wheelHub.rotation.z = Math.PI / 2;
wheelHub.name = 'WheelMetalRim';
wheelGroup.add(wheelHub);

// Knurled Rubber Outer Tire with Chevron Ridges
const tireGeom = new THREE.CylinderGeometry(0.176, 0.176, 0.055, 36);
const wheelTire = new THREE.Mesh(tireGeom, rubberMat);
wheelTire.rotation.z = Math.PI / 2;
wheelTire.name = 'WheelRubberTire';
wheelGroup.add(wheelTire);

// 20 knurled tactile traction ribs on tire surface
for (let i = 0; i < 20; i++) {
  const angle = (i / 20) * Math.PI * 2;
  const rib = new THREE.Mesh(
    new THREE.BoxGeometry(0.056, 0.008, 0.014),
    metalMat
  );
  rib.position.set(0, Math.cos(angle) * 0.176, Math.sin(angle) * 0.176);
  rib.rotation.x = -angle;
  wheelGroup.add(rib);
}

// Dual Translucent Chroma RGB Glow Rings on Wheel Flanks
[-0.038, 0.038].forEach((x, i) => {
  const glowRing = new THREE.Mesh(
    new THREE.RingGeometry(0.125, 0.168, 28),
    wheelRgbMat
  );
  glowRing.position.set(x, 0, 0);
  glowRing.rotation.y = Math.PI / 2;
  glowRing.name = `Wheel_Chroma_Ring_${i}`;
  wheelGroup.add(glowRing);
});

// Wheel Cowl / Hood (Aggressive visor framing the scroll wheel)
const wheelHood = new THREE.Mesh(
  new THREE.BoxGeometry(0.14, 0.06, 0.22),
  chassisMat
);
wheelHood.position.set(0, 0.44, -0.48);
wheelHood.rotation.x = -0.15;
mouseGroup.add(wheelHood);

// Dual Faceted Tactile DPI Sensitivity Buttons
[-0.045, 0.045].forEach((z, i) => {
  const dpiBtn = new THREE.Mesh(
    new THREE.BoxGeometry(0.08, 0.04, 0.075),
    metalMat
  );
  dpiBtn.position.set(0, 0.45, -0.34 + z);
  dpiBtn.rotation.x = -0.12;
  dpiBtn.name = `DPI_Switch_${i + 1}`;
  mouseGroup.add(dpiBtn);
});

// ─────────────────────────────────────────────────────────────────────────────
// 8. SIDE THUMB BUTTONS (Mouse 4 & Mouse 5) & FRONT INTAKE BUMPER
// ─────────────────────────────────────────────────────────────────────────────
const sideButtonsGroup = new THREE.Group();
sideButtonsGroup.position.set(-0.62, 0.40, -0.06);
sideButtonsGroup.rotation.set(0, 0.08, -0.04);
mouseGroup.add(sideButtonsGroup);

// Mouse 5 (Forward Button)
const mouse5 = new THREE.Mesh(
  new THREE.BoxGeometry(0.07, 0.09, 0.26),
  glossButtonMat
);
mouse5.position.set(0, 0, -0.16);
mouse5.name = 'Mouse5_Forward';
sideButtonsGroup.add(mouse5);

// Mouse 4 (Back Button)
const mouse4 = new THREE.Mesh(
  new THREE.BoxGeometry(0.07, 0.09, 0.26),
  glossButtonMat
);
mouse4.position.set(0, 0, 0.14);
mouse4.name = 'Mouse4_Back';
sideButtonsGroup.add(mouse4);

// Front Air Intake Grille & Recessed USB-C Speedflex Port
const frontIntakeGroup = new THREE.Group();
frontIntakeGroup.position.set(0, 0.16, -1.22);
mouseGroup.add(frontIntakeGroup);

const intakeBumper = new THREE.Mesh(
  new THREE.BoxGeometry(0.46, 0.12, 0.08),
  chassisMat
);
frontIntakeGroup.add(intakeBumper);

// Dual intake scoops
[-0.14, 0.14].forEach((x) => {
  const scoop = new THREE.Mesh(
    new THREE.BoxGeometry(0.12, 0.05, 0.04),
    glossButtonMat
  );
  scoop.position.set(x, 0, -0.02);
  frontIntakeGroup.add(scoop);
});

// USB-C Reversible Port Hollow
const usbcPort = new THREE.Mesh(
  new THREE.BoxGeometry(0.10, 0.035, 0.04),
  metalMat
);
usbcPort.position.set(0, 0, -0.025);
frontIntakeGroup.add(usbcPort);

// ─────────────────────────────────────────────────────────────────────────────
// EXPORT TO GLTF BINARY (.GLB)
// ─────────────────────────────────────────────────────────────────────────────
console.log('Generating authentic Razer Basilisk V3 Pro 3D CAD model...');

const exporter = new GLTFExporter();
exporter.parse(
  scene,
  (glbBuffer) => {
    const outputPath = path.resolve('public/models/gaming-mouse.glb');
    fs.writeFileSync(outputPath, Buffer.from(glbBuffer));
    console.log(`[SUCCESS] Wrote gaming-mouse.glb to ${outputPath} (${(glbBuffer.byteLength / 1024).toFixed(1)} KB)`);
  },
  (err) => {
    console.error('GLTF Export failed:', err);
    process.exit(1);
  },
  { binary: true }
);
