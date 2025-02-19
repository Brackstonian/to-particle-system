import ParticleSystem from './ParticleSystem';

let particleSystemInstance;

export function particleStart(containerSelector = '#webgl-background') {
    particleSystemInstance = new ParticleSystem(containerSelector);
    particleSystemInstance.loadAnimation();
}

export function particleStop() {
    if (particleSystemInstance) {
        particleSystemInstance.stopAnimation();
    }
}

export function updateParticleSettings(newSettings) {
    if (particleSystemInstance) {
        particleSystemInstance.updateParticleSettings(newSettings);
    }
}

export async function takeParticleScreenshot() {
    if (particleSystemInstance) {
        return particleSystemInstance.takeScreenshot();
    }
}

export default {
    particleStart,
    particleStop,
    updateParticleSettings,
};
