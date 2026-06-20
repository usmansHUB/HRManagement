<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import * as THREE from 'three';

const canvasRef = ref(null);
let renderer, scene, camera, mesh;
let animationFrameId;

const isHovered = ref(false);

const handleMouseEnter = () => {
  isHovered.value = true;
};

const handleMouseLeave = () => {
  isHovered.value = false;
};

onMounted(() => {
  if (!canvasRef.value) return;

  const width = canvasRef.value.clientWidth || 40;
  const height = canvasRef.value.clientHeight || 40;

  // Scene
  scene = new THREE.Scene();

  // Camera (Orthographic fits a small header widget nicely)
  camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
  camera.position.z = 2;

  // Renderer
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, canvas: canvasRef.value });
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  // Geometry (Subtle premium Octahedron or Icosahedron)
  const geometry = new THREE.IcosahedronGeometry(0.7, 0);
  
  // Wireframe material with purple/blue glowing highlights
  const material = new THREE.MeshBasicMaterial({
    color: 0xc084fc, // subtle purple
    wireframe: true,
  });

  mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);

  // Animation Loop
  const animate = () => {
    animationFrameId = requestAnimationFrame(animate);

    // Apply speed increase on hover
    const targetSpeedY = isHovered.value ? 0.08 : 0.015;
    const targetSpeedX = isHovered.value ? 0.035 : 0.007;

    mesh.rotation.y += targetSpeedY;
    mesh.rotation.x += targetSpeedX;

    // Apply scale growth on hover
    const targetScale = isHovered.value ? 1.25 : 1.0;
    mesh.scale.x += (targetScale - mesh.scale.x) * 0.15;
    mesh.scale.y += (targetScale - mesh.scale.y) * 0.15;
    mesh.scale.z += (targetScale - mesh.scale.z) * 0.15;

    // Gently float up and down
    mesh.position.y = Math.sin(Date.now() * 0.0025) * 0.08;

    renderer.render(scene, camera);
  };

  animate();
});

onUnmounted(() => {
  cancelAnimationFrame(animationFrameId);
  if (renderer) {
    renderer.dispose();
  }
  if (mesh) {
    mesh.geometry.dispose();
    mesh.material.dispose();
  }
});
</script>

<template>
  <canvas 
    ref="canvasRef" 
    class="w-10 h-10 select-none cursor-pointer transition-transform duration-200"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
  ></canvas>
</template>
