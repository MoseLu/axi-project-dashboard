# AXI Dashboard 3D 登录页面指南

## 概述

AXI Dashboard 现在使用 **3D 登录页** (`/login`) 作为默认登录页面，提供沉浸式3D体验。

## 3D 登录页面特性

### 🎨 视觉效果
- **太阳系模拟**：八大行星围绕太阳旋转的真实宇宙场景，每个行星都有独特的纹理和大气层效果
- **卫星系统**：地球有月球，火星有火卫一和火卫二，木星有四大卫星，土星有泰坦等卫星，天王星和海王星也有各自的卫星
- **土星环**：土星具有真实的环系统，带有半透明效果
- **动态星空**：5000+颗背景星星，每颗星星都有独立的运动轨迹
- **星群系统**：8个星群，每群40-120颗星星，带有闪烁和移动效果
- **小行星带**：300颗不同形状的小行星（球形、立方体、八面体），带有自转效果
- **陨石系统**：20颗陨石在宇宙中飞行，带有旋转和轨迹效果
- **太阳光源**：脉动的太阳，带有动态表面纹理和光晕效果

### 🔧 技术实现
- **Three.js**：3D图形渲染引擎
- **WebGL**：底层图形API
- **React Hooks**：状态管理和生命周期
- **TypeScript**：类型安全

### 📱 响应式设计
- 移动端自动隐藏左侧装饰区域
- 自适应屏幕尺寸
- 触摸友好的交互设计

## 文件结构

```
frontend/src/
├── components/3d/
│   ├── ThreeJSBackground.tsx    # 3D背景组件
│   └── FloatingGeometry.tsx     # 浮动几何体组件
├── pages/
│   └── LoginPage3D.tsx          # 3D登录页
└── styles/
    └── login-page.css           # 登录页面样式
```

## 使用方法

### 1. 访问登录页面

```bash
# 3D登录页
http://localhost:3000/login
```

### 2. 开发环境设置

确保已安装Three.js依赖：

```bash
pnpm add three @types/three
```

### 3. 自定义宇宙场景

#### 修改行星参数
编辑 `ThreeJSBackground.tsx`：

```typescript
// 修改行星数据（包含卫星信息）
const PLANETS = [
  { 
    name: 'Mercury', 
    distance: 8, 
    size: 0.8, 
    color: 0x8C7853, 
    speed: 0.02, 
    tilt: 0.03,
    satellites: []
  },
  { 
    name: 'Earth', 
    distance: 16, 
    size: 1.3, 
    color: 0x6B93D6, 
    speed: 0.012, 
    tilt: 0.4,
    satellites: [
      { name: 'Moon', distance: 2.5, size: 0.3, color: 0xCCCCCC, speed: 0.03 }
    ]
  },
  // ... 其他行星
];

// 调整小行星带数量
const asteroidCount = 400; // 增加小行星数量

// 修改星群数量
for (let cluster = 0; cluster < 10; cluster++) { // 增加星群数量
```

#### 修改太阳效果
```typescript
// 调整太阳大小和脉动效果
const sunGeometry = new THREE.SphereGeometry(4, 32, 32); // 增大太阳

// 修改脉动速度
float pulse = sin(time * 3.0) * 0.15 + 0.85; // 更快的脉动
```

## 性能优化

### 1. 渲染优化
- 使用 `requestAnimationFrame` 进行动画循环
- 合理设置几何体数量和复杂度
- 及时清理Three.js资源

### 2. 内存管理
```typescript
// 组件卸载时清理资源
useEffect(() => {
  return () => {
    if (animationIdRef.current) {
      cancelAnimationFrame(animationIdRef.current);
    }
    renderer.dispose();
  };
}, []);
```

### 3. 响应式处理
```typescript
// 监听窗口大小变化
const handleResize = () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
};
```

## 浏览器兼容性

### 支持的浏览器
- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

### WebGL 支持检测
```javascript
function isWebGLSupported() {
  try {
    const canvas = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && 
      (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
  } catch (e) {
    return false;
  }
}
```

## 故障排除

### 1. 3D效果不显示
- 检查WebGL支持
- 确认Three.js依赖已正确安装
- 查看浏览器控制台错误信息

### 2. 性能问题
- 减少几何体数量
- 降低动画帧率
- 检查GPU使用情况

### 3. 移动端问题
- 确保响应式设计正确
- 测试触摸交互
- 检查移动端性能

## 扩展功能

### 1. 添加交互效果
```typescript
// 鼠标悬停效果
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

function onMouseMove(event) {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  
  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(geometries);
  
  if (intersects.length > 0) {
    // 处理悬停效果
  }
}
```

### 2. 添加音效
```typescript
// 背景音乐
const audio = new Audio('/assets/background-music.mp3');
audio.loop = true;
audio.volume = 0.3;
```

### 3. 粒子系统优化
```typescript
// 使用GPU加速的粒子系统
const particles = new THREE.Points(particlesGeometry, particlesMaterial);
particles.frustumCulled = false; // 禁用视锥体剔除
```

## 贡献指南

1. Fork 项目
2. 创建功能分支
3. 提交更改
4. 推送到分支
5. 创建 Pull Request

## 许可证

本项目采用 MIT 许可证。

---

## 参考资源

- [Three.js 官方文档](https://threejs.org/docs/)
- [WebGL 基础教程](https://webglfundamentals.org/)
- [CSDN 3D登录页示例](https://blog.csdn.net/lunahaijiao/article/details/121059156)
