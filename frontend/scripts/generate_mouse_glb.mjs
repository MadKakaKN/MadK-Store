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
scene.name = 'GamingMouseScene';

// ── PBR MATERIALS ──
// Body/Housing material takes variant color in viewer
const bodyMat = new THREE.MeshStandardMaterial({
  name: 'Body',
  color: 0x1e293b,
  roughness: 0.32,
  metalness: 0.35
});

const darkMat = new THREE.MeshStandardMaterial({
  name: 'Chassis',
  color: 0x0f172a,
  roughness: 0.75,
  metalness: 0.2
});

const rubberMat = new THREE.MeshStandardMaterial({
  name: 'RubberGrip',
  color: 0x090d16,
  roughness: 0.95,
  metalness: 0.05
});

const ptfeMat = new THREE.MeshStandardMaterial({
  name: 'PTFE_Feet',
  color: 0xffffff,
  roughness: 0.12,
  metalness: 0.05
});

const metalMat = new THREE.MeshStandardMaterial({
  name: 'Metal',
  color: 0xcbd5e1,
  roughness: 0.2,
  metalness: 0.95
});

const rgbMat = new THREE.MeshStandardMaterial({
  name: 'RGB_LED',
  color: 0x10b981,
  emissive: 0x10b981,
  emissiveIntensity: 2.0,
  roughness: 0.2
});

const wheelLedMat = new THREE.MeshStandardMaterial({
  name: 'Wheel_LED',
  color: 0x06b6d4,
  emissive: 0x06b6d4,
  emissiveIntensity: 1.8,
  roughness: 0.2
});

const laserMat = new THREE.MeshStandardMaterial({
  name: 'Laser_Sensor',
  color: 0xef4444,
  emissive: 0xef4444,
  emissiveIntensity: 2.5
});

const glossButtonMat = new THREE.MeshStandardMaterial({
  name: 'GlossButtons',
  color: 0x090d16,
  roughness: 0.18,
  metalness: 0.85
});

// Root Mouse Group (resting flat on table, centered)
const mouseGroup = new THREE.Group();
mouseGroup.name = 'GamingMouse';
scene.add(mouseGroup);

// ── 1. BASEPLATE & CHASSIS TUB ──
const baseGroup = new THREE.Group();
baseGroup.name = 'Baseplate';
mouseGroup.add(baseGroup);

const basePlate = new THREE.Mesh(
  new THREE.CylinderGeometry(0.64, 0.68, 0.08, 36),
  darkMat
);
basePlate.position.set(0, 0.04, 0);
basePlate.name = 'ChassisTub';
baseGroup.add(basePlate);

const frontPlate = new THREE.Mesh(
  new THREE.CylinderGeometry(0.58, 0.62, 0.08, 36),
  darkMat
);
frontPlate.position.set(0, 0.04, -0.58);
baseGroup.add(frontPlate);

const rearPlate = new THREE.Mesh(
  new THREE.CylinderGeometry(0.60, 0.64, 0.08, 36),
  darkMat
);
rearPlate.position.set(0, 0.04, 0.58);
baseGroup.add(rearPlate);

// ── 2. VIRGIN-GRADE 100% PURE WHITE PTFE GLIDE SKATES ──
// Front Smile Skate
const frontSkate = new THREE.Mesh(
  new THREE.RingGeometry(0.26, 0.45, 32, 1, 0, Math.PI),
  ptfeMat
);
frontSkate.position.set(0, 0.005, -1.02);
frontSkate.rotation.set(-Math.PI / 2, 0, 0);
frontSkate.name = 'PTFE_Front';
baseGroup.add(frontSkate);

// Rear Crescent Skate
const rearSkate = new THREE.Mesh(
  new THREE.RingGeometry(0.32, 0.52, 32, 1, 0, Math.PI),
  ptfeMat
);
rearSkate.position.set(0, 0.005, 1.02);
rearSkate.rotation.set(-Math.PI / 2, 0, Math.PI);
rearSkate.name = 'PTFE_Rear';
baseGroup.add(rearSkate);

// Thumb Wing Skate
const thumbSkate = new THREE.Mesh(
  new THREE.CapsuleGeometry(0.065, 0.38, 8, 16),
  ptfeMat
);
thumbSkate.position.set(-0.80, 0.005, 0.14);
thumbSkate.rotation.set(-Math.PI / 2, 0, 0);
thumbSkate.name = 'PTFE_Thumb';
baseGroup.add(thumbSkate);

// Optical Sensor Ring
const sensorRing = new THREE.Mesh(
  new THREE.RingGeometry(0.10, 0.18, 28),
  ptfeMat
);
sensorRing.position.set(0, 0.005, 0.02);
sensorRing.rotation.set(-Math.PI / 2, 0, 0);
sensorRing.name = 'PTFE_SensorRing';
baseGroup.add(sensorRing);

// Glowing Laser Sensor Aperture
const laserAperture = new THREE.Mesh(
  new THREE.CircleGeometry(0.065, 20),
  laserMat
);
laserAperture.position.set(0, 0.01, 0.02);
laserAperture.rotation.set(-Math.PI / 2, 0, 0);
laserAperture.name = 'FocusPro_Laser';
baseGroup.add(laserAperture);

// Profile switch & power toggle on bottom
const profileBtn = new THREE.Mesh(
  new THREE.CylinderGeometry(0.045, 0.045, 0.02, 16),
  metalMat
);
profileBtn.position.set(0.28, 0.015, 0.22);
baseGroup.add(profileBtn);

// ── 3. FLARED THUMB REST WING & RUBBER GRIP RIBS ──
const thumbWingGroup = new THREE.Group();
thumbWingGroup.position.set(-0.80, 0.04, 0.14);
thumbWingGroup.rotation.set(0, 0, -0.07);
baseGroup.add(thumbWingGroup);

const thumbWingMesh = new THREE.Mesh(
  new THREE.SphereGeometry(1, 28, 20, 0, Math.PI * 2, 0, Math.PI * 0.5),
  darkMat
);
thumbWingMesh.scale.set(0.48, 0.09, 1.22);
thumbWingMesh.name = 'ThumbRestWing';
thumbWingGroup.add(thumbWingMesh);

// Textured rubber grip ridges
[-0.28, 0, 0.28].forEach((z, idx) => {
  const gripRib = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.016, 0.32, 8, 16),
    rubberMat
  );
  gripRib.position.set(0.02, 0.055, z);
  gripRib.rotation.set(0, 0, Math.PI / 2);
  thumbWingGroup.add(gripRib);
});

// Sniper DPI Clutch trigger paddle
const sniperBtn = new THREE.Mesh(
  new THREE.CapsuleGeometry(0.045, 0.18, 8, 16),
  metalMat
);
sniperBtn.position.set(0.06, 0.085, -0.58);
sniperBtn.rotation.set(0, 0, -0.12);
sniperBtn.name = 'SniperClutch';
thumbWingGroup.add(sniperBtn);

// ── 4. ERGONOMIC PALM ARCH (Sculpted Ellipsoid Dome) ──
const palmGroup = new THREE.Group();
palmGroup.position.set(0, 0.24, 0.20);
palmGroup.rotation.set(-0.14, 0, -0.06); // Ergonomic right-hand tilt
mouseGroup.add(palmGroup);

const palmMesh = new THREE.Mesh(
  new THREE.SphereGeometry(1, 48, 36, 0, Math.PI * 2, 0, Math.PI * 0.56),
  bodyMat
);
palmMesh.scale.set(0.78, 0.50, 1.28);
palmMesh.name = 'PalmRest_Body';
palmGroup.add(palmMesh);

// Illuminated Chroma Gaming Crest on Palm Rest
const chromaLogo = new THREE.Mesh(
  new THREE.CircleGeometry(0.16, 28),
  rgbMat
);
chromaLogo.position.set(0, 0.58, 0.50);
chromaLogo.rotation.set(-0.32, 0, 0);
chromaLogo.name = 'Chroma_RGB_Logo';
palmGroup.add(chromaLogo);

// ── 5. SPLIT PRIMARY CLICK BUTTONS (Independent Left & Right Clicks) ──
const clicksGroup = new THREE.Group();
mouseGroup.add(clicksGroup);

// Left Click Paddle (Ergonomic concave finger hollow)
const leftClickGroup = new THREE.Group();
leftClickGroup.position.set(-0.34, 0.25, -0.70);
leftClickGroup.rotation.set(0.23, 0, 0.04);
clicksGroup.add(leftClickGroup);

const leftClickMesh = new THREE.Mesh(
  new THREE.SphereGeometry(1, 32, 24, 0, Math.PI * 2, 0, Math.PI * 0.5),
  bodyMat
);
leftClickMesh.scale.set(0.35, 0.17, 0.92);
leftClickMesh.name = 'LeftClick_Button';
leftClickGroup.add(leftClickMesh);

// Right Click Paddle (Ergonomic concave finger hollow)
const rightClickGroup = new THREE.Group();
rightClickGroup.position.set(0.34, 0.25, -0.70);
rightClickGroup.rotation.set(0.23, 0, -0.04);
clicksGroup.add(rightClickGroup);

const rightClickMesh = new THREE.Mesh(
  new THREE.SphereGeometry(1, 32, 24, 0, Math.PI * 2, 0, Math.PI * 0.5),
  bodyMat
);
rightClickMesh.scale.set(0.35, 0.17, 0.92);
rightClickMesh.name = 'RightClick_Button';
rightClickGroup.add(rightClickMesh);

// Center Recessed Trench Channel between clicks
const centerTrench = new THREE.Mesh(
  new THREE.BoxGeometry(0.14, 0.20, 1.02),
  darkMat
);
centerTrench.position.set(0, 0.22, -0.68);
centerTrench.name = 'CenterCanyon';
clicksGroup.add(centerTrench);

// ── 6. HYPERSCROLL TACTILE WHEEL & DPI BUTTONS ──
const wheelGroup = new THREE.Group();
wheelGroup.position.set(0, 0.46, -0.68);
mouseGroup.add(wheelGroup);

// Brushed Metal Core Hub
const wheelHub = new THREE.Mesh(
  new THREE.CylinderGeometry(0.16, 0.16, 0.085, 32),
  metalMat
);
wheelHub.rotation.set(0, 0, Math.PI / 2);
wheelHub.name = 'WheelMetalHub';
wheelGroup.add(wheelHub);

// Knurled Rubber Outer Tire Tread
const wheelTire = new THREE.Mesh(
  new THREE.CylinderGeometry(0.17, 0.17, 0.048, 32),
  rubberMat
);
wheelTire.rotation.set(0, 0, Math.PI / 2);
wheelTire.name = 'WheelRubberTread';
wheelGroup.add(wheelTire);

// Dual Translucent RGB Side Glow Rims
[-0.040, 0.040].forEach((x, idx) => {
  const ledRim = new THREE.Mesh(
    new THREE.RingGeometry(0.118, 0.165, 28),
    wheelLedMat
  );
  ledRim.position.set(x, 0, 0);
  ledRim.rotation.set(0, Math.PI / 2, 0);
  ledRim.name = 'Wheel_LED_Rim_' + (idx === 0 ? 'L' : 'R');
  wheelGroup.add(ledRim);
});

// DPI Toggle Stage Buttons directly behind wheel
const dpiGroup = new THREE.Group();
dpiGroup.position.set(0, 0.44, -0.40);
mouseGroup.add(dpiGroup);

[-0.065, 0.065].forEach((z, idx) => {
  const dpiBtn = new THREE.Mesh(
    new THREE.BoxGeometry(0.085, 0.055, 0.095),
    metalMat
  );
  dpiBtn.position.set(0, 0, z);
  dpiBtn.name = 'DPI_Button_' + (idx === 0 ? 'Up' : 'Down');
  dpiGroup.add(dpiBtn);
});

// ── 7. SIDE THUMB BUTTONS (Mouse 4 & Mouse 5) ──
const sideButtonsGroup = new THREE.Group();
sideButtonsGroup.position.set(-0.66, 0.39, -0.02);
sideButtonsGroup.rotation.set(0, 0.09, 0);
mouseGroup.add(sideButtonsGroup);

const mouse4 = new THREE.Mesh(
  new THREE.CapsuleGeometry(0.042, 0.22, 10, 16),
  glossButtonMat
);
mouse4.position.set(0, 0, -0.16);
mouse4.name = 'Button_Forward_M4';
sideButtonsGroup.add(mouse4);

const mouse5 = new THREE.Mesh(
  new THREE.CapsuleGeometry(0.042, 0.22, 10, 16),
  glossButtonMat
);
mouse5.position.set(0, 0, 0.17);
mouse5.name = 'Button_Back_M5';
sideButtonsGroup.add(mouse5);

// ── 8. FRONT BUMPER & SPEEDFLEX USB-C PORT ──
const frontPort = new THREE.Mesh(
  new THREE.BoxGeometry(0.24, 0.075, 0.06),
  darkMat
);
frontPort.position.set(0, 0.12, -1.26);
frontPort.name = 'Speedflex_Port';
mouseGroup.add(frontPort);

// ── EXPORT TO BINARY GLB ──
const exporter = new GLTFExporter();
exporter.parse(
  scene,
  (glb) => {
    const outPath = path.resolve('public/models/gaming-mouse.glb');
    fs.writeFileSync(outPath, Buffer.from(glb));
    console.log('SUCCESS: Generated gaming-mouse.glb at', outPath, 'Size:', glb.byteLength, 'bytes');
  },
  (err) => {
    console.error('ERROR exporting GLB:', err);
    process.exit(1);
  },
  { binary: true }
);
