import React, { useRef, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';
import { usePrefersReducedMotion } from '../../../hooks/usePrefersReducedMotion';

function LostCompassObject() {
  const reducedMotion = usePrefersReducedMotion();
  const ring1Ref = useRef<THREE.Mesh>(null);
  const ring2Ref = useRef<THREE.Mesh>(null);
  const crystalRef = useRef<THREE.Mesh>(null);
  const mouse = useRef({ x: 0, y: 0 });

  useFrame((state) => {
    if (reducedMotion) return;

    const t = state.clock.getElapsedTime();

    // Outer gyro ring rotating slowly
    if (ring1Ref.current) {
      ring1Ref.current.rotation.x = t * 0.4 + mouse.current.y * 0.2;
      ring1Ref.current.rotation.y = t * 0.5 + mouse.current.x * 0.25;
    }

    // Inner gyro ring rotating at counter speed
    if (ring2Ref.current) {
      ring2Ref.current.rotation.y = -t * 0.6;
      ring2Ref.current.rotation.z = Math.sin(t * 0.4) * 0.3;
    }

    // Central pulsing 404 crystal core
    if (crystalRef.current) {
      crystalRef.current.rotation.y = t * 0.8;
      crystalRef.current.rotation.x = -t * 0.3;
      const s = 1 + Math.sin(t * 2.5) * 0.08;
      crystalRef.current.scale.set(s, s, s);
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
        rotationIntensity={reducedMotion ? 0 : 0.5}
        floatIntensity={reducedMotion ? 0 : 0.7}
      >
        {/* Outer Orbit Gyro Ring */}
        <mesh ref={ring1Ref}>
          <torusGeometry args={[1.6, 0.05, 16, 64]} />
          <meshStandardMaterial
            color="#6366F1"
            emissive="#4F46E5"
            emissiveIntensity={0.5}
            metalness={0.9}
            roughness={0.2}
          />
        </mesh>

        {/* Inner Gyro Ring (Rose/Amber Accent) */}
        <mesh ref={ring2Ref} rotation={[Math.PI / 3, 0, 0]}>
          <torusGeometry args={[1.2, 0.04, 16, 64]} />
          <meshStandardMaterial
            color="#F43F5E"
            emissive="#E11D48"
            emissiveIntensity={0.4}
            metalness={0.85}
            roughness={0.25}
          />
        </mesh>

        {/* Floating Faceted Crystal Core */}
        <mesh ref={crystalRef} castShadow>
          <octahedronGeometry args={[0.7, 0]} />
          <meshStandardMaterial
            color="#818CF8"
            emissive="#6366F1"
            emissiveIntensity={1.2}
            roughness={0.15}
            metalness={0.9}
          />
        </mesh>

        {/* Translucent Wireframe Envelope */}
        <mesh>
          <octahedronGeometry args={[0.74, 0]} />
          <meshBasicMaterial
            color="#C7D2FE"
            wireframe
            transparent
            opacity={0.3}
          />
        </mesh>

        {/* Floating Lost Satellite Orb 1 */}
        <mesh position={[1.3, 0.8, -0.4]}>
          <sphereGeometry args={[0.09, 16, 16]} />
          <meshStandardMaterial
            color="#38BDF8"
            emissive="#0284C7"
            emissiveIntensity={0.9}
          />
        </mesh>

        {/* Floating Lost Satellite Orb 2 */}
        <mesh position={[-1.2, -0.6, 0.5]}>
          <sphereGeometry args={[0.07, 16, 16]} />
          <meshStandardMaterial
            color="#FB7185"
            emissive="#E11D48"
            emissiveIntensity={0.9}
          />
        </mesh>
      </Float>
    </group>
  );
}

export const NotFound3DCanvas: React.FC = () => {
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  return (
    <div className="w-full h-full relative select-none">
      <Canvas
        camera={{ position: [0, 0, 4.2], fov: 45 }}
        dpr={isMobile ? 1 : [1, 1.5]}
        gl={{
          powerPreference: 'high-performance',
          antialias: true,
          alpha: true,
        }}
        className="w-full h-full"
      >
        <ambientLight intensity={0.6} />
        <directionalLight position={[4, 5, 4]} intensity={1.5} color="#E0E7FF" />
        <directionalLight position={[-4, -3, -3]} intensity={0.5} color="#FDA4AF" />
        <pointLight position={[0, 0, 0]} intensity={1.2} color="#6366F1" distance={4} />

        <Suspense fallback={null}>
          <LostCompassObject />
        </Suspense>

        <ContactShadows
          position={[0, -1.8, 0]}
          opacity={0.35}
          scale={4.5}
          blur={2.0}
          far={3.0}
        />
      </Canvas>
    </div>
  );
};

export default NotFound3DCanvas;
