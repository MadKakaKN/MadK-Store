import React, { useRef, useMemo, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Center } from '@react-three/drei';
import * as THREE from 'three';

export interface ProceduralTechModelProps {
  variantColor: string;
  wireframe?: boolean;
  categorySlug?: string;
  productName?: string;
  thumbnailUrl?: string;
  productSlug?: string;
}

/**
 * Robust texture loader for 3D surfaces without crashing or blocking canvas
 */
function useProductTexture(url?: string): THREE.Texture | null {
  const [texture, setTexture] = useState<THREE.Texture | null>(null);

  useEffect(() => {
    if (!url) {
      setTexture(null);
      return;
    }

    let isMounted = true;
    const loader = new THREE.TextureLoader();
    loader.load(
      url,
      (loadedTex) => {
        if (isMounted) {
          loadedTex.colorSpace = THREE.SRGBColorSpace;
          loadedTex.needsUpdate = true;
          setTexture(loadedTex);
        }
      },
      undefined,
      (err) => {
        console.warn('[3D Viewer] Texture load notice:', url, err);
        if (isMounted) setTexture(null);
      }
    );

    return () => {
      isMounted = false;
    };
  }, [url]);

  return texture;
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
// 1. SMARTPHONE 3D MODEL (iPhone 15 / Galaxy S24 Ultra / Z Fold / Z Flip)
// ─────────────────────────────────────────────────────────────────────────────
function Smartphone3D({
  parsedColor,
  wireframe,
  texture,
  productName,
}: {
  parsedColor: THREE.Color;
  wireframe: boolean;
  texture: THREE.Texture | null;
  productName?: string;
}) {
  const name = (productName || '').toLowerCase();
  const isGalaxyUltra = name.includes('s24 ultra') || name.includes('ultra');
  const isFoldable = name.includes('z flip') || name.includes('z fold');

  return (
    <group position={[0, 0, 0]} rotation={[0.15, -0.35, 0]}>
      {/* Perimeter Chassis Frame: Boxy titanium for S24 Ultra, curved for iPhone */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[isGalaxyUltra ? 1.58 : 1.52, isGalaxyUltra ? 3.22 : 3.12, 0.16]} />
        <meshStandardMaterial
          color={parsedColor}
          metalness={0.92}
          roughness={0.25}
          wireframe={wireframe}
        />
      </mesh>

      {/* Front Face: Minimal Bezel Frame */}
      <mesh position={[0, 0, 0.082]}>
        <planeGeometry args={[isGalaxyUltra ? 1.54 : 1.44, isGalaxyUltra ? 3.18 : 3.04]} />
        <meshStandardMaterial color="#020617" roughness={0.05} metalness={0.3} wireframe={wireframe} />
      </mesh>

      {/* Screen Display with Real Product Texture & OLED Glow */}
      <mesh position={[0, 0, 0.083]}>
        <planeGeometry args={[isGalaxyUltra ? 1.5 : 1.38, isGalaxyUltra ? 3.12 : 2.92]} />
        {texture ? (
          <meshStandardMaterial
            map={texture}
            emissiveMap={texture}
            emissive="#ffffff"
            emissiveIntensity={0.22}
            roughness={0.15}
            metalness={0.1}
            wireframe={wireframe}
          />
        ) : (
          <meshStandardMaterial
            color={parsedColor}
            emissive={parsedColor}
            emissiveIntensity={0.35}
            roughness={0.2}
            wireframe={wireframe}
          />
        )}
      </mesh>

      {/* Central Foldable Hinge Seam for Galaxy Z Flip / Fold */}
      {isFoldable && (
        <mesh position={[0, 0, 0.084]}>
          <boxGeometry args={[1.48, 0.015, 0.005]} />
          <meshStandardMaterial color="#334155" roughness={0.8} />
        </mesh>
      )}

      {/* Front Dynamic Island Pill (iPhone) or Punch-hole (Galaxy) */}
      {isGalaxyUltra ? (
        <mesh position={[0, 1.45, 0.085]}>
          <circleGeometry args={[0.035, 16]} />
          <meshBasicMaterial color="#000000" />
        </mesh>
      ) : (
        <mesh position={[0, 1.25, 0.085]}>
          <boxGeometry args={[0.38, 0.1, 0.005]} />
          <meshStandardMaterial color="#000000" roughness={0.9} />
        </mesh>
      )}

      {/* Back Face: Matte Frosted Glass */}
      <mesh position={[0, 0, -0.082]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[isGalaxyUltra ? 1.54 : 1.46, isGalaxyUltra ? 3.18 : 3.06]} />
        <meshStandardMaterial color={parsedColor} roughness={0.38} metalness={0.65} wireframe={wireframe} />
      </mesh>

      {/* Rear Camera Setup: Galaxy S24 Ultra 4 Floating Rings vs iPhone Triple Plateau */}
      {isGalaxyUltra ? (
        <group position={[-0.45, 0.8, -0.095]} rotation={[0, Math.PI, 0]}>
          {/* Main 3 Vertical Rings */}
          {[0.4, 0, -0.4].map((y, idx) => (
            <mesh key={idx} position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.13, 0.13, 0.04, 24]} />
              <meshStandardMaterial color="#0f172a" metalness={0.95} roughness={0.1} />
            </mesh>
          ))}
          {/* Secondary Telephoto & Laser Sensor Ring */}
          {[0.2, -0.2].map((y, idx) => (
            <mesh key={`s-${idx}`} position={[0.26, y, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.09, 0.09, 0.035, 20]} />
              <meshStandardMaterial color="#0f172a" metalness={0.95} roughness={0.1} />
            </mesh>
          ))}
        </group>
      ) : (
        <group position={[-0.35, 0.95, -0.095]} rotation={[0, Math.PI, 0]}>
          {/* Raised Camera Island Plateau */}
          <mesh castShadow>
            <boxGeometry args={[0.62, 0.65, 0.04]} />
            <meshStandardMaterial color={parsedColor} roughness={0.25} metalness={0.8} />
          </mesh>
          {/* Triple Lenses */}
          {[-0.14, 0.14].map((x, idx) => (
            <mesh key={idx} position={[x, idx === 0 ? 0.16 : 0, 0.03]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.11, 0.11, 0.035, 24]} />
              <meshStandardMaterial color="#0f172a" metalness={0.95} roughness={0.1} />
            </mesh>
          ))}
          <mesh position={[-0.14, -0.16, 0.03]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.11, 0.11, 0.035, 24]} />
            <meshStandardMaterial color="#0f172a" metalness={0.95} roughness={0.1} />
          </mesh>
        </group>
      )}

      {/* S-Pen Silo Notch for Galaxy S24 Ultra */}
      {isGalaxyUltra && (
        <mesh position={[-0.6, -1.6, 0]}>
          <boxGeometry args={[0.15, 0.04, 0.08]} />
          <meshStandardMaterial color="#1e293b" metalness={0.8} roughness={0.3} />
        </mesh>
      )}
    </group>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. TABLET 3D MODEL (Samsung Galaxy Tab S9 Ultra / iPad Pro M4 / iPad Air)
// ─────────────────────────────────────────────────────────────────────────────
function Tablet3D({
  parsedColor,
  wireframe,
  texture,
  productName,
}: {
  parsedColor: THREE.Color;
  wireframe: boolean;
  texture: THREE.Texture | null;
  productName?: string;
}) {
  const name = (productName || '').toLowerCase();
  const isSamsungTab = name.includes('samsung') || name.includes('tab s9');

  // Galaxy Tab S9 Ultra: massive 14.6" 16:10 format (3.5 x 2.2). iPad Pro: 4:3 format (3.1 x 2.3)
  const width = isSamsungTab ? 3.52 : 3.12;
  const height = isSamsungTab ? 2.22 : 2.32;

  return (
    <group position={[0, 0, 0]} rotation={[0.2, -0.3, 0]}>
      {/* Aluminum CNC Unibody (Ultra-slim 5.5mm chassis) */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[width, height, 0.085]} />
        <meshStandardMaterial color={parsedColor} metalness={0.92} roughness={0.25} wireframe={wireframe} />
      </mesh>

      {/* Front Face: Narrow Outer Bezel */}
      <mesh position={[0, 0, 0.044]}>
        <planeGeometry args={[width - 0.08, height - 0.08]} />
        <meshStandardMaterial color="#020617" roughness={0.08} metalness={0.3} wireframe={wireframe} />
      </mesh>

      {/* Active High-Res Display with Product Texture & AMOLED Luminescence */}
      <mesh position={[0, 0, 0.046]}>
        <planeGeometry args={[width - 0.14, height - 0.14]} />
        {texture ? (
          <meshStandardMaterial
            map={texture}
            emissiveMap={texture}
            emissive="#ffffff"
            emissiveIntensity={0.25}
            roughness={0.12}
            metalness={0.08}
            wireframe={wireframe}
          />
        ) : (
          <meshStandardMaterial
            color={parsedColor}
            emissive={parsedColor}
            emissiveIntensity={0.3}
            roughness={0.15}
            wireframe={wireframe}
          />
        )}
      </mesh>

      {/* Landscape Ultra-wide Front Camera */}
      <mesh position={[0, height / 2 - 0.035, 0.047]}>
        <circleGeometry args={[0.025, 16]} />
        <meshBasicMaterial color="#000000" />
      </mesh>

      {/* Back Plate Detailing: Samsung Galaxy Tab S9 S-Pen Magnetic Groove vs Apple iPad */}
      {isSamsungTab ? (
        <group position={[-width / 2 + 0.45, 0, -0.046]} rotation={[0, Math.PI, 0]}>
          {/* Dual Camera Module */}
          <mesh position={[0, 0.65, 0.015]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.08, 0.08, 0.03, 20]} />
            <meshStandardMaterial color="#0f172a" metalness={0.95} roughness={0.1} />
          </mesh>
          <mesh position={[0, 0.45, 0.015]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.08, 0.08, 0.03, 20]} />
            <meshStandardMaterial color="#0f172a" metalness={0.95} roughness={0.1} />
          </mesh>
          {/* S-Pen Vertical Magnetic Charging Strip */}
          <mesh position={[0, -0.1, 0.005]}>
            <boxGeometry args={[0.12, 0.9, 0.01]} />
            <meshStandardMaterial color="#1e293b" metalness={0.8} roughness={0.4} />
          </mesh>
        </group>
      ) : (
        <group position={[-width / 2 + 0.45, height / 2 - 0.45, -0.046]} rotation={[0, Math.PI, 0]}>
          {/* Apple Square Camera Bump */}
          <mesh>
            <boxGeometry args={[0.42, 0.42, 0.02]} />
            <meshStandardMaterial color={parsedColor} roughness={0.2} metalness={0.9} />
          </mesh>
          <mesh position={[0, 0, 0.02]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.1, 0.1, 0.02, 20]} />
            <meshStandardMaterial color="#0f172a" metalness={0.9} roughness={0.1} />
          </mesh>
        </group>
      )}

      {/* Top Edge Wireless Stylus Attachment Bar */}
      <mesh position={[0, height / 2 + 0.005, 0]}>
        <boxGeometry args={[1.6, 0.015, 0.05]} />
        <meshStandardMaterial color="#94a3b8" metalness={0.8} roughness={0.3} />
      </mesh>
    </group>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. LAPTOP 3D MODEL (MacBook Pro / ROG Strix SCAR / Dell XPS / ThinkPad)
// ─────────────────────────────────────────────────────────────────────────────
function Laptop3D({
  parsedColor,
  wireframe,
  texture,
  productName,
}: {
  parsedColor: THREE.Color;
  wireframe: boolean;
  texture: THREE.Texture | null;
  productName?: string;
}) {
  const name = (productName || '').toLowerCase();
  const isGaming = name.includes('rog') || name.includes('scar') || name.includes('legion') || name.includes('helios') || name.includes('nitro') || name.includes('tuf');
  const isThinkPad = name.includes('thinkpad');
  const rgbBarRef = useRef<THREE.Mesh>(null);

  // Dynamic RGB underglow lightbar for gaming laptops
  useFrame((state) => {
    if (isGaming && rgbBarRef.current) {
      const hue = (state.clock.getElapsedTime() * 0.25) % 1;
      (rgbBarRef.current.material as THREE.MeshStandardMaterial).emissive.setHSL(hue, 1, 0.6);
      (rgbBarRef.current.material as THREE.MeshStandardMaterial).color.setHSL(hue, 1, 0.5);
    }
  });

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

      {/* Front Lip RGB Lightbar for Gaming Laptops */}
      {isGaming && (
        <mesh ref={rgbBarRef} position={[0, -0.03, 1.11]}>
          <boxGeometry args={[2.8, 0.03, 0.02]} />
          <meshStandardMaterial color="#06b6d4" emissive="#06b6d4" emissiveIntensity={1.8} />
        </mesh>
      )}

      {/* Keyboard Well */}
      <mesh position={[0, 0.075, -0.2]} receiveShadow>
        <boxGeometry args={[2.7, 0.02, 1.15]} />
        <meshStandardMaterial color="#020617" roughness={0.7} />
      </mesh>

      {/* Backlit Keys */}
      <group position={[0, 0.09, -0.2]}>
        {keyboardKeys.map((k, i) => (
          <mesh key={i} position={[k.x, 0, k.z]}>
            <boxGeometry args={[k.w, 0.03, 0.16]} />
            <meshStandardMaterial
              color={k.isAccent ? '#38bdf8' : '#1e293b'}
              emissive={k.isAccent ? '#0284c7' : isGaming ? '#1e1b4b' : '#000000'}
              emissiveIntensity={k.isAccent ? 0.6 : 0.2}
              roughness={0.4}
              wireframe={wireframe}
            />
          </mesh>
        ))}

        {/* ThinkPad Iconic Red TrackPoint Nub */}
        {isThinkPad && (
          <mesh position={[0, 0.025, -0.05]}>
            <cylinderGeometry args={[0.04, 0.04, 0.03, 16]} />
            <meshStandardMaterial color="#ef4444" roughness={0.6} />
          </mesh>
        )}
      </group>

      {/* Glass Precision Touchpad */}
      <mesh position={[0, 0.076, 0.62]} receiveShadow>
        <boxGeometry args={[1.05, 0.015, 0.65]} />
        <meshStandardMaterial color="#1e293b" metalness={0.4} roughness={0.2} />
      </mesh>

      {/* Open Display Lid: Angled at 112 degrees */}
      <group position={[0, 0.08, -1.08]} rotation={[-0.28, 0, 0]}>
        {/* Lid Rear Shell */}
        <mesh position={[0, 1.05, 0]} castShadow>
          <boxGeometry args={[3.2, 2.1, 0.08]} />
          <meshStandardMaterial color={parsedColor} metalness={0.9} roughness={0.2} wireframe={wireframe} />
        </mesh>

        {/* Bezel Frame */}
        <mesh position={[0, 1.05, 0.042]}>
          <boxGeometry args={[3.14, 2.04, 0.01]} />
          <meshStandardMaterial color="#000000" roughness={0.9} />
        </mesh>

        {/* Screen Display with Real Laptop Screen / Product Visual */}
        <mesh position={[0, 1.05, 0.048]}>
          <planeGeometry args={[3.04, 1.94]} />
          {texture ? (
            <meshStandardMaterial
              map={texture}
              emissiveMap={texture}
              emissive="#ffffff"
              emissiveIntensity={0.25}
              roughness={0.12}
              metalness={0.08}
              wireframe={wireframe}
            />
          ) : (
            <meshStandardMaterial
              color="#0f172a"
              emissive="#0284c7"
              emissiveIntensity={0.35}
              roughness={0.15}
              metalness={0.1}
            />
          )}
        </mesh>
      </group>
    </group>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. GRAPHICS CARD 3D MODEL (ASUS ROG Strix RTX 4090 / TUF / MSI / Gigabyte)
// ─────────────────────────────────────────────────────────────────────────────
function GPU3D({
  wireframe,
  texture,
}: {
  wireframe: boolean;
  texture: THREE.Texture | null;
}) {
  const fan1 = useRef<THREE.Group>(null);
  const fan2 = useRef<THREE.Group>(null);
  const fan3 = useRef<THREE.Group>(null);
  const rgbRef = useRef<THREE.Mesh>(null);

  useFrame((state, delta) => {
    if (fan1.current) fan1.current.rotation.z += delta * 4.5;
    if (fan2.current) fan2.current.rotation.z -= delta * 4.5;
    if (fan3.current) fan3.current.rotation.z += delta * 4.5;

    if (rgbRef.current) {
      const hue = (state.clock.getElapsedTime() * 0.3) % 1;
      (rgbRef.current.material as THREE.MeshStandardMaterial).emissive.setHSL(hue, 1, 0.6);
      (rgbRef.current.material as THREE.MeshStandardMaterial).color.setHSL(hue, 1, 0.5);
    }
  });

  return (
    <group position={[0, 0, 0]} rotation={[0.2, -0.3, 0]}>
      {/* Heavy 3.5-Slot Die-Cast Metal Shroud */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[3.3, 1.45, 0.58]} />
        <meshStandardMaterial color="#0f172a" metalness={0.9} roughness={0.25} wireframe={wireframe} />
      </mesh>

      {/* Front Face with Real Graphic Card Shroud / Fan Design Texture */}
      {texture && (
        <mesh position={[0, 0, 0.295]}>
          <planeGeometry args={[3.25, 1.4]} />
          <meshStandardMaterial
            map={texture}
            transparent={true}
            roughness={0.25}
            metalness={0.3}
            wireframe={wireframe}
          />
        </mesh>
      )}

      {/* Triple Axial Fans Spinning in 3D */}
      {[-1.0, 0, 1.0].map((x, i) => (
        <group key={i} position={[x, 0, 0.31]} ref={i === 0 ? fan1 : i === 1 ? fan2 : fan3}>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.38, 0.38, 0.03, 24]} />
            <meshStandardMaterial color="#1e293b" metalness={0.8} roughness={0.3} transparent opacity={0.65} />
          </mesh>
          {/* Fan Blade Rings */}
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.36, 0.015, 12, 24]} />
            <meshStandardMaterial color="#475569" metalness={0.9} roughness={0.2} />
          </mesh>
        </group>
      ))}

      {/* Glowing RGB ROG / TUF Lightbar */}
      <mesh ref={rgbRef} position={[0, 0.74, 0.1]}>
        <boxGeometry args={[2.4, 0.04, 0.2]} />
        <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={2.2} />
      </mesh>

      {/* Rear Full-Coverage Metal Backplate */}
      <mesh position={[0, 0, -0.3]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[3.26, 1.42]} />
        <meshStandardMaterial color="#1e293b" metalness={0.92} roughness={0.3} />
      </mesh>

      {/* PCIe 4.0 x16 Gold Teeth Connector */}
      <mesh position={[0, -0.75, -0.1]}>
        <boxGeometry args={[1.8, 0.06, 0.03]} />
        <meshStandardMaterial color="#f59e0b" metalness={0.98} roughness={0.1} />
      </mesh>
    </group>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. OVER-EAR HEADPHONE 3D MODEL (Sony WH-1000XM5 / Apple AirPods Max)
// ─────────────────────────────────────────────────────────────────────────────
function Headphone3D({
  parsedColor,
  wireframe,
  texture,
}: {
  parsedColor: THREE.Color;
  wireframe: boolean;
  texture: THREE.Texture | null;
}) {
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
        {/* Outer Brand Face with Product Texture */}
        {texture && (
          <mesh position={[-0.17, 0, 0]} rotation={[0, -Math.PI / 2, 0]}>
            <circleGeometry args={[0.38, 28]} />
            <meshStandardMaterial map={texture} roughness={0.3} />
          </mesh>
        )}
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
        {/* Outer Brand Face with Product Texture */}
        {texture && (
          <mesh position={[0.17, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
            <circleGeometry args={[0.38, 28]} />
            <meshStandardMaterial map={texture} roughness={0.3} />
          </mesh>
        )}
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
// 6. GAMING MOUSE 3D MODEL (Logitech Superlight / Razer / G502)
// ─────────────────────────────────────────────────────────────────────────────
function Mouse3D({
  parsedColor,
  wireframe,
  texture,
}: {
  parsedColor: THREE.Color;
  wireframe: boolean;
  texture: THREE.Texture | null;
}) {
  return (
    <group position={[0, 0, 0]} rotation={[0.4, -0.4, 0]}>
      {/* Contoured Ergonomic Shell */}
      <mesh castShadow receiveShadow>
        <capsuleGeometry args={[0.65, 1.4, 20, 24]} />
        <meshStandardMaterial color={parsedColor} metalness={0.3} roughness={0.4} wireframe={wireframe} />
      </mesh>

      {/* Top Shell Badge with Authentic Product Branding Texture */}
      {texture && (
        <mesh position={[0, 0.1, 0.45]} rotation={[-Math.PI / 4, 0, 0]}>
          <planeGeometry args={[0.9, 0.9]} />
          <meshStandardMaterial map={texture} transparent opacity={0.9} roughness={0.3} />
        </mesh>
      )}

      {/* Center Separation Groove */}
      <mesh position={[0, 0.3, 0.45]}>
        <boxGeometry args={[0.02, 0.8, 0.2]} />
        <meshStandardMaterial color="#020617" roughness={0.9} />
      </mesh>

      {/* Rubberized Scroll Wheel with RGB Core */}
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
// 7. MECHANICAL KEYBOARD 3D MODEL (Keychron Q1 / Razer / Corsair)
// ─────────────────────────────────────────────────────────────────────────────
function Keyboard3D({
  parsedColor,
  wireframe,
  texture,
}: {
  parsedColor: THREE.Color;
  wireframe: boolean;
  texture: THREE.Texture | null;
}) {
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

      {/* Keycaps Bed */}
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

      {/* Overlay Product Texture across Keycap Surface if present */}
      {texture && (
        <mesh position={[0, 0.255, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[2.6, 1.15]} />
          <meshStandardMaterial map={texture} transparent opacity={0.65} roughness={0.3} />
        </mesh>
      )}

      {/* Rotary Encoder Knob */}
      <mesh position={[1.25, 0.22, -0.45]}>
        <cylinderGeometry args={[0.11, 0.11, 0.15, 24]} />
        <meshStandardMaterial color="#cbd5e1" metalness={0.95} roughness={0.2} />
      </mesh>
    </group>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 8. CPU PROCESSOR 3D MODEL (Intel Core i9 / i7 / AMD Ryzen 9 / 7)
// ─────────────────────────────────────────────────────────────────────────────
function CPU3D({
  parsedColor,
  wireframe,
  texture,
  productName,
}: {
  parsedColor: THREE.Color;
  wireframe: boolean;
  texture: THREE.Texture | null;
  productName?: string;
}) {
  const name = (productName || '').toLowerCase();
  const isIntel = name.includes('intel') || name.includes('core i');

  return (
    <group position={[0, 0, 0]} rotation={[0.4, -0.35, 0]}>
      {/* Substrate PCB: Intel LGA1700 (rectangle) vs AMD AM5 (square) */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[isIntel ? 1.85 : 2.0, 0.08, isIntel ? 2.25 : 2.0]} />
        <meshStandardMaterial color="#064e3b" roughness={0.3} metalness={0.4} wireframe={wireframe} />
      </mesh>

      {/* Gold Alignment Triangle Pin 1 */}
      <mesh position={[-0.8, 0.045, -0.85]}>
        <boxGeometry args={[0.15, 0.01, 0.15]} />
        <meshStandardMaterial color="#eab308" metalness={0.95} roughness={0.1} />
      </mesh>

      {/* Nickel-Plated Copper IHS (Integrated Heat Spreader) */}
      <mesh position={[0, 0.1, 0]} castShadow>
        <boxGeometry args={[isIntel ? 1.45 : 1.55, 0.12, isIntel ? 1.75 : 1.55]} />
        <meshStandardMaterial color={parsedColor} metalness={0.92} roughness={0.2} wireframe={wireframe} />
      </mesh>

      {/* Laser Engraving Brand Plate with Authentic CPU Packaging Texture */}
      <mesh position={[0, 0.165, 0]}>
        <planeGeometry args={[isIntel ? 1.35 : 1.45, isIntel ? 1.65 : 1.45]} />
        {texture ? (
          <meshStandardMaterial
            map={texture}
            metalness={0.85}
            roughness={0.35}
            wireframe={wireframe}
          />
        ) : (
          <meshStandardMaterial color="#94a3b8" metalness={0.9} roughness={0.4} />
        )}
      </mesh>
    </group>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 9. RAM MODULE 3D MODEL (Corsair Dominator / Vengeance RGB / Kingston Fury)
// ─────────────────────────────────────────────────────────────────────────────
function RAM3D({
  parsedColor,
  wireframe,
  texture,
}: {
  parsedColor: THREE.Color;
  wireframe: boolean;
  texture: THREE.Texture | null;
}) {
  const rgbRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (rgbRef.current) {
      const hue = (state.clock.getElapsedTime() * 0.35) % 1;
      (rgbRef.current.material as THREE.MeshStandardMaterial).emissive.setHSL(hue, 1, 0.6);
      (rgbRef.current.material as THREE.MeshStandardMaterial).color.setHSL(hue, 1, 0.5);
    }
  });

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

      {/* Side Label with Real RAM Product Logo Texture */}
      {texture && (
        <mesh position={[0, 0.1, 0.065]}>
          <planeGeometry args={[2.8, 0.8]} />
          <meshStandardMaterial map={texture} transparent opacity={0.9} roughness={0.3} metalness={0.4} />
        </mesh>
      )}

      {/* Top Diffused RGB Light Bar */}
      <mesh ref={rgbRef} position={[0, 0.65, 0]}>
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
// 10. M.2 NVMe SSD 3D MODEL (Samsung 990 Pro / Kingston KC3000)
// ─────────────────────────────────────────────────────────────────────────────
function SSD3D({
  parsedColor,
  wireframe,
  texture,
}: {
  parsedColor: THREE.Color;
  wireframe: boolean;
  texture: THREE.Texture | null;
}) {
  return (
    <group position={[0, 0, 0]} rotation={[0.3, -0.3, 0]}>
      {/* M.2 2280 PCB */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[2.8, 0.06, 0.9]} />
        <meshStandardMaterial color="#020617" roughness={0.5} wireframe={wireframe} />
      </mesh>

      {/* High-speed Controller Chip */}
      <mesh position={[-0.6, 0.06, 0]}>
        <boxGeometry args={[0.42, 0.06, 0.42]} />
        <meshStandardMaterial color="#cbd5e1" metalness={0.95} roughness={0.2} />
      </mesh>

      {/* Graphene Heat Spreader / Brand Label with Real Product Texture */}
      <mesh position={[0.6, 0.082, 0]}>
        <boxGeometry args={[1.4, 0.01, 0.7]} />
        {texture ? (
          <meshStandardMaterial map={texture} roughness={0.3} metalness={0.5} wireframe={wireframe} />
        ) : (
          <meshStandardMaterial color={parsedColor} metalness={0.7} roughness={0.3} wireframe={wireframe} />
        )}
      </mesh>

      {/* NAND Flash Memory Package 1 & 2 */}
      <mesh position={[0.25, 0.055, 0]}>
        <boxGeometry args={[0.55, 0.05, 0.65]} />
        <meshStandardMaterial color="#1e293b" roughness={0.6} metalness={0.3} />
      </mesh>
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
  thumbnailUrl,
  productSlug,
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

  // Compute effective texture URL
  const effectiveImageUrl = useMemo(() => {
    if (thumbnailUrl && !thumbnailUrl.includes('unsplash')) return thumbnailUrl;
    if (productSlug) return `/images/products/${productSlug}.png`;
    return undefined;
  }, [thumbnailUrl, productSlug]);

  const texture = useProductTexture(effectiveImageUrl);

  return (
    <Center position={[0, -0.2, 0]}>
      <group ref={groupRef}>
        {productType === 'phone' && (
          <Smartphone3D
            parsedColor={parsedColor}
            wireframe={wireframe}
            texture={texture}
            productName={productName}
          />
        )}
        {productType === 'tablet' && (
          <Tablet3D
            parsedColor={parsedColor}
            wireframe={wireframe}
            texture={texture}
            productName={productName}
          />
        )}
        {productType === 'laptop' && (
          <Laptop3D
            parsedColor={parsedColor}
            wireframe={wireframe}
            texture={texture}
            productName={productName}
          />
        )}
        {productType === 'gpu' && <GPU3D wireframe={wireframe} texture={texture} />}
        {productType === 'headphone' && (
          <Headphone3D parsedColor={parsedColor} wireframe={wireframe} texture={texture} />
        )}
        {productType === 'mouse' && <Mouse3D parsedColor={parsedColor} wireframe={wireframe} texture={texture} />}
        {productType === 'keyboard' && (
          <Keyboard3D parsedColor={parsedColor} wireframe={wireframe} texture={texture} />
        )}
        {productType === 'cpu' && (
          <CPU3D
            parsedColor={parsedColor}
            wireframe={wireframe}
            texture={texture}
            productName={productName}
          />
        )}
        {productType === 'ram' && <RAM3D parsedColor={parsedColor} wireframe={wireframe} texture={texture} />}
        {productType === 'ssd' && <SSD3D parsedColor={parsedColor} wireframe={wireframe} texture={texture} />}
      </group>
    </Center>
  );
};

export default ProceduralTechModel;
