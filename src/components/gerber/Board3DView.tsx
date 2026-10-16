import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { RefreshCw } from 'lucide-react';
import { buildBoardMesh } from '../../utils/gerber/board3d';
import type { RenderedBoard } from '../../utils/gerber/stackup';

export type CameraPreset = 'iso' | 'top' | 'bottom';

interface Board3DViewProps {
  board: RenderedBoard;
  thicknessMm: number;
  edgeColor: string;
  preset: CameraPreset;
  /** Tăng số này để đặt lại camera về preset hiện tại */
  resetKey: number;
}

interface SceneState {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  controls: OrbitControls;
  boardW: number;
  boardH: number;
}

function placeCamera(s: SceneState, preset: CameraPreset) {
  // Khoảng cách để cả bo lọt khung theo cả chiều dọc và chiều ngang của viewport
  const halfTan = Math.tan(THREE.MathUtils.degToRad(s.camera.fov) / 2);
  const d = Math.max(s.boardH / (2 * halfTan), s.boardW / (2 * halfTan * s.camera.aspect)) * 1.2;
  const iso = new THREE.Vector3(0.35, 0.75, 0.75).normalize().multiplyScalar(d * 1.1);
  // Lệch z rất nhỏ để OrbitControls xác định hướng: cạnh trên bo (Gerber +Y = thế giới -Z) luôn ở phía trên màn hình
  const pos =
    preset === 'top' ? new THREE.Vector3(0, d, d * 1e-3) :
    preset === 'bottom' ? new THREE.Vector3(0, -d, -d * 1e-3) :
    iso;
  s.camera.position.copy(pos);
  s.camera.up.set(0, 1, 0);
  s.controls.target.set(0, 0, 0);
  s.controls.update();
}

export const Board3DView: React.FC<Board3DViewProps> = ({ board, thicknessMm, edgeColor, preset, resetKey }) => {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const stateRef = useRef<SceneState | null>(null);
  const [isBuilding, setIsBuilding] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Khởi tạo renderer / scene một lần
  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    } catch {
      setError('Trình duyệt không hỗ trợ WebGL nên không thể hiển thị 3D.');
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    host.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const pmrem = new THREE.PMREMGenerator(renderer);
    const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = envTex;
    scene.environmentIntensity = 0.6;

    const sun = new THREE.DirectionalLight(0xffffff, 1.6);
    sun.position.set(60, 120, 80);
    const fill = new THREE.DirectionalLight(0xffffff, 0.9);
    fill.position.set(-40, -100, -60);
    scene.add(sun, fill, new THREE.AmbientLight(0xffffff, 0.35));

    const camera = new THREE.PerspectiveCamera(35, 1, 0.5, 5000);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;

    const state: SceneState = { renderer, scene, camera, controls, boardW: 100, boardH: 100 };
    stateRef.current = state;

    const resize = () => {
      const w = host.clientWidth || 1;
      const h = host.clientHeight || 1;
      renderer.setSize(w, h, false);
      renderer.domElement.style.width = '100%';
      renderer.domElement.style.height = '100%';
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(host);

    renderer.setAnimationLoop(() => {
      controls.update();
      renderer.render(scene, camera);
    });

    return () => {
      ro.disconnect();
      renderer.setAnimationLoop(null);
      controls.dispose();
      envTex.dispose();
      pmrem.dispose();
      renderer.dispose();
      renderer.domElement.remove();
      stateRef.current = null;
    };
  }, []);

  // Dựng lại khối bo khi dữ liệu / độ dày / màu cạnh thay đổi
  useEffect(() => {
    const s = stateRef.current;
    if (!s) return;
    let cancelled = false;
    let built: Awaited<ReturnType<typeof buildBoardMesh>> | null = null;
    setIsBuilding(true);
    setError(null);

    buildBoardMesh(board, s.renderer, { thicknessMm, edgeColor })
      .then(result => {
        if (cancelled) return result.dispose();
        built = result;
        const isFirst = s.scene.getObjectByName('board') === undefined;
        result.group.name = 'board';
        s.scene.add(result.group);
        s.boardW = result.widthMm;
        s.boardH = result.heightMm;
        if (isFirst) placeCamera(s, preset);
      })
      .catch(err => !cancelled && setError(`Không dựng được mô hình 3D: ${err?.message || err}`))
      .finally(() => !cancelled && setIsBuilding(false));

    return () => {
      cancelled = true;
      if (built) {
        s.scene.remove(built.group);
        built.dispose();
      }
    };
    // preset chỉ áp dụng lần đầu; đổi góc nhìn do effect bên dưới xử lý
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [board, thicknessMm, edgeColor]);

  useEffect(() => {
    if (stateRef.current) placeCamera(stateRef.current, preset);
  }, [preset, resetKey]);

  return (
    <div className="relative w-full h-full">
      <div ref={hostRef} className="absolute inset-0 cursor-grab active:cursor-grabbing" />
      {isBuilding && !error && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-900/80 text-cyan-300 text-xs font-mono">
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span>Đang dựng mô hình 3D...</span>
          </div>
        </div>
      )}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center p-6">
          <div className="px-4 py-3 rounded-lg bg-red-950/90 border border-red-500/60 text-red-200 text-xs font-mono">{error}</div>
        </div>
      )}
    </div>
  );
};
