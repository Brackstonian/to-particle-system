import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { AfterimagePass } from 'three/examples/jsm/postprocessing/AfterimagePass.js';

export default class Renderer {
    constructor({ container, orbSettings }) {
        this.container = container;
        this.orbSettings = orbSettings;
        this.init();
    }

    init() {
        // Create Scene.
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x000000);

        // Set up Camera.
        this.camera = new THREE.PerspectiveCamera(
            50,
            window.innerWidth / window.innerHeight,
            0.1,
            2000
        );
        this.camera.position.z = 10.5;
        this.camera.enableDamping = true;
        this.targetCameraPosition = this.camera.position.clone();

        // Create WebGLRenderer.
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.container.appendChild(this.renderer.domElement);

        // Set up OrbitControls.
        this.controls = new OrbitControls(
            this.camera,
            this.renderer.domElement
        );
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;

        // Add basic lighting.
        this.ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
        this.scene.add(this.ambientLight);
        this.pointLight = new THREE.PointLight(0xffffff, 0.8);
        this.pointLight.position.set(5, 5, 5);
        this.scene.add(this.pointLight);

        // Set up post-processing with EffectComposer.
        this.composer = new EffectComposer(this.renderer);
        this.composer.setSize(window.innerWidth, window.innerHeight);
        this.renderPass = new RenderPass(this.scene, this.camera);
        this.composer.addPass(this.renderPass);

        this.bloomPass = new UnrealBloomPass(
            new THREE.Vector2(window.innerWidth, window.innerHeight),
            this.orbSettings.bloomStrength,
            this.orbSettings.bloomRadius,
            this.orbSettings.bloomThreshold
        );
        this.composer.addPass(this.bloomPass);
        this.bloomPass.renderToScreen = false;

        this.afterimagePass = new AfterimagePass();
        this.afterimagePass.uniforms['damp'].value =
            this.orbSettings.motionBlurDamp;
        this.composer.addPass(this.afterimagePass);
        this.afterimagePass.renderToScreen = true;

        window.addEventListener(
            'resize',
            this.onWindowResize.bind(this),
            false
        );
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.composer.setSize(window.innerWidth, window.innerHeight);
    }

    render() {
        this.composer.render();
    }
}
