import * as THREE from 'three';

export default class ParticleManager {
    constructor({ orbSettings, scene, camera }) {
        this.orbSettings = orbSettings;
        this.scene = scene;
        this.camera = camera;
        this.initParticleAttributes();
        this.initAllParticles();
    }

    initParticleAttributes() {
        this.positionsArray = new Float32Array(
            this.orbSettings.particleCount * 3
        );
        this.colorsArray = new Float32Array(this.orbSettings.particleCount * 3);
        this.particleGeometry = new THREE.BufferGeometry();
        this.particleGeometry.setAttribute(
            'position',
            new THREE.BufferAttribute(this.positionsArray, 3)
        );
        this.particleGeometry.setAttribute(
            'color',
            new THREE.BufferAttribute(this.colorsArray, 3)
        );

        // Create a PointsMaterial.
        this.particleMaterial = new THREE.PointsMaterial({
            size: 0.12,
            transparent: true,
            opacity: 1,
            depthWrite: false,
            vertexColors: true,
            blending: THREE.AdditiveBlending,
        });

        // Clip each point to a circular shape.
        this.particleMaterial.onBeforeCompile = (shader) => {
            shader.fragmentShader = shader.fragmentShader.replace(
                'void main() {',
                `void main() {
                    vec2 coord = gl_PointCoord - vec2(0.5);
                    if(length(coord) > 0.5) discard;
                `
            );
        };

        this.particlePoints = new THREE.Points(
            this.particleGeometry,
            this.particleMaterial
        );
        this.scene.add(this.particlePoints);
        this.allParticles = [];
    }

    initParticle(particle, index) {
        const baseRadius = this.orbSettings.radius;
        const randomFactor = 0.6 + Math.random() * 0.5;
        const radius = baseRadius * randomFactor;
        const theta = Math.random() * 2 * Math.PI;
        const phi = Math.acos(2 * Math.random() - 1);
        particle.x = radius * Math.sin(phi) * Math.cos(theta);
        particle.y = radius * Math.sin(phi) * Math.sin(theta);
        particle.z = radius * Math.cos(phi);
        particle.vx = (Math.random() - 0.5) * this.orbSettings.speed;
        particle.vy = (Math.random() - 0.5) * this.orbSettings.speed;
        particle.vz = (Math.random() - 0.5) * this.orbSettings.speed;

        // Set an initial color.
        const idx = index * 3;
        this.colorsArray[idx + 0] = 1.0;
        this.colorsArray[idx + 1] = 1.0;
        this.colorsArray[idx + 2] = 0.2;
    }

    initAllParticles() {
        this.allParticles = [];
        for (let i = 0; i < this.orbSettings.particleCount; i++) {
            const particle = { x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0 };
            this.initParticle(particle, i);
            this.allParticles.push(particle);
        }
    }

    updateParticles(deltaTime, currentColor, camera) {
        const { attraction, curlSize, speed, swirlForce } = this.orbSettings;
        const time = performance.now() * 0.001;

        for (let i = 0; i < this.allParticles.length; i++) {
            const particle = this.allParticles[i];

            // Attraction toward the center.
            const dirToCenter = new THREE.Vector3(-particle.x, -particle.y, -particle.z).normalize();
            particle.vx += dirToCenter.x * attraction * this.orbSettings.speed * deltaTime;
            particle.vy += dirToCenter.y * attraction * this.orbSettings.speed * deltaTime;
            particle.vz += dirToCenter.z * attraction * this.orbSettings.speed * deltaTime;
            
            // Add curl noise with per-particle variation.
            const noiseX = Math.sin(time + i * 0.1) * curlSize;
            const noiseY = Math.cos(time + i * 0.1) * curlSize;
            const noiseZ = Math.sin(time * 0.1 + i) * curlSize;
            particle.vx += noiseX * speed * deltaTime;
            particle.vy += noiseY * speed * deltaTime;
            particle.vz += noiseZ * speed * deltaTime;

            // Tangential swirl force for orbital motion.
            const radialVec = new THREE.Vector3(particle.x, particle.y, particle.z).normalize();
            let arbitrary = new THREE.Vector3(0, 1, 0);
            if (Math.abs(radialVec.dot(arbitrary)) > 0.99) {
                arbitrary.set(1, 0, 0);
            }
            const tangent = new THREE.Vector3().crossVectors(radialVec, arbitrary).normalize();
            particle.vx += tangent.x * swirlForce * deltaTime;
            particle.vy += tangent.y * swirlForce * deltaTime;
            particle.vz += tangent.z * swirlForce * deltaTime;

            // Update position.
            particle.x += particle.vx * deltaTime;
            particle.y += particle.vy * deltaTime;
            particle.z += particle.vz * deltaTime;

            // Apply damping.
            particle.vx *= 0.8;
            particle.vy *= 0.8;
            particle.vz *= 0.8;

            // Optionally, re-enable or adjust a reset condition if needed:
            const newDistance = Math.sqrt(particle.x ** 2 + particle.y ** 2 + particle.z ** 2);
            if (newDistance < 0.1) {
                this.initParticle(particle, i);
            }

            // Update positions array.
            const idx = i * 3;
            this.positionsArray[idx + 0] = particle.x;
            this.positionsArray[idx + 1] = particle.y;
            this.positionsArray[idx + 2] = particle.z;

            // Update color based on camera distance.
            const camDistance = camera.position.distanceTo(
                new THREE.Vector3(particle.x, particle.y, particle.z)
            );
            const brightness = THREE.MathUtils.clamp(
                1 - camDistance / 15,
                0.2,
                1
            );
            this.colorsArray[idx + 0] = currentColor.r * brightness;
            this.colorsArray[idx + 1] = currentColor.g * brightness;
            this.colorsArray[idx + 2] = currentColor.b * brightness;
        }
        this.particleGeometry.attributes.position.needsUpdate = true;
        this.particleGeometry.attributes.color.needsUpdate = true;
    }

    reinitializeParticles(newCount) {
        if (this.particlePoints) {
            this.scene.remove(this.particlePoints);
            this.particleGeometry.dispose();
        }
        this.positionsArray = new Float32Array(newCount * 3);
        this.colorsArray = new Float32Array(newCount * 3);
        this.particleGeometry = new THREE.BufferGeometry();
        this.particleGeometry.setAttribute(
            'position',
            new THREE.BufferAttribute(this.positionsArray, 3)
        );
        this.particleGeometry.setAttribute(
            'color',
            new THREE.BufferAttribute(this.colorsArray, 3)
        );
        this.particleGeometry.setDrawRange(0, newCount);
        this.particlePoints = new THREE.Points(
            this.particleGeometry,
            this.particleMaterial
        );
        this.scene.add(this.particlePoints);
        // Avoid recursion by not reassigning particleCount.
        this.initAllParticles();
    }
}
