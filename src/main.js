// src/main.js

import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass }     from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { AfterimagePass } from 'three/examples/jsm/postprocessing/AfterimagePass.js';

// Camera controls
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// Stats and dat.GUI
import Stats from 'stats.js';

/* ----------------------------------------------------------------
 * 1. Orb & Bloom Settings
 * ----------------------------------------------------------------
 */
const orbSettings = {
  // Particle behavior
  curlSize:        0.035,
  speed:           1,  // This will be updated by Fruity sliders
  radius:          0.5,     // Initial spawn radius of particles
  attraction:      0.5,  // Updated by Sweet sliders
  color:           0xfff307,
  particleCount:   10000,

  // Bloom post-processing parameters
  bloomStrength:   0.1,
  bloomRadius:     0.1,
  bloomThreshold:  0.1,

  // Motion Blur
  motionBlurDamp:  0.5,   // Updated by Smokey sliders

  // Constant spin speed (radians per second)
  spinSpeed:       0.02,

  // Additional parameter for tangential (swirl) force (Spicy)
  swirlForce:      0.02
};

/* ----------------------------------------------------------------
 * 2. Basic Three.js Scene Setup
 * ----------------------------------------------------------------
 */
const scene = new THREE.Scene();
// scene.background = new THREE.Color(0x000000);
function createGradientTexture() {
  const size = 512; // Height of the gradient texture
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = size;
  const context = canvas.getContext('2d');

  // Create a vertical gradient
  const gradient = context.createLinearGradient(0, 0, 0, size);
  gradient.addColorStop(0, '#000000');  // Top: pure black
  gradient.addColorStop(1, '#1a1a1a');  // Bottom: a slightly lighter black

  context.fillStyle = gradient;
  context.fillRect(0, 0, 1, size);

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter; // Ensure smooth scaling
  return texture;
}

scene.background = createGradientTexture();

const camera = new THREE.PerspectiveCamera(
  50,
  window.innerWidth / window.innerHeight,
  0.1,
  2000
);
camera.position.z = 2.5;

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;

window.addEventListener('resize', onWindowResize, false);
function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);
}

/* ----------------------------------------------------------------
 * 3. (Optional) Lights
 * ----------------------------------------------------------------
 */
const ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
scene.add(ambientLight);

const pointLight = new THREE.PointLight(0xffffff, 0.8);
pointLight.position.set(5, 5, 5);
scene.add(pointLight);

/* ----------------------------------------------------------------
 * 4. Particle Geometry & Material
 * ----------------------------------------------------------------
 */
const positionsArray = new Float32Array(orbSettings.particleCount * 3);
const colorsArray = new Float32Array(orbSettings.particleCount * 3);
const particleGeometry = new THREE.BufferGeometry();
particleGeometry.setAttribute('position', new THREE.BufferAttribute(positionsArray, 3));
particleGeometry.setAttribute('color', new THREE.BufferAttribute(colorsArray, 3));

const particleMaterial = new THREE.PointsMaterial({
  size: 0.01,
  transparent: true,
  opacity: 1,
  depthWrite: false,
  vertexColors: true,
  blending: THREE.AdditiveBlending
});

particleMaterial.onBeforeCompile = (shader) => {
  shader.fragmentShader = shader.fragmentShader.replace(
    'void main() {',
    `
    void main() {
      // Calculate distance from the center of the point
      vec2 coord = gl_PointCoord - vec2(0.5);
      // If outside the circle, discard the fragment
      if(length(coord) > 0.5) discard;
    `
  );
};

const particlePoints = new THREE.Points(particleGeometry, particleMaterial);
scene.add(particlePoints);

/* ----------------------------------------------------------------
 * 5. Particle Data & Initialization
 * ----------------------------------------------------------------
 */
const allParticles = [];

/**
 * Initialize a single particle with a random position on a sphere
 * and a symmetric random velocity.
 */
function initParticle(particle, colorArr, index) {
  const randRadius = orbSettings.radius;
  const theta = Math.random() * 2 * Math.PI;
  const phi   = Math.acos(2 * Math.random() - 1);

  particle.x = randRadius * Math.sin(phi) * Math.cos(theta);
  particle.y = randRadius * Math.sin(phi) * Math.sin(theta);
  particle.z = randRadius * Math.cos(phi);

  // Use the current speed setting
  particle.vx = (Math.random() - 0.5) * 2 * orbSettings.speed;
  particle.vy = (Math.random() - 0.5) * 2 * orbSettings.speed;
  particle.vz = (Math.random() - 0.5) * 2 * orbSettings.speed;

  // Base color (yellowish)
  colorArr[index + 0] = 1.0; // red
  colorArr[index + 1] = 1.0; // green
  colorArr[index + 2] = 0.2; // blue
}

/**
 * Initialize all particles.
 */
function initAllParticles() {
  allParticles.length = 0;
  for (let i = 0; i < orbSettings.particleCount; i++) {
    const particle = { x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0 };
    initParticle(particle, colorsArray, i * 3);
    allParticles.push(particle);
  }
}
initAllParticles();

/* ----------------------------------------------------------------
 * 6. Post-Processing: Bloom and Motion Blur
 * ----------------------------------------------------------------
 */
const composer = new EffectComposer(renderer);
composer.setSize(window.innerWidth, window.innerHeight);

const renderPass = new RenderPass(scene, camera);
composer.addPass(renderPass);

const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  orbSettings.bloomStrength,
  orbSettings.bloomRadius,
  orbSettings.bloomThreshold
);
composer.addPass(bloomPass);
bloomPass.renderToScreen = false;

const afterimagePass = new AfterimagePass();
afterimagePass.uniforms["damp"].value = orbSettings.motionBlurDamp;
composer.addPass(afterimagePass);
afterimagePass.renderToScreen = true;

/* ----------------------------------------------------------------
 * 7. Flavor Settings & UI Event Listeners
 * ----------------------------------------------------------------
 *
 * We define four flavors (fruity, sweet, spicy, smokey), each having
 * two components: "smell" and "taste". The average of these two values
 * is used to adjust a parameter in orbSettings:
 *  - Fruity:    Adjusts particle speed.
 *  - Sweet:     Adjusts center attraction.
 *  - Spicy:     Adjusts tangential swirl force.
 *  - Smokey:    Adjusts motion blur damping.
 */
const flavorSettings = {
  fruity: { smell: 1, taste: 1 },
  sweet: { smell: 1, taste: 1 },
  spicy: { smell: 1, taste: 1 },
  smokey: { smell: 1, taste: 1 },
};

const baseFruitySpeed    = orbSettings.speed;
const baseSweetAttraction = orbSettings.attraction;
const baseSpicySwirl     = orbSettings.swirlForce;
const baseSmokeyBlur     = orbSettings.motionBlurDamp;

function updateFlavorSettings(flavor) {
  const avg = (flavorSettings[flavor].smell + flavorSettings[flavor].taste) / 2;
  switch (flavor) {
    case 'fruity':
      orbSettings.speed = baseFruitySpeed + 0.5 * (avg - 1);
      break;
    case 'sweet':
      orbSettings.attraction = baseSweetAttraction + 0.25 * (avg - 1);
      break;
    case 'spicy':
      orbSettings.swirlForce = baseSpicySwirl + 0.1 * (avg - 1);
      break;
    case 'smokey':
      orbSettings.motionBlurDamp = baseSmokeyBlur + 0.06 * (avg - 1);
      afterimagePass.uniforms["damp"].value = orbSettings.motionBlurDamp;
      break;
  }
}

// Attach listeners to each slider (make sure these IDs match your HTML)
document.getElementById('smell-fruity').addEventListener('input', (e) => {
  flavorSettings.fruity.smell = parseFloat(e.target.value);
  updateFlavorSettings('fruity');
});
document.getElementById('taste-fruity').addEventListener('input', (e) => {
  flavorSettings.fruity.taste = parseFloat(e.target.value);
  updateFlavorSettings('fruity');
});

document.getElementById('smell-sweet').addEventListener('input', (e) => {
  flavorSettings.sweet.smell = parseFloat(e.target.value);
  updateFlavorSettings('sweet');
});
document.getElementById('taste-sweet').addEventListener('input', (e) => {
  flavorSettings.sweet.taste = parseFloat(e.target.value);
  updateFlavorSettings('sweet');
});

document.getElementById('smell-spicy').addEventListener('input', (e) => {
  flavorSettings.spicy.smell = parseFloat(e.target.value);
  updateFlavorSettings('spicy');
});
document.getElementById('taste-spicy').addEventListener('input', (e) => {
  flavorSettings.spicy.taste = parseFloat(e.target.value);
  updateFlavorSettings('spicy');
});

document.getElementById('smell-smokey').addEventListener('input', (e) => {
  flavorSettings.smokey.smell = parseFloat(e.target.value);
  updateFlavorSettings('smokey');
});
document.getElementById('taste-smokey').addEventListener('input', (e) => {
  flavorSettings.smokey.taste = parseFloat(e.target.value);
  updateFlavorSettings('smokey');
});

/* ----------------------------------------------------------------
 * 8. Animation & Update Loop
 * ----------------------------------------------------------------
 */
const clock = new THREE.Clock();

const stats = new Stats();
stats.showPanel(0);
document.body.appendChild(stats.dom);

function animate() {
  stats.begin();

  requestAnimationFrame(animate);

  const deltaTime = clock.getDelta();

  // Update particle positions and properties
  updateParticles(deltaTime);

  // Apply a constant spin to the particle system
  particlePoints.rotation.y += orbSettings.spinSpeed * deltaTime;

  // Update camera controls
  controls.update();

  // Render the scene with post-processing
  composer.render();

  stats.end();
}

/**
 * Update all particles for a single frame.
 * Uses the flavor-adjusted settings to influence behavior:
 *  - Attraction (Sweet)
 *  - Noise (Fruity)
 *  - Swirl (Spicy)
 */
function updateParticles(deltaTime) {
  const { attraction, curlSize } = orbSettings;
  const time = performance.now() * 0.001;
  const resetDistance = 0.3;

  for (let i = 0; i < allParticles.length; i++) {
    const particle = allParticles[i];

    // 1. Attraction toward the center (Sweet effect)
    const dirToCenter = new THREE.Vector3(-particle.x, -particle.y, -particle.z).normalize();
    particle.vx += dirToCenter.x * orbSettings.attraction * deltaTime;
    particle.vy += dirToCenter.y * orbSettings.attraction * deltaTime;
    particle.vz += dirToCenter.z * orbSettings.attraction * deltaTime;

    // 2. Add simple curl noise scaled by speed (Fruity effect)
    const noiseX = Math.sin(time + i * 0.1) * curlSize;
    const noiseY = Math.cos(time + i * 0.2) * curlSize;
    const noiseZ = Math.sin(time * 0.3 + i) * curlSize;
    particle.vx += noiseX * orbSettings.speed * deltaTime;
    particle.vy += noiseY * orbSettings.speed * deltaTime;
    particle.vz += noiseZ * orbSettings.speed * deltaTime;

    // 3. Tangential (swirl) force for orbital effect (Spicy effect)
    const radialVec = new THREE.Vector3(particle.x, particle.y, particle.z).normalize();
    let arbitrary = new THREE.Vector3(0, 1, 0);
    if (Math.abs(radialVec.dot(arbitrary)) > 0.99) {
      arbitrary.set(1, 0, 0);
    }
    const tangent = new THREE.Vector3().crossVectors(radialVec, arbitrary).normalize();
    particle.vx += tangent.x * orbSettings.swirlForce * deltaTime;
    particle.vy += tangent.y * orbSettings.swirlForce * deltaTime;
    particle.vz += tangent.z * orbSettings.swirlForce * deltaTime;

    // Update position:
    particle.x += particle.vx * deltaTime;
    particle.y += particle.vy * deltaTime;
    particle.z += particle.vz * deltaTime;

    // Damping:
    particle.vx *= 0.98;
    particle.vy *= 0.98;
    particle.vz *= 0.98;

    // Reset if too close:
    const newDistance = Math.sqrt(particle.x * particle.x + particle.y * particle.y + particle.z * particle.z);
    if (newDistance < resetDistance) {
      initParticle(particle, colorsArray, i * 3);
    }

    // Update positions array:
    const idx = i * 3;
    positionsArray[idx + 0] = particle.x;
    positionsArray[idx + 1] = particle.y;
    positionsArray[idx + 2] = particle.z;

    // Update color based on depth:
    const camDistance = camera.position.distanceTo(new THREE.Vector3(particle.x, particle.y, particle.z));
    const brightness = THREE.MathUtils.clamp(1 - (camDistance / 15), 0.2, 1);
    colorsArray[idx + 0] = brightness;
    colorsArray[idx + 1] = brightness * 0.8;
    colorsArray[idx + 2] = brightness * 0.2;
  }

  particleGeometry.attributes.position.needsUpdate = true;
  particleGeometry.attributes.color.needsUpdate = true;
}

animate();