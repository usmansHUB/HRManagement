<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import * as THREE from 'three';

const containerRef = ref(null);
let renderer, scene, camera, particles, geometry, material;
let animationFrameId;

const mouse2D = new THREE.Vector2(0, 0);
const raycaster = new THREE.Raycaster();
const planeZ = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0); // target Z=0 plane

const handleMouseMove = (event) => {
  mouse2D.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse2D.y = -(event.clientY / window.innerHeight) * 2 + 1;
};

const handleResize = () => {
  if (!containerRef.value || !camera || !renderer) return;
  const width = containerRef.value.clientWidth;
  const height = containerRef.value.clientHeight;

  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
};

onMounted(() => {
  if (!containerRef.value) return;

  const width = containerRef.value.clientWidth;
  const height = containerRef.value.clientHeight;

  // Scene
  scene = new THREE.Scene();

  // Camera
  camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 100);
  camera.position.z = 8;

  // Renderer
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  containerRef.value.appendChild(renderer.domElement);

  // Geometry Setup
  const particleCount = 3500;
  geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(particleCount * 3);
  const initialPositions = new Float32Array(particleCount * 3); // track starting anchors

  for (let i = 0; i < particleCount * 3; i += 3) {
    const x = (Math.random() - 0.5) * 24;
    const y = (Math.random() - 0.5) * 24;
    const z = (Math.random() - 0.5) * 16;
    
    positions[i] = x;
    positions[i + 1] = y;
    positions[i + 2] = z;

    initialPositions[i] = x;
    initialPositions[i + 1] = y;
    initialPositions[i + 2] = z;
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  // Dynamic Circle Canvas Texture
  const canvas = document.createElement('canvas');
  canvas.width = 16;
  canvas.height = 16;
  const ctx = canvas.getContext('2d');
  const grad = ctx.createRadialGradient(8, 8, 0, 8, 8, 8);
  grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
  grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 16, 16);

  const texture = new THREE.CanvasTexture(canvas);

  // Points material
  material = new THREE.PointsMaterial({
    color: 0x4f8ef7,
    size: 0.1,
    map: texture,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  particles = new THREE.Points(geometry, material);
  scene.add(particles);

  // Listeners
  window.addEventListener('mousemove', handleMouseMove);
  window.addEventListener('resize', handleResize);

  // Animation Loop
  const animate = () => {
    animationFrameId = requestAnimationFrame(animate);

    // Calculate mouse 3D intersection on Z=0 plane
    raycaster.setFromCamera(mouse2D, camera);
    const intersects = new THREE.Vector3();
    raycaster.ray.intersectPlane(planeZ, intersects);

    // Camera dynamic panning corresponding to mouse position (gives cool depth offset)
    const targetCamX = mouse2D.x * 1.5;
    const targetCamY = mouse2D.y * 1.5;
    camera.position.x += (targetCamX - camera.position.x) * 0.05;
    camera.position.y += (targetCamY - camera.position.y) * 0.05;
    camera.lookAt(scene.position);

    // Rotate field slowly
    particles.rotation.y += 0.0004;

    // Move & Deflect particles
    const positionsArray = geometry.attributes.position.array;
    const rLimit = 2.5; // push radius
    const pushForce = 0.8;

    for (let i = 0; i < positionsArray.length; i += 3) {
      // 1. Accumulate regular downward drift to the anchors
      initialPositions[i + 1] -= 0.008;
      if (initialPositions[i + 1] < -12) {
        initialPositions[i + 1] = 12;
        initialPositions[i] = (Math.random() - 0.5) * 24; // randomize X on entry
      }

      // 2. Vector distance to cursor position
      const dx = initialPositions[i] - intersects.x;
      const dy = initialPositions[i + 1] - intersects.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < rLimit) {
        // Push particles outwards along the direction vector
        const angle = Math.atan2(dy, dx);
        const forceFactor = (rLimit - dist) / rLimit; // stronger close to mouse
        
        // Target deflection points
        const targetX = initialPositions[i] + Math.cos(angle) * forceFactor * pushForce;
        const targetY = initialPositions[i + 1] + Math.sin(angle) * forceFactor * pushForce;

        // Apply smooth deflection interpolation
        positionsArray[i] += (targetX - positionsArray[i]) * 0.15;
        positionsArray[i + 1] += (targetY - positionsArray[i + 1]) * 0.15;
      } else {
        // Smoothly decay back to normal drift positions
        positionsArray[i] += (initialPositions[i] - positionsArray[i]) * 0.08;
        positionsArray[i + 1] += (initialPositions[i + 1] - positionsArray[i + 1]) * 0.08;
      }
    }
    geometry.attributes.position.needsUpdate = true;

    // 3. Smooth color transition cycle (Hue sweep from blue to purple accent)
    const timeCycle = Date.now() * 0.0004;
    material.color.setHSL(0.55 + Math.sin(timeCycle) * 0.08, 0.85, 0.6);

    // 4. Point size breathing cycle
    const sizeTime = Date.now() * 0.0015;
    material.size = 0.08 + Math.sin(sizeTime) * 0.03;

    renderer.render(scene, camera);
  };

  animate();
});

onUnmounted(() => {
  cancelAnimationFrame(animationFrameId);
  window.removeEventListener('mousemove', handleMouseMove);
  window.removeEventListener('resize', handleResize);

  if (renderer) {
    renderer.dispose();
  }
  if (particles) {
    geometry.dispose();
    material.dispose();
  }
  console.log('WebGL interactive particles disposed.');
});
</script>

<template>
  <div ref="containerRef" class="absolute inset-0 w-full h-full overflow-hidden -z-10 bg-[#060913]"></div>
</template>
