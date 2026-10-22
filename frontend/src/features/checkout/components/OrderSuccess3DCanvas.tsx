import React, { useRef, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';
import { usePrefersReducedMotion } from '../../../hooks/usePrefersReducedMotion';

function CelebratoryGiftBox() {
  const reducedMotion = usePrefersReducedMotion();
  const boxGroupRef = useRef<THREE.Group>(null);
  const ribbonTopRef = useRef<THREE.Mesh>(null);
  const mouse = useRef({ x: 0, y: 0 });

  useFrame((state) => {
    if (reducedMotion) return;

    const t = state.clock.getElapsedTime();

    if (boxGroupRef.current) {
      // Gentle rocking and subtle mouse tilt
      boxGroupRef.current.rotation.y = t * 0.5 + mouse.current.x * 0.3;
      boxGroupRef.current.rotation.x = Math.sin(t * 0.8) * 0.08 + mouse.current.y * 0.2;
    }

    if (ribbonTopRef.current) {
      ribbonTopRef.current.rotation.y = -t * 1.2;
      const s = 1 + Math.sin(t * 3) * 0.06;
      ribbonTopRef.current.scale.set(s, s, s);
    }
  });

  return (
    <group
      onPointerMove={(e) => {
        if (!reducedMotion) {
          mouse.current.x = (e.clientX / window.innerWidth) * 2 - 1;
          mouse.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
        }
      }}
    >
      <Float
        speed={reducedMotion ? 0 : 2.5}
        rotationIntensity={reducedMotion ? 0 : 0.4}
        floatIntensity={reducedMotion ? 0 : 0.6}
      >
        <group ref={boxGroupRef} position={[0, 0.2, 0]}>
          {/* Main Parcel Box Body (Emerald & Teal gradient feel) */}
          <mesh castShadow receiveShadow>
            <boxGeometry args={[1.5, 1.3, 1.5]} />
            <meshStandardMaterial
              color="#059669"
              roughness={0.25}
              metalness={0.3}
              emissive="#047857"
              emissiveIntensity={0.2}
            />
          </mesh>

          {/* Golden Ribbon Band 1 (Z-axis wrap) */}
          <mesh castShadow>
            <boxGeometry args={[1.52, 1.32, 0.32]} />
            <meshStandardMaterial
              color="#F59E0B"
              metalness={0.8}
              roughness={0.2}
              emissive="#D97706"
              emissiveIntensity={0.3}
            />
          </mesh>

          {/* Golden Ribbon Band 2 (X-axis wrap) */}
          <mesh castShadow>
            <boxGeometry args={[0.32, 1.32, 1.52]} />
            <meshStandardMaterial
              color="#F59E0B"
              metalness={0.8}
              roughness={0.2}
              emissive="#D97706"
              emissiveIntensity={0.3}
            />
          </mesh>

          {/* Sparkling Top Bow Knot (Faceted Gem) */}
          <mesh ref={ribbonTopRef} position={[0, 0.85, 0]} castShadow>
            <octahedronGeometry args={[0.35, 0]} />
            <meshStandardMaterial
              color="#FBBF24"
              emissive="#F59E0B"
              emissiveIntensity={0.7}
              metalness={0.9}
              roughness={0.1}
            />
          </mesh>

          {/* Tiny orbital confetti star 1 */}
          <mesh position={[1.1, 0.5, 0.4]}>
            <octahedronGeometry args={[0.12, 0]} />
            <meshStandardMaterial color="#34D399" emissive="#10B981" emissiveIntensity={0.8} />
          </mesh>

          {/* Tiny orbital confetti star 2 */}
          <mesh position={[-1.0, 0.7, -0.3]}>
            <octahedronGeometry args={[0.14, 0]} />
            <meshStandardMaterial color="#FBBF24" emissive="#F59E0B" emissiveIntensity={0.8} />
          </mesh>
        </group>
      </Float>
    </group>
  );
}

export const OrderSuccess3DCanvas: React.FC = () => {
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  return (
    <div className="w-full h-full relative select-none cursor-grab active:cursor-grabbing">
      <Canvas
        camera={{ position: [0, 1.5, 3.8], fov: 42 }}
        dpr={isMobile ? 1 : [1, 1.5]}
        gl={{
          powerPreference: 'high-performance',
          antialias: true,
          alpha: true,
        }}
        className="w-full h-full"
      >
        <ambientLight intensity={0.7} />
        <directionalLight position={[4, 6, 3]} intensity={1.6} color="#FFFFFF" />
        <directionalLight position={[-4, 2, -2]} intensity={0.5} color="#A7F3D0" />
        <pointLight position={[0, 1.5, 0]} intensity={0.8} color="#FBBF24" distance={3} />

        <Suspense fallback={null}>
          <CelebratoryGiftBox />
        </Suspense>

        <ContactShadows
          position={[0, -1.0, 0]}
          opacity={0.35}
          scale={3.5}
          blur={2.0}
          far={2.5}
        />
      </Canvas>
    </div>
  );
};

export default OrderSuccess3DCanvas;
