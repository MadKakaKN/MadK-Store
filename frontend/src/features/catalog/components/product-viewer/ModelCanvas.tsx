import React, { Suspense, Component, ErrorInfo, ReactNode } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, ContactShadows, Environment, Html, useProgress } from '@react-three/drei';
import GLBModelRenderer from './GLBModelRenderer';
import ProceduralTechModel from './ProceduralTechModel';

function CanvasLoader() {
  const { progress } = useProgress();
  return (
    <Html center>
      <div className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-slate-900/85 backdrop-blur-md border border-slate-700/60 text-white shadow-2xl select-none">
        <div className="w-6 h-6 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
        <span className="text-[11px] font-mono font-bold tracking-wider text-indigo-300">
          {progress > 0 ? `${progress.toFixed(0)}%` : 'Đang tải 3D...'}
        </span>
      </div>
    </Html>
  );
}

interface ErrorBoundaryProps {
  fallback: ReactNode;
  onError?: (error: Error) => void;
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

class CanvasErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.warn('3D GLB Load Error, falling back to Procedural Model:', error, errorInfo);
    this.props.onError?.(error);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

interface ModelCanvasProps {
  modelUrl?: string;
  variantColor: string;
  wireframe: boolean;
  autoRotate: boolean;
  maxDpr: number;
  controlsRef: React.ComponentProps<typeof OrbitControls>['ref'];
  onModelSourceChange?: (source: 'custom_glb' | 'sample_glb' | 'procedural') => void;
}

export const ModelCanvas: React.FC<ModelCanvasProps> = ({
  modelUrl,
  variantColor,
  wireframe,
  autoRotate,
  maxDpr,
  controlsRef,
  onModelSourceChange,
}) => {
  // If modelUrl is a relative path or sample path, use it.
  // If no modelUrl is specified, or if remote fails, CanvasErrorBoundary seamlessly renders ProceduralTechModel.
  const hasGlbUrl = Boolean(modelUrl && modelUrl.trim().length > 0);

  return (
    <Canvas
      shadows
      dpr={maxDpr}
      camera={{ position: [0, 1.8, 3.6], fov: 45 }}
      gl={{
        powerPreference: 'high-performance',
        antialias: true,
        alpha: true,
      }}
      className="w-full h-full cursor-grab active:cursor-grabbing"
    >
      {/* Dynamic Lighting Setup */}
      <ambientLight intensity={0.7} />
      <directionalLight
        position={[5, 8, 5]}
        intensity={1.2}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-far={20}
        shadow-camera-left={-4}
        shadow-camera-right={4}
        shadow-camera-top={4}
        shadow-camera-bottom={-4}
      />
      <directionalLight position={[-5, 4, -4]} intensity={0.5} />
      <hemisphereLight intensity={0.35} groundColor="#0f172a" />

      {/* Orbit Interaction Controls */}
      <OrbitControls
        ref={controlsRef}
        makeDefault
        enablePan={false}
        enableZoom={true}
        minDistance={1.2}
        maxDistance={6.5}
        autoRotate={autoRotate}
        autoRotateSpeed={1.8}
        enableDamping
        dampingFactor={0.06}
        maxPolarAngle={Math.PI / 2 + 0.05}
      />

      {/* Model Loading with Error Fallback */}
      <Suspense fallback={<CanvasLoader />}>
        {hasGlbUrl ? (
          <CanvasErrorBoundary
            onError={() => onModelSourceChange?.('procedural')}
            fallback={
              <ProceduralTechModel
                variantColor={variantColor}
                wireframe={wireframe}
              />
            }
          >
            <GLBModelRenderer
              url={modelUrl!}
              variantColor={variantColor}
              wireframe={wireframe}
            />
          </CanvasErrorBoundary>
        ) : (
          <ProceduralTechModel
            variantColor={variantColor}
            wireframe={wireframe}
          />
        )}
      </Suspense>

      {/* Studio Floor Contact Shadow */}
      <ContactShadows
        position={[0, -0.65, 0]}
        opacity={0.65}
        scale={6}
        blur={1.6}
        far={3}
      />

      {/* Subtle Environment reflections */}
      <Environment preset="city" />
    </Canvas>
  );
};

export default ModelCanvas;
