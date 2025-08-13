import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface FloatingGeometryProps {
  containerRef: React.RefObject<HTMLDivElement>;
}

const FloatingGeometry: React.FC<FloatingGeometryProps> = ({ containerRef }) => {
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const animationIdRef = useRef<number | null>(null);
  const geometriesRef = useRef<THREE.Mesh[]>([]);

  useEffect(() => {
    if (!containerRef.current) return;

    // 创建场景
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // 创建相机
    const camera = new THREE.PerspectiveCamera(
      75,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.z = 15;

    // 创建渲染器
    const renderer = new THREE.WebGLRenderer({ 
      alpha: true,
      antialias: true 
    });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.setClearColor(0x000000, 0);
    rendererRef.current = renderer;

    // 设置canvas样式，确保不影响布局
    renderer.domElement.style.position = 'absolute';
    renderer.domElement.style.top = '0';
    renderer.domElement.style.left = '0';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.pointerEvents = 'none';
    renderer.domElement.style.zIndex = '0';

    containerRef.current.appendChild(renderer.domElement);

    // 创建浮动几何体 - 减少数量，优化布局
    const geometries: THREE.Mesh[] = [];
    
    // 立方体 - 左侧
    const cubeGeometry = new THREE.BoxGeometry(1.5, 1.5, 1.5);
    const cubeMaterial = new THREE.MeshPhongMaterial({
      color: 0x667eea,
      transparent: true,
      opacity: 0.4,
      wireframe: true
    });
    const cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
    cube.position.set(-12, 2, 0);
    cube.userData = {
      rotationSpeed: { x: 0.008, y: 0.015, z: 0.003 },
      floatSpeed: 0.015,
      floatAmplitude: 1.5
    };
    scene.add(cube);
    geometries.push(cube);

    // 球体 - 右侧
    const sphereGeometry = new THREE.SphereGeometry(1.2, 24, 24);
    const sphereMaterial = new THREE.MeshPhongMaterial({
      color: 0x764ba2,
      transparent: true,
      opacity: 0.3
    });
    const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
    sphere.position.set(12, -2, 0);
    sphere.userData = {
      rotationSpeed: { x: 0.003, y: 0.008, z: 0.012 },
      floatSpeed: 0.012,
      floatAmplitude: 1.2
    };
    scene.add(sphere);
    geometries.push(sphere);

    // 八面体 - 上方
    const octahedronGeometry = new THREE.OctahedronGeometry(1);
    const octahedronMaterial = new THREE.MeshPhongMaterial({
      color: 0x667eea,
      transparent: true,
      opacity: 0.5,
      wireframe: true
    });
    const octahedron = new THREE.Mesh(octahedronGeometry, octahedronMaterial);
    octahedron.position.set(0, 8, 0);
    octahedron.userData = {
      rotationSpeed: { x: 0.015, y: 0.003, z: 0.008 },
      floatSpeed: 0.018,
      floatAmplitude: 0.8
    };
    scene.add(octahedron);
    geometries.push(octahedron);

    // 四面体 - 下方
    const tetrahedronGeometry = new THREE.TetrahedronGeometry(0.8);
    const tetrahedronMaterial = new THREE.MeshPhongMaterial({
      color: 0x764ba2,
      transparent: true,
      opacity: 0.4
    });
    const tetrahedron = new THREE.Mesh(tetrahedronGeometry, tetrahedronMaterial);
    tetrahedron.position.set(0, -8, 0);
    tetrahedron.userData = {
      rotationSpeed: { x: 0.012, y: 0.015, z: 0.003 },
      floatSpeed: 0.014,
      floatAmplitude: 1
    };
    scene.add(tetrahedron);
    geometries.push(tetrahedron);

    // 圆环 - 左上角
    const torusGeometry = new THREE.TorusGeometry(1.2, 0.4, 12, 80);
    const torusMaterial = new THREE.MeshPhongMaterial({
      color: 0x667eea,
      transparent: true,
      opacity: 0.3,
      wireframe: true
    });
    const torus = new THREE.Mesh(torusGeometry, torusMaterial);
    torus.position.set(-8, 6, 0);
    torus.userData = {
      rotationSpeed: { x: 0.008, y: 0.012, z: 0.015 },
      floatSpeed: 0.016,
      floatAmplitude: 1.3
    };
    scene.add(torus);
    geometries.push(torus);

    // 十二面体 - 右下角
    const dodecahedronGeometry = new THREE.DodecahedronGeometry(1);
    const dodecahedronMaterial = new THREE.MeshPhongMaterial({
      color: 0x764ba2,
      transparent: true,
      opacity: 0.25
    });
    const dodecahedron = new THREE.Mesh(dodecahedronGeometry, dodecahedronMaterial);
    dodecahedron.position.set(8, -6, 0);
    dodecahedron.userData = {
      rotationSpeed: { x: 0.006, y: 0.009, z: 0.015 },
      floatSpeed: 0.013,
      floatAmplitude: 1.1
    };
    scene.add(dodecahedron);
    geometries.push(dodecahedron);

    geometriesRef.current = geometries;

    // 添加光源 - 更柔和的光照
    const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0x667eea, 0.6);
    directionalLight.position.set(10, 10, 5);
    scene.add(directionalLight);

    const pointLight = new THREE.PointLight(0x764ba2, 0.8, 100);
    pointLight.position.set(-10, -10, 5);
    scene.add(pointLight);

    // 动画循环
    const animate = () => {
      animationIdRef.current = requestAnimationFrame(animate);

      const time = Date.now() * 0.001;

      // 更新几何体
      geometries.forEach((geometry, index) => {
        // 旋转
        geometry.rotation.x += geometry.userData.rotationSpeed.x;
        geometry.rotation.y += geometry.userData.rotationSpeed.y;
        geometry.rotation.z += geometry.userData.rotationSpeed.z;

        // 浮动
        const originalY = geometry.position.y;
        geometry.position.y = originalY + Math.sin(time * geometry.userData.floatSpeed + index) * geometry.userData.floatAmplitude;

        // 缩放动画 - 更微妙
        const scale = 1 + Math.sin(time * 1.5 + index) * 0.05;
        geometry.scale.set(scale, scale, scale);
      });

      // 移动光源 - 更缓慢
      directionalLight.position.x = Math.sin(time * 0.3) * 12;
      directionalLight.position.z = Math.cos(time * 0.3) * 12;

      pointLight.position.x = Math.sin(time * 0.2) * 10;
      pointLight.position.z = Math.cos(time * 0.2) * 10;

      renderer.render(scene, camera);
    };

    animate();

    // 处理窗口大小变化
    const handleResize = () => {
      if (!containerRef.current) return;
      
      camera.aspect = containerRef.current.clientWidth / containerRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    };

    window.addEventListener('resize', handleResize);

    // 清理函数
    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
      if (containerRef.current && renderer.domElement) {
        containerRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [containerRef]);

  return null;
};

export default FloatingGeometry;
