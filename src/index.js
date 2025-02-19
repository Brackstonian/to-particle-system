import {
    particleStart,
    takeParticleScreenshot,
    updateParticleSettings,
} from './particles/index';

document.addEventListener('DOMContentLoaded', () => {
    particleStart();

    const flavourColourMap = {
        sweet: { color: 0xefc300 },
        fruity: { color: 0x9747ff },
        spicy: { color: 0xff0141 },
        smokey: { color: 0xd65900 },
    };

    // Start with "sweet" as the current flavor.
    let currentFlavor = 'sweet';
    let baseBloomStrength = 0.1; // initial particle count
    let baseCurlSize = 0.5; // initial particle count
    let baseMotionBlurDamp = 0.15;
    let baseSpeed = 0.5;

    // Store cumulative slider values for each flavor.
    // This lets each flavor remember its last slider value.
    const cumulativeSliderValues = {
        sweet: 0,
        fruity: 0,
        spicy: 0,
        smokey: 0,
    };

    // Listen for button clicks on any element with a "data-target" attribute
    document.querySelectorAll('[data-target]').forEach((button) => {
        button.addEventListener('click', (e) => {
            const targetName = e.currentTarget.getAttribute('data-target');
            if (
                targetName === 'smell-fruity' ||
                targetName === 'taste-fruity'
            ) {
                updateParticleSettings({
                    color: flavourColourMap.fruity.color,
                });
                currentFlavor = 'fruity';
            } else if (
                targetName === 'smell-sweet' ||
                targetName === 'taste-sweet'
            ) {
                updateParticleSettings({ color: flavourColourMap.sweet.color });
                currentFlavor = 'sweet';
            } else if (
                targetName === 'smell-spicy' ||
                targetName === 'taste-spicy'
            ) {
                updateParticleSettings({ color: flavourColourMap.spicy.color });
                currentFlavor = 'spicy';
            } else if (
                targetName === 'smell-smokey' ||
                targetName === 'taste-smokey'
            ) {
                updateParticleSettings({
                    color: flavourColourMap.smokey.color,
                });
                currentFlavor = 'smokey';
            }
        });
    });

    let baseSelectedItems = 0;

    document.querySelectorAll('.slider').forEach((slider) => {
        slider.dataset.lastValue = slider.value;
        slider.addEventListener('input', (e) => {
            const sliderValue = parseFloat(e.target.value);
            const lastSliderValue = parseFloat(e.target.dataset.lastValue);

            if (
                e.target.id === 'smell-sweet' ||
                e.target.id === 'taste-sweet'
            ) {
                console.log(e.target.id);
                if (sliderValue > lastSliderValue) {
                    baseSpeed += 0.01;
                } else {
                    baseSpeed -= 0.01;
                }
            }

            if (
                e.target.id === 'smell-spicy' ||
                e.target.id === 'taste-spicy'
            ) {
                console.log(e.target.id);
                if (sliderValue > lastSliderValue) {
                    baseCurlSize += 0.5;
                } else {
                    baseCurlSize -= 0.5;
                }
            }

            if (
                e.target.id === 'smell-smokey' ||
                e.target.id === 'taste-smokey'
            ) {
                console.log(e.target.id);
                if (sliderValue > lastSliderValue) {
                    baseMotionBlurDamp += 0.05;
                } else {
                    baseMotionBlurDamp -= 0.05;
                }
            }
            if (
                e.target.id === 'smell-fruity' ||
                e.target.id === 'taste-fruity'
            ) {
                console.log(e.target.id);
                if (sliderValue > lastSliderValue) {
                    baseBloomStrength += 1;
                } else {
                    baseBloomStrength -= 1;
                }
            }

            // if (sliderValue > lastSliderValue) {
            //     baseSelectedItems += 1;
            //     // baseParticleCount += 500
            //     baseCurlSize += 0.005
            // } else {
            //     baseSelectedItems -= 1;
            //     // baseParticleCount -= 500
            //     baseCurlSize -= 0.005
            // }

            updateParticleSettings({
                bloomStrength: baseBloomStrength,
                curlSize: baseCurlSize,
                speed: baseSpeed,
                motionBlurDamp: baseMotionBlurDamp,
            });

            // Update the slider's own last value
            e.target.dataset.lastValue = sliderValue;

            console.log('🚀 sliderValue:', sliderValue);
            console.log('🚀 baseSelectedItems:', baseSelectedItems);
        });
    });
});

const screenshotButton = document.getElementById('screenshot');
screenshotButton.addEventListener('click', async () => {
    // Optionally, you can inspect "myObject.screenshotStatus" while the animation runs.
    const screenshotData = await takeParticleScreenshot();

    // Create a temporary anchor element to trigger the download.
    const link = document.createElement('a');
    link.href = screenshotData;
    link.download = 'screenshot.png'; // specify the filename
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
});
