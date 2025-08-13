import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface ThreeJSBackgroundProps {
  children: React.ReactNode;
}

// 行星数据 - 围绕登录框旋转，完全避开登录框区域
const PLANETS = [
  { 
    name: 'Mercury', 
    distance: 200, 
    size: 1.2, 
    color: 0x8C7853, 
    speed: 0.015, 
    tilt: 0.03,
    satellites: []
  },
  { 
    name: 'Venus', 
    distance: 250, 
    size: 1.6, 
    color: 0xFFC649, 
    speed: 0.012, 
    tilt: 0.01,
    satellites: []
  },
  { 
    name: 'Earth', 
    distance: 300, 
    size: 1.8, 
    color: 0x6B93D6, 
    speed: 0.01, 
    tilt: 0.4,
    satellites: [
      { name: 'Moon', distance: 3.5, size: 0.4, color: 0xCCCCCC, speed: 0.025 }
    ]
  },
  { 
    name: 'Mars', 
    distance: 350, 
    size: 1.4, 
    color: 0xC1440E, 
    speed: 0.008, 
    tilt: 0.4,
    satellites: [
      { name: 'Phobos', distance: 2.5, size: 0.2, color: 0x999999, speed: 0.03 },
      { name: 'Deimos', distance: 3.0, size: 0.15, color: 0x888888, speed: 0.025 }
    ]
  },
  { 
    name: 'Jupiter', 
    distance: 450, 
    size: 3.0, 
    color: 0xD8CA9D, 
    speed: 0.006, 
    tilt: 0.05,
    satellites: [
      { name: 'Io', distance: 4.5, size: 0.5, color: 0xFFD700, speed: 0.035 },
      { name: 'Europa', distance: 5.0, size: 0.45, color: 0x87CEEB, speed: 0.03 },
      { name: 'Ganymede', distance: 5.5, size: 0.55, color: 0xDEB887, speed: 0.025 },
      { name: 'Callisto', distance: 6.0, size: 0.5, color: 0x696969, speed: 0.02 }
    ]
  },
  { 
    name: 'Saturn', 
    distance: 550, 
    size: 2.5, 
    color: 0xFAD5A5, 
    speed: 0.004, 
    tilt: 0.5,
    hasRings: true,
    satellites: [
      { name: 'Titan', distance: 5.0, size: 0.5, color: 0xFFA500, speed: 0.025 },
      { name: 'Enceladus', distance: 4.0, size: 0.25, color: 0xF0F8FF, speed: 0.035 },
      { name: 'Mimas', distance: 3.5, size: 0.2, color: 0xD3D3D3, speed: 0.04 }
    ]
  },
  { 
    name: 'Uranus', 
    distance: 650, 
    size: 2.0, 
    color: 0x4FD0E7, 
    speed: 0.003, 
    tilt: 1.7,
    satellites: [
      { name: 'Titania', distance: 4.0, size: 0.35, color: 0xE6E6FA, speed: 0.025 },
      { name: 'Oberon', distance: 4.5, size: 0.3, color: 0xDDA0DD, speed: 0.02 }
    ]
  },
  { 
    name: 'Neptune', 
    distance: 750, 
    size: 1.9, 
    color: 0x4B70DD, 
    speed: 0.002, 
    tilt: 0.5,
    satellites: [
      { name: 'Triton', distance: 4.0, size: 0.4, color: 0x00CED1, speed: 0.02 }
    ]
  }
];

const ThreeJSBackground: React.FC<ThreeJSBackgroundProps> = ({ children }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const animationIdRef = useRef<number | null>(null);
  const solarSystemRef = useRef<THREE.Group | null>(null);
  const asteroidsRef = useRef<THREE.Group | null>(null);
  const starClustersRef = useRef<THREE.Group | null>(null);

  useEffect(() => {
    if (!mountRef.current) return;

    // 创建场景
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // 创建相机
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.set(0, 0, 200);
    camera.lookAt(0, 0, 0);

    // 创建渲染器
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      alpha: true 
    });
    rendererRef.current = renderer;
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000011, 0.3);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    mountRef.current.appendChild(renderer.domElement);

    // 创建太阳
    const createSun = () => {
      const sunGeometry = new THREE.SphereGeometry(4, 64, 64);
      const sunMaterial = new THREE.ShaderMaterial({
          uniforms: {
          time: { value: 0 }
          },
          vertexShader: `
          varying vec3 vNormal;
          varying vec3 vPosition;
            varying vec2 vUv;
            
            void main() {
            vNormal = normalize(normalMatrix * normal);
            vPosition = position;
              vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
          `,
          fragmentShader: `
          varying vec3 vNormal;
          varying vec3 vPosition;
            varying vec2 vUv;
            uniform float time;
          
          void main() {
            vec3 light = normalize(vec3(0.0, 1.0, 1.0));
            float intensity = pow(0.7 - dot(vNormal, light), 2.0);
            
            // 创建太阳表面纹理
            float noise1 = sin(vUv.x * 50.0 + time * 2.0) * sin(vUv.y * 30.0 + time * 1.5);
            float noise2 = sin(vUv.x * 30.0 + time * 1.0) * cos(vUv.y * 40.0 + time * 2.5);
            float surfaceNoise = (noise1 + noise2) * 0.3;
            
            vec3 color = vec3(1.0, 0.8, 0.4);
            color += vec3(1.0, 0.6, 0.2) * intensity;
            color += vec3(1.0, 0.4, 0.1) * surfaceNoise;
            
            // 添加脉动效果
            float pulse = sin(time * 2.0) * 0.1 + 0.9;
            color *= pulse;
            
            gl_FragColor = vec4(color, 1.0);
          }
        `
      });
      
      const sun = new THREE.Mesh(sunGeometry, sunMaterial);
      sun.castShadow = true;
      sun.receiveShadow = true;
      
      // 将太阳放置在登录框后方，完全避开登录框
      sun.position.set(0, 0, -300);
      
      // 添加太阳光晕
      const sunGlowGeometry = new THREE.SphereGeometry(6, 64, 64);
      const sunGlowMaterial = new THREE.ShaderMaterial({
        uniforms: {
          time: { value: 0 }
        },
        vertexShader: `
          varying vec3 vNormal;
          varying vec2 vUv;
          
          void main() {
            vNormal = normalize(normalMatrix * normal);
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          varying vec3 vNormal;
          varying vec2 vUv;
          uniform float time;
          
          void main() {
            float intensity = pow(0.8 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);
            vec3 color = vec3(1.0, 0.8, 0.4);
            
            // 动态光晕效果
            float glow = sin(time * 3.0 + vUv.x * 10.0) * 0.5 + 0.5;
            float alpha = intensity * glow * 0.4;
              
              gl_FragColor = vec4(color, alpha);
            }
          `,
          transparent: true,
          blending: THREE.AdditiveBlending,
        side: THREE.BackSide
      });
      const sunGlow = new THREE.Mesh(sunGlowGeometry, sunGlowMaterial);
      sun.add(sunGlow);
      
      return sun;
    };

    // 创建行星纹理
    const createPlanetTexture = (color: number, hasAtmosphere: boolean = false) => {
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 512;
      const ctx = canvas.getContext('2d')!;

      // 创建径向渐变
      const gradient = ctx.createRadialGradient(256, 256, 0, 256, 256, 256);
      const baseColor = new THREE.Color(color);
      
      gradient.addColorStop(0, '#' + baseColor.getHexString());
      gradient.addColorStop(0.7, '#' + baseColor.getHexString());
      gradient.addColorStop(1, '#' + baseColor.clone().multiplyScalar(0.7).getHexString());

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 512, 512);

      // 添加大气层效果
      if (hasAtmosphere) {
        const atmosphereGradient = ctx.createRadialGradient(256, 256, 200, 256, 256, 256);
        atmosphereGradient.addColorStop(0, 'rgba(255, 255, 255, 0)');
        atmosphereGradient.addColorStop(1, 'rgba(255, 255, 255, 0.1)');
        
        ctx.fillStyle = atmosphereGradient;
        ctx.fillRect(0, 0, 512, 512);
      }

      const texture = new THREE.CanvasTexture(canvas);
      texture.needsUpdate = true;
      return texture;
    };

    // 创建行星
    const createPlanet = (planetData: typeof PLANETS[0]) => {
      const planetGroup = new THREE.Group();
      
      // 创建轨道
      const orbitGeometry = new THREE.RingGeometry(planetData.distance - 0.1, planetData.distance + 0.1, 128);
      const orbitMaterial = new THREE.MeshBasicMaterial({
        color: 0x444444,
        transparent: true,
        opacity: 0.1,
        side: THREE.DoubleSide
      });
      const orbit = new THREE.Mesh(orbitGeometry, orbitMaterial);
      orbit.rotation.x = Math.PI / 2;
      planetGroup.add(orbit);
      
      // 创建行星
      const planetGeometry = new THREE.SphereGeometry(planetData.size, 64, 64);
      const planetTexture = createPlanetTexture(planetData.color, planetData.name === 'Earth');
      const planetMaterial = new THREE.MeshPhongMaterial({
        map: planetTexture,
        shininess: 30,
        bumpScale: 0.1
      });
      const planet = new THREE.Mesh(planetGeometry, planetMaterial);
      planet.position.x = planetData.distance;
      planet.castShadow = true;
      planet.receiveShadow = true;
      
      // 添加行星光晕
      const planetGlowGeometry = new THREE.SphereGeometry(planetData.size + 0.3, 64, 64);
      const planetGlowMaterial = new THREE.MeshBasicMaterial({
        color: planetData.color,
        transparent: true,
        opacity: 0.2,
        blending: THREE.AdditiveBlending
      });
      const planetGlow = new THREE.Mesh(planetGlowGeometry, planetGlowMaterial);
      planet.add(planetGlow);
      
      // 添加土星环
      if (planetData.hasRings) {
        const ringGeometry = new THREE.RingGeometry(planetData.size + 0.5, planetData.size + 2.5, 128);
        const ringMaterial = new THREE.MeshPhongMaterial({
          color: 0xFAD5A5,
          transparent: true,
          opacity: 0.6,
          side: THREE.DoubleSide
        });
        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        ring.rotation.x = Math.PI / 2;
        planet.add(ring);
      }
      
      planetGroup.add(planet);
      
      // 创建卫星
      planetData.satellites.forEach((satellite) => {
        const satelliteGeometry = new THREE.SphereGeometry(satellite.size, 32, 32);
        const satelliteMaterial = new THREE.MeshPhongMaterial({
          color: satellite.color,
          shininess: 20
        });
        const satelliteMesh = new THREE.Mesh(satelliteGeometry, satelliteMaterial);
        
        // 卫星围绕行星运行
        satelliteMesh.position.x = satellite.distance;
        satelliteMesh.castShadow = true;
        
        satelliteMesh.userData = {
          distance: satellite.distance,
          speed: satellite.speed,
          angle: Math.random() * Math.PI * 2,
          parentPlanet: planet
        };
        
        planet.add(satelliteMesh);
      });
      
      // 存储动画数据
      planetGroup.userData = {
        distance: planetData.distance,
        speed: planetData.speed,
        tilt: planetData.tilt,
        angle: Math.random() * Math.PI * 2
      };
      
      return planetGroup;
    };

    // 创建小行星带
    const createAsteroidBelt = () => {
      const asteroidGroup = new THREE.Group();
      const asteroidCount = 300;
      
      for (let i = 0; i < asteroidCount; i++) {
        // 随机选择小行星形状
        const shapes = [
          () => new THREE.SphereGeometry(Math.random() * 0.3 + 0.1, 8, 8),
          () => new THREE.BoxGeometry(Math.random() * 0.3 + 0.1, Math.random() * 0.3 + 0.1, Math.random() * 0.3 + 0.1),
          () => new THREE.OctahedronGeometry(Math.random() * 0.2 + 0.1)
        ];
        
        const randomShape = shapes[Math.floor(Math.random() * shapes.length)];
        const asteroidGeometry = randomShape();
        
        const asteroidMaterial = new THREE.MeshPhongMaterial({
          color: new THREE.Color().setHSL(0.1, 0.3, Math.random() * 0.3 + 0.2)
        });
        const asteroid = new THREE.Mesh(asteroidGeometry, asteroidMaterial);
        
        // 随机分布在火星和木星之间，围绕登录框，完全避开登录框区域
        const distance = Math.random() * 100 + 400; // 400-500
        const angle = Math.random() * Math.PI * 2;
        const height = (Math.random() - 0.5) * 3;
        
        asteroid.position.set(
          Math.cos(angle) * distance,
          height,
          Math.sin(angle) * distance
        );
        
        asteroid.userData = {
          distance,
          angle,
          speed: Math.random() * 0.005 + 0.002,
          height,
          heightSpeed: (Math.random() - 0.5) * 0.01,
          rotationSpeed: new THREE.Vector3(
            Math.random() * 0.02,
            Math.random() * 0.02,
            Math.random() * 0.02
          )
        };
        
        asteroidGroup.add(asteroid);
      }
      
      return asteroidGroup;
    };

    // 创建动态星群
    const createStarClusters = () => {
      const clustersGroup = new THREE.Group();
      
      // 创建多个星群
      for (let cluster = 0; cluster < 8; cluster++) {
        const clusterGroup = new THREE.Group();
        const starCount = Math.floor(Math.random() * 80) + 40;
        
        for (let i = 0; i < starCount; i++) {
          const starGeometry = new THREE.SphereGeometry(0.1, 8, 8);
          const starMaterial = new THREE.MeshBasicMaterial({
            color: new THREE.Color().setHSL(
              Math.random() * 0.1 + 0.6, // 蓝色到白色
              0.8,
              Math.random() * 0.5 + 0.5
            ),
            transparent: true,
            opacity: Math.random() * 0.8 + 0.2
          });
          const star = new THREE.Mesh(starGeometry, starMaterial);
          
          // 星群围绕登录框分布，完全避开登录框区域
          const clusterDistance = Math.random() * 400 + 600; // 600-1000
          const clusterAngle = Math.random() * Math.PI * 2;
          const clusterCenterX = Math.cos(clusterAngle) * clusterDistance;
          const clusterCenterY = (Math.random() - 0.5) * 200;
          const clusterCenterZ = Math.sin(clusterAngle) * clusterDistance;
          
          // 在星群中心周围分布
          const radius = Math.random() * 15 + 8;
          const angle = Math.random() * Math.PI * 2;
          const height = (Math.random() - 0.5) * 8;
          
          star.position.set(
            clusterCenterX + Math.cos(angle) * radius,
            clusterCenterY + height,
            clusterCenterZ + Math.sin(angle) * radius
          );
          
          star.userData = {
            originalPosition: star.position.clone(),
            twinkleSpeed: Math.random() * 0.03 + 0.01,
            twinkleOffset: Math.random() * Math.PI * 2,
            moveSpeed: Math.random() * 0.001 + 0.0005,
            moveDirection: new THREE.Vector3(
              (Math.random() - 0.5) * 2,
              (Math.random() - 0.5) * 2,
              (Math.random() - 0.5) * 2
            ).normalize()
          };
          
          clusterGroup.add(star);
        }
        
        clustersGroup.add(clusterGroup);
      }
      
      return clustersGroup;
    };

    // 创建震撼的星云效果
    const createNebula = () => {
      const nebulaGroup = new THREE.Group();
      const nebulaCount = 3; // 创建3个星云
      
      for (let nebulaIndex = 0; nebulaIndex < nebulaCount; nebulaIndex++) {
        const nebulaGeometry = new THREE.BufferGeometry();
        const particleCount = 2000;
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);
        const sizes = new Float32Array(particleCount);
        
                 // 星云位置 - 围绕登录框分布，完全避开登录框区域
         const nebulaDistance = Math.random() * 800 + 800; // 800-1600
        const nebulaAngle = Math.random() * Math.PI * 2;
        const nebulaCenterX = Math.cos(nebulaAngle) * nebulaDistance;
        const nebulaCenterY = (Math.random() - 0.5) * 300;
        const nebulaCenterZ = Math.sin(nebulaAngle) * nebulaDistance;
        
        // 星云颜色主题
        const nebulaTypes = [
          { r: 1.0, g: 0.3, b: 0.5 }, // 粉红色星云
          { r: 0.3, g: 0.7, b: 1.0 }, // 蓝色星云
          { r: 0.8, g: 0.9, b: 0.3 }  // 绿色星云
        ];
        const nebulaColor = nebulaTypes[nebulaIndex % nebulaTypes.length];
        
        for (let i = 0; i < particleCount; i++) {
          // 在星云中心周围分布粒子
          const radius = Math.random() * 80 + 20;
          const angle = Math.random() * Math.PI * 2;
          const height = (Math.random() - 0.5) * 60;
          
          positions[i * 3] = nebulaCenterX + Math.cos(angle) * radius;
          positions[i * 3 + 1] = nebulaCenterY + height;
          positions[i * 3 + 2] = nebulaCenterZ + Math.sin(angle) * radius;
          
          // 渐变颜色效果
          const distanceFromCenter = Math.sqrt(
            Math.pow(positions[i * 3] - nebulaCenterX, 2) +
            Math.pow(positions[i * 3 + 1] - nebulaCenterY, 2) +
            Math.pow(positions[i * 3 + 2] - nebulaCenterZ, 2)
          );
          
          const intensity = Math.max(0, 1 - distanceFromCenter / 100);
          colors[i * 3] = nebulaColor.r * intensity;
          colors[i * 3 + 1] = nebulaColor.g * intensity;
          colors[i * 3 + 2] = nebulaColor.b * intensity;
          
          sizes[i] = Math.random() * 4 + 1;
        }
        
        nebulaGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        nebulaGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        nebulaGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
        
        const nebulaMaterial = new THREE.PointsMaterial({
          size: 2,
          vertexColors: true,
          transparent: true,
          opacity: 0.6,
          sizeAttenuation: true,
          blending: THREE.AdditiveBlending
        });
        
        const nebula = new THREE.Points(nebulaGeometry, nebulaMaterial);
        nebula.userData = {
          center: new THREE.Vector3(nebulaCenterX, nebulaCenterY, nebulaCenterZ),
          rotationSpeed: Math.random() * 0.002 + 0.001
        };
        
        nebulaGroup.add(nebula);
      }
      
      return nebulaGroup;
    };

    // 创建黑洞效果
    const createBlackHole = () => {
      const blackHoleGroup = new THREE.Group();
      
      // 黑洞核心 - 深色球体
      const coreGeometry = new THREE.SphereGeometry(8, 64, 64);
      const coreMaterial = new THREE.ShaderMaterial({
        uniforms: {
          time: { value: 0 }
        },
        vertexShader: `
          varying vec3 vNormal;
          varying vec3 vPosition;
          
          void main() {
            vNormal = normalize(normalMatrix * normal);
            vPosition = position;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          varying vec3 vNormal;
          varying vec3 vPosition;
          uniform float time;
          
          void main() {
            vec3 light = normalize(vec3(0.0, 1.0, 1.0));
            float intensity = pow(0.9 - dot(vNormal, light), 3.0);
            
            // 黑洞核心 - 几乎完全黑色
            vec3 color = vec3(0.01, 0.01, 0.02);
            
            // 添加微妙的边缘发光
            float edge = 1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0)));
            color += vec3(0.1, 0.05, 0.2) * edge * 0.3;
            
            gl_FragColor = vec4(color, 1.0);
          }
        `
      });
      
      const core = new THREE.Mesh(coreGeometry, coreMaterial);
      
      // 吸积盘 - 发光环
      const accretionDiskGeometry = new THREE.RingGeometry(10, 25, 128);
      const accretionDiskMaterial = new THREE.ShaderMaterial({
        uniforms: {
          time: { value: 0 }
        },
        vertexShader: `
          varying vec2 vUv;
          
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          varying vec2 vUv;
          uniform float time;
          
          void main() {
            float distance = length(vUv - vec2(0.5));
            float intensity = 1.0 - distance;
            
            // 旋转的吸积盘效果
            float rotation = sin(time * 2.0 + distance * 10.0) * 0.5 + 0.5;
            
            vec3 color = vec3(1.0, 0.8, 0.4) * intensity * rotation;
            float alpha = intensity * 0.8;
            
            gl_FragColor = vec4(color, alpha);
          }
        `,
        transparent: true,
        side: THREE.DoubleSide
      });
      
      const accretionDisk = new THREE.Mesh(accretionDiskGeometry, accretionDiskMaterial);
      accretionDisk.rotation.x = Math.PI / 2;
      
      // 黑洞位置 - 在远处，完全避开登录框
      blackHoleGroup.position.set(0, 0, -1000);
      blackHoleGroup.add(core);
      blackHoleGroup.add(accretionDisk);
      
      return blackHoleGroup;
    };

    // 创建彗星效果
    const createComets = () => {
      const cometsGroup = new THREE.Group();
      const cometCount = 5;
      
      for (let i = 0; i < cometCount; i++) {
        const cometGroup = new THREE.Group();
        
        // 彗星核心
        const coreGeometry = new THREE.SphereGeometry(1, 16, 16);
        const coreMaterial = new THREE.MeshBasicMaterial({
          color: 0xFFFFFF,
          transparent: true,
          opacity: 0.9
        });
        const core = new THREE.Mesh(coreGeometry, coreMaterial);
        cometGroup.add(core);
        
        // 彗星尾巴 - 使用粒子系统
        const tailGeometry = new THREE.BufferGeometry();
        const tailParticles = 100;
        const tailPositions = new Float32Array(tailParticles * 3);
        const tailColors = new Float32Array(tailParticles * 3);
        const tailSizes = new Float32Array(tailParticles);
        
        for (let j = 0; j < tailParticles; j++) {
          const distance = j * 0.5;
          tailPositions[j * 3] = -distance;
          tailPositions[j * 3 + 1] = (Math.random() - 0.5) * 0.3;
          tailPositions[j * 3 + 2] = (Math.random() - 0.5) * 0.3;
          
          const opacity = 1 - (j / tailParticles);
          tailColors[j * 3] = 0.8 * opacity;
          tailColors[j * 3 + 1] = 0.9 * opacity;
          tailColors[j * 3 + 2] = 1.0 * opacity;
          
          tailSizes[j] = (1 - j / tailParticles) * 2;
        }
        
        tailGeometry.setAttribute('position', new THREE.BufferAttribute(tailPositions, 3));
        tailGeometry.setAttribute('color', new THREE.BufferAttribute(tailColors, 3));
        tailGeometry.setAttribute('size', new THREE.BufferAttribute(tailSizes, 1));
        
        const tailMaterial = new THREE.PointsMaterial({
          size: 1,
          vertexColors: true,
          transparent: true,
          opacity: 0.7,
          sizeAttenuation: true,
          blending: THREE.AdditiveBlending
        });
        
        const tail = new THREE.Points(tailGeometry, tailMaterial);
        cometGroup.add(tail);
        
                 // 彗星轨道 - 完全避开登录框区域
         const orbitDistance = Math.random() * 600 + 800;
        const orbitAngle = Math.random() * Math.PI * 2;
        const orbitHeight = (Math.random() - 0.5) * 200;
        
        cometGroup.position.set(
          Math.cos(orbitAngle) * orbitDistance,
          orbitHeight,
          Math.sin(orbitAngle) * orbitDistance
        );
        
        cometGroup.userData = {
          orbitDistance,
          orbitAngle,
          orbitHeight,
          speed: Math.random() * 0.003 + 0.001,
          rotationSpeed: Math.random() * 0.02 + 0.01
        };
        
        cometsGroup.add(cometGroup);
      }
      
      return cometsGroup;
    };

    // 创建星链（星座）效果
    const createConstellations = () => {
      const constellationsGroup = new THREE.Group();
      const constellationCount = 4;
      
      for (let i = 0; i < constellationCount; i++) {
        const constellationGroup = new THREE.Group();
        const starCount = Math.floor(Math.random() * 5) + 3; // 3-7颗星星
        const stars = [];
        
        // 创建星座中的星星
        for (let j = 0; j < starCount; j++) {
          const starGeometry = new THREE.SphereGeometry(0.5, 8, 8);
          const starMaterial = new THREE.MeshBasicMaterial({
            color: 0xFFFFFF,
            transparent: true,
            opacity: 0.9
          });
          const star = new THREE.Mesh(starGeometry, starMaterial);
          
                     // 星座位置 - 完全避开登录框区域
           const constellationDistance = Math.random() * 600 + 700;
          const constellationAngle = Math.random() * Math.PI * 2;
          const starOffset = (Math.random() - 0.5) * 50;
          
          star.position.set(
            Math.cos(constellationAngle) * constellationDistance + starOffset,
            (Math.random() - 0.5) * 200,
            Math.sin(constellationAngle) * constellationDistance + starOffset
          );
          
          stars.push(star);
          constellationGroup.add(star);
        }
        
        // 创建星座连线
        for (let j = 0; j < stars.length - 1; j++) {
          const lineGeometry = new THREE.BufferGeometry().setFromPoints([
            stars[j].position,
            stars[j + 1].position
          ]);
          const lineMaterial = new THREE.LineBasicMaterial({
            color: 0x4444FF,
            transparent: true,
            opacity: 0.3
          });
          const line = new THREE.Line(lineGeometry, lineMaterial);
          constellationGroup.add(line);
        }
        
        constellationsGroup.add(constellationGroup);
      }
      
      return constellationsGroup;
    };

    // 创建陨石
    const createMeteors = () => {
      const meteorsGroup = new THREE.Group();
      const meteorCount = 30; // 增加陨石数量
      
      for (let i = 0; i < meteorCount; i++) {
        const meteorGeometry = new THREE.ConeGeometry(0.3, 3, 8);
        const meteorMaterial = new THREE.MeshPhongMaterial({
          color: 0x888888,
          transparent: true,
          opacity: 0.8
        });
        const meteor = new THREE.Mesh(meteorGeometry, meteorMaterial);
        
        // 随机起始位置
        const startX = (Math.random() - 0.5) * 400;
        const startY = (Math.random() - 0.5) * 400;
        const startZ = (Math.random() - 0.5) * 400;
        
        meteor.position.set(startX, startY, startZ);
        
        // 随机方向和速度
        const direction = new THREE.Vector3(
          (Math.random() - 0.5) * 2,
          (Math.random() - 0.5) * 2,
          (Math.random() - 0.5) * 2
        ).normalize();
        
        meteor.userData = {
          direction,
          speed: Math.random() * 0.8 + 0.3,
          rotationSpeed: new THREE.Vector3(
            Math.random() * 0.15,
            Math.random() * 0.15,
            Math.random() * 0.15
          )
        };
        
        meteorsGroup.add(meteor);
      }
      
      return meteorsGroup;
    };

    // 创建震撼的银河系背景星空
    const createBackgroundStars = () => {
      const starsGeometry = new THREE.BufferGeometry();
      const starsCount = 8000; // 增加星星数量
      const positions = new Float32Array(starsCount * 3);
      const colors = new Float32Array(starsCount * 3);
      const sizes = new Float32Array(starsCount);
      const velocities = new Float32Array(starsCount * 3);

      for (let i = 0; i < starsCount; i++) {
        // 围绕登录框分布背景星星，形成银河系效果，完全避开登录框区域
        const starDistance = Math.random() * 1500 + 800; // 800-2300
        const starAngle = Math.random() * Math.PI * 2;
        const starHeight = (Math.random() - 0.5) * 800;
        
        positions[i * 3] = Math.cos(starAngle) * starDistance;
        positions[i * 3 + 1] = starHeight;
        positions[i * 3 + 2] = Math.sin(starAngle) * starDistance;

        // 创建更丰富的星星颜色
        const starType = Math.random();
        if (starType < 0.2) {
          colors[i * 3] = 0.6;     // 深蓝色
          colors[i * 3 + 1] = 0.8;
          colors[i * 3 + 2] = 1.0;
        } else if (starType < 0.4) {
          colors[i * 3] = 1.0;     // 白色
          colors[i * 3 + 1] = 1.0;
          colors[i * 3 + 2] = 1.0;
        } else if (starType < 0.6) {
          colors[i * 3] = 1.0;     // 黄色
          colors[i * 3 + 1] = 0.9;
          colors[i * 3 + 2] = 0.6;
        } else if (starType < 0.8) {
          colors[i * 3] = 1.0;     // 橙色
          colors[i * 3 + 1] = 0.7;
          colors[i * 3 + 2] = 0.3;
        } else {
          colors[i * 3] = 1.0;     // 红色
          colors[i * 3 + 1] = 0.5;
          colors[i * 3 + 2] = 0.3;
        }

        sizes[i] = Math.random() * 3 + 0.5;
        
        // 添加更复杂的运动
        velocities[i * 3] = (Math.random() - 0.5) * 0.15;
        velocities[i * 3 + 1] = (Math.random() - 0.5) * 0.15;
        velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.15;
      }

      starsGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      starsGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
      starsGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
      starsGeometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));

      const starsMaterial = new THREE.PointsMaterial({
        size: 1.5,
        vertexColors: true,
        transparent: true,
        opacity: 0.9,
        sizeAttenuation: true,
        map: createStarTexture()
      });

      const stars = new THREE.Points(starsGeometry, starsMaterial);
      stars.userData = { velocities };
      return stars;
    };

    // 创建太阳系
    const solarSystem = new THREE.Group();
    solarSystemRef.current = solarSystem;
    
    // 添加太阳
    const sun = createSun();
    solarSystem.add(sun);
    
    // 添加行星
    PLANETS.forEach(planetData => {
      const planet = createPlanet(planetData);
      solarSystem.add(planet);
    });
    
    // 添加小行星带
    const asteroidBelt = createAsteroidBelt();
    asteroidsRef.current = asteroidBelt;
    solarSystem.add(asteroidBelt);
    
    // 添加星群
    const starClusters = createStarClusters();
    starClustersRef.current = starClusters;
    scene.add(starClusters);
    
    // 添加震撼的星云效果
    const nebula = createNebula();
    scene.add(nebula);
    
    // 添加黑洞
    const blackHole = createBlackHole();
    scene.add(blackHole);
    
    // 添加彗星
    const comets = createComets();
    scene.add(comets);
    
    // 添加星链（星座）
    const constellations = createConstellations();
    scene.add(constellations);
    
    // 添加陨石
    const meteors = createMeteors();
    scene.add(meteors);

    // 添加背景星空
    const backgroundStars = createBackgroundStars();
    scene.add(backgroundStars);
    
    // 添加太阳系到场景
    scene.add(solarSystem);

    // 添加光源
    const ambientLight = new THREE.AmbientLight(0x404040, 0.3);
    scene.add(ambientLight);

    // 太阳光源 - 跟随太阳位置
    const sunLight = new THREE.PointLight(0xFFD700, 2, 400);
    sunLight.position.set(0, 0, -300); // 与太阳位置一致
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    scene.add(sunLight);

    // 动画循环
    const animate = () => {
      animationIdRef.current = requestAnimationFrame(animate);
      
      const time = Date.now() * 0.001;
      
      // 更新太阳着色器
      if ((sun as any).material?.uniforms) {
        (sun as any).material.uniforms.time.value = time;
      }
      if (sun.children[0] && (sun.children[0] as any).material?.uniforms) {
        (sun.children[0] as any).material.uniforms.time.value = time;
      }
      
      // 更新黑洞着色器
      if (blackHole.children[0] && (blackHole.children[0] as any).material?.uniforms) {
        (blackHole.children[0] as any).material.uniforms.time.value = time;
      }
      if (blackHole.children[1] && (blackHole.children[1] as any).material?.uniforms) {
        (blackHole.children[1] as any).material.uniforms.time.value = time;
      }
      
      // 更新行星轨道
      solarSystem.children.forEach((child: any) => {
        if (child.userData && child.userData.distance) {
          child.userData.angle += child.userData.speed;
          child.children[1].position.x = Math.cos(child.userData.angle) * child.userData.distance;
          child.children[1].position.z = Math.sin(child.userData.angle) * child.userData.distance;
          child.children[1].rotation.y = child.userData.angle;
          child.children[1].rotation.x = child.userData.tilt;
          
          // 更新卫星
          child.children[1].children.forEach((satellite: any) => {
            if (satellite.userData && satellite.userData.distance) {
              satellite.userData.angle += satellite.userData.speed;
              satellite.position.x = Math.cos(satellite.userData.angle) * satellite.userData.distance;
              satellite.position.z = Math.sin(satellite.userData.angle) * satellite.userData.distance;
              satellite.rotation.y += 0.01;
            }
          });
        }
      });
      
      // 更新小行星带
      asteroidBelt.children.forEach((asteroid: any) => {
        if (asteroid.userData) {
          asteroid.userData.angle += asteroid.userData.speed;
          asteroid.position.x = Math.cos(asteroid.userData.angle) * asteroid.userData.distance;
          asteroid.position.z = Math.sin(asteroid.userData.angle) * asteroid.userData.distance;
          asteroid.position.y = asteroid.userData.height + Math.sin(time + asteroid.userData.angle) * 0.5;
          
          // 小行星自转
          asteroid.rotation.x += asteroid.userData.rotationSpeed.x;
          asteroid.rotation.y += asteroid.userData.rotationSpeed.y;
          asteroid.rotation.z += asteroid.userData.rotationSpeed.z;
        }
      });
      
      // 更新星群
      starClusters.children.forEach((cluster: any) => {
        cluster.children.forEach((star: any) => {
          if (star.userData) {
            // 闪烁效果
            const twinkle = Math.sin(time * star.userData.twinkleSpeed + star.userData.twinkleOffset) * 0.5 + 0.5;
            star.material.opacity = twinkle * 0.8 + 0.2;
            
            // 移动效果
            star.position.add(star.userData.moveDirection.clone().multiplyScalar(star.userData.moveSpeed));
            
            // 重置超出边界的星星
            if (Math.abs(star.position.x) > 100 || 
                Math.abs(star.position.y) > 100 || 
                Math.abs(star.position.z) > 100) {
              star.position.copy(star.userData.originalPosition);
            }
          }
        });
      });
      
      // 更新陨石
      meteors.children.forEach((meteor: any) => {
        if (meteor.userData) {
          meteor.position.add(meteor.userData.direction.clone().multiplyScalar(meteor.userData.speed));
          meteor.rotation.x += meteor.userData.rotationSpeed.x;
          meteor.rotation.y += meteor.userData.rotationSpeed.y;
          meteor.rotation.z += meteor.userData.rotationSpeed.z;
          
          // 重置超出边界的陨石
          if (Math.abs(meteor.position.x) > 100 || 
              Math.abs(meteor.position.y) > 100 || 
              Math.abs(meteor.position.z) > 100) {
            meteor.position.set(
              (Math.random() - 0.5) * 200,
              (Math.random() - 0.5) * 200,
              (Math.random() - 0.5) * 200
            );
          }
        }
      });
      
      // 更新背景星空
      if (backgroundStars.userData) {
        const positions = backgroundStars.geometry.attributes.position.array as Float32Array;
        const velocities = backgroundStars.userData.velocities;
        
        for (let i = 0; i < positions.length; i += 3) {
          positions[i] += velocities[i];
          positions[i + 1] += velocities[i + 1];
          positions[i + 2] += velocities[i + 2];
          
          // 重置超出边界的星星
          if (Math.abs(positions[i]) > 300 || 
              Math.abs(positions[i + 1]) > 300 || 
              Math.abs(positions[i + 2]) > 300) {
            positions[i] = (Math.random() - 0.5) * 600;
            positions[i + 1] = (Math.random() - 0.5) * 600;
            positions[i + 2] = (Math.random() - 0.5) * 600 - 300;
          }
        }
        
        backgroundStars.geometry.attributes.position.needsUpdate = true;
      }
      
      // 缓慢旋转整个太阳系
      solarSystem.rotation.y += 0.0005;
      
      // 更新彗星轨道
      comets.children.forEach((comet: any) => {
        if (comet.userData) {
          comet.userData.orbitAngle += comet.userData.speed;
          comet.position.x = Math.cos(comet.userData.orbitAngle) * comet.userData.orbitDistance;
          comet.position.z = Math.sin(comet.userData.orbitAngle) * comet.userData.orbitDistance;
          comet.rotation.y += comet.userData.rotationSpeed;
        }
      });
      
      // 更新星云旋转
      nebula.children.forEach((nebulaCloud: any) => {
        if (nebulaCloud.userData) {
          nebulaCloud.rotation.y += nebulaCloud.userData.rotationSpeed;
        }
      });
      
      renderer.render(scene, camera);
    };
    animate();

    // 处理窗口大小变化
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    // 清理函数
    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  // 创建星星纹理
  const createStarTexture = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d')!;

    // 创建径向渐变
    const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(0.3, 'rgba(255, 255, 255, 0.8)');
    gradient.addColorStop(0.7, 'rgba(255, 255, 255, 0.3)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 32, 32);

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  };

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden' }}>
      <div
        ref={mountRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 0,
          pointerEvents: 'none'
        }}
      />
      <div style={{
        position: 'relative',
        zIndex: 1,
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}>
        {children}
      </div>
    </div>
  );
};

export default ThreeJSBackground;
