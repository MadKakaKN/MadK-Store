import React, { useRef, useMemo, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, ContactShadows, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { usePrefersReducedMotion } from '../../../../hooks/usePrefersReducedMotion';

interface Hero3DCanvasProps {
  productSlug?: string;
  productCategory?: string;
  productName?: string;
}

/**
 * Loads a texture with automatic SRGB color space conversion
 */
function useLoadedTexture(url: string) {
  return useMemo(() => {
    const loader = new THREE.TextureLoader();
    const tex = loader.load(url);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }, [url]);
}

/**
 * High-fidelity 3D Gaming Laptop Model (ROG Strix SCAR 16)
 * Features real 2K ROG Strix screen display, RGB light bar, per-key backlit keyboard,
 * glass touchpad, and rear glowing ROG Eye emblem.
 */
function Laptop3DModel() {
  const screenTex = useLoadedTexture('/images/products/rog-scar-screen-flat.jpg');
  const rgbBarRef = useRef<THREE.Mesh>(null);

  // Dynamic RGB cycling along front edge
  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (rgbBarRef.current) {
      const hue = (t * 0.25) % 1;
      (rgbBarRef.current.material as THREE.MeshStandardMaterial).emissive.setHSL(hue, 1, 0.6);
      (rgbBarRef.current.material as THREE.MeshStandardMaterial).color.setHSL(hue, 1, 0.5);
    }
  });

  // Miniature chiclet keyboard layout
  const keyboardKeys = useMemo(() => {
    const keys: { x: number; z: number; w: number; isAccent?: boolean }[] = [];
    const rows = 4;
    const cols = 11;
    const spacingX = 0.22;
    const spacingZ = 0.22;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (r === 3 && c >= 3 && c <= 7) {
          if (c === 3) {
            keys.push({ x: 0, z: 0.33, w: spacingX * 4.8, isAccent: true });
          }
          continue;
        }
        keys.push({
          x: (c - (cols - 1) / 2) * spacingX,
          z: (r - (rows - 1) / 2) * spacingZ - 0.05,
          w: spacingX * 0.85,
          isAccent: (r === 0 && c === 0) || (r === 1 && c === cols - 1),
        });
      }
    }
    return keys;
  }, []);

  return (
    <group position={[0, -0.6, 0]} rotation={[0.22, -0.38, 0]}>
      {/* LOWER CHASSIS (BASE) */}
      <mesh position={[0, 0, 0]} castShadow receiveShadow>
        <boxGeometry args={[3.2, 0.14, 2.2]} />
        <meshStandardMaterial color="#0f172a" metalness={0.9} roughness={0.2} />
      </mesh>

      {/* FRONT RGB LIGHT BAR */}
      <mesh ref={rgbBarRef} position={[0, -0.04, 1.11]}>
        <boxGeometry args={[3.18, 0.04, 0.04]} />
        <meshStandardMaterial color="#06B6D4" emissive="#06B6D4" emissiveIntensity={2.5} />
      </mesh>

      {/* KEYBOARD RECESS */}
      <mesh position={[0, 0.075, -0.2]} receiveShadow>
        <boxGeometry args={[2.7, 0.02, 1.15]} />
        <meshStandardMaterial color="#020617" roughness={0.7} />
      </mesh>

      {/* KEYBOARD KEYS */}
      <group position={[0, 0.09, -0.2]}>
        {keyboardKeys.map((k, i) => (
          <mesh key={i} position={[k.x, 0, k.z]}>
            <boxGeometry args={[k.w, 0.03, 0.16]} />
            <meshStandardMaterial
              color={k.isAccent ? '#38BDF8' : '#1e293b'}
              emissive={k.isAccent ? '#0284C7' : '#0f172a'}
              emissiveIntensity={k.isAccent ? 1.0 : 0.2}
              roughness={0.3}
            />
          </mesh>
        ))}
      </group>

      {/* TOUCHPAD WITH MATTE GLASS TEXTURE */}
      <mesh position={[0, 0.076, 0.62]} receiveShadow>
        <boxGeometry args={[1.05, 0.015, 0.65]} />
        <meshStandardMaterial color="#1e293b" metalness={0.3} roughness={0.25} />
      </mesh>

      {/* HINGES */}
      <mesh position={[-1.1, 0.08, -1.08]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.07, 0.07, 0.4, 16]} />
        <meshStandardMaterial color="#475569" metalness={0.9} roughness={0.2} />
      </mesh>
      <mesh position={[1.1, 0.08, -1.08]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.07, 0.07, 0.4, 16]} />
        <meshStandardMaterial color="#475569" metalness={0.9} roughness={0.2} />
      </mesh>

      {/* OPEN DISPLAY LID (TILTED BACK ~16° FROM VERTICAL) */}
      <group position={[0, 0.08, -1.08]} rotation={[-0.28, 0, 0]}>
        {/* Lid Rear Casing */}
        <mesh position={[0, 1.05, 0]} castShadow>
          <boxGeometry args={[3.2, 2.1, 0.08]} />
          <meshStandardMaterial color="#090d16" metalness={0.95} roughness={0.15} />
        </mesh>

        {/* ROG Eye Crimson Logo on back of lid */}
        <mesh position={[0.75, 1.35, -0.045]}>
          <planeGeometry args={[0.55, 0.45]} />
          <meshBasicMaterial color="#EF4444" transparent opacity={0.95} />
        </mesh>

        {/* Diagonal Cyber Cut Line on back lid */}
        <mesh position={[-0.2, 1.05, -0.042]} rotation={[0, 0, -0.45]}>
          <planeGeometry args={[0.03, 2.3]} />
          <meshBasicMaterial color="#38BDF8" transparent opacity={0.6} />
        </mesh>

        {/* Front Screen Bezel */}
        <mesh position={[0, 1.05, 0.042]}>
          <boxGeometry args={[3.14, 2.04, 0.01]} />
          <meshStandardMaterial color="#000000" roughness={0.9} />
        </mesh>

        {/* Photorealistic ROG Strix SCAR 16 Gaming Screen Display */}
        <mesh position={[0, 1.05, 0.048]}>
          <planeGeometry args={[3.04, 1.94]} />
          <meshStandardMaterial
            map={screenTex}
            emissive="#0284C7"
            emissiveIntensity={0.3}
            roughness={0.1}
          />
        </mesh>
      </group>

      {/* COPPER REAR EXHAUST VENTS */}
      <mesh position={[-1.61, -0.02, -0.3]}>
        <boxGeometry args={[0.03, 0.08, 0.8]} />
        <meshStandardMaterial color="#D97706" metalness={0.95} roughness={0.2} />
      </mesh>
      <mesh position={[1.61, -0.02, -0.3]}>
        <boxGeometry args={[0.03, 0.08, 0.8]} />
        <meshStandardMaterial color="#D97706" metalness={0.95} roughness={0.2} />
      </mesh>
    </group>
  );
}

/**
 * Photorealistic 3D Smartphone Model (Apple iPhone 15 Pro Max)
 * Built with authentic 4K textures for both the Ceramic Shield iOS 17 front display
 * and Natural Titanium frosted glass back with Apple logo and 3D sapphire camera lenses.
 */
function Phone3DModel() {
  const frontTex = useLoadedTexture('/images/products/iphone15-screen-texture.jpg');
  const backTex = useLoadedTexture('/images/products/iphone15-back-texture.jpg');

  return (
    <group position={[0, 0, 0]} rotation={[0.15, -0.35, 0]}>
      {/* Curved Titanium Perimeter Frame */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[1.52, 3.12, 0.16]} />
        <meshStandardMaterial
          color="#94A3B8"
          metalness={0.96}
          roughness={0.22}
        />
      </mesh>

      {/* Front Face: Photorealistic iOS 17 Display (9:41, Dynamic Island, Wallpaper) */}
      <mesh position={[0, 0, 0.082]}>
        <planeGeometry args={[1.48, 3.08]} />
        <meshStandardMaterial
          map={frontTex}
          emissive="#1E293B"
          emissiveIntensity={0.2}
          roughness={0.1}
          metalness={0.1}
        />
      </mesh>

      {/* Back Face: Natural Titanium Frosted Glass with Apple Logo & Triple Camera */}
      <mesh position={[0, 0, -0.082]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[1.48, 3.08]} />
        <meshStandardMaterial
          map={backTex}
          roughness={0.4}
          metalness={0.5}
        />
      </mesh>


      {/* Titanium Side Buttons */}
      {/* Action Button & Volume Rockers (Left) */}
      <mesh position={[-0.77, 0.8, 0]}>
        <boxGeometry args={[0.02, 0.14, 0.04]} />
        <meshStandardMaterial color="#CBD5E1" metalness={0.95} roughness={0.2} />
      </mesh>
      <mesh position={[-0.77, 0.5, 0]}>
        <boxGeometry args={[0.02, 0.22, 0.04]} />
        <meshStandardMaterial color="#CBD5E1" metalness={0.95} roughness={0.2} />
      </mesh>
      <mesh position={[-0.77, 0.2, 0]}>
        <boxGeometry args={[0.02, 0.22, 0.04]} />
        <meshStandardMaterial color="#CBD5E1" metalness={0.95} roughness={0.2} />
      </mesh>

      {/* Power Button (Right) */}
      <mesh position={[0.77, 0.45, 0]}>
        <boxGeometry args={[0.02, 0.35, 0.04]} />
        <meshStandardMaterial color="#CBD5E1" metalness={0.95} roughness={0.2} />
      </mesh>
    </group>
  );
}

/**
 * Photorealistic 3D Graphics Card Model (ROG Strix RTX 4090)
 * Massive heatsink, spinning triple axial fans, and illuminated RGB ROG bar.
 */
function GPU3DModel() {
  const gpuTex = useLoadedTexture('/images/products/rog-strix-rtx-4090.jpg');
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
      {/* Heavy Die-Cast Shroud with Real Graphics Texture */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[3.2, 1.4, 0.58]} />
        <meshStandardMaterial color="#0F172A" metalness={0.9} roughness={0.25} />
      </mesh>

      {/* Front Face Texture */}
      <mesh position={[0, 0, 0.292]}>
        <planeGeometry args={[3.16, 1.36]} />
        <meshStandardMaterial map={gpuTex} roughness={0.3} metalness={0.7} />
      </mesh>

      {/* Triple Axial Fans Overlay */}
      <group position={[-0.95, 0, 0.31]} ref={fan1}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.38, 0.38, 0.03, 24]} />
          <meshStandardMaterial color="#1E293B" metalness={0.8} roughness={0.3} transparent opacity={0.6} />
        </mesh>
      </group>
      <group position={[0, 0, 0.31]} ref={fan2}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.38, 0.38, 0.03, 24]} />
          <meshStandardMaterial color="#1E293B" metalness={0.8} roughness={0.3} transparent opacity={0.6} />
        </mesh>
      </group>
      <group position={[0.95, 0, 0.31]} ref={fan3}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.38, 0.38, 0.03, 24]} />
          <meshStandardMaterial color="#1E293B" metalness={0.8} roughness={0.3} transparent opacity={0.6} />
        </mesh>
      </group>

      {/* Glowing RGB ROG Bar */}
      <mesh position={[0, 0.71, 0.1]}>
        <boxGeometry args={[2.2, 0.04, 0.2]} />
        <meshStandardMaterial color="#EF4444" emissive="#EF4444" emissiveIntensity={2.5} />
      </mesh>

      {/* PCIe Gold Teeth Connector */}
      <mesh position={[0, -0.73, -0.1]}>
        <boxGeometry args={[1.8, 0.06, 0.03]} />
        <meshStandardMaterial color="#F59E0B" metalness={0.95} roughness={0.1} />
      </mesh>
    </group>
  );
}

export const Hero3DCanvas: React.FC<Hero3DCanvasProps> = ({
  productSlug = 'laptop-asus-rog-strix-scar-16',
}) => {
  const reducedMotion = usePrefersReducedMotion();
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  // Determine model type based on product slug/category
  const isPhone = productSlug.includes('iphone') || productSlug.includes('dien-thoai');
  const isGPU = productSlug.includes('rtx') || productSlug.includes('vga');

  return (
    <div className="w-full h-full relative select-none cursor-grab active:cursor-grabbing">
      <Canvas
        camera={{ position: [0, 0, 4.6], fov: 45 }}
        dpr={isMobile ? 1 : [1, 1.5]}
        gl={{
          powerPreference: 'high-performance',
          antialias: true,
          alpha: true,
        }}
        className="w-full h-full"
      >
        <ambientLight intensity={0.7} />
        <directionalLight position={[4, 6, 4]} intensity={1.8} color="#E0E7FF" />
        <directionalLight position={[-4, -3, -4]} intensity={0.6} color="#38BDF8" />
        <pointLight position={[0, 1.5, 2]} intensity={1.2} color="#818CF8" distance={5} />

        <Suspense fallback={null}>
          <Float
            speed={reducedMotion ? 0 : 2}
            rotationIntensity={reducedMotion ? 0 : 0.4}
            floatIntensity={reducedMotion ? 0 : 0.6}
          >
            {isPhone ? <Phone3DModel /> : isGPU ? <GPU3DModel /> : <Laptop3DModel />}
          </Float>
        </Suspense>

        <ContactShadows
          position={[0, -1.8, 0]}
          opacity={0.5}
          scale={5.5}
          blur={2.2}
          far={3.5}
        />

        {/* Free 360° mouse drag interaction */}
        <OrbitControls
          enableZoom={true}
          minDistance={2.5}
          maxDistance={7}
          enablePan={false}
          autoRotate={!reducedMotion}
          autoRotateSpeed={1.2}
        />
      </Canvas>
    </div>
  );
};

export default Hero3DCanvas;
