import React, { useMemo, useEffect } from 'react';
import { useGLTF, Center } from '@react-three/drei';
import * as THREE from 'three';

interface GLBModelRendererProps {
  url: string;
  variantColor: string;
  wireframe?: boolean;
}

export const GLBModelRenderer: React.FC<GLBModelRendererProps> = ({
  url,
  variantColor,
  wireframe = false,
}) => {
  const gltf = useGLTF(url);

  // Deep-clone the scene so that runtime material/color changes don't corrupt cached assets
  const clonedScene = useMemo(() => {
    const clone = gltf.scene.clone(true);

    // Ensure cloned materials are independent instances
    clone.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.castShadow = true;
        mesh.receiveShadow = true;

        if (Array.isArray(mesh.material)) {
          mesh.material = mesh.material.map((m) => m.clone());
        } else if (mesh.material) {
          mesh.material = mesh.material.clone();
        }
      }
    });

    return clone;
  }, [gltf.scene]);

  // Apply color mapping and wireframe whenever variantColor or wireframe changes
  useEffect(() => {
    if (!clonedScene) return;

    const targetColor = new THREE.Color(variantColor);

    clonedScene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];

        materials.forEach((mat) => {
          if (mat instanceof THREE.MeshStandardMaterial || mat instanceof THREE.MeshPhysicalMaterial || mat instanceof THREE.MeshBasicMaterial) {
            mat.wireframe = wireframe;

            // Target body/housing/primary materials for color mapping
            const matName = (mat.name || '').toLowerCase();
            const meshName = (mesh.name || '').toLowerCase();

            const isAccentOrGlass =
              matName.includes('glass') ||
              matName.includes('lens') ||
              matName.includes('screen') ||
              matName.includes('led') ||
              matName.includes('emitter') ||
              meshName.includes('glass') ||
              meshName.includes('screen');

            if (!isAccentOrGlass) {
              // Smoothly apply variant color
              mat.color.copy(targetColor);
              mat.needsUpdate = true;
            }
          }
        });
      }
    });
  }, [clonedScene, variantColor, wireframe]);

  return (
    <Center top>
      <primitive object={clonedScene} />
    </Center>
  );
};

export default GLBModelRenderer;
