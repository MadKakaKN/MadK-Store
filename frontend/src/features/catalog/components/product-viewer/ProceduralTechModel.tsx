import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Center } from '@react-three/drei';
import * as THREE from 'three';

export interface ProceduralTechModelProps {
  variantColor: string;
  wireframe?: boolean;
  categorySlug?: string;
  productName?: string;
}

/**
 * Detect product category to render the authentic, category-accurate 3D procedural model
 */
export function detectProductType(
  categorySlug?: string,
  productName?: string
): 'phone' | 'tablet' | 'laptop' | 'gpu' | 'headphone' | 'mouse' | 'keyboard' | 'cpu' | 'ram' | 'ssd' {
  const cat = (categorySlug || '').toLowerCase();
  const name = (productName || '').toLowerCase();

  if (cat.includes('may-tinh-bang') || name.includes('ipad') || name.includes('tab')) {
    return 'tablet';
  }
  if (
    cat.includes('dien-thoai') ||
    name.includes('iphone') ||
    name.includes('galaxy s') ||
    name.includes('galaxy z') ||
    name.includes('galaxy a') ||
    name.includes('phone')
  ) {
    return 'phone';
  }
  if (
    cat.includes('laptop') ||
    name.includes('macbook') ||
    name.includes('laptop') ||
    name.includes('xps') ||
    name.includes('thinkpad') ||
    name.includes('zenbook') ||
    name.includes('scar') ||
    name.includes('zephyrus') ||
    name.includes('helios') ||
    name.includes('legion') ||
    name.includes('alienware')
  ) {
    return 'laptop';
  }
  if (
    cat.includes('vga') ||
    cat.includes('card-man-hinh') ||
    name.includes('rtx') ||
    name.includes('geforce') ||
    name.includes('radeon') ||
    name.includes('vga')
  ) {
    return 'gpu';
  }
  if (
    cat.includes('tai-nghe') ||
    name.includes('tai nghe') ||
    name.includes('headphone') ||
    name.includes('wh-1000') ||
    name.includes('wf-1000') ||
    name.includes('airpods') ||
    name.includes('blackshark')
  ) {
    return 'headphone';
  }
  if (
    cat.includes('chuot') ||
    name.includes('chuột') ||
    name.includes('mouse') ||
    name.includes('superlight') ||
    name.includes('deathadder') ||
    name.includes('viper') ||
    name.includes('g502')
  ) {
    return 'mouse';
  }
  if (
    cat.includes('ban-phim') ||
    name.includes('bàn phím') ||
    name.includes('keyboard') ||
    name.includes('keychron') ||
    name.includes('huntsman') ||
    name.includes('g915')
  ) {
    return 'keyboard';
  }
  if (
    cat.includes('cpu') ||
    name.includes('vi xử lý') ||
    name.includes('core i') ||
    name.includes('ryzen') ||
    name.includes('intel core')
  ) {
    return 'cpu';
  }
  if (
    cat.includes('ram') ||
    name.includes('ram ') ||
    name.includes('ddr5') ||
    name.includes('ddr4') ||
    name.includes('dominator') ||
    name.includes('vengeance')
  ) {
    return 'ram';
  }
  if (
    cat.includes('ssd') ||
    cat.includes('o-cung') ||
    name.includes('ssd') ||
    name.includes('ổ cứng') ||
    name.includes('990 pro') ||
    name.includes('980 pro') ||
    name.includes('nvme')
  ) {
    return 'ssd';
  }

  return 'phone';
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. SMARTPHONE 3D MODEL (iPhone / Galaxy)
// ─────────────────────────────────────────────────────────────────────────────
function Smartphone3D({ parsedColor, wireframe }: { parsedColor: THREE.Color; wireframe: boolean }) {
  return (
    <group position={[0, 0, 0]} rotation={[0.15, -0.35, 0]}>
      {/* Curved Titanium Perimeter Chassis */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[1.52, 3.12, 0.16]} />
        <meshStandardMaterial color={parsedColor} metalness={0.92} roughness={0.25} wireframe={wireframe} />
      </mesh>

      {/* Front Face: Glossy Bezel & OLED Screen */}
      <mesh position={[0, 0, 0.082]}>
        <planeGeometry args={[1.44, 3.04]} />
        <meshStandardMaterial color="#020617" roughness={0.05} metalness={0.3} wireframe={wireframe} />
      </mesh>

      {/* Screen Glowing Wallpaper */}
      <mesh position={[0, -0.05, 0.083]}>
        <planeGeometry args={[1.38, 2.85]} />
        <meshStandardMaterial
          color={parsedColor}
          emissive={parsedColor}
          emissiveIntensity={0.35}
          roughness={0.2}
          wireframe={wireframe}
        />
      </mesh>

      {/* Dynamic Island Pill Notch */}
      <mesh position={[0, 1.25, 0.084]}>
        <boxGeometry args={[0.38, 0.1, 0.005]} />
        <meshStandardMaterial color="#000000" roughness={0.9} />
      </mesh>

      {/* Back Face: Frosted Matte Glass Back */}
      <mesh position={[0, 0, -0.082]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[1.46, 3.06]} />
        <meshStandardMaterial color={parsedColor} roughness={0.4} metalness={0.6} wireframe={wireframe} />
      </mesh>

      {/* Triple Camera Island on Back */}
      <group position={[-0.35, 0.95, -0.095]} rotation={[0, Math.PI, 0]}>
        {/* Raised Camera Island Plateau */}
        <mesh castShadow>
          <boxGeometry args={[0.62, 0.65, 0.04]} />
          <meshStandardMaterial color={parsedColor} roughness={0.25} metalness={0.8} />
        </mesh>
        {/* Top Camera Lens */}
        <mesh position={[-0.14, 0.16, 0.03]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.11, 0.11, 0.035, 24]} />
          <meshStandardMaterial color="#0f172a" metalness={0.95} roughness={0.1} />
        </mesh>
        {/* Bottom Camera Lens */}
        <mesh position={[-0.14, -0.16, 0.03]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.11, 0.11, 0.035, 24]} />
          <meshStandardMaterial color="#0f172a" metalness={0.95} roughness={0.1} />
        </mesh>
        {/* Right Camera Lens */}
        <mesh position={[0.15, 0, 0.03]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.11, 0.11, 0.035, 24]} />
          <meshStandardMaterial color="#0f172a" metalness={0.95} roughness={0.1} />
        </mesh>
        {/* Sapphire Lens Glass Cores */}
        <mesh position={[-0.14, 0.16, 0.045]}>
          <circleGeometry args={[0.07, 16]} />
          <meshStandardMaterial color="#38bdf8" emissive="#0284c7" emissiveIntensity={0.6} roughness={0.05} />
        </mesh>
        <mesh position={[-0.14, -0.16, 0.045]}>
          <circleGeometry args={[0.07, 16]} />
          <meshStandardMaterial color="#38bdf8" emissive="#0284c7" emissiveIntensity={0.6} roughness={0.05} />
        </mesh>
        <mesh position={[0.15, 0, 0.045]}>
          <circleGeometry args={[0.07, 16]} />
          <meshStandardMaterial color="#38bdf8" emissive="#0284c7" emissiveIntensity={0.6} roughness={0.05} />
        </mesh>
        {/* True Tone Flash */}
        <mesh position={[0.15, 0.2, 0.025]}>
          <circleGeometry args={[0.04, 16]} />
          <meshBasicMaterial color="#fef08a" />
        </mesh>
        {/* LiDAR Scanner */}
        <mesh position={[0.15, -0.2, 0.025]}>
          <circleGeometry args={[0.04, 16]} />
          <meshBasicMaterial color="#1e293b" />
        </mesh>
      </group>

      {/* Side Buttons (Titanium) */}
      <mesh position={[-0.77, 0.8, 0]}>
        <boxGeometry args={[0.02, 0.14, 0.04]} />
        <meshStandardMaterial color="#cbd5e1" metalness={0.95} roughness={0.2} />
      </mesh>
      <mesh position={[-0.77, 0.5, 0]}>
        <boxGeometry args={[0.02, 0.22, 0.04]} />
        <meshStandardMaterial color="#cbd5e1" metalness={0.95} roughness={0.2} />
      </mesh>
      <mesh position={[-0.77, 0.2, 0]}>
        <boxGeometry args={[0.02, 0.22, 0.04]} />
        <meshStandardMaterial color="#cbd5e1" metalness={0.95} roughness={0.2} />
      </mesh>
      <mesh position={[0.77, 0.45, 0]}>
        <boxGeometry args={[0.02, 0.35, 0.04]} />
        <meshStandardMaterial color="#cbd5e1" metalness={0.95} roughness={0.2} />
      </mesh>
    </group>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. TABLET 3D MODEL (iPad / Galaxy Tab)
// ─────────────────────────────────────────────────────────────────────────────
function Tablet3D({ parsedColor, wireframe }: { parsedColor: THREE.Color; wireframe: boolean }) {
  return (
    <group position={[0, 0, 0]} rotation={[0.2, -0.3, 0]}>
      {/* Aluminum Unibody */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[3.2, 2.25, 0.1]} />
        <meshStandardMaterial color={parsedColor} metalness={0.92} roughness={0.25} wireframe={wireframe} />
      </mesh>

      {/* Ultra Retina Tandem OLED Display Screen */}
      <mesh position={[0, 0, 0.052]}>
        <planeGeometry args={[3.08, 2.13]} />
        <meshStandardMaterial color="#020617" roughness={0.1} metalness={0.4} wireframe={wireframe} />
      </mesh>
      <mesh position={[0, 0, 0.053]}>
        <planeGeometry args={[2.98, 2.03]} />
        <meshStandardMaterial
          color={parsedColor}
          emissive={parsedColor}
          emissiveIntensity={0.25}
          roughness={0.15}
          wireframe={wireframe}
        />
      </mesh>

      {/* Front Landscape FaceTime Camera */}
      <mesh position={[0, 1.09, 0.054]}>
        <circleGeometry args={[0.025, 16]} />
        <meshBasicMaterial color="#000000" />
      </mesh>

      {/* Back Plate Apple Camera Island */}
      <group position={[-1.25, 0.8, -0.055]} rotation={[0, Math.PI, 0]}>
        <mesh>
          <boxGeometry args={[0.42, 0.42, 0.02]} />
          <meshStandardMaterial color={parsedColor} roughness={0.2} metalness={0.9} />
        </mesh>
        <mesh position={[0, 0, 0.02]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.1, 0.1, 0.02, 20]} />
          <meshStandardMaterial color="#0f172a" metalness={0.9} roughness={0.1} />
        </mesh>
      </group>

      {/* Magnetic Apple Pencil Wireless Charger Strip */}
      <mesh position={[0, 1.13, 0]}>
        <boxGeometry args={[1.5, 0.02, 0.05]} />
        <meshStandardMaterial color="#94a3b8" metalness={0.8} roughness={0.3} />
      </mesh>
    </group>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. LAPTOP 3D MODEL (MacBook / ROG Strix / Dell XPS)
// ─────────────────────────────────────────────────────────────────────────────
function Laptop3D({ parsedColor, wireframe }: { parsedColor: THREE.Color; wireframe: boolean }) {
  const keyboardKeys = useMemo(() => {
    const keys: { x: number; z: number; w: number; isAccent: boolean }[] = [];
    const rows = 4;
    const cols = 11;
    const spX = 0.22;
    const spZ = 0.22;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (r === 3 && c >= 3 && c <= 7) {
          if (c === 3) keys.push({ x: 0, z: 0.33, w: spX * 4.8, isAccent: true });
          continue;
        }
        keys.push({
          x: (c - (cols - 1) / 2) * spX,
          z: (r - (rows - 1) / 2) * spZ - 0.05,
          w: spX * 0.85,
          isAccent: (r === 0 && c === 0) || (r === 1 && c === cols - 1),
        });
      }
    }
    return keys;
  }, []);

  return (
    <group position={[0, -0.2, 0]} scale={0.84} rotation={[0.18, -0.38, 0]}>
      {/* Lower Base Chassis */}
      <mesh position={[0, 0, 0]} castShadow receiveShadow>
        <boxGeometry args={[3.2, 0.14, 2.2]} />
        <meshStandardMaterial color={parsedColor} metalness={0.85} roughness={0.25} wireframe={wireframe} />
      </mesh>

      {/* Keyboard Recess */}
      <mesh position={[0, 0.075, -0.2]} receiveShadow>
        <boxGeometry args={[2.7, 0.02, 1.15]} />
        <meshStandardMaterial color="#020617" roughness={0.7} />
      </mesh>

      {/* Keys */}
      <group position={[0, 0.09, -0.2]}>
        {keyboardKeys.map((k, i) => (
          <mesh key={i} position={[k.x, 0, k.z]}>
            <boxGeometry args={[k.w, 0.03, 0.16]} />
            <meshStandardMaterial
              color={k.isAccent ? '#38bdf8' : '#1e293b'}
              emissive={k.isAccent ? '#0284c7' : '#000000'}
              emissiveIntensity={k.isAccent ? 0.6 : 0}
              roughness={0.4}
              wireframe={wireframe}
            />
          </mesh>
        ))}
      </group>

      {/* Glass Touchpad */}
      <mesh position={[0, 0.076, 0.62]} receiveShadow>
        <boxGeometry args={[1.05, 0.015, 0.65]} />
        <meshStandardMaterial color="#1e293b" metalness={0.4} roughness={0.2} />
      </mesh>

      {/* Open Display Lid */}
      <group position={[0, 0.08, -1.08]} rotation={[-0.28, 0, 0]}>
        <mesh position={[0, 1.05, 0]} castShadow>
          <boxGeometry args={[3.2, 2.1, 0.08]} />
          <meshStandardMaterial color={parsedColor} metalness={0.9} roughness={0.2} wireframe={wireframe} />
        </mesh>

        {/* Screen Bezel */}
        <mesh position={[0, 1.05, 0.042]}>
          <boxGeometry args={[3.14, 2.04, 0.01]} />
          <meshStandardMaterial color="#000000" roughness={0.9} />
        </mesh>

        {/* Display Screen */}
        <mesh position={[0, 1.05, 0.048]}>
          <planeGeometry args={[3.04, 1.94]} />
          <meshStandardMaterial
            color="#0f172a"
            emissive="#0284c7"
            emissiveIntensity={0.25}
            roughness={0.15}
            metalness={0.1}
          />
        </mesh>
      </group>
    </group>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. GRAPHICS CARD 3D MODEL (RTX 4090 / VGA)
// ─────────────────────────────────────────────────────────────────────────────
function GPU3D({ wireframe }: { wireframe: boolean }) {
  const fan1 = useRef<THREE.Group>(null);
  const fan2 = useRef<THREE.Group>(null);
  const fan3 = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (fan1.current) fan1.current.rotation.z += delta * 4;
    if (fan2.current) fan2.current.rotation.z -= delta * 4;
    if (fan3.current) fan3.current.rotation.z += delta * 4;
  });

  return (
    <group position={[0, 0, 0]} rotation={[0.2, -0.3, 0]}>
      {/* Heavy Die-Cast Shroud */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[3.2, 1.4, 0.58]} />
        <meshStandardMaterial color="#0f172a" metalness={0.9} roughness={0.25} wireframe={wireframe} />
      </mesh>

      {/* Triple Fans */}
      {[-0.95, 0, 0.95].map((x, i) => (
        <group key={i} position={[x, 0, 0.31]} ref={i === 0 ? fan1 : i === 1 ? fan2 : fan3}>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.38, 0.38, 0.03, 24]} />
            <meshStandardMaterial color="#1e293b" metalness={0.8} roughness={0.3} transparent opacity={0.7} />
          </mesh>
        </group>
      ))}

      {/* Glowing RGB ROG Bar */}
      <mesh position={[0, 0.71, 0.1]}>
        <boxGeometry args={[2.2, 0.04, 0.2]} />
        <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={2.5} />
      </mesh>

      {/* PCIe Gold Teeth Connector */}
      <mesh position={[0, -0.73, -0.1]}>
        <boxGeometry args={[1.8, 0.06, 0.03]} />
        <meshStandardMaterial color="#f59e0b" metalness={0.95} roughness={0.1} />
      </mesh>
    </group>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. OVER-EAR HEADPHONE 3D MODEL (Sony / Apple AirPods Max)
// ─────────────────────────────────────────────────────────────────────────────
function Headphone3D({ parsedColor, wireframe }: { parsedColor: THREE.Color; wireframe: boolean }) {
  return (
    <group position={[0, -0.1, 0]} rotation={[0.1, -0.35, 0]}>
      {/* Padded Headband Arch */}
      <mesh position={[0, 0.9, 0]}>
        <torusGeometry args={[1.05, 0.1, 16, 40, Math.PI]} />
        <meshStandardMaterial color="#1e293b" roughness={0.8} wireframe={wireframe} />
      </mesh>

      {/* Left Earcup */}
      <group position={[-1.15, 0.6, 0]} rotation={[0, 0, 0.15]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.42, 0.42, 0.32, 28]} />
          <meshStandardMaterial color={parsedColor} metalness={0.85} roughness={0.25} wireframe={wireframe} />
        </mesh>
        {/* Soft Leather Cushion */}
        <mesh position={[0.12, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <torusGeometry args={[0.36, 0.1, 16, 28]} />
          <meshStandardMaterial color="#0f172a" roughness={0.9} />
        </mesh>
      </group>

      {/* Right Earcup */}
      <group position={[1.15, 0.6, 0]} rotation={[0, 0, -0.15]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.42, 0.42, 0.32, 28]} />
          <meshStandardMaterial color={parsedColor} metalness={0.85} roughness={0.25} wireframe={wireframe} />
        </mesh>
        {/* Soft Leather Cushion */}
        <mesh position={[-0.12, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <torusGeometry args={[0.36, 0.1, 16, 28]} />
          <meshStandardMaterial color="#0f172a" roughness={0.9} />
        </mesh>
      </group>
    </group>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. GAMING MOUSE 3D MODEL (Logitech Superlight / Razer)
// ─────────────────────────────────────────────────────────────────────────────
function Mouse3D({ parsedColor, wireframe }: { parsedColor: THREE.Color; wireframe: boolean }) {
  return (
    <group position={[0, 0, 0]} rotation={[0.4, -0.4, 0]}>
      {/* Contoured Ergonomic Shell */}
      <mesh castShadow receiveShadow>
        <capsuleGeometry args={[0.65, 1.4, 20, 24]} />
        <meshStandardMaterial color={parsedColor} metalness={0.3} roughness={0.4} wireframe={wireframe} />
      </mesh>

      {/* Center Separation Groove */}
      <mesh position={[0, 0.3, 0.45]}>
        <boxGeometry args={[0.02, 0.8, 0.2]} />
        <meshStandardMaterial color="#020617" roughness={0.9} />
      </mesh>

      {/* Rubberized Scroll Wheel with RGB */}
      <mesh position={[0, 0.5, 0.5]} rotation={[0, Math.PI / 2, 0]}>
        <cylinderGeometry args={[0.14, 0.14, 0.09, 20]} />
        <meshStandardMaterial color="#06b6d4" emissive="#06b6d4" emissiveIntensity={0.8} roughness={0.3} />
      </mesh>

      {/* Side Thumb Buttons */}
      <mesh position={[-0.62, 0.15, 0.15]}>
        <boxGeometry args={[0.06, 0.28, 0.12]} />
        <meshStandardMaterial color="#020617" roughness={0.6} />
      </mesh>
    </group>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 7. MECHANICAL KEYBOARD 3D MODEL (Keychron)
// ─────────────────────────────────────────────────────────────────────────────
function Keyboard3D({ parsedColor, wireframe }: { parsedColor: THREE.Color; wireframe: boolean }) {
  const keycaps = useMemo(() => {
    const keys: { x: number; z: number; width: number; isAccent: boolean }[] = [];
    const rows = 5;
    const cols = 12;
    const spacing = 0.22;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (r === 4 && c >= 3 && c <= 8) {
          if (c === 3) keys.push({ x: 0, z: (r - 2) * spacing, width: spacing * 5.8, isAccent: true });
          continue;
        }
        const isEsc = r === 0 && c === 0;
        const isEnter = r === 2 && c === cols - 1;
        keys.push({
          x: (c - (cols - 1) / 2) * spacing,
          z: (r - (rows - 1) / 2) * spacing,
          width: spacing * 0.85,
          isAccent: isEsc || isEnter,
        });
      }
    }
    return keys;
  }, []);

  return (
    <group position={[0, 0, 0]} rotation={[0.25, -0.4, 0]}>
      {/* Aluminum Base Chassis */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[3.0, 0.22, 1.45]} />
        <meshStandardMaterial color={parsedColor} metalness={0.85} roughness={0.25} wireframe={wireframe} />
      </mesh>
      {/* Brass Weight Plate */}
      <mesh position={[0, -0.12, 0]}>
        <boxGeometry args={[2.7, 0.05, 1.2]} />
        <meshStandardMaterial color="#d4af37" metalness={0.95} roughness={0.15} />
      </mesh>
      {/* Switch Plate */}
      <mesh position={[0, 0.12, 0]}>
        <boxGeometry args={[2.85, 0.04, 1.3]} />
        <meshStandardMaterial color="#020617" roughness={0.8} />
      </mesh>
      {/* Keycaps */}
      {keycaps.map((k, idx) => (
        <mesh key={idx} position={[k.x, 0.2, k.z]}>
          <boxGeometry args={[k.width, 0.1, 0.18]} />
          <meshStandardMaterial
            color={k.isAccent ? '#fef08a' : '#f8fafc'}
            roughness={0.35}
            metalness={0.1}
            wireframe={wireframe}
          />
        </mesh>
      ))}
      {/* Rotary Encoder Knob */}
      <mesh position={[1.25, 0.22, -0.45]}>
        <cylinderGeometry args={[0.11, 0.11, 0.15, 24]} />
        <meshStandardMaterial color="#cbd5e1" metalness={0.95} roughness={0.2} />
      </mesh>
    </group>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 8. CPU PROCESSOR 3D MODEL (Intel Core / AMD Ryzen)
// ─────────────────────────────────────────────────────────────────────────────
function CPU3D({ parsedColor, wireframe }: { parsedColor: THREE.Color; wireframe: boolean }) {
  return (
    <group position={[0, 0, 0]} rotation={[0.4, -0.35, 0]}>
      {/* Substrate PCB */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[2.0, 0.08, 2.0]} />
        <meshStandardMaterial color="#064e3b" roughness={0.3} metalness={0.4} wireframe={wireframe} />
      </mesh>
      {/* Gold Corner Pin 1 Marker */}
      <mesh position={[-0.85, 0.045, -0.85]}>
        <boxGeometry args={[0.15, 0.01, 0.15]} />
        <meshStandardMaterial color="#eab308" metalness={0.95} roughness={0.1} />
      </mesh>
      {/* Nickel-Plated Copper IHS (Integrated Heat Spreader) */}
      <mesh position={[0, 0.1, 0]} castShadow>
        <boxGeometry args={[1.5, 0.12, 1.5]} />
        <meshStandardMaterial color={parsedColor} metalness={0.9} roughness={0.2} wireframe={wireframe} />
      </mesh>
      {/* Laser Engraving Brand Plate */}
      <mesh position={[0, 0.165, 0]}>
        <planeGeometry args={[1.2, 1.2]} />
        <meshStandardMaterial color="#94a3b8" metalness={0.9} roughness={0.4} />
      </mesh>
    </group>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 9. RAM MODULE 3D MODEL (Corsair Dominator / DDR5)
// ─────────────────────────────────────────────────────────────────────────────
function RAM3D({ parsedColor, wireframe }: { parsedColor: THREE.Color; wireframe: boolean }) {
  return (
    <group position={[0, 0, 0]} rotation={[0.1, -0.35, 0]}>
      {/* Matte Black High-Layer PCB */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[3.2, 1.2, 0.04]} />
        <meshStandardMaterial color="#020617" roughness={0.6} />
      </mesh>
      {/* Dual Aluminum Anodized Heat Spreaders */}
      <mesh position={[0, 0.1, 0.04]} castShadow>
        <boxGeometry args={[3.15, 0.95, 0.04]} />
        <meshStandardMaterial color={parsedColor} metalness={0.9} roughness={0.25} wireframe={wireframe} />
      </mesh>
      <mesh position={[0, 0.1, -0.04]} castShadow>
        <boxGeometry args={[3.15, 0.95, 0.04]} />
        <meshStandardMaterial color={parsedColor} metalness={0.9} roughness={0.25} wireframe={wireframe} />
      </mesh>
      {/* Top Diffused RGB Light Bar */}
      <mesh position={[0, 0.65, 0]}>
        <boxGeometry args={[3.16, 0.16, 0.1]} />
        <meshStandardMaterial
          color="#38bdf8"
          emissive="#38bdf8"
          emissiveIntensity={2.0}
          roughness={0.2}
          transparent
          opacity={0.95}
        />
      </mesh>
      {/* Bottom Gold Contact Fingers */}
      <mesh position={[0, -0.56, 0]}>
        <boxGeometry args={[2.9, 0.12, 0.045]} />
        <meshStandardMaterial color="#eab308" metalness={0.98} roughness={0.1} />
      </mesh>
    </group>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 10. M.2 NVMe SSD 3D MODEL (Samsung 990 Pro / Kingston)
// ─────────────────────────────────────────────────────────────────────────────
function SSD3D({ parsedColor, wireframe }: { parsedColor: THREE.Color; wireframe: boolean }) {
  return (
    <group position={[0, 0, 0]} rotation={[0.3, -0.3, 0]}>
      {/* M.2 2280 PCB */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[2.8, 0.06, 0.9]} />
        <meshStandardMaterial color="#020617" roughness={0.5} wireframe={wireframe} />
      </mesh>
      {/* High-speed Controller Chip (with nickel coating) */}
      <mesh position={[-0.6, 0.06, 0]}>
        <boxGeometry args={[0.42, 0.06, 0.42]} />
        <meshStandardMaterial color="#cbd5e1" metalness={0.95} roughness={0.2} />
      </mesh>
      {/* Graphene Heat Spreader / Brand Label */}
      <mesh position={[0.6, 0.082, 0]}>
        <boxGeometry args={[1.4, 0.01, 0.7]} />
        <meshStandardMaterial color={parsedColor} metalness={0.7} roughness={0.3} wireframe={wireframe} />
      </mesh>
      {/* NAND Flash Memory Package 1 */}
      <mesh position={[0.25, 0.055, 0]}>
        <boxGeometry args={[0.55, 0.05, 0.65]} />
        <meshStandardMaterial color="#1e293b" roughness={0.6} metalness={0.3} />
      </mesh>
      {/* NAND Flash Memory Package 2 */}
      <mesh position={[0.95, 0.055, 0]}>
        <boxGeometry args={[0.55, 0.05, 0.65]} />
        <meshStandardMaterial color="#1e293b" roughness={0.6} metalness={0.3} />
      </mesh>
      {/* M-Key Gold Connector Pins */}
      <mesh position={[-1.38, 0.01, 0]}>
        <boxGeometry args={[0.12, 0.05, 0.75]} />
        <meshStandardMaterial color="#eab308" metalness={0.98} roughness={0.1} />
      </mesh>
    </group>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN PROCEDURAL TECH MODEL ORCHESTRATOR
// ─────────────────────────────────────────────────────────────────────────────
export const ProceduralTechModel: React.FC<ProceduralTechModelProps> = ({
  variantColor,
  wireframe = false,
  categorySlug,
  productName,
}) => {
  const groupRef = useRef<THREE.Group>(null);

  // Subtle floating motion
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 1.5) * 0.04;
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.05;
    }
  });

  const parsedColor = useMemo(() => new THREE.Color(variantColor), [variantColor]);
  const productType = useMemo(() => detectProductType(categorySlug, productName), [categorySlug, productName]);

  return (
    <Center position={[0, -0.2, 0]}>
      <group ref={groupRef}>
        {productType === 'phone' && <Smartphone3D parsedColor={parsedColor} wireframe={wireframe} />}
        {productType === 'tablet' && <Tablet3D parsedColor={parsedColor} wireframe={wireframe} />}
        {productType === 'laptop' && <Laptop3D parsedColor={parsedColor} wireframe={wireframe} />}
        {productType === 'gpu' && <GPU3D wireframe={wireframe} />}
        {productType === 'headphone' && <Headphone3D parsedColor={parsedColor} wireframe={wireframe} />}
        {productType === 'mouse' && <Mouse3D parsedColor={parsedColor} wireframe={wireframe} />}
        {productType === 'keyboard' && <Keyboard3D parsedColor={parsedColor} wireframe={wireframe} />}
        {productType === 'cpu' && <CPU3D parsedColor={parsedColor} wireframe={wireframe} />}
        {productType === 'ram' && <RAM3D parsedColor={parsedColor} wireframe={wireframe} />}
        {productType === 'ssd' && <SSD3D parsedColor={parsedColor} wireframe={wireframe} />}
      </group>
    </Center>
  );
};

export default ProceduralTechModel;
