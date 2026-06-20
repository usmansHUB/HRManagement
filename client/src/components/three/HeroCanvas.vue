<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import * as THREE from 'three';

const canvasContainer = ref(null);
let renderer, scene, camera, mesh, wireframeMesh, group, dust, dustGeometry, dustMaterial;
let animationFrameId;

const mouse = { x: 0, y: 0 };
const targetMouse = { x: 0, y: 0 };
const scrollPercent = ref(0);
const isMouseDown = ref(false);

const handleMouseMove = (event) => {
  targetMouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  targetMouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
};

const handleScroll = () => {
  const scrollTop = window.scrollY || document.documentElement.scrollTop;
  const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
  scrollPercent.value = scrollHeight > 0 ? scrollTop / scrollHeight : 0;
};

const handleResize = () => {
  if (!canvasContainer.value || !camera || !renderer) return;
  const width = canvasContainer.value.clientWidth;
  const height = canvasContainer.value.clientHeight;
  
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
};

const handleMouseDown = () => {
  isMouseDown.value = true;
};

const handleMouseUp = () => {
  isMouseDown.value = false;
};

onMounted(() => {
  if (!canvasContainer.value) return;

  const width = canvasContainer.value.clientWidth;
  const height = canvasContainer.value.clientHeight;

  // Scene
  scene = new THREE.Scene();

  // Camera
  camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 100);
  camera.position.z = 5;

  // WebGL Renderer
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  canvasContainer.value.appendChild(renderer.domElement);

  // Group container
  group = new THREE.Group();
  scene.add(group);

  // Octahedral / Torus Knot Geometry
  const geometry = new THREE.TorusKnotGeometry(1.1, 0.38, 120, 16);

  // Flat Navy Material
  const material = new THREE.MeshStandardMaterial({
    color: 0x05070f,
    roughness: 0.15,
    metalness: 0.85,
    flatShading: true,
  });
  mesh = new THREE.Mesh(geometry, material);
  group.add(mesh);

  // Glowing wireframe overlays
  const wireframeMaterial = new THREE.MeshBasicMaterial({
    color: 0x38bdf8,
    wireframe: true,
    transparent: true,
    opacity: 0.4,
  });
  wireframeMesh = new THREE.Mesh(geometry, wireframeMaterial);
  group.add(wireframeMesh);

  // Floating particle dust inside the group
  const particleCount = 250;
  dustGeometry = new THREE.BufferGeometry();
  const dustPositions = new Float32Array(particleCount * 3);
  for (let i = 0; i < particleCount * 3; i += 3) {
    dustPositions[i] = (Math.random() - 0.5) * 8;
    dustPositions[i + 1] = (Math.random() - 0.5) * 8;
    dustPositions[i + 2] = (Math.random() - 0.5) * 6;
  }
  dustGeometry.setAttribute('position', new THREE.BufferAttribute(dustPositions, 3));
  dustMaterial = new THREE.PointsMaterial({
    color: 0xc084fc,
    size: 0.045,
    transparent: true,
    opacity: 0.6,
  });
  dust = new THREE.Points(dustGeometry, dustMaterial);
  group.add(dust);

  // Lights
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.35);
  scene.add(ambientLight);

  const dirLight1 = new THREE.DirectionalLight(0x38bdf8, 1.3);
  dirLight1.position.set(5, 5, 5);
  scene.add(dirLight1);

  const dirLight2 = new THREE.DirectionalLight(0xc084fc, 0.9);
  dirLight2.position.set(-5, -5, 5);
  scene.add(dirLight2);

  // Event Triggers
  window.addEventListener('mousemove', handleMouseMove);
  window.addEventListener('scroll', handleScroll, { passive: true });
  window.addEventListener('resize', handleResize);
  window.addEventListener('mousedown', handleMouseDown);
  window.addEventListener('mouseup', handleMouseUp);

  // Animation Loop
  const animate = () => {
    animationFrameId = requestAnimationFrame(animate);

    // Continuous standard rotations
    group.rotation.x += 0.003;
    group.rotation.y += 0.005;

    // Mouse movement camera parallax shifts
    mouse.x += (targetMouse.x - mouse.x) * 0.05;
    mouse.y += (targetMouse.y - mouse.y) * 0.05;

    group.rotation.x += mouse.y * 0.12;
    group.rotation.y += mouse.x * 0.12;

    // Dynamic scroll folding + click scale bump animation
    const scaleFactor = isMouseDown.value ? 1.25 : 1.0;
    const targetScale = (1 - scrollPercent.value * 0.35) * scaleFactor;
    group.scale.x += (targetScale - group.scale.x) * 0.1;
    group.scale.y += (targetScale - group.scale.y) * 0.1;
    group.scale.z += (targetScale - group.scale.z) * 0.1;

    const targetY = -scrollPercent.value * 2.2;
    group.position.y += (targetY - group.position.y) * 0.08;

    // Sweep wireframe color and pulse wireframe opacity over time
    const time = Date.now() * 0.001;
    wireframeMesh.material.opacity = 0.3 + Math.sin(time * 2) * 0.15;
    wireframeMaterial.color.setHSL(0.55 + Math.sin(time * 0.4) * 0.15, 0.85, 0.6);

    // Rotate dust clouds slowly in opposite directions
    dust.rotation.y -= 0.0015;
    dust.rotation.x += 0.0008;

    renderer.render(scene, camera);
  };

  animate();
});

onUnmounted(() => {
  cancelAnimationFrame(animationFrameId);
  window.removeEventListener('mousemove', handleMouseMove);
  window.removeEventListener('scroll', handleScroll);
  window.removeEventListener('resize', handleResize);
  window.removeEventListener('mousedown', handleMouseDown);
  window.removeEventListener('mouseup', handleMouseUp);

  if (renderer) {
    renderer.dispose();
  }
  if (mesh) {
    mesh.geometry.dispose();
    mesh.material.dispose();
  }
  if (wireframeMesh) {
    wireframeMesh.geometry.dispose();
    wireframeMesh.material.dispose();
  }
  if (dust) {
    dustGeometry.dispose();
    dustMaterial.dispose();
  }
  console.log('Three.js HeroCanvas resources disposed.');
});
</script>

<template>
  <div ref="canvasContainer" class="w-full h-full min-h-[300px]"></div>
</template>
