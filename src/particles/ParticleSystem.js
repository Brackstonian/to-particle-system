import * as THREE from 'three';
import Renderer from './Renderer';
import ParticleManager from './ParticleManager';

export default class ParticleSystem {
    constructor(containerSelector = '#webgl-background') {
        this.containerSelector = containerSelector;
        this.container = document.querySelector(this.containerSelector);

        this.initialOrbSettings = {
            curlSize: 0.5,
            speed: 3.0,
            radius: 2.0,
            attraction: 0.035,
            color: 0xfff307,
            particleCount: 3000,
            bloomStrength: 0.1,
            bloomRadius: 1.0,
            bloomThreshold: 1.0,
            motionBlurDamp: 0.05,
            spinSpeed: 0.0,
            swirlForce: 0.0,
        };

        // Use a Proxy so that if particleCount or color change, we can react immediately.
        this.orbSettings = new Proxy(this.initialOrbSettings, {
            set: (target, key, value) => {
                target[key] = value;
                if (key === 'color') {
                    this.targetColor = new THREE.Color(value);
                }
                if (key === 'particleCount' && this.particleManager) {
                    this.particleManager.reinitializeParticles(value);
                }
                if (key === 'motionBlurDamp') {
                    this.rendererInstance.afterimagePass.uniforms[
                        'damp'
                    ].value = value;
                }
                if (key === 'bloomStrength') {
                    this.rendererInstance.render();
                }
                return true;
            },
        });

        // Cache the starting color.
        this.orbColor = new THREE.Color(this.orbSettings.color);
        this.currentColor = this.orbColor.clone();
        this.targetColor = this.orbColor.clone();

        this.clock = new THREE.Clock();
        this.animationId = null;

        if (!this.container) {
            const interval = setInterval(() => {
                const container = document.querySelector(
                    this.containerSelector
                );
                if (container) {
                    clearInterval(interval);
                    this.container = container;
                    this.init();
                }
            }, 500);
        } else {
            this.init();
        }
    }

    init() {
        // Initialize the Renderer (scene, camera, controls, post-processing)
        this.rendererInstance = new Renderer({
            container: this.container,
            orbSettings: this.orbSettings,
        });
        this.scene = this.rendererInstance.scene;
        this.camera = this.rendererInstance.camera;
        this.composer = this.rendererInstance.composer;
        // this.controls = this.rendererInstance.controls;

        // Initialize the ParticleManager (handles particles creation and update)
        this.particleManager = new ParticleManager({
            orbSettings: this.orbSettings,
            scene: this.scene,
            camera: this.camera,
        });

        // Bind the animation loop.
        this.animate = this.animate.bind(this);
    }

    animate() {
        const deltaTime = this.clock.getDelta();

        // Smoothly interpolate particle color.
        this.currentColor.lerp(this.targetColor, deltaTime / 0.2);

        // Update particles based on the new deltaTime.
        this.particleManager.updateParticles(
            deltaTime,
            this.currentColor,
            this.camera
        );
        // this.particleManager.particlePoints.rotation.y +=
        //     this.orbSettings.spinSpeed * deltaTime;

        // Update controls and render the scene.
        // this.controls.update();
        this.rendererInstance.render();


        this.animationId = requestAnimationFrame(this.animate);
    }

    updateParticleSettings(newSettings = {}) {
        // Update the particle color if provided.
        if (newSettings.color) {
            this.orbSettings.color = newSettings.color;
            this.targetColor = new THREE.Color(newSettings.color);
        }

        if (newSettings.speed) {
            this.orbSettings.speed = newSettings.speed;
        }

        if (newSettings.curlSize) {
            this.orbSettings.curlSize = newSettings.curlSize;
        }

        if (newSettings.motionBlurDamp) {
            this.orbSettings.motionBlurDamp = newSettings.motionBlurDamp;
        }

        if (newSettings.bloomStrength) {
            this.orbSettings.bloomStrength = newSettings.bloomStrength;
        }

        if (newSettings.particleCount) {
            this.orbSettings.particleCount = newSettings.particleCount;
        }
    }

    loadAnimation() {
        if (!this.animationId) {
            this.clock.getDelta(); // reset the clock
            this.animate();
        }
    }

    stopAnimation() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        const canvas = this.rendererInstance.renderer.domElement;
        if (canvas && canvas.parentNode) {
            canvas.remove();
        }
    }

    // Assuming this code is within a class or object where "this.camera" and "this.rendererInstance" are defined.
    async takeScreenshot() {
        // Set initial status: animation is in progress
        this.screenshotStatus = { animating: true, complete: false };

        const originalZ = this.camera.position.z;
        const targetZ = 1; // Target z position for the zoom
        const duration = 1000; // Duration in milliseconds

        // Helper: returns a promise that resolves when the lerp animation finishes.
        const animateLerp = (start, end, startTime) => {
            return new Promise((resolve) => {
                const animate = (currentTime) => {
                    const elapsed = currentTime - startTime;
                    const t = Math.min(elapsed / duration, 1); // t is normalized (0 to 1)
                    // Update camera position using linear interpolation.
                    this.camera.position.z = THREE.MathUtils.lerp(
                        start,
                        end,
                        t
                    );
                    this.camera.updateProjectionMatrix();
                    this.rendererInstance.render();

                    if (t < 1) {
                        requestAnimationFrame(animate);
                    } else {
                        resolve();
                    }
                };
                requestAnimationFrame(animate);
            });
        };

        // Animate zoom in.
        await animateLerp(originalZ, targetZ, performance.now());

        // Once zoomed in, capture the screenshot.
        const screenshotDataUrl =
            this.rendererInstance.renderer.domElement.toDataURL('image/png');

        // Animate zoom out.
        await animateLerp(targetZ, originalZ, performance.now());

        // Update status: animation complete and data is available.
        this.screenshotStatus = {
            animating: false,
            complete: true,
            data: screenshotDataUrl,
        };

        return screenshotDataUrl;
    }
}
