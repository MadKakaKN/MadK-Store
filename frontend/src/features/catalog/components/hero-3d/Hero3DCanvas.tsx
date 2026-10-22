import React, { useRef, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';
import { usePrefersReducedMotion } from '../../../../hooks/usePrefersReducedMotion';

function TechHologramObject() {
  const reducedMotion = usePrefersReducedMotion();
  const outerRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const coreRef = useRef<THREE.Mesh>(null);

  // Mouse parallax interaction
  const mouse = useRef({ x: 0, y: 0 });

  useFrame((state) => {
    if (reducedMotion) return; // Respect reduced motion preference

    const t = state.clock.getElapsedTime();

    // Smooth floating rotation
    if (outerRef.current) {
      outerRef.current.rotation.x = t * 0.4 + mouse.current.y * 0.2;
      outerRef.current.rotation.y = t * 0.6 + mouse.current.x * 0.3;
    }

    if (ringRef.current) {
      ringRef.current.rotation.z = -t * 0.5;
      ringRef.current.rotation.x = Math.PI / 4 + Math.sin(t * 0.5) * 0.15;
    }

    if (coreRef.current) {
      coreRef.current.rotation.y = -t * 0.8;
      const scale = 1 + Math.sin(t * 2) * 0.08;
      coreRef.current.scale.set(scale, scale, scale);
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
        speed={reducedMotion ? 0 : 2}
        rotationIntensity={reducedMotion ? 0 : 0.6}
        floatIntensity={reducedMotion ? 0 : 0.8}
      >
        {/* Outer Faceted Tech Polyhedron (Glassy Blue Titanium) */}
        <mesh ref={outerRef} castShadow receiveShadow>
          <icosahedronGeometry args={[1.3, 0]} />
          <meshStandardMaterial
            color="#38BDF8"
            emissive="#0284C7"
            emissiveIntensity={0.25}
            metalness={0.9}
            roughness={0.15}
            wireframe={false}
          />
        </mesh>

        {/* Wireframe Outline Cage */}
        <mesh>
          <icosahedronGeometry args={[1.34, 0]} />
          <meshBasicMaterial
            color="#60A5FA"
            wireframe
            transparent
            opacity={0.35}
          />
        </mesh>

        {/* Inner Glowing Energy Core */}
        <mesh ref={coreRef}>
          <octahedronGeometry args={[0.65, 0]} />
          <meshStandardMaterial
            color="#A855F7"
            emissive="#9333EA"
            emissiveIntensity={1.8}
            roughness={0.2}
          />
        </mesh>

        {/* Orbital Futuristic Tech Ring */}
        <mesh ref={ringRef} rotation={[Math.PI / 4, 0, 0]}>
          <torusGeometry args={[2.0, 0.04, 16, 64]} />
          <meshStandardMaterial
            color="#818CF8"
            emissive="#6366F1"
            emissiveIntensity={0.6}
            metalness={0.95}
            roughness={0.1}
          />
        </mesh>
      </Float>
    </group>
  );
}

export const Hero3DCanvas: React.FC = () => {
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  return (
    <div className="w-full h-full relative select-none">
      <Canvas
        camera={{ position: [0, 0, 4.8], fov: 45 }}
        dpr={isMobile ? 1 : [1, 1.5]}
        gl={{
          powerPreference: 'high-performance',
          antialias: true,
          alpha: true,
        }}
        className="w-full h-full"
      >
        <ambientLight intensity={0.6} />
        <directionalLight position={[4, 6, 4]} intensity={1.5} color="#E0E7FF" />
        <directionalLight position={[-4, -3, -4]} intensity={0.4} color="#C084FC" />
        <pointLight position={[0, 0, 0]} intensity={1.0} color="#38BDF8" distance={4} />

        <Suspense fallback={null}>
          <TechHologramObject />
        </Suspense>

        <ContactShadows
          position={[0, -2.1, 0]}
          opacity={0.4}
          scale={5.5}
          blur={2.0}
          far={3.5}
        />
      </Canvas>
    </div>
  );
};

export default Hero3DCanvas;
