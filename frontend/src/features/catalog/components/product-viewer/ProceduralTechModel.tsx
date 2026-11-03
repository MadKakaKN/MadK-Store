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
  if (cat.includes('laptop') || name.includes('macbook') || name.includes('laptop') || name.includes('xps') || name.includes('thinkpad') || name.includes('scar') || name.includes('zephyrus') || name.includes('helios') || name.includes('legion') || name.includes('alienware')) {
    return 'laptop';
  }

  // GPUs
  if (cat.includes('vga') || cat.includes('card-man-hinh') || name.includes('rtx') || name.includes('geforce') || name.includes('radeon') || name.includes('vga')) {
    return 'gpu';
  }

  // Audio / Headphones
  if (cat.includes('tai-nghe') || name.includes('tai nghe') || name.includes('headphone') || name.includes('airpods') || name.includes('wf-1000') || name.includes('wh-1000') || name.includes('blackshark')) {
    if (name.includes('wf-1000') || name.includes('airpods pro') || name.includes('tws') || name.includes('in-ear')) {
      return 'headphone_tws';
    }
    return 'headphone_overear';
  }

  // Mice
  if (cat.includes('chuot') || name.includes('chuột') || name.includes('mouse') || name.includes('superlight') || name.includes('deathadder') || name.includes('viper') || name.includes('g502')) {
    return 'mouse';
  }

  // Keyboards
  if (cat.includes('ban-phim') || name.includes('bàn phím') || name.includes('keyboard') || name.includes('keychron') || name.includes('huntsman') || name.includes('k70')) {
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
  if (cat.includes('ram') || name.includes('ram ') || name.includes('ddr5') || name.includes('ddr4') || name.includes('dominator') || name.includes('vengeance')) {
    return 'ram';
  }

  // SSD
  if (cat.includes('ssd') || cat.includes('o-cung') || name.includes('ssd') || name.includes('ổ cứng') || name.includes('990 pro') || name.includes('nvme')) {
    return 'ssd';
  }

  return 'samsung_standard_phone';
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. SAMSUNG GALAXY Z FLIP5 3D MODEL (Clamshell Foldable with Flex Window)
// ─────────────────────────────────────────────────────────────────────────────
function SamsungGalaxyZFlip3D({
  parsedColor,
  wireframe,
  texture,
}: {
  parsedColor: THREE.Color;
  wireframe: boolean;
  texture: THREE.Texture | null;
}) {
  return (
    <group position={[0, -0.1, 0]} rotation={[0.2, -0.35, 0]}>
      {/* ── LOWER HALF (Base) ── */}
      <group position={[0, -0.85, 0]}>
        {/* Armor Aluminum Bottom Frame */}
        <mesh castShadow receiveShadow>
          <boxGeometry args={[1.54, 1.58, 0.14]} />
          <meshStandardMaterial color={parsedColor} metalness={0.9} roughness={0.3} wireframe={wireframe} />
        </mesh>
        {/* Back Matte Glass in Mint/Chosen Color */}
        <mesh position={[0, 0, -0.072]} rotation={[0, Math.PI, 0]}>
          <planeGeometry args={[1.48, 1.52]} />
          <meshStandardMaterial color={parsedColor} roughness={0.35} metalness={0.6} />
        </mesh>
        {/* Embossed Samsung Logo */}
        <mesh position={[0, -0.4, -0.075]} rotation={[0, Math.PI, 0]}>
          <boxGeometry args={[0.6, 0.08, 0.005]} />
          <meshStandardMaterial color="#ffffff" metalness={0.95} roughness={0.2} />
        </mesh>
        {/* Inside Main Lower Screen Portion */}
        <mesh position={[0, 0, 0.072]}>
          <planeGeometry args={[1.46, 1.5]} />
          <meshStandardMaterial color="#020617" roughness={0.1} metalness={0.2} />
        </mesh>
      </group>

      {/* ── CENTRAL ARMOR ALUMINUM HINGE SPINE ── */}
      <mesh position={[0, 0, -0.04]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.075, 0.075, 1.54, 24]} />
        <meshStandardMaterial color="#cbd5e1" metalness={0.95} roughness={0.2} />
      </mesh>
      {/* Folding Crease Seam */}
      <mesh position={[0, 0, 0.072]}>
        <boxGeometry args={[1.48, 0.02, 0.005]} />
        <meshStandardMaterial color="#0f172a" roughness={0.8} />
      </mesh>

      {/* ── UPPER HALF (Display + Outer Flex Window 3.4") ── */}
      {/* Slightly angled at 15 degrees to show off clamshell flex design */}
      <group position={[0, 0.85, 0]}>
        {/* Armor Aluminum Upper Frame */}
        <mesh castShadow receiveShadow>
          <boxGeometry args={[1.54, 1.58, 0.14]} />
          <meshStandardMaterial color={parsedColor} metalness={0.9} roughness={0.3} wireframe={wireframe} />
        </mesh>

        {/* ── OUTSIDE: THE ICONIC 3.4" FLEX WINDOW (FOLDER SHAPED) ── */}
        <mesh position={[0, -0.05, -0.073]} rotation={[0, Math.PI, 0]}>
          <planeGeometry args={[1.35, 1.25]} />
          <meshStandardMaterial color="#000000" roughness={0.1} metalness={0.4} />
        </mesh>
        {/* Flex Window Active Widget Display */}
        <mesh position={[0, -0.05, -0.074]} rotation={[0, Math.PI, 0]}>
          <planeGeometry args={[1.28, 1.18]} />
          <meshStandardMaterial
            color="#0ea5e9"
            emissive="#0ea5e9"
            emissiveIntensity={0.35}
            roughness={0.2}
          />
        </mesh>

        {/* Dual Horizontal Floating Camera Rings on Outer Shell */}
        <group position={[-0.26, 0.6, -0.082]} rotation={[0, Math.PI, 0]}>
          {/* Main 12MP Wide Camera Ring */}
          <mesh position={[-0.22, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.11, 0.11, 0.035, 20]} />
            <meshStandardMaterial color="#0f172a" metalness={0.95} roughness={0.1} />
          </mesh>
          {/* Ultra-Wide 12MP Camera Ring */}
          <mesh position={[0.08, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.11, 0.11, 0.035, 20]} />
            <meshStandardMaterial color="#0f172a" metalness={0.95} roughness={0.1} />
          </mesh>
          {/* LED Flash */}
          <mesh position={[0.34, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <circleGeometry args={[0.045, 16]} />
            <meshStandardMaterial color="#fef08a" emissive="#fef08a" emissiveIntensity={0.8} />
          </mesh>
        </group>

        {/* ── INSIDE: TOP HALF SCREEN WITH AUTHENTIC TEXTURE & CAMERA PUNCH HOLE ── */}
        <mesh position={[0, 0, 0.072]}>
          <planeGeometry args={[1.46, 1.5]} />
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
            <meshStandardMaterial color={parsedColor} emissive={parsedColor} emissiveIntensity={0.25} />
          )}
        </mesh>

        {/* Infinity-O Front Selfie Camera Punch-Hole */}
        <mesh position={[0, 0.65, 0.074]}>
          <circleGeometry args={[0.035, 16]} />
          <meshBasicMaterial color="#000000" />
        </mesh>
      </group>
    </group>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. SAMSUNG GALAXY S24 ULTRA 3D MODEL (Sharp 90° Corners, 4 Floating Camera Rings)
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
      {/* Sharp Rectangular Titanium Perimeter Frame (No curved corners!) */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[1.62, 3.26, 0.165]} />
        <meshStandardMaterial color={parsedColor} metalness={0.94} roughness={0.28} wireframe={wireframe} />
      </mesh>

      {/* Completely Flat Front Display Frame */}
      <mesh position={[0, 0, 0.084]}>
        <planeGeometry args={[1.56, 3.2]} />
        <meshStandardMaterial color="#020617" roughness={0.06} metalness={0.3} wireframe={wireframe} />
      </mesh>

      {/* Screen Display with Real S24 Ultra Wallpaper Texture */}
      <mesh position={[0, 0, 0.085]}>
        <planeGeometry args={[1.52, 3.14]} />
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
          <meshStandardMaterial color={parsedColor} emissive={parsedColor} emissiveIntensity={0.3} />
        )}
      </mesh>

      {/* Central Punch-Hole Selfie Camera (Samsung Infinity-O) */}
      <mesh position={[0, 1.45, 0.086]}>
        <circleGeometry args={[0.035, 16]} />
        <meshBasicMaterial color="#000000" />
      </mesh>

      {/* Back Plate: Satin Matte Titanium Glass */}
      <mesh position={[0, 0, -0.084]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[1.56, 3.2]} />
        <meshStandardMaterial color={parsedColor} roughness={0.4} metalness={0.7} wireframe={wireframe} />
      </mesh>

      {/* ── SAMSUNG SIGNATURE: 4 INDEPENDENT FLOATING CAMERA RINGS (NO ISLAND!) ── */}
      <group position={[-0.46, 0.85, -0.095]} rotation={[0, Math.PI, 0]}>
        {/* Column 1: Main 3 Large Protruding Rings (200MP + 50MP 5x + 12MP Ultrawide) */}
        {[0.45, 0, -0.45].map((y, idx) => (
          <group key={idx} position={[0, y, 0]}>
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.14, 0.14, 0.045, 24]} />
              <meshStandardMaterial color="#334155" metalness={0.95} roughness={0.15} />
            </mesh>
            <mesh position={[0, 0, 0.024]}>
              <circleGeometry args={[0.085, 20]} />
              <meshStandardMaterial color="#090d16" metalness={0.98} roughness={0.05} />
            </mesh>
          </group>
        ))}

        {/* Column 2: 10MP 3x Telephoto + Laser AF Sensor + Flash */}
        <group position={[0.28, 0.22, 0]}>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.095, 0.095, 0.038, 20]} />
            <meshStandardMaterial color="#334155" metalness={0.95} roughness={0.15} />
          </mesh>
        </group>
        <group position={[0.28, -0.22, 0]}>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.075, 0.075, 0.03, 16]} />
            <meshStandardMaterial color="#0f172a" metalness={0.9} roughness={0.2} />
          </mesh>
        </group>
      </group>

      {/* S-Pen Silo Push-Cap on Bottom Left */}
      <mesh position={[-0.62, -1.63, 0]}>
        <boxGeometry args={[0.14, 0.02, 0.07]} />
        <meshStandardMaterial color="#475569" metalness={0.9} roughness={0.2} />
      </mesh>
    </group>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. SAMSUNG GALAXY STANDARD (S24 / S24+ / A55 5G - 3 Vertical Floating Rings)
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
      {/* Armor Aluminum Frame with Soft Curved Corners */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[1.52, 3.12, 0.15]} />
        <meshStandardMaterial color={parsedColor} metalness={0.88} roughness={0.3} wireframe={wireframe} />
      </mesh>

      {/* Front Screen Display */}
      <mesh position={[0, 0, 0.077]}>
        <planeGeometry args={[1.44, 3.02]} />
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
          <meshStandardMaterial color={parsedColor} emissive={parsedColor} emissiveIntensity={0.3} />
        )}
      </mesh>

      {/* Central Punch-Hole Camera */}
      <mesh position={[0, 1.38, 0.078]}>
        <circleGeometry args={[0.035, 16]} />
        <meshBasicMaterial color="#000000" />
      </mesh>

      {/* Back Glass Shell */}
      <mesh position={[0, 0, -0.077]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[1.46, 3.04]} />
        <meshStandardMaterial color={parsedColor} roughness={0.4} metalness={0.6} wireframe={wireframe} />
      </mesh>

      {/* ── 3 VERTICAL FLOATING CAMERA RINGS (SAMSUNG SIGNATURE MINIMALIST) ── */}
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
        {/* Flash beside top camera */}
        <mesh position={[0.22, 0.38, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.04, 16]} />
          <meshStandardMaterial color="#fef08a" emissive="#fef08a" emissiveIntensity={0.8} />
        </mesh>
      </group>

      {/* Samsung Wordmark near bottom */}
      <mesh position={[0, -1.0, -0.079]} rotation={[0, Math.PI, 0]}>
        <boxGeometry args={[0.5, 0.07, 0.005]} />
        <meshStandardMaterial color="#ffffff" metalness={0.8} roughness={0.3} />
      </mesh>
    </group>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. APPLE IPHONE 3D MODEL (Dynamic Island Pill & Triple Camera Island)
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
      {/* Contoured Titanium Perimeter Frame */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[1.52, 3.12, 0.16]} />
        <meshStandardMaterial color={parsedColor} metalness={0.92} roughness={0.25} wireframe={wireframe} />
      </mesh>

      {/* Front Face with Real iOS Texture */}
      <mesh position={[0, 0, 0.082]}>
        <planeGeometry args={[1.44, 3.02]} />
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
          <meshStandardMaterial color="#020617" roughness={0.1} />
        )}
      </mesh>

      {/* Dynamic Island Pill Cutout */}
      <mesh position={[0, 1.25, 0.085]}>
        <boxGeometry args={[0.38, 0.1, 0.005]} />
        <meshStandardMaterial color="#000000" roughness={0.95} />
      </mesh>

      {/* Back Plate with Square Frosted Camera Island */}
      <mesh position={[0, 0, -0.082]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[1.46, 3.04]} />
        <meshStandardMaterial color={parsedColor} roughness={0.4} metalness={0.65} wireframe={wireframe} />
      </mesh>

      {/* Elevated Triple Camera Plateau */}
      <group position={[-0.35, 0.95, -0.095]} rotation={[0, Math.PI, 0]}>
        <mesh castShadow>
          <boxGeometry args={[0.62, 0.65, 0.04]} />
          <meshStandardMaterial color={parsedColor} roughness={0.25} metalness={0.8} />
        </mesh>
        {/* Triple Lenses Triangle */}
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
    </group>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. TABLET 3D MODELS (Samsung Galaxy Tab S9 Ultra vs Apple iPad Pro)
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
  // Galaxy Tab S9 Ultra: 14.6" 16:10 format (3.54 x 2.22)
  return (
    <group position={[0, 0, 0]} rotation={[0.2, -0.3, 0]}>
      {/* Aluminum Armor Unibody */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[3.54, 2.22, 0.085]} />
        <meshStandardMaterial color={parsedColor} metalness={0.92} roughness={0.25} wireframe={wireframe} />
      </mesh>

      {/* Front Screen Display */}
      <mesh position={[0, 0, 0.045]}>
        <planeGeometry args={[3.42, 2.1]} />
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
          <meshStandardMaterial color={parsedColor} emissive={parsedColor} emissiveIntensity={0.3} />
        )}
      </mesh>

      {/* Dual Landscape Front Selfie Cameras */}
      <mesh position={[0, 1.06, 0.046]}>
        <boxGeometry args={[0.1, 0.035, 0.005]} />
        <meshBasicMaterial color="#000000" />
      </mesh>

      {/* Rear Plate: Dual Camera + S-Pen Magnetic Groove */}
      <group position={[-1.3, 0, -0.046]} rotation={[0, Math.PI, 0]}>
        <mesh position={[0, 0.65, 0.015]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.08, 0.08, 0.03, 20]} />
          <meshStandardMaterial color="#0f172a" metalness={0.95} roughness={0.1} />
        </mesh>
        <mesh position={[0, 0.45, 0.015]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.08, 0.08, 0.03, 20]} />
          <meshStandardMaterial color="#0f172a" metalness={0.95} roughness={0.1} />
        </mesh>
        {/* S-Pen Magnetic Charging Groove */}
        <mesh position={[0, -0.15, 0.005]}>
          <boxGeometry args={[0.14, 0.95, 0.01]} />
          <meshStandardMaterial color="#1e293b" metalness={0.8} roughness={0.4} />
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
  // iPad Pro: 4:3 format (3.12 x 2.32)
  return (
    <group position={[0, 0, 0]} rotation={[0.2, -0.3, 0]}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[3.12, 2.32, 0.085]} />
        <meshStandardMaterial color={parsedColor} metalness={0.92} roughness={0.25} wireframe={wireframe} />
      </mesh>
      <mesh position={[0, 0, 0.045]}>
        <planeGeometry args={[3.0, 2.2]} />
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
          <meshStandardMaterial color="#020617" roughness={0.1} />
        )}
      </mesh>
      {/* Apple Square Camera Island with LiDAR */}
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
// 6. LAPTOP 3D MODEL (Tailored: ROG Strix vs MacBook vs ThinkPad vs XPS)
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
        <meshStandardMaterial color={parsedColor} metalness={0.85} roughness={0.25} wireframe={wireframe} />
      </mesh>

      {/* Dynamic RGB Lightbar along front lip (ROG Strix / Legion) */}
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

      {/* Glass Precision Touchpad */}
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

        {/* Screen Display with Real Product Screen / Photo */}
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
            <meshStandardMaterial color="#0f172a" emissive="#0284c7" emissiveIntensity={0.35} />
          )}
        </mesh>
      </group>
    </group>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 7. GPU / GRAPHICS CARD 3D MODEL
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

      {/* Triple Rotating Fans */}
      {[-1.0, 0, 1.0].map((x, i) => (
        <group key={i} position={[x, 0, 0.31]} ref={i === 0 ? fan1 : i === 1 ? fan2 : fan3}>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.38, 0.38, 0.03, 24]} />
            <meshStandardMaterial color="#1e293b" metalness={0.8} roughness={0.3} transparent opacity={0.65} />
          </mesh>
        </group>
      ))}

      {/* RGB Lightbar on top edge */}
      <mesh ref={rgbRef} position={[0, 0.74, 0.1]}>
        <boxGeometry args={[2.4, 0.04, 0.2]} />
        <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={2.2} />
      </mesh>

      {/* PCIe Gold Teeth */}
      <mesh position={[0, -0.75, -0.1]}>
        <boxGeometry args={[1.8, 0.06, 0.03]} />
        <meshStandardMaterial color="#f59e0b" metalness={0.98} roughness={0.1} />
      </mesh>
    </group>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 8. HEADPHONES (Sony WH-1000XM5 / AirPods Max) & TWS EARBUDS
// ─────────────────────────────────────────────────────────────────────────────
function HeadphoneOverEar3D({
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
        {texture && (
          <mesh position={[-0.17, 0, 0]} rotation={[0, -Math.PI / 2, 0]}>
            <circleGeometry args={[0.38, 28]} />
            <meshStandardMaterial map={texture} roughness={0.3} />
          </mesh>
        )}
      </group>
      {/* Right Earcup */}
      <group position={[1.15, 0.6, 0]} rotation={[0, 0, -0.15]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.42, 0.42, 0.32, 28]} />
          <meshStandardMaterial color={parsedColor} metalness={0.85} roughness={0.25} wireframe={wireframe} />
        </mesh>
        {texture && (
          <mesh position={[0.17, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
            <circleGeometry args={[0.38, 28]} />
            <meshStandardMaterial map={texture} roughness={0.3} />
          </mesh>
        )}
      </group>
    </group>
  );
}

function HeadphoneTWS3D({
  parsedColor,
  texture,
}: {
  parsedColor: THREE.Color;
  texture: THREE.Texture | null;
}) {
  return (
    <group position={[0, 0, 0]} rotation={[0.3, -0.35, 0]}>
      {/* Pebble Charging Case */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[1.8, 1.4, 0.8]} />
        <meshStandardMaterial color={parsedColor} roughness={0.3} metalness={0.2} />
      </mesh>
      {/* Cover Texture */}
      {texture && (
        <mesh position={[0, 0, 0.41]}>
          <planeGeometry args={[1.6, 1.2]} />
          <meshStandardMaterial map={texture} transparent roughness={0.3} />
        </mesh>
      )}
      {/* Status LED */}
      <mesh position={[0, 0, 0.42]}>
        <circleGeometry args={[0.04, 16]} />
        <meshStandardMaterial color="#22c55e" emissive="#22c55e" emissiveIntensity={1.2} />
      </mesh>
    </group>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 9. GAMING MOUSE 3D MODEL
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
      <mesh castShadow receiveShadow>
        <capsuleGeometry args={[0.65, 1.4, 20, 24]} />
        <meshStandardMaterial color={parsedColor} metalness={0.3} roughness={0.4} wireframe={wireframe} />
      </mesh>
      {texture && (
        <mesh position={[0, 0.1, 0.45]} rotation={[-Math.PI / 4, 0, 0]}>
          <planeGeometry args={[0.9, 0.9]} />
          <meshStandardMaterial map={texture} transparent opacity={0.9} roughness={0.3} />
        </mesh>
      )}
      {/* Scroll Wheel with RGB */}
      <mesh position={[0, 0.5, 0.5]} rotation={[0, Math.PI / 2, 0]}>
        <cylinderGeometry args={[0.14, 0.14, 0.09, 20]} />
        <meshStandardMaterial color="#06b6d4" emissive="#06b6d4" emissiveIntensity={0.8} roughness={0.3} />
      </mesh>
    </group>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 10. MECHANICAL KEYBOARD 3D MODEL
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
  return (
    <group position={[0, 0, 0]} rotation={[0.25, -0.4, 0]}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[3.0, 0.22, 1.45]} />
        <meshStandardMaterial color={parsedColor} metalness={0.85} roughness={0.25} wireframe={wireframe} />
      </mesh>
      {/* Rotary Encoder Knob */}
      <mesh position={[1.25, 0.22, -0.45]}>
        <cylinderGeometry args={[0.11, 0.11, 0.15, 24]} />
        <meshStandardMaterial color="#cbd5e1" metalness={0.95} roughness={0.2} />
      </mesh>
      {/* Keycaps Surface with Product Texture */}
      {texture && (
        <mesh position={[0, 0.15, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[2.7, 1.25]} />
          <meshStandardMaterial map={texture} roughness={0.3} />
        </mesh>
      )}
    </group>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 11. CPU 3D MODELS (Intel LGA1700 vs AMD AM5)
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
  // Intel LGA1700: Rectangular (1.85 x 2.25)
  return (
    <group position={[0, 0, 0]} rotation={[0.4, -0.35, 0]}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[1.85, 0.08, 2.25]} />
        <meshStandardMaterial color="#064e3b" roughness={0.3} metalness={0.4} wireframe={wireframe} />
      </mesh>
      {/* Nickel IHS */}
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
  // AMD AM5: Square (2.0 x 2.0)
  return (
    <group position={[0, 0, 0]} rotation={[0.4, -0.35, 0]}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[2.0, 0.08, 2.0]} />
        <meshStandardMaterial color="#064e3b" roughness={0.3} metalness={0.4} wireframe={wireframe} />
      </mesh>
      {/* AM5 Octopus-Cutout IHS */}
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
// 12. RAM & SSD 3D MODELS
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
      {/* Top Diffused RGB Light Bar */}
      <mesh ref={rgbRef} position={[0, 0.65, 0]}>
        <boxGeometry args={[3.16, 0.16, 0.1]} />
        <meshStandardMaterial color="#38bdf8" emissive="#38bdf8" emissiveIntensity={2.0} transparent opacity={0.95} />
      </mesh>
      {/* Gold Pins */}
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
      {/* Graphene Label with Real Product Branding */}
      <mesh position={[0.6, 0.082, 0]}>
        <boxGeometry args={[1.4, 0.01, 0.7]} />
        {texture ? (
          <meshStandardMaterial map={texture} roughness={0.3} metalness={0.5} wireframe={wireframe} />
        ) : (
          <meshStandardMaterial color={parsedColor} metalness={0.7} roughness={0.3} />
        )}
      </mesh>
      {/* Gold Pins */}
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
    if (thumbnailUrl && !thumbnailUrl.includes('unsplash')) return thumbnailUrl;
    if (productSlug) return `/images/products/${productSlug}.png`;
    return undefined;
  }, [thumbnailUrl, productSlug]);

  const texture = useProductTexture(effectiveImageUrl);

  return (
    <Center position={[0, -0.2, 0]}>
      <group ref={groupRef}>
        {productType === 'samsung_flip' && (
          <SamsungGalaxyZFlip3D parsedColor={parsedColor} wireframe={wireframe} texture={texture} />
        )}
        {productType === 'samsung_fold' && (
          <SamsungGalaxyZFlip3D parsedColor={parsedColor} wireframe={wireframe} texture={texture} />
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
          <HeadphoneOverEar3D parsedColor={parsedColor} wireframe={wireframe} texture={texture} />
        )}
        {productType === 'headphone_tws' && (
          <HeadphoneTWS3D parsedColor={parsedColor} texture={texture} />
        )}
        {productType === 'mouse' && <Mouse3D parsedColor={parsedColor} wireframe={wireframe} texture={texture} />}
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
