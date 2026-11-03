import React, { useMemo, useEffect } from 'react';
import { useGLTF, Center } from '@react-three/drei';
import * as THREE from 'three';

interface GLBModelRendererProps {
  url: string;
  variantColor: string;
  wireframe?: boolean;
  onLoaded?: () => void;
}

export const GLBModelRenderer: React.FC<GLBModelRendererProps> = ({
  url,
  variantColor,
  wireframe = false,
  onLoaded,
}) => {
  const gltf = useGLTF(url);

  // Deep-clone the scene so that runtime material/color changes don't corrupt cached assets
  const { clonedScene, normalizedScale } = useMemo(() => {
    const clone = gltf.scene.clone(true);

    // Compute bounding box to normalize model dimensions to fit the 3D viewport nicely
    const bbox = new THREE.Box3().setFromObject(clone);
    const size = new THREE.Vector3();
    bbox.getSize(size);
    const maxDim = Math.max(size.x, size.y, size.z);
    // Ideal bounding diameter in Three.js viewport is ~2.3
    const normalizedScale = maxDim > 0 ? 2.3 / maxDim : 1;

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

    return { clonedScene: clone, normalizedScale };
  }, [gltf.scene]);

  useEffect(() => {
    onLoaded?.();
  }, [onLoaded]);

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
    <Center position={[0, -0.1, 0]}>
      <primitive object={clonedScene} scale={normalizedScale} />
    </Center>
  );
};

export default GLBModelRenderer;
