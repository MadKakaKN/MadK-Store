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
  foldState?: 'open' | 'flex' | 'closed';
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
 * Detect product category to render the authentic, brand-accurate 3D model
 */
export function detectProductType(
  categorySlug?: string,
  productName?: string
):
  | 'samsung_flip'
  | 'samsung_fold'
  | 'samsung_s24_ultra'
  | 'samsung_standard_phone'
  | 'apple_iphone'
  | 'samsung_tablet'
  | 'apple_ipad'
  | 'laptop'
  | 'gpu'
  | 'headphone_overear'
  | 'headphone_tws'
  | 'mouse'
  | 'keyboard'
  | 'cpu_intel'
  | 'cpu_amd'
  | 'ram'
  | 'ssd' {
  const cat = (categorySlug || '').toLowerCase();
  const name = (productName || '').toLowerCase();

  // Tablets
  if (cat.includes('may-tinh-bang') || name.includes('ipad') || name.includes('tab')) {
    if (name.includes('samsung') || name.includes('galaxy') || name.includes('tab')) {
      return 'samsung_tablet';
    }
    return 'apple_ipad';
  }

  // Phones
  if (cat.includes('dien-thoai') || name.includes('iphone') || name.includes('galaxy') || name.includes('phone')) {
    if (name.includes('z flip') || name.includes('flip')) {
      return 'samsung_flip';
    }
    if (name.includes('z fold') || name.includes('fold')) {
      return 'samsung_fold';
    }
    if (name.includes('s24 ultra') || name.includes('ultra')) {
      return 'samsung_s24_ultra';
    }
    if (name.includes('samsung') || name.includes('galaxy') || name.includes('a55')) {
      return 'samsung_standard_phone';
    }
    return 'apple_iphone';
  }

  // Laptops
  if (cat.includes('laptop') || name.includes('macbook') || name.includes('laptop') || name.includes('xps') || name.includes('thinkpad') || name.includes('scar') || name.includes('zephyrus') || name.includes('helios') || name.includes('legion') || name.includes('alienware') || name.includes('zenbook') || name.includes('inspiron')) {
    return 'laptop';
  }

  // GPUs
  if (cat.includes('vga') || cat.includes('card-man-hinh') || name.includes('rtx') || name.includes('geforce') || name.includes('radeon') || name.includes('vga') || name.includes('hellhound')) {
    return 'gpu';
  }

  // Audio / Headphones
  if (cat.includes('tai-nghe') || name.includes('tai nghe') || name.includes('headphone') || name.includes('airpods') || name.includes('wf-1000') || name.includes('wh-1000') || name.includes('blackshark') || name.includes('virtuoso')) {
    if (name.includes('wf-1000') || name.includes('airpods pro') || name.includes('tws') || name.includes('in-ear')) {
      return 'headphone_tws';
    }
    return 'headphone_overear';
  }

  // Mice
  if (cat.includes('chuot') || name.includes('chuột') || name.includes('mouse') || name.includes('superlight') || name.includes('deathadder') || name.includes('viper') || name.includes('g502') || name.includes('basilisk') || name.includes('darkstar')) {
    return 'mouse';
  }

  // Keyboards
  if (cat.includes('ban-phim') || name.includes('bàn phím') || name.includes('keyboard') || name.includes('keychron') || name.includes('huntsman') || name.includes('blackwidow') || name.includes('k70') || name.includes('k65')) {
    return 'keyboard';
  }

  // CPUs
  if (cat.includes('cpu') || name.includes('vi xử lý') || name.includes('core i') || name.includes('ryzen') || name.includes('intel core')) {
    if (name.includes('amd') || name.includes('ryzen')) {
      return 'cpu_amd';
    }
    return 'cpu_intel';
  }

  // RAM
  if (cat.includes('ram') || name.includes('ram ') || name.includes('ddr5') || name.includes('ddr4') || name.includes('dominator') || name.includes('vengeance') || name.includes('fury')) {
    return 'ram';
  }

  // SSD
  if (cat.includes('ssd') || cat.includes('o-cung') || name.includes('ssd') || name.includes('ổ cứng') || name.includes('990 pro') || name.includes('nvme') || name.includes('kc3000') || name.includes('t700')) {
    return 'ssd';
  }

  return 'samsung_standard_phone';
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. SAMSUNG GALAXY Z FLIP5 (Clamshell Foldable with Flex Window 3.4")
// ─────────────────────────────────────────────────────────────────────────────
function SamsungGalaxyZFlip3D({
  parsedColor,
  wireframe,
  texture,
  foldAngle = 1.05,
}: {
  parsedColor: THREE.Color;
  wireframe: boolean;
  texture: THREE.Texture | null;
  foldAngle?: number;
}) {
  return (
    <group position={[0, -0.2, 0]} rotation={[0.2, -0.35, 0]}>
      {/* ── LOWER HALF (Base) ── */}
      <group position={[0, -0.85, 0]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[1.54, 1.58, 0.14]} />
          <meshStandardMaterial color={parsedColor} metalness={0.9} roughness={0.3} wireframe={wireframe} />
        </mesh>
        <mesh position={[0, 0, -0.072]} rotation={[0, Math.PI, 0]}>
          <planeGeometry args={[1.48, 1.52]} />
          <meshStandardMaterial color={parsedColor} roughness={0.35} metalness={0.6} />
        </mesh>
        <mesh position={[0, -0.4, -0.075]} rotation={[0, Math.PI, 0]}>
          <boxGeometry args={[0.6, 0.08, 0.005]} />
          <meshStandardMaterial color="#ffffff" metalness={0.95} roughness={0.2} />
        </mesh>
        <mesh position={[0, 0, 0.072]}>
          <planeGeometry args={[1.46, 1.5]} />
          <meshStandardMaterial color="#020617" roughness={0.1} metalness={0.2} />
        </mesh>
        <mesh position={[0, -0.79, 0]}>
          <boxGeometry args={[0.22, 0.04, 0.06]} />
          <meshBasicMaterial color="#0f172a" />
        </mesh>
      </group>

      {/* ── CENTRAL ARMOR ALUMINUM HINGE SPINE ── */}
      <mesh position={[0, 0, -0.04]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.075, 0.075, 1.54, 24]} />
        <meshStandardMaterial color="#cbd5e1" metalness={0.95} roughness={0.2} />
      </mesh>
      <mesh position={[0, 0, 0.072]}>
        <boxGeometry args={[1.48, 0.02, 0.005]} />
        <meshStandardMaterial color="#0f172a" roughness={0.8} />
      </mesh>

      {/* ── UPPER HALF (Pivoting Hinge Section with Flex Window 3.4") ── */}
      <group position={[0, 0, 0]} rotation={[foldAngle, 0, 0]}>
        <group position={[0, 0.85, 0]}>
          <mesh castShadow receiveShadow>
            <boxGeometry args={[1.54, 1.58, 0.14]} />
            <meshStandardMaterial color={parsedColor} metalness={0.9} roughness={0.3} wireframe={wireframe} />
          </mesh>
          {/* Flex Window */}
          <mesh position={[0, -0.05, -0.073]} rotation={[0, Math.PI, 0]}>
            <planeGeometry args={[1.35, 1.25]} />
            <meshStandardMaterial color="#000000" roughness={0.1} metalness={0.4} />
          </mesh>
          <mesh position={[0, -0.05, -0.074]} rotation={[0, Math.PI, 0]}>
            <planeGeometry args={[1.28, 1.18]} />
            <meshStandardMaterial color="#0ea5e9" emissive="#0ea5e9" emissiveIntensity={0.35} roughness={0.2} />
          </mesh>
          {/* Dual Horizontal Floating Cameras */}
          <group position={[-0.26, 0.6, -0.082]} rotation={[0, Math.PI, 0]}>
            <mesh position={[-0.22, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.11, 0.11, 0.035, 20]} />
              <meshStandardMaterial color="#0f172a" metalness={0.95} roughness={0.1} />
            </mesh>
            <mesh position={[0.08, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.11, 0.11, 0.035, 20]} />
              <meshStandardMaterial color="#0f172a" metalness={0.95} roughness={0.1} />
            </mesh>
            <mesh position={[0.34, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <circleGeometry args={[0.045, 16]} />
              <meshStandardMaterial color="#fef08a" emissive="#fef08a" emissiveIntensity={0.8} />
            </mesh>
          </group>
          {/* Inside Display */}
          <mesh position={[0, 0, 0.072]}>
            <planeGeometry args={[1.46, 1.5]} />
            {texture ? (
              <meshStandardMaterial map={texture} emissiveMap={texture} emissive="#ffffff" emissiveIntensity={0.22} roughness={0.15} metalness={0.1} wireframe={wireframe} />
            ) : (
              <meshStandardMaterial color={parsedColor} emissive={parsedColor} emissiveIntensity={0.25} />
            )}
          </mesh>
          <mesh position={[0, 0.65, 0.074]}>
            <circleGeometry args={[0.035, 16]} />
            <meshBasicMaterial color="#000000" />
          </mesh>
        </group>
      </group>
    </group>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. SAMSUNG GALAXY Z FOLD5 (Book Foldable with 7.6" Main Screen)
// ─────────────────────────────────────────────────────────────────────────────
function SamsungGalaxyZFold3D({
  parsedColor,
  wireframe,
  texture,
  foldAngle = 0.5,
}: {
  parsedColor: THREE.Color;
  wireframe: boolean;
  texture: THREE.Texture | null;
  foldAngle?: number;
}) {
  return (
    <group position={[0, 0, 0]} rotation={[0.15, -0.3, 0]}>
      {/* Right Wing (Base Half) */}
      <group position={[0.9, 0, 0]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[1.65, 3.2, 0.13]} />
          <meshStandardMaterial color={parsedColor} metalness={0.9} roughness={0.3} wireframe={wireframe} />
        </mesh>
        <mesh position={[0, 0, 0.068]}>
          <planeGeometry args={[1.56, 3.1]} />
          <meshStandardMaterial color="#020617" roughness={0.1} metalness={0.2} />
        </mesh>
        {/* Cover Screen on Back of Right Wing */}
        <mesh position={[0, 0, -0.068]} rotation={[0, Math.PI, 0]}>
          <planeGeometry args={[1.56, 3.1]} />
          {texture ? (
            <meshStandardMaterial map={texture} emissiveMap={texture} emissive="#ffffff" emissiveIntensity={0.25} roughness={0.1} />
          ) : (
            <meshStandardMaterial color="#0f172a" roughness={0.2} />
          )}
        </mesh>
      </group>

      {/* Central Armor Aluminum Hinge Spine */}
      <mesh position={[0, 0, -0.03]} rotation={[0, 0, 0]}>
        <cylinderGeometry args={[0.07, 0.07, 3.2, 24]} />
        <meshStandardMaterial color="#cbd5e1" metalness={0.95} roughness={0.2} />
      </mesh>

      {/* Left Wing (Pivoting Half) */}
      <group position={[0, 0, 0]} rotation={[0, foldAngle, 0]}>
        <group position={[-0.9, 0, 0]}>
          <mesh castShadow receiveShadow>
            <boxGeometry args={[1.65, 3.2, 0.13]} />
            <meshStandardMaterial color={parsedColor} metalness={0.9} roughness={0.3} wireframe={wireframe} />
          </mesh>
          <mesh position={[0, 0, 0.068]}>
            <planeGeometry args={[1.56, 3.1]} />
            <meshStandardMaterial color="#020617" roughness={0.1} metalness={0.2} />
          </mesh>
          {/* Triple Vertical Camera Rings on Back of Left Wing */}
          <group position={[0.4, 0.8, -0.075]} rotation={[0, Math.PI, 0]}>
            {[0.36, 0, -0.36].map((y, idx) => (
              <mesh key={idx} position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.11, 0.11, 0.03, 20]} />
                <meshStandardMaterial color="#334155" metalness={0.95} roughness={0.15} />
              </mesh>
            ))}
          </group>
        </group>
      </group>
    </group>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. SAMSUNG GALAXY S24 ULTRA (Sharp 90° Corners, 4 Floating Camera Rings, S-Pen)
// ─────────────────────────────────────────────────────────────────────────────
function SamsungGalaxyS24Ultra3D({
  parsedColor,
  wireframe,
  texture,
}: {
  parsedColor: THREE.Color;
  wireframe: boolean;
  texture: THREE.Texture | null;
}) {
  return (
    <group position={[0, 0, 0]} rotation={[0.15, -0.35, 0]}>
      {/* Sharp Rectangular Titanium Perimeter Frame */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[1.62, 3.26, 0.165]} />
        <meshStandardMaterial color={parsedColor} metalness={0.94} roughness={0.28} wireframe={wireframe} />
      </mesh>

      {/* Flat Front Display Frame */}
      <mesh position={[0, 0, 0.084]}>
        <planeGeometry args={[1.56, 3.2]} />
        <meshStandardMaterial color="#020617" roughness={0.06} metalness={0.3} wireframe={wireframe} />
      </mesh>

      {/* Screen with Real Product Texture */}
      <mesh position={[0, 0, 0.085]}>
        <planeGeometry args={[1.52, 3.14]} />
        {texture ? (
          <meshStandardMaterial map={texture} emissiveMap={texture} emissive="#ffffff" emissiveIntensity={0.25} roughness={0.12} metalness={0.08} wireframe={wireframe} />
        ) : (
          <meshStandardMaterial color={parsedColor} emissive={parsedColor} emissiveIntensity={0.3} />
        )}
      </mesh>

      {/* Selfie Camera Punch-Hole */}
      <mesh position={[0, 1.45, 0.086]}>
        <circleGeometry args={[0.035, 16]} />
        <meshBasicMaterial color="#000000" />
      </mesh>

      {/* Satin Matte Titanium Glass Backplate */}
      <mesh position={[0, 0, -0.084]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[1.56, 3.2]} />
        <meshStandardMaterial color={parsedColor} roughness={0.4} metalness={0.7} wireframe={wireframe} />
      </mesh>

      {/* 4 Floating Camera Rings */}
      <group position={[-0.46, 0.85, -0.095]} rotation={[0, Math.PI, 0]}>
        {[0.45, 0, -0.45].map((y, idx) => (
          <group key={idx} position={[0, y, 0]}>
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.14, 0.14, 0.045, 24]} />
              <meshStandardMaterial color="#334155" metalness={0.95} roughness={0.15} />
            </mesh>
            <mesh position={[0, 0, 0.024]}>
              <circleGeometry args={[0.085, 20]} />
              <meshStandardMaterial color="#020617" roughness={0.05} metalness={0.98} />
            </mesh>
          </group>
        ))}
        {/* Column 2: 3x Telephoto + Laser AF + Flash */}
        <group position={[0.28, 0.22, 0]}>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.09, 0.09, 0.035, 20]} />
            <meshStandardMaterial color="#334155" metalness={0.95} roughness={0.15} />
          </mesh>
        </group>
        <group position={[0.28, -0.22, 0]}>
          <circleGeometry args={[0.045, 16]} />
          <meshStandardMaterial color="#fef08a" emissive="#fef08a" emissiveIntensity={0.85} />
        </group>
      </group>

      {/* Bottom Edge: S-Pen Silo Clicker Cap & USB-C */}
      <mesh position={[-0.6, -1.63, 0]}>
        <cylinderGeometry args={[0.05, 0.05, 0.02, 16]} />
        <meshStandardMaterial color="#475569" metalness={0.9} roughness={0.2} />
      </mesh>
      <mesh position={[0, -1.63, 0]}>
        <boxGeometry args={[0.22, 0.02, 0.06]} />
        <meshBasicMaterial color="#0f172a" />
      </mesh>
    </group>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. SAMSUNG GALAXY STANDARD (S24, S24+, A55 - Armor Aluminum with 3 Rings)
// ─────────────────────────────────────────────────────────────────────────────
function SamsungGalaxyStandard3D({
  parsedColor,
  wireframe,
  texture,
}: {
  parsedColor: THREE.Color;
  wireframe: boolean;
  texture: THREE.Texture | null;
}) {
  return (
    <group position={[0, 0, 0]} rotation={[0.15, -0.35, 0]}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[1.52, 3.12, 0.15]} />
        <meshStandardMaterial color={parsedColor} metalness={0.9} roughness={0.3} wireframe={wireframe} />
      </mesh>
      <mesh position={[0, 0, 0.077]}>
        <planeGeometry args={[1.44, 3.02]} />
        {texture ? (
          <meshStandardMaterial map={texture} emissiveMap={texture} emissive="#ffffff" emissiveIntensity={0.25} roughness={0.12} metalness={0.08} wireframe={wireframe} />
        ) : (
          <meshStandardMaterial color={parsedColor} emissive={parsedColor} emissiveIntensity={0.25} />
        )}
      </mesh>
      <mesh position={[0, 1.38, 0.079]}>
        <circleGeometry args={[0.035, 16]} />
        <meshBasicMaterial color="#000000" />
      </mesh>
      {/* 3 Vertical Floating Rings */}
      <group position={[-0.45, 0.85, -0.088]} rotation={[0, Math.PI, 0]}>
        {[0.38, 0, -0.38].map((y, idx) => (
          <group key={idx} position={[0, y, 0]}>
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.12, 0.12, 0.035, 24]} />
              <meshStandardMaterial color="#475569" metalness={0.95} roughness={0.2} />
            </mesh>
            <mesh position={[0, 0, 0.019]}>
              <circleGeometry args={[0.075, 18]} />
              <meshStandardMaterial color="#020617" metalness={0.98} roughness={0.05} />
            </mesh>
          </group>
        ))}
      </group>
    </group>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. APPLE IPHONE (Titanium Contoured Frame, Dynamic Island & Triangle Lenses)
// ─────────────────────────────────────────────────────────────────────────────
function AppleIPhone3D({
  parsedColor,
  wireframe,
  texture,
}: {
  parsedColor: THREE.Color;
  wireframe: boolean;
  texture: THREE.Texture | null;
}) {
  return (
    <group position={[0, 0, 0]} rotation={[0.15, -0.35, 0]}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[1.52, 3.12, 0.16]} />
        <meshStandardMaterial color={parsedColor} metalness={0.92} roughness={0.25} wireframe={wireframe} />
      </mesh>
      <mesh position={[0, 0, 0.082]}>
        <planeGeometry args={[1.44, 3.02]} />
        {texture ? (
          <meshStandardMaterial map={texture} emissiveMap={texture} emissive="#ffffff" emissiveIntensity={0.22} roughness={0.15} metalness={0.1} wireframe={wireframe} />
        ) : (
          <meshStandardMaterial color="#020617" roughness={0.1} />
        )}
      </mesh>
      {/* Dynamic Island Pill Cutout */}
      <mesh position={[0, 1.25, 0.085]}>
        <capsuleGeometry args={[0.05, 0.16, 12, 16]} />
        <meshBasicMaterial color="#000000" />
      </mesh>
      {/* Elevated Square Camera Plateau */}
      <group position={[-0.38, 0.85, -0.09]} rotation={[0, Math.PI, 0]}>
        <mesh>
          <boxGeometry args={[0.62, 0.62, 0.035]} />
          <meshStandardMaterial color={parsedColor} roughness={0.25} metalness={0.8} />
        </mesh>
        {[
          [-0.14, 0.14, 0.025],
          [-0.14, -0.14, 0.025],
          [0.14, 0, 0.025],
        ].map(([x, y, z], idx) => (
          <group key={idx} position={[x, y, z]}>
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.09, 0.09, 0.03, 20]} />
              <meshStandardMaterial color="#334155" metalness={0.95} roughness={0.1} />
            </mesh>
          </group>
        ))}
      </group>
    </group>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. TABLETS (Samsung Galaxy Tab S9 Ultra 14.6" vs Apple iPad Pro)
// ─────────────────────────────────────────────────────────────────────────────
function SamsungTablet3D({
  parsedColor,
  wireframe,
  texture,
}: {
  parsedColor: THREE.Color;
  wireframe: boolean;
  texture: THREE.Texture | null;
}) {
  return (
    <group position={[0, 0, 0]} rotation={[0.2, -0.3, 0]}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[3.54, 2.22, 0.085]} />
        <meshStandardMaterial color={parsedColor} metalness={0.92} roughness={0.25} wireframe={wireframe} />
      </mesh>
      <mesh position={[0, 0, 0.045]}>
        <planeGeometry args={[3.42, 2.1]} />
        {texture ? (
          <meshStandardMaterial map={texture} emissiveMap={texture} emissive="#ffffff" emissiveIntensity={0.25} roughness={0.12} metalness={0.08} wireframe={wireframe} />
        ) : (
          <meshStandardMaterial color={parsedColor} emissive={parsedColor} emissiveIntensity={0.3} />
        )}
      </mesh>
      {/* Rear: Dual Camera + S-Pen Magnetic Groove with S-Pen */}
      <group position={[-1.3, 0, -0.046]} rotation={[0, Math.PI, 0]}>
        <mesh position={[0, 0.65, 0.015]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.08, 0.08, 0.03, 20]} />
          <meshStandardMaterial color="#0f172a" metalness={0.95} roughness={0.1} />
        </mesh>
        <mesh position={[0, 0.45, 0.015]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.08, 0.08, 0.03, 20]} />
          <meshStandardMaterial color="#0f172a" metalness={0.95} roughness={0.1} />
        </mesh>
        {/* S-Pen Stylus docked magnetically */}
        <mesh position={[0, -0.15, 0.01]}>
          <cylinderGeometry args={[0.035, 0.035, 1.1, 16]} />
          <meshStandardMaterial color="#1e293b" metalness={0.9} roughness={0.2} />
        </mesh>
      </group>
    </group>
  );
}

function AppleIPad3D({
  parsedColor,
  wireframe,
  texture,
}: {
  parsedColor: THREE.Color;
  wireframe: boolean;
  texture: THREE.Texture | null;
}) {
  return (
    <group position={[0, 0, 0]} rotation={[0.2, -0.3, 0]}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[3.12, 2.32, 0.085]} />
        <meshStandardMaterial color={parsedColor} metalness={0.92} roughness={0.25} wireframe={wireframe} />
      </mesh>
      <mesh position={[0, 0, 0.045]}>
        <planeGeometry args={[3.0, 2.2]} />
        {texture ? (
          <meshStandardMaterial map={texture} emissiveMap={texture} emissive="#ffffff" emissiveIntensity={0.25} roughness={0.12} metalness={0.08} wireframe={wireframe} />
        ) : (
          <meshStandardMaterial color="#020617" roughness={0.1} />
        )}
      </mesh>
      <group position={[-1.1, 0.7, -0.046]} rotation={[0, Math.PI, 0]}>
        <mesh>
          <boxGeometry args={[0.42, 0.42, 0.02]} />
          <meshStandardMaterial color={parsedColor} roughness={0.2} metalness={0.9} />
        </mesh>
        <mesh position={[0, 0, 0.02]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.1, 0.1, 0.02, 20]} />
          <meshStandardMaterial color="#0f172a" metalness={0.9} roughness={0.1} />
        </mesh>
      </group>
    </group>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 7. LAPTOP 3D MODEL (ROG Strix / Legion / MacBook Pro / ThinkPad / XPS)
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
  const isGaming = name.includes('rog') || name.includes('scar') || name.includes('legion') || name.includes('helios') || name.includes('nitro') || name.includes('tuf') || name.includes('alienware');
  const isThinkPad = name.includes('thinkpad');
  const isMacBook = name.includes('macbook');
  const rgbBarRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (isGaming && rgbBarRef.current) {
      const hue = (state.clock.getElapsedTime() * 0.25) % 1;
      (rgbBarRef.current.material as THREE.MeshStandardMaterial).emissive.setHSL(hue, 1, 0.6);
      (rgbBarRef.current.material as THREE.MeshStandardMaterial).color.setHSL(hue, 1, 0.5);
    }
  });

  return (
    <group position={[0, -0.2, 0]} scale={0.84} rotation={[0.18, -0.38, 0]}>
      {/* Lower Base Chassis */}
      <mesh position={[0, 0, 0]} castShadow receiveShadow>
        <boxGeometry args={[3.2, 0.14, 2.2]} />
        <meshStandardMaterial color={isMacBook ? '#1e293b' : parsedColor} metalness={0.88} roughness={0.25} wireframe={wireframe} />
      </mesh>

      {/* Dynamic Front RGB Lightbar (Gaming Laptops) */}
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

      {/* ThinkPad Red TrackPoint */}
      {isThinkPad && (
        <mesh position={[0, 0.11, -0.2]}>
          <cylinderGeometry args={[0.04, 0.04, 0.03, 16]} />
          <meshStandardMaterial color="#ef4444" roughness={0.6} />
        </mesh>
      )}

      {/* Precision Touchpad */}
      <mesh position={[0, 0.076, 0.62]} receiveShadow>
        <boxGeometry args={[1.05, 0.015, 0.65]} />
        <meshStandardMaterial color="#1e293b" metalness={0.4} roughness={0.2} />
      </mesh>

      {/* Open Display Lid */}
      <group position={[0, 0.08, -1.08]} rotation={[-0.28, 0, 0]}>
        <mesh position={[0, 1.05, 0]} castShadow>
          <boxGeometry args={[3.2, 2.1, 0.08]} />
          <meshStandardMaterial color={isMacBook ? '#1e293b' : parsedColor} metalness={0.9} roughness={0.2} wireframe={wireframe} />
        </mesh>
        {/* Screen Display */}
        <mesh position={[0, 1.05, 0.048]}>
          <planeGeometry args={[3.04, 1.94]} />
          {texture ? (
            <meshStandardMaterial map={texture} emissiveMap={texture} emissive="#ffffff" emissiveIntensity={0.25} roughness={0.12} metalness={0.08} wireframe={wireframe} />
          ) : (
            <meshStandardMaterial color="#0f172a" emissive="#0284c7" emissiveIntensity={0.35} />
          )}
        </mesh>
      </group>
    </group>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 8. GPU / GRAPHICS CARD (3.5-Slot Shroud, Rotating Axial Fans, Heatsink)
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
      {/* 3.5-Slot Shroud Body */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[3.3, 1.45, 0.58]} />
        <meshStandardMaterial color="#0f172a" metalness={0.9} roughness={0.25} wireframe={wireframe} />
      </mesh>

      {/* Front Shroud Mapped with Real Card Texture */}
      {texture && (
        <mesh position={[0, 0, 0.295]}>
          <planeGeometry args={[3.25, 1.4]} />
          <meshStandardMaterial map={texture} transparent roughness={0.25} metalness={0.3} />
        </mesh>
      )}

      {/* Triple High-Detail Rotating Axial Fans */}
      {[-1.0, 0, 1.0].map((x, i) => (
        <group key={i} position={[x, 0, 0.31]} ref={i === 0 ? fan1 : i === 1 ? fan2 : fan3}>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.38, 0.38, 0.03, 24]} />
            <meshStandardMaterial color="#1e293b" metalness={0.8} roughness={0.3} transparent opacity={0.65} />
          </mesh>
          {/* Fan Center Hub */}
          <mesh position={[0, 0, 0.02]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.12, 0.12, 0.02, 16]} />
            <meshStandardMaterial color="#cbd5e1" metalness={0.95} roughness={0.1} />
          </mesh>
        </group>
      ))}

      {/* Dense Aluminum Heatsink Fins along sides */}
      {[-0.65, 0.65].map((y, i) => (
        <mesh key={i} position={[0, y, 0]}>
          <boxGeometry args={[3.1, 0.08, 0.52]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.95} roughness={0.3} />
        </mesh>
      ))}

      {/* Top Edge Dynamic RGB Lightbar */}
      <mesh ref={rgbRef} position={[0, 0.74, 0.1]}>
        <boxGeometry args={[2.4, 0.04, 0.2]} />
        <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={2.2} />
      </mesh>

      {/* Rear Metal Backplate */}
      <mesh position={[0, 0, -0.295]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[3.25, 1.4]} />
        <meshStandardMaterial color="#1e293b" metalness={0.92} roughness={0.3} />
      </mesh>

      {/* Gold PCIe 4.0 Interface Connector */}
      <mesh position={[0, -0.75, -0.1]}>
        <boxGeometry args={[1.8, 0.06, 0.03]} />
        <meshStandardMaterial color="#f59e0b" metalness={0.98} roughness={0.1} />
      </mesh>
    </group>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 9. MECHANICAL KEYBOARD (6 Sculpted Rows, Rotary Knob, Dynamic RGB Backlight)
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
  const rgbRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (rgbRef.current) {
      const hue = (state.clock.getElapsedTime() * 0.35) % 1;
      (rgbRef.current.material as THREE.MeshStandardMaterial).emissive.setHSL(hue, 1, 0.6);
      (rgbRef.current.material as THREE.MeshStandardMaterial).color.setHSL(hue, 1, 0.5);
    }
  });

  return (
    <group position={[0, 0, 0]} rotation={[0.25, -0.4, 0]}>
      {/* CNC Aluminum Angled Case */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[3.0, 0.22, 1.45]} />
        <meshStandardMaterial color={parsedColor} metalness={0.88} roughness={0.25} wireframe={wireframe} />
      </mesh>

      {/* Rotary Encoder Volume Knob (Top Right) */}
      <group position={[1.25, 0.22, -0.48]}>
        <mesh>
          <cylinderGeometry args={[0.11, 0.11, 0.16, 24]} />
          <meshStandardMaterial color="#e2e8f0" metalness={0.95} roughness={0.15} />
        </mesh>
      </group>

      {/* Dynamic Per-Key RGB Underglow Bed */}
      <mesh ref={rgbRef} position={[0, 0.12, 0]}>
        <boxGeometry args={[2.7, 0.02, 1.25]} />
        <meshStandardMaterial color="#06b6d4" emissive="#06b6d4" emissiveIntensity={1.8} />
      </mesh>

      {/* Keycaps Bed Mapped with Real Product Texture */}
      {texture && (
        <mesh position={[0, 0.16, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[2.75, 1.28]} />
          <meshStandardMaterial map={texture} roughness={0.4} />
        </mesh>
      )}
    </group>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 10. GAMING MOUSE (Aerodynamic Shell, Split Clickers, PTFE Skates, Sensor)
// ─────────────────────────────────────────────────────────────────────────────
function Mouse3D({
  parsedColor,
  wireframe,
  productName,
}: {
  parsedColor: THREE.Color;
  wireframe: boolean;
  productName?: string;
  texture?: THREE.Texture | null;
}) {
  const name = (productName || '').toLowerCase();
  const isBasiliskOrG502 = name.includes('basilisk') || name.includes('g502') || name.includes('darkstar');
  const rgbRef = useRef<THREE.Mesh>(null);
  const wheelRgbRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    if (rgbRef.current) {
      const hue = (time * 0.3) % 1;
      (rgbRef.current.material as THREE.MeshStandardMaterial).emissive.setHSL(hue, 1, 0.55);
      (rgbRef.current.material as THREE.MeshStandardMaterial).color.setHSL(hue, 1, 0.5);
    }
    if (wheelRgbRef.current) {
      const hue = (time * 0.3 + 0.25) % 1;
      (wheelRgbRef.current.material as THREE.MeshStandardMaterial).emissive.setHSL(hue, 1, 0.6);
    }
  });

  return (
    <group position={[0, -0.15, 0]} scale={0.96} rotation={[0.28, Math.PI * 0.78, 0]}>
      {/* ── BASE CHASSIS (Smooth aerodynamic tub resting flat) ── */}
      <group position={[0, 0, 0]}>
        {/* Main Baseplate Tub */}
        <mesh position={[0, 0.04, 0]} receiveShadow>
          <cylinderGeometry args={[0.62, 0.66, 0.08, 32]} />
          <meshStandardMaterial color="#0f172a" roughness={0.7} metalness={0.2} wireframe={wireframe} />
        </mesh>
        <mesh position={[0, 0.04, -0.55]} receiveShadow>
          <cylinderGeometry args={[0.56, 0.6, 0.08, 32]} />
          <meshStandardMaterial color="#0f172a" roughness={0.7} metalness={0.2} />
        </mesh>
        <mesh position={[0, 0.04, 0.55]} receiveShadow>
          <cylinderGeometry args={[0.58, 0.62, 0.08, 32]} />
          <meshStandardMaterial color="#0f172a" roughness={0.7} metalness={0.2} />
        </mesh>

        {/* Flared Thumb Rest Wing on Left Side (Razer Basilisk / Logitech G502 / Corsair Darkstar) */}
        {isBasiliskOrG502 && (
          <group position={[-0.78, 0.04, 0.12]} rotation={[0, 0, -0.06]}>
            <mesh scale={[0.45, 0.08, 1.15]} receiveShadow>
              <sphereGeometry args={[1, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.5]} />
              <meshStandardMaterial color="#0f172a" roughness={0.85} metalness={0.15} />
            </mesh>
            {/* Rubber Grip Traction Texture Lines */}
            {[-0.25, 0, 0.25].map((z, idx) => (
              <mesh key={idx} position={[0.02, 0.05, z]} rotation={[0, 0, Math.PI / 2]}>
                <capsuleGeometry args={[0.015, 0.28, 8, 16]} />
                <meshStandardMaterial color="#020617" roughness={0.95} />
              </mesh>
            ))}
            {/* Sniper DPI Clutch Button at front of wing */}
            <mesh position={[0.06, 0.08, -0.55]} rotation={[0, 0, -0.1]}>
              <capsuleGeometry args={[0.04, 0.16, 8, 16]} />
              <meshStandardMaterial color="#334155" metalness={0.9} roughness={0.2} />
            </mesh>
          </group>
        )}

        {/* ── 100% VIRGIN-GRADE PURE WHITE PTFE GLIDE FEET ── */}
        {/* Front Smile Skate */}
        <mesh position={[0, 0.005, -0.98]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.25, 0.42, 24, 1, 0, Math.PI]} />
          <meshStandardMaterial color="#ffffff" roughness={0.15} metalness={0.1} />
        </mesh>
        {/* Rear Crescent Skate */}
        <mesh position={[0, 0.005, 0.98]} rotation={[-Math.PI / 2, 0, Math.PI]}>
          <ringGeometry args={[0.3, 0.48, 24, 1, 0, Math.PI]} />
          <meshStandardMaterial color="#ffffff" roughness={0.15} metalness={0.1} />
        </mesh>
        {/* Thumb Wing Skate */}
        {isBasiliskOrG502 && (
          <mesh position={[-0.78, 0.005, 0.12]} rotation={[-Math.PI / 2, 0, 0]}>
            <capsuleGeometry args={[0.06, 0.35, 8, 16]} />
            <meshStandardMaterial color="#ffffff" roughness={0.15} />
          </mesh>
        )}
        {/* Optical Sensor Ring */}
        <mesh position={[0, 0.005, 0.02]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.1, 0.18, 24]} />
          <meshStandardMaterial color="#ffffff" roughness={0.2} />
        </mesh>
        {/* Glowing Optical Tracking Laser Aperture */}
        <mesh position={[0, 0.01, 0.02]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.06, 16]} />
          <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={2.0} />
        </mesh>
        {/* Profile Switch Button & Power Slider */}
        <mesh position={[0.26, 0.01, 0.2]}>
          <cylinderGeometry args={[0.04, 0.04, 0.02, 16]} />
          <meshStandardMaterial color="#475569" metalness={0.8} />
        </mesh>
      </group>

      {/* ── ERGONOMIC SCULPTED PALM DOME (Smooth organic curved surface) ── */}
      <group position={[0, 0.08, 0]}>
        {/* Sculpted Palm Arch (Ellipsoid dome with natural hand curvature) */}
        <group position={[0, 0.22, 0.18]} rotation={[-0.14, 0, isBasiliskOrG502 ? -0.06 : 0]}>
          <mesh scale={[0.76, 0.48, 1.25]} castShadow receiveShadow>
            <sphereGeometry args={[1, 32, 24, 0, Math.PI * 2, 0, Math.PI * 0.55]} />
            <meshStandardMaterial
              color={parsedColor}
              roughness={0.32}
              metalness={0.28}
              wireframe={wireframe}
            />
          </mesh>
        </group>

        {/* Dynamic Chroma RGB Illuminated Brand Crest on Palm Rest */}
        <mesh ref={rgbRef} position={[0, 0.58, 0.48]} rotation={[-0.32, 0, 0]}>
          <circleGeometry args={[0.15, 24]} />
          <meshStandardMaterial color="#10b981" emissive="#10b981" emissiveIntensity={1.9} />
        </mesh>

        {/* ── SPLIT PRIMARY CLICK BUTTON PADDLES (Independent Left & Right) ── */}
        {/* Left Click Trigger (Contoured finger trough) */}
        <group position={[-0.33, 0.24, -0.68]} rotation={[0.22, 0, 0.04]}>
          <mesh scale={[0.34, 0.16, 0.88]} castShadow>
            <sphereGeometry args={[1, 24, 20, 0, Math.PI * 2, 0, Math.PI * 0.5]} />
            <meshStandardMaterial
              color={parsedColor}
              roughness={0.28}
              metalness={0.32}
              wireframe={wireframe}
            />
          </mesh>
        </group>

        {/* Right Click Trigger (Contoured finger trough) */}
        <group position={[0.33, 0.24, -0.68]} rotation={[0.22, 0, -0.04]}>
          <mesh scale={[0.34, 0.16, 0.88]} castShadow>
            <sphereGeometry args={[1, 24, 20, 0, Math.PI * 2, 0, Math.PI * 0.5]} />
            <meshStandardMaterial
              color={parsedColor}
              roughness={0.28}
              metalness={0.32}
              wireframe={wireframe}
            />
          </mesh>
        </group>

        {/* Center Recessed Trench Channel between clicks */}
        <mesh position={[0, 0.22, -0.65]}>
          <boxGeometry args={[0.14, 0.18, 0.95]} />
          <meshBasicMaterial color="#020617" />
        </mesh>

        {/* ── HYPERSCROLL TACTILE WHEEL & DPI BUTTONS ── */}
        <group position={[0, 0.45, -0.66]}>
          {/* Metal Wheel Rim Hub */}
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.16, 0.16, 0.08, 32]} />
            <meshStandardMaterial color="#cbd5e1" metalness={0.95} roughness={0.15} />
          </mesh>
          {/* Knurled Rubber Outer Tire Tread */}
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.168, 0.168, 0.045, 32]} />
            <meshStandardMaterial color="#020617" roughness={0.95} />
          </mesh>
          {/* Dual Translucent RGB Side Glow Rims */}
          {[-0.038, 0.038].map((x, idx) => (
            <mesh key={idx} ref={idx === 0 ? wheelRgbRef : undefined} position={[x, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
              <ringGeometry args={[0.12, 0.162, 24]} />
              <meshStandardMaterial color="#06b6d4" emissive="#06b6d4" emissiveIntensity={1.7} />
            </mesh>
          ))}
        </group>

        {/* Tactile DPI Switch Buttons behind Wheel */}
        <group position={[0, 0.44, -0.38]}>
          <mesh position={[0, 0, -0.06]}>
            <boxGeometry args={[0.08, 0.05, 0.09]} />
            <meshStandardMaterial color="#475569" metalness={0.85} roughness={0.2} />
          </mesh>
          <mesh position={[0, 0, 0.06]}>
            <boxGeometry args={[0.08, 0.05, 0.09]} />
            <meshStandardMaterial color="#475569" metalness={0.85} roughness={0.2} />
          </mesh>
        </group>

        {/* ── SIDE THUMB BUTTONS (Mouse 4 & Mouse 5) ── */}
        <group position={[-0.64, 0.38, -0.02]} rotation={[0, 0.08, 0]}>
          <mesh position={[0, 0, -0.15]}>
            <capsuleGeometry args={[0.04, 0.22, 10, 16]} />
            <meshStandardMaterial color="#020617" roughness={0.2} metalness={0.85} />
          </mesh>
          <mesh position={[0, 0, 0.16]}>
            <capsuleGeometry args={[0.04, 0.22, 10, 16]} />
            <meshStandardMaterial color="#020617" roughness={0.2} metalness={0.85} />
          </mesh>
        </group>

        {/* ── FRONT BUMPER & SPEEDFLEX USB-C PORT ── */}
        <mesh position={[0, 0.12, -1.24]}>
          <boxGeometry args={[0.24, 0.07, 0.05]} />
          <meshBasicMaterial color="#020617" />
        </mesh>
      </group>
    </group>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 11. HEADPHONES & EARBUDS (Sony WH-1000XM5, AirPods Max, WF-1000XM5)
// ─────────────────────────────────────────────────────────────────────────────
function HeadphoneOverEar3D({
  parsedColor,
  wireframe,
  productName,
}: {
  parsedColor: THREE.Color;
  wireframe: boolean;
  productName?: string;
}) {
  const name = (productName || '').toLowerCase();
  const isGamingHeadset = name.includes('virtuoso') || name.includes('blackshark') || name.includes('g pro') || name.includes('hs80');
  const isAirPodsMax = name.includes('airpods max');
  const isSonyXM5 = name.includes('wh-1000xm5') || name.includes('sony');
  const isVirtuoso = name.includes('virtuoso');

  return (
    <group position={[0, -0.2, 0]} scale={0.92} rotation={[0.12, -0.38, 0]}>
      {/* ── HEADBAND ARCH ── */}
      {/* Padded Top Cushion */}
      <mesh position={[0, 1.45, 0]}>
        <torusGeometry args={[1.35, 0.14, 16, 32, Math.PI]} />
        <meshStandardMaterial color="#1e293b" roughness={0.7} metalness={0.15} wireframe={wireframe} />
      </mesh>
      {/* Outer Metal / Reinforced Spine Band */}
      <mesh position={[0, 1.48, 0]}>
        <torusGeometry args={[1.42, 0.04, 12, 32, Math.PI]} />
        <meshStandardMaterial color={isAirPodsMax ? '#e2e8f0' : parsedColor} metalness={0.9} roughness={0.2} />
      </mesh>

      {/* ── ADJUSTABLE SLIDER EXTENSION ARMS ── */}
      {[-1.35, 1.35].map((x, i) => (
        <group key={i} position={[x, 0.95, 0]}>
          <mesh>
            <cylinderGeometry args={[0.05, 0.05, 0.65, 16]} />
            <meshStandardMaterial color="#94a3b8" metalness={0.95} roughness={0.15} />
          </mesh>
          <mesh position={[0, -0.35, 0]}>
            <boxGeometry args={[0.14, 0.12, 0.14]} />
            <meshStandardMaterial color={isSonyXM5 ? '#eab308' : '#334155'} metalness={0.8} roughness={0.3} />
          </mesh>
        </group>
      ))}

      {/* ── SWIVEL FORK YOKES ── */}
      {[-1.38, 1.38].map((x, i) => (
        <group key={i} position={[x, 0.5, 0]} rotation={[0, 0, i === 0 ? 0.08 : -0.08]}>
          <mesh position={[0, 0, 0]}>
            <torusGeometry args={[0.48, 0.04, 12, 24, Math.PI]} />
            <meshStandardMaterial color="#475569" metalness={0.9} roughness={0.2} />
          </mesh>
        </group>
      ))}

      {/* ── LEFT EARCUP ── */}
      <group position={[-1.38, 0.28, 0]} rotation={[0, 0.12, 0.08]}>
        {/* Outer Earcup Dome */}
        <mesh castShadow>
          <cylinderGeometry args={[0.55, 0.52, 0.28, 32]} />
          <meshStandardMaterial color={parsedColor} metalness={0.8} roughness={0.25} wireframe={wireframe} />
        </mesh>

        {/* Outer Face Plate */}
        <mesh position={[-0.15, 0, 0]} rotation={[0, -Math.PI / 2, 0]}>
          <circleGeometry args={[0.48, 32]} />
          <meshStandardMaterial
            color={isVirtuoso ? '#0f172a' : parsedColor}
            metalness={isVirtuoso ? 0.95 : 0.85}
            roughness={isVirtuoso ? 0.15 : 0.3}
          />
        </mesh>
        {isVirtuoso && (
          <mesh position={[-0.155, 0, 0]} rotation={[0, -Math.PI / 2, 0]}>
            <ringGeometry args={[0.2, 0.44, 24]} />
            <meshStandardMaterial color="#94a3b8" metalness={0.95} roughness={0.2} wireframe />
          </mesh>
        )}

        {/* Inner Memory Foam Ear Cushion (Facing Inward to Head) */}
        <group position={[0.16, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
          <mesh>
            <torusGeometry args={[0.38, 0.14, 20, 32]} />
            <meshStandardMaterial color="#0f172a" roughness={0.85} metalness={0.1} />
          </mesh>
          <mesh position={[0, 0, -0.05]}>
            <circleGeometry args={[0.32, 24]} />
            <meshStandardMaterial color="#020617" roughness={0.95} />
          </mesh>
        </group>

        {/* Detachable Boom Mic for Gaming Headsets */}
        {isGamingHeadset && (
          <group position={[0.1, -0.4, 0.25]} rotation={[0.4, 0.6, -0.3]}>
            <mesh position={[0, 0, 0.45]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.025, 0.025, 0.9, 16]} />
              <meshStandardMaterial color="#334155" metalness={0.9} roughness={0.3} />
            </mesh>
            <mesh position={[0, 0, 0.95]} rotation={[Math.PI / 2, 0, 0]}>
              <capsuleGeometry args={[0.07, 0.16, 12, 16]} />
              <meshStandardMaterial color="#020617" roughness={0.95} />
            </mesh>
            <mesh position={[0, 0, 0.86]} rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[0.035, 0.01, 8, 16]} />
              <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={1.5} />
            </mesh>
          </group>
        )}
      </group>

      {/* ── RIGHT EARCUP ── */}
      <group position={[1.38, 0.28, 0]} rotation={[0, -0.12, -0.08]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.55, 0.52, 0.28, 32]} />
          <meshStandardMaterial color={parsedColor} metalness={0.8} roughness={0.25} wireframe={wireframe} />
        </mesh>
        <mesh position={[0.15, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
          <circleGeometry args={[0.48, 32]} />
          <meshStandardMaterial
            color={isVirtuoso ? '#0f172a' : parsedColor}
            metalness={isVirtuoso ? 0.95 : 0.85}
            roughness={isVirtuoso ? 0.15 : 0.3}
          />
        </mesh>
        {isVirtuoso && (
          <mesh position={[0.155, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
            <ringGeometry args={[0.2, 0.44, 24]} />
            <meshStandardMaterial color="#94a3b8" metalness={0.95} roughness={0.2} wireframe />
          </mesh>
        )}
        <group position={[-0.16, 0, 0]} rotation={[0, -Math.PI / 2, 0]}>
          <mesh>
            <torusGeometry args={[0.38, 0.14, 20, 32]} />
            <meshStandardMaterial color="#0f172a" roughness={0.85} metalness={0.1} />
          </mesh>
          <mesh position={[0, 0, -0.05]}>
            <circleGeometry args={[0.32, 24]} />
            <meshStandardMaterial color="#020617" roughness={0.95} />
          </mesh>
        </group>
      </group>
    </group>
  );
}

function HeadphoneTWS3D({
  parsedColor,
  productName,
}: {
  parsedColor: THREE.Color;
  productName?: string;
}) {
  const name = (productName || '').toLowerCase();
  const isAirPods = name.includes('airpods');

  return (
    <group position={[0, -0.1, 0]} scale={0.9} rotation={[0.25, -0.35, 0]}>
      {/* ── CHARGING CASE ── */}
      <group position={[0, -0.3, 0]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[1.9, 1.25, 0.75]} />
          <meshStandardMaterial color={isAirPods ? '#ffffff' : parsedColor} roughness={0.2} metalness={0.15} />
        </mesh>
        <mesh position={[0, 0.72, 0]} castShadow>
          <boxGeometry args={[1.9, 0.65, 0.75]} />
          <meshStandardMaterial color={isAirPods ? '#ffffff' : parsedColor} roughness={0.2} metalness={0.15} />
        </mesh>
        <mesh position={[0, 0.39, 0.38]}>
          <boxGeometry args={[1.82, 0.02, 0.01]} />
          <meshBasicMaterial color="#334155" />
        </mesh>
        <mesh position={[0, 0.1, 0.385]}>
          <circleGeometry args={[0.035, 16]} />
          <meshStandardMaterial color="#22c55e" emissive="#22c55e" emissiveIntensity={1.5} />
        </mesh>
        <mesh position={[0, -0.63, 0]}>
          <boxGeometry args={[0.22, 0.04, 0.08]} />
          <meshBasicMaterial color="#020617" />
        </mesh>
      </group>

      {/* ── PAIR OF WIRELESS EARBUDS ── */}
      {/* Left Earbud */}
      <group position={[-0.85, 0.85, 0.2]} rotation={[0.2, 0.4, -0.2]}>
        <mesh castShadow>
          <sphereGeometry args={[0.22, 20, 20]} />
          <meshStandardMaterial color={isAirPods ? '#ffffff' : parsedColor} roughness={0.25} metalness={0.2} />
        </mesh>
        <mesh position={[-0.14, 0.05, 0.12]} rotation={[0, -Math.PI / 4, 0]}>
          <coneGeometry args={[0.15, 0.18, 20]} />
          <meshStandardMaterial color="#94a3b8" roughness={0.7} transparent opacity={0.85} />
        </mesh>
        <mesh position={[0, -0.28, 0]}>
          <cylinderGeometry args={[0.05, 0.05, 0.45, 16]} />
          <meshStandardMaterial color={isAirPods ? '#ffffff' : parsedColor} roughness={0.2} metalness={0.2} />
        </mesh>
        <mesh position={[0, -0.51, 0]}>
          <cylinderGeometry args={[0.052, 0.052, 0.03, 16]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.95} roughness={0.1} />
        </mesh>
      </group>

      {/* Right Earbud */}
      <group position={[0.85, 0.85, 0.2]} rotation={[0.2, -0.4, 0.2]}>
        <mesh castShadow>
          <sphereGeometry args={[0.22, 20, 20]} />
          <meshStandardMaterial color={isAirPods ? '#ffffff' : parsedColor} roughness={0.25} metalness={0.2} />
        </mesh>
        <mesh position={[0.14, 0.05, 0.12]} rotation={[0, Math.PI / 4, 0]}>
          <coneGeometry args={[0.15, 0.18, 20]} />
          <meshStandardMaterial color="#94a3b8" roughness={0.7} transparent opacity={0.85} />
        </mesh>
        <mesh position={[0, -0.28, 0]}>
          <cylinderGeometry args={[0.05, 0.05, 0.45, 16]} />
          <meshStandardMaterial color={isAirPods ? '#ffffff' : parsedColor} roughness={0.2} metalness={0.2} />
        </mesh>
        <mesh position={[0, -0.51, 0]}>
          <cylinderGeometry args={[0.052, 0.052, 0.03, 16]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.95} roughness={0.1} />
        </mesh>
      </group>
    </group>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 12. CPUS (Intel LGA1700 Rectangular vs AMD AM5 Octopus IHS)
// ─────────────────────────────────────────────────────────────────────────────
function CPUIntel3D({
  parsedColor,
  wireframe,
  texture,
}: {
  parsedColor: THREE.Color;
  wireframe: boolean;
  texture: THREE.Texture | null;
}) {
  return (
    <group position={[0, 0, 0]} rotation={[0.4, -0.35, 0]}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[1.85, 0.08, 2.25]} />
        <meshStandardMaterial color="#064e3b" roughness={0.3} metalness={0.4} wireframe={wireframe} />
      </mesh>
      <mesh position={[0, 0.1, 0]} castShadow>
        <boxGeometry args={[1.45, 0.12, 1.75]} />
        <meshStandardMaterial color={parsedColor} metalness={0.92} roughness={0.2} wireframe={wireframe} />
      </mesh>
      {texture && (
        <mesh position={[0, 0.165, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[1.35, 1.65]} />
          <meshStandardMaterial map={texture} metalness={0.85} roughness={0.35} />
        </mesh>
      )}
    </group>
  );
}

function CPUAMD3D({
  parsedColor,
  wireframe,
  texture,
}: {
  parsedColor: THREE.Color;
  wireframe: boolean;
  texture: THREE.Texture | null;
}) {
  return (
    <group position={[0, 0, 0]} rotation={[0.4, -0.35, 0]}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[2.0, 0.08, 2.0]} />
        <meshStandardMaterial color="#064e3b" roughness={0.3} metalness={0.4} wireframe={wireframe} />
      </mesh>
      <mesh position={[0, 0.1, 0]} castShadow>
        <boxGeometry args={[1.55, 0.12, 1.55]} />
        <meshStandardMaterial color={parsedColor} metalness={0.92} roughness={0.2} wireframe={wireframe} />
      </mesh>
      {texture && (
        <mesh position={[0, 0.165, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[1.45, 1.45]} />
          <meshStandardMaterial map={texture} metalness={0.85} roughness={0.35} />
        </mesh>
      )}
    </group>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 13. RAM & M.2 NVME SSD (DDR5 Heat Spreader, Gold Contacts, Real PCB)
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
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[3.2, 1.2, 0.04]} />
        <meshStandardMaterial color="#020617" roughness={0.6} />
      </mesh>
      <mesh position={[0, 0.1, 0.04]} castShadow>
        <boxGeometry args={[3.15, 0.95, 0.04]} />
        <meshStandardMaterial color={parsedColor} metalness={0.9} roughness={0.25} wireframe={wireframe} />
      </mesh>
      {texture && (
        <mesh position={[0, 0.1, 0.065]}>
          <planeGeometry args={[2.8, 0.8]} />
          <meshStandardMaterial map={texture} transparent opacity={0.9} roughness={0.3} metalness={0.4} />
        </mesh>
      )}
      <mesh ref={rgbRef} position={[0, 0.65, 0]}>
        <boxGeometry args={[3.16, 0.16, 0.1]} />
        <meshStandardMaterial color="#38bdf8" emissive="#38bdf8" emissiveIntensity={2.0} transparent opacity={0.95} />
      </mesh>
      <mesh position={[0, -0.56, 0]}>
        <boxGeometry args={[2.9, 0.12, 0.045]} />
        <meshStandardMaterial color="#eab308" metalness={0.98} roughness={0.1} />
      </mesh>
    </group>
  );
}

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
      <mesh castShadow receiveShadow>
        <boxGeometry args={[2.8, 0.06, 0.9]} />
        <meshStandardMaterial color="#020617" roughness={0.5} wireframe={wireframe} />
      </mesh>
      <mesh position={[0.6, 0.082, 0]}>
        <boxGeometry args={[1.4, 0.01, 0.7]} />
        {texture ? (
          <meshStandardMaterial map={texture} roughness={0.3} metalness={0.5} wireframe={wireframe} />
        ) : (
          <meshStandardMaterial color={parsedColor} metalness={0.7} roughness={0.3} />
        )}
      </mesh>
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
  foldState = 'flex',
}) => {
  const groupRef = useRef<THREE.Group>(null);

  // Floating ambient motion
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
    if (thumbnailUrl && !thumbnailUrl.includes('unsplash') && !thumbnailUrl.match(/\/(apple|samsung|asus|lenovo|acer|dell|keychron|razer|corsair|logitech|sony|intel|amd|nvidia|kingston)\.png$/i)) {
      return thumbnailUrl;
    }
    if (productSlug) return `/images/products/${productSlug}.png`;
    return undefined;
  }, [thumbnailUrl, productSlug]);

  const texture = useProductTexture(effectiveImageUrl);

  return (
    <Center position={[0, -0.2, 0]}>
      <group ref={groupRef}>
        {productType === 'samsung_flip' && (
          <SamsungGalaxyZFlip3D
            parsedColor={parsedColor}
            wireframe={wireframe}
            texture={texture}
            foldAngle={foldState === 'closed' ? 2.92 : foldState === 'open' ? 0.0 : 1.15}
          />
        )}
        {productType === 'samsung_fold' && (
          <SamsungGalaxyZFold3D
            parsedColor={parsedColor}
            wireframe={wireframe}
            texture={texture}
            foldAngle={foldState === 'closed' ? 2.7 : foldState === 'open' ? 0.0 : 0.6}
          />
        )}
        {productType === 'samsung_s24_ultra' && (
          <SamsungGalaxyS24Ultra3D parsedColor={parsedColor} wireframe={wireframe} texture={texture} />
        )}
        {productType === 'samsung_standard_phone' && (
          <SamsungGalaxyStandard3D parsedColor={parsedColor} wireframe={wireframe} texture={texture} />
        )}
        {productType === 'apple_iphone' && (
          <AppleIPhone3D parsedColor={parsedColor} wireframe={wireframe} texture={texture} />
        )}
        {productType === 'samsung_tablet' && (
          <SamsungTablet3D parsedColor={parsedColor} wireframe={wireframe} texture={texture} />
        )}
        {productType === 'apple_ipad' && (
          <AppleIPad3D parsedColor={parsedColor} wireframe={wireframe} texture={texture} />
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
        {productType === 'headphone_overear' && (
          <HeadphoneOverEar3D parsedColor={parsedColor} wireframe={wireframe} productName={productName} />
        )}
        {productType === 'headphone_tws' && (
          <HeadphoneTWS3D parsedColor={parsedColor} productName={productName} />
        )}
        {productType === 'mouse' && <Mouse3D parsedColor={parsedColor} wireframe={wireframe} productName={productName} />}
        {productType === 'keyboard' && (
          <Keyboard3D parsedColor={parsedColor} wireframe={wireframe} texture={texture} />
        )}
        {productType === 'cpu_intel' && (
          <CPUIntel3D parsedColor={parsedColor} wireframe={wireframe} texture={texture} />
        )}
        {productType === 'cpu_amd' && (
          <CPUAMD3D parsedColor={parsedColor} wireframe={wireframe} texture={texture} />
        )}
        {productType === 'ram' && <RAM3D parsedColor={parsedColor} wireframe={wireframe} texture={texture} />}
        {productType === 'ssd' && <SSD3D parsedColor={parsedColor} wireframe={wireframe} texture={texture} />}
      </group>
    </Center>
  );
};

export default ProceduralTechModel;
