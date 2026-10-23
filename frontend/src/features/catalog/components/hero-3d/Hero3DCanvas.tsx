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
 * High-fidelity 3D Gaming Laptop Model (ROG Strix SCAR 16)
 * Complete with open chassis, RGB front bar, backlit keyboard, touchpad,
 * and illuminated gaming screen with rear ROG Eye logo.
 */
function Laptop3DModel() {
  const rgbBarRef = useRef<THREE.Mesh>(null);

  // Dynamic RGB cycling
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
        <meshStandardMaterial color="#020617" roughness={0.6} />
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
          <planeGeometry args={[0.5, 0.4]} />
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

        {/* High-Refresh Glowing Gaming Screen */}
        <mesh position={[0, 1.05, 0.048]}>
          <planeGeometry args={[3.04, 1.94]} />
          <meshStandardMaterial
            color="#0284C7"
            emissive="#0369A1"
            emissiveIntensity={0.65}
            roughness={0.1}
          />
        </mesh>

        {/* ROG Strix Wallpaper Accent inside display */}
        <mesh position={[0, 1.05, 0.05]}>
          <planeGeometry args={[1.2, 0.8]} />
          <meshBasicMaterial color="#38BDF8" transparent opacity={0.7} />
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
 * High-fidelity 3D Smartphone Model (iPhone 15 Pro Max)
 * Titanium frame, Dynamic Island screen, and Triple Camera island.
 */
function Phone3DModel() {
  return (
    <group position={[0, 0, 0]} rotation={[0.2, -0.3, 0]}>
      {/* Titanium Body Shell */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[1.5, 3.1, 0.18]} />
        <meshStandardMaterial color="#64748B" metalness={0.95} roughness={0.2} />
      </mesh>

      {/* Front Glass Screen */}
      <mesh position={[0, 0, 0.092]}>
        <planeGeometry args={[1.42, 3.02]} />
        <meshStandardMaterial
          color="#0f172a"
          emissive="#1e1b4b"
          emissiveIntensity={0.6}
          roughness={0.08}
        />
      </mesh>

      {/* Screen Wallpaper Glow */}
      <mesh position={[0, 0, 0.093]}>
        <planeGeometry args={[1.2, 2.4]} />
        <meshBasicMaterial color="#38BDF8" transparent opacity={0.4} />
      </mesh>

      {/* Dynamic Island Pill */}
      <mesh position={[0, 1.22, 0.095]}>
        <planeGeometry args={[0.38, 0.1]} />
        <meshBasicMaterial color="#000000" />
      </mesh>

      {/* Back Glass Panel */}
      <mesh position={[0, 0, -0.092]}>
        <planeGeometry args={[1.44, 3.04]} />
        <meshStandardMaterial color="#334155" roughness={0.4} metalness={0.6} />
      </mesh>

      {/* Camera Bump Plateau */}
      <mesh position={[-0.32, 0.92, -0.13]}>
        <boxGeometry args={[0.68, 0.78, 0.08]} />
        <meshStandardMaterial color="#475569" metalness={0.8} roughness={0.3} />
      </mesh>

      {/* 3 Camera Lenses with Metallic Rings */}
      <mesh position={[-0.46, 1.08, -0.18]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.13, 0.13, 0.04, 24]} />
        <meshStandardMaterial color="#020617" metalness={0.95} roughness={0.1} />
      </mesh>
      <mesh position={[-0.46, 0.76, -0.18]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.13, 0.13, 0.04, 24]} />
        <meshStandardMaterial color="#020617" metalness={0.95} roughness={0.1} />
      </mesh>
      <mesh position={[-0.18, 0.92, -0.18]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.13, 0.13, 0.04, 24]} />
        <meshStandardMaterial color="#020617" metalness={0.95} roughness={0.1} />
      </mesh>
    </group>
  );
}

/**
 * High-fidelity 3D Graphics Card Model (ROG Strix RTX 4090)
 * Massive heatsink, spinning triple axial fans, and illuminated RGB ROG bar.
 */
function GPU3DModel() {
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
        <meshStandardMaterial color="#0F172A" metalness={0.9} roughness={0.25} />
      </mesh>

      {/* Heatsink Fin Stack */}
      <mesh position={[0, 0, -0.05]}>
        <boxGeometry args={[3.1, 1.3, 0.45]} />
        <meshStandardMaterial color="#64748B" metalness={0.95} roughness={0.2} />
      </mesh>

      {/* Triple Axial Fans */}
      <group position={[-0.95, 0, 0.3]} ref={fan1}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.42, 0.42, 0.04, 24]} />
          <meshStandardMaterial color="#1E293B" metalness={0.8} roughness={0.3} />
        </mesh>
      </group>
      <group position={[0, 0, 0.3]} ref={fan2}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.42, 0.42, 0.04, 24]} />
          <meshStandardMaterial color="#1E293B" metalness={0.8} roughness={0.3} />
        </mesh>
      </group>
      <group position={[0.95, 0, 0.3]} ref={fan3}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.42, 0.42, 0.04, 24]} />
          <meshStandardMaterial color="#1E293B" metalness={0.8} roughness={0.3} />
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
