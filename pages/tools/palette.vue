<template>
    <div class="mx-auto max-w-4xl">
        <div class="flex justify-between items-center mb-6">
            <div>
                <h1 class="text-2xl font-bold">Color Palette Generator</h1>
                <p class="text-gray-600">Easily generate color palettes.</p>
            </div>

            <button
                @click="sharePalette"
                class="px-4 py-2 text-white bg-purple-600 rounded-md hover:bg-purple-700"
            >
                Share Palette
            </button>
        </div>
        <div class="p-6 bg-white rounded-lg shadow">
            <div class="mb-6">
                <label class="block mb-2 text-sm font-medium text-gray-700">
                    Base Color
                </label>
                <div class="flex gap-4">
                    <input
                        v-model="palette.baseColor"
                        type="color"
                        class="w-20 h-10"
                    />
                    <input
                        v-model="palette.baseColor"
                        type="text"
                        class="flex-1 px-3 py-2 rounded-md border"
                        placeholder="#000000"
                    />
                    <button
                        @click="generatePalette"
                        class="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700"
                    >
                        Generate New
                    </button>
                </div>
            </div>

            <div class="mb-6">
                <label class="block mb-2 text-sm font-medium text-gray-700">
                    Scheme Type
                </label>
                <select
                    v-model="palette.schemeType"
                    class="px-3 py-2 w-full rounded-md border"
                >
                    <option
                        v-for="scheme in Object.keys(colorSchemes)"
                        :key="colorSchemes[scheme]"
                        :value="colorSchemes[scheme]"
                    >
                        {{ scheme }}
                    </option>
                </select>
            </div>

            <div
                class="grid grid-cols-1 gap-4 mb-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
            >
                <div v-if="palette.colors.length === 0">
                    <div class="flex justify-center items-center h-24">
                        No colors generated
                    </div>
                </div>
                <div
                    v-for="color in palette.colors"
                    :key="color.hex"
                    class="relative group"
                >
                    <div
                        class="h-24 rounded-lg shadow-sm cursor-pointer"
                        :style="{ backgroundColor: color.hex }"
                        @click="copyColor(color.hex)"
                    ></div>
                    <div class="mt-2 text-sm text-center">
                        {{ color.hex }}
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import Values from 'values.js';
import { useLocalStorage } from '@vueuse/core';
import { useToast } from '~/composables/useToast';
import { useShareLink } from '~/composables/useShareLink';

const toast = useToast();
const { generateShareLink, getSharedData } = useShareLink();

const palette = useLocalStorage('palette', {
    baseColor: '#4A90E2',
    schemeType: 'monochromatic',
    colors: [],
});

const colorSchemes = {
    Monochromatic: 'monochromatic',
    Analogous: 'analogous',
    Complementary: 'complementary',
    Triadic: 'triadic',
    Tetradic: 'tetradic',
    'Split Complementary': 'split-complementary',
    Square: 'square',
};

const hexToHsl = (hex) => {
    // Remove '#' if present
    hex = hex.replace(/^#/, '');

    // Convert 3-digit hex to 6-digit hex
    if (hex.length === 3) {
        hex = hex
            .split('')
            .map((x) => x + x)
            .join('');
    }

    const r = parseInt(hex.substring(0, 2), 16) / 255;
    const g = parseInt(hex.substring(2, 4), 16) / 255;
    const b = parseInt(hex.substring(4, 6), 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const delta = max - min;

    let h = 0;
    if (delta !== 0) {
        if (max === r) {
            h = ((g - b) / delta + (g < b ? 6 : 0)) * 60;
        } else if (max === g) {
            h = ((b - r) / delta + 2) * 60;
        } else {
            h = ((r - g) / delta + 4) * 60;
        }
    }

    const l = (max + min) / 2;
    const s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));

    return [Math.round(h), Math.round(s * 100), Math.round(l * 100)];
};

function hslToHex(h, s, l) {
    // Convert saturation and lightness from percentage to fraction
    s /= 100;
    l /= 100;

    // Calculate chroma
    const c = (1 - Math.abs(2 * l - 1)) * s;

    // Calculate intermediate value x
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));

    // Match chroma (c) and intermediate value (x) to RGB color
    const m = l - c / 2;
    let r = 0,
        g = 0,
        b = 0;

    if (h >= 0 && h < 60) {
        r = c;
        g = x;
        b = 0;
    } else if (h >= 60 && h < 120) {
        r = x;
        g = c;
        b = 0;
    } else if (h >= 120 && h < 180) {
        r = 0;
        g = c;
        b = x;
    } else if (h >= 180 && h < 240) {
        r = 0;
        g = x;
        b = c;
    } else if (h >= 240 && h < 300) {
        r = x;
        g = 0;
        b = c;
    } else if (h >= 300 && h < 360) {
        r = c;
        g = 0;
        b = x;
    }

    // Convert RGB values to hex
    const toHex = (n) => {
        const hex = Math.round((n + m) * 255).toString(16);
        return hex.length === 1 ? '0' + hex : hex;
    };

    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

const generatePalette = () => {
    try {
        debugger;
        const values = new Values(palette.value.baseColor);

        switch (palette.value.schemeType) {
            case 'monochromatic':
                palette.value.colors = values.all(20).map((color) => ({
                    hex: color.hexString(),
                }));
                break;

            case 'analogous':
                const baseHSL = hexToHsl(palette.value.baseColor);
                palette.value.colors = [
                    { hex: palette.value.baseColor },

                    {
                        hex: hslToHex(
                            (baseHSL[0] + 30) % 360,
                            baseHSL[1],
                            baseHSL[2]
                        ),
                    },

                    {
                        hex: hslToHex(
                            (baseHSL[0] + 60) % 360,
                            baseHSL[1],
                            baseHSL[2]
                        ),
                    },

                    {
                        hex: hslToHex(
                            (baseHSL[0] - 30 + 360) % 360,
                            baseHSL[1],
                            baseHSL[2]
                        ),
                    },
                    {
                        hex: hslToHex(
                            (baseHSL[0] - 60 + 360) % 360,
                            baseHSL[1],
                            baseHSL[2]
                        ),
                    },
                ];
                break;

            case 'complementary':
                const compHSL = hexToHsl(palette.value.baseColor);
                const complementaryHSL = [
                    (compHSL[0] + 180) % 360,
                    compHSL[1],
                    compHSL[2],
                ];
                palette.value.colors = [
                    ...values
                        .tints(3)
                        .reverse()
                        .map((color) => ({ hex: color.hexString() })),
                    { hex: palette.value.baseColor },
                    ...values
                        .shades(3)
                        .map((color) => ({ hex: color.hexString() })),
                ];
                break;

            case 'triadic':
                const triadicHSL = hexToHsl(palette.value.baseColor);
                palette.value.colors = [
                    { hex: palette.value.baseColor },
                    {
                        hex: hslToHex(
                            (triadicHSL[0] + 120) % 360,
                            triadicHSL[1],
                            triadicHSL[2]
                        ),
                    },
                    {
                        hex: hslToHex(
                            (triadicHSL[0] + 240) % 360,
                            triadicHSL[1],
                            triadicHSL[2]
                        ),
                    },
                ];
                break;

            case 'tetradic':
                const tetradicHSL = hexToHsl(palette.value.baseColor);
                palette.value.colors = [
                    { hex: palette.value.baseColor },
                    {
                        hex: hslToHex(
                            (tetradicHSL[0] + 90) % 360,
                            tetradicHSL[1],
                            tetradicHSL[2]
                        ),
                    },
                    {
                        hex: hslToHex(
                            (tetradicHSL[0] + 180) % 360,
                            tetradicHSL[1],
                            tetradicHSL[2]
                        ),
                    },
                    {
                        hex: hslToHex(
                            (tetradicHSL[0] + 270) % 360,
                            tetradicHSL[1],
                            tetradicHSL[2]
                        ),
                    },
                ];
                break;

            case 'split-complementary':
                const splitHSL = hexToHsl(palette.value.baseColor);
                palette.value.colors = [
                    { hex: palette.value.baseColor },
                    {
                        hex: hslToHex(
                            (splitHSL[0] + 150) % 360,
                            splitHSL[1],
                            splitHSL[2]
                        ),
                    },
                    {
                        hex: hslToHex(
                            (splitHSL[0] + 210) % 360,
                            splitHSL[1],
                            splitHSL[2]
                        ),
                    },
                ];
                break;

            case 'square':
                const squareHSL = hexToHsl(palette.value.baseColor);
                palette.value.colors = [
                    { hex: palette.value.baseColor },
                    {
                        hex: hslToHex(
                            (squareHSL[0] + 90) % 360,
                            squareHSL[1],
                            squareHSL[2]
                        ),
                    },
                    {
                        hex: hslToHex(
                            (squareHSL[0] + 180) % 360,
                            squareHSL[1],
                            squareHSL[2]
                        ),
                    },
                    {
                        hex: hslToHex(
                            (squareHSL[0] + 270) % 360,
                            squareHSL[1],
                            squareHSL[2]
                        ),
                    },
                ];
                break;
            default:
                palette.value.colors = [];
                toast.error('Invalid scheme type selected');
                break;
        }
    } catch (error) {
        toast.error('Invalid color value');
    }
};

const copyColor = (hex) => {
    navigator.clipboard.writeText(hex);
    toast.success(`Color ${hex} copied to clipboard!`);
};

const sharePalette = async () => {
    const link = await generateShareLink('/tools/palette', {
        palette: {
            baseColor: palette.value.baseColor,
            schemeType: palette.value.schemeType,
        },
    });
    if (link) {
        navigator.clipboard.writeText(link);
        toast.success('Share link copied to clipboard!');
    } else {
        toast.error('Failed to generate share link');
    }
};

onMounted(async () => {
    const shared = await getSharedData();
    if (shared?.palette) {
        palette.value = shared.palette;
    }
    generatePalette();
});

watch(
    () => [palette.value.baseColor, palette.value.schemeType],
    generatePalette,
    { deep: true }
);
</script>
