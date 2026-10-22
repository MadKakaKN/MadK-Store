import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Center } from '@react-three/drei';
import * as THREE from 'three';

interface ProceduralTechModelProps {
  variantColor: string;
  wireframe?: boolean;
}

/**
 * Procedural 3D Mechanical Keyboard / Tech Gadget model
 * Built with native Three.js geometries for instant, zero-latency 3D demonstration
 * when no custom GLB file has been uploaded yet.
 */
export const ProceduralTechModel: React.FC<ProceduralTechModelProps> = ({
  variantColor,
  wireframe = false,
}) => {
  const groupRef = useRef<THREE.Group>(null);

  // Subtle floating idle motion
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 1.5) * 0.04;
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.05;
    }
  });

  const parsedColor = useMemo(() => new THREE.Color(variantColor), [variantColor]);
  const accentColor = useMemo(() => {
    const hsl = { h: 0, s: 0, l: 0 };
    parsedColor.getHSL(hsl);
    return new THREE.Color().setHSL((hsl.h + 0.5) % 1, 0.8, 0.5); // Complimentary accent
  }, [parsedColor]);

  // Keycap grid positions
  const keycaps = useMemo(() => {
    const keys: { x: number; z: number; width: number; isAccent: boolean }[] = [];
    const rows = 5;
    const cols = 12;
    const spacing = 0.22;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        // Create realistic spacebar on bottom row
        if (r === 4 && c >= 3 && c <= 8) {
          if (c === 3) {
            keys.push({
              x: 0,
              z: (r - 2) * spacing,
              width: spacing * 5.8,
              isAccent: true,
            });
          }
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
    <Center top>
      <group ref={groupRef} rotation={[0.25, -0.4, 0]}>
        {/* Main Base Case (Chassis) */}
        <mesh position={[0, 0, 0]} castShadow receiveShadow>
          <boxGeometry args={[3.0, 0.22, 1.45]} />
          <meshStandardMaterial
            color={parsedColor}
            metalness={0.8}
            roughness={0.25}
            wireframe={wireframe}
          />
        </mesh>

        {/* Chamfered Bottom Weight Plate */}
        <mesh position={[0, -0.12, 0]} castShadow receiveShadow>
          <boxGeometry args={[2.7, 0.05, 1.2]} />
          <meshStandardMaterial
            color="#D4AF37" // Brass weight plate
            metalness={0.95}
            roughness={0.15}
            wireframe={wireframe}
          />
        </mesh>

        {/* Switch Mounting Plate */}
        <mesh position={[0, 0.12, 0]} receiveShadow>
          <boxGeometry args={[2.85, 0.04, 1.3]} />
          <meshStandardMaterial
            color="#0F172A"
            metalness={0.4}
            roughness={0.6}
            wireframe={wireframe}
          />
        </mesh>

        {/* RGB Underglow Diffuser Strip */}
        <mesh position={[0, -0.05, 0]}>
          <boxGeometry args={[3.02, 0.04, 1.47]} />
          <meshStandardMaterial
            color={accentColor}
            emissive={accentColor}
            emissiveIntensity={0.8}
            transparent
            opacity={0.85}
            wireframe={wireframe}
          />
        </mesh>

        {/* Keycaps Grid */}
        <group position={[0, 0.18, 0]}>
          {keycaps.map((k, idx) => (
            <mesh key={idx} position={[k.x, 0, k.z]} castShadow receiveShadow>
              <boxGeometry args={[k.width, 0.14, 0.18]} />
              <meshStandardMaterial
                color={k.isAccent ? accentColor : '#F8FAFC'}
                roughness={0.4}
                metalness={0.1}
                wireframe={wireframe}
              />
            </mesh>
          ))}
        </group>

        {/* Metallic Rotary Volume Knob (Top Right) */}
        <mesh position={[1.25, 0.24, -0.45]} castShadow receiveShadow>
          <cylinderGeometry args={[0.1, 0.1, 0.18, 24]} />
          <meshStandardMaterial
            color="#E2E8F0"
            metalness={0.9}
            roughness={0.2}
            wireframe={wireframe}
          />
        </mesh>
      </group>
    </Center>
  );
};

export default ProceduralTechModel;
