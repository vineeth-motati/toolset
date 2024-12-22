<!-- src/components/animation.vue -->
<template>
    <div class="p-4 mx-auto max-w-6xl">
        <!-- Header -->
        <div class="flex justify-between items-center mb-6">
            <h1 class="text-2xl font-bold">CSS Animation Generator</h1>
            <button
                @click="shareAnimation"
                class="px-4 py-2 text-white bg-purple-600 rounded-md hover:bg-purple-700"
            >
                Share Animation
            </button>
        </div>

        <!-- Main Grid -->
        <div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <!-- Controls Panel -->
            <div class="p-6 space-y-6 bg-white rounded-lg shadow lg:col-span-1">
                <!-- Preset Selector -->
                <AnimationPresetSelector
                    @apply-preset="applyPreset"
                    :onApply="applyPreset"
                />

                <!-- Animation Properties Controls -->
                <div>
                    <label class="block mb-2 text-sm font-medium text-gray-700">
                        Animation Name
                    </label>
                    <input
                        v-model="animation.animationName"
                        type="text"
                        class="px-3 py-2 w-full rounded-md border"
                        placeholder="myAnimation"
                    />
                </div>

                <div>
                    <label class="block mb-2 text-sm font-medium text-gray-700">
                        Duration (seconds)
                    </label>
                    <input
                        v-model="animation.duration"
                        type="number"
                        step="0.1"
                        min="0"
                        class="px-3 py-2 w-full rounded-md border"
                    />
                </div>

                <div>
                    <label class="block mb-2 text-sm font-medium text-gray-700">
                        Timing Function
                    </label>
                    <select
                        v-model="animation.timingFunction"
                        class="px-3 py-2 w-full rounded-md border"
                    >
                        <option
                            v-for="timing in timingFunctions"
                            :key="timing"
                            :value="timing"
                        >
                            {{ timing }}
                        </option>
                    </select>
                </div>

                <div
                    v-if="animation.timingFunction === 'cubic-bezier'"
                    class="space-y-2"
                >
                    <label class="block mb-2 text-sm font-medium text-gray-700">
                        Cubic-Bezier Points
                    </label>
                    <div class="flex space-x-2">
                        <input
                            v-model.number="animation.cubicBezier[0]"
                            type="number"
                            step="0.01"
                            min="0"
                            max="1"
                            class="px-3 py-1 w-1/4 text-sm rounded-md border"
                            placeholder="P1x"
                        />
                        <input
                            v-model.number="animation.cubicBezier[1]"
                            type="number"
                            step="0.01"
                            min="0"
                            max="1"
                            class="px-3 py-1 w-1/4 text-sm rounded-md border"
                            placeholder="P1y"
                        />
                        <input
                            v-model.number="animation.cubicBezier[2]"
                            type="number"
                            step="0.01"
                            min="0"
                            max="1"
                            class="px-3 py-1 w-1/4 text-sm rounded-md border"
                            placeholder="P2x"
                        />
                        <input
                            v-model.number="animation.cubicBezier[3]"
                            type="number"
                            step="0.01"
                            min="0"
                            max="1"
                            class="px-3 py-1 w-1/4 text-sm rounded-md border"
                            placeholder="P2y"
                        />
                    </div>
                </div>

                <div>
                    <label class="block mb-2 text-sm font-medium text-gray-700">
                        Iteration Count
                    </label>
                    <select
                        v-model="animation.iterationCount"
                        class="px-3 py-2 w-full rounded-md border"
                    >
                        <option :value="1">1</option>
                        <option :value="2">2</option>
                        <option :value="3">3</option>
                        <option value="infinite">Infinite</option>
                    </select>
                </div>

                <div>
                    <label class="block mb-2 text-sm font-medium text-gray-700">
                        Direction
                    </label>
                    <select
                        v-model="animation.direction"
                        class="px-3 py-2 w-full rounded-md border"
                    >
                        <option value="normal">Normal</option>
                        <option value="reverse">Reverse</option>
                        <option value="alternate">Alternate</option>
                        <option value="alternate-reverse">
                            Alternate Reverse
                        </option>
                    </select>
                </div>

                <!-- Keyframe Properties -->
                <div class="space-y-4">
                    <h3 class="font-medium">Keyframe Timeline</h3>
                    <!-- Timeline visualization -->
                    <div class="relative mb-8">
                        <div
                            class="relative h-2 bg-gray-200 rounded-full"
                            @mousemove="handleTimelineMouseMove"
                            @mouseleave="handleTimelineMouseLeave"
                            @dblclick="handleTimelineDoubleClick"
                        >
                            <!-- Hover marker placeholder -->
                            <div
                                v-if="shouldShowCustomPercentage"
                                :style="{ left: `${customPercentage}%` }"
                                class="absolute z-20 -mt-1 w-4 h-4 bg-gray-400 rounded-full transform -translate-x-1/2 pointer-events-none"
                            >
                                <!-- Hover percentage indicator -->
                                <div
                                    v-if="shouldShowCustomPercentage"
                                    class="absolute -top-8 z-20 px-2 py-1 text-xs text-white bg-gray-800 rounded transform -translate-x-1/4 pointer-events-none"
                                >
                                    {{ customPercentage }}%
                                </div>
                            </div>

                            <!-- Keyframe markers -->
                            <div
                                v-for="keyframe in sortedKeyframes"
                                :key="keyframe.percentage"
                                :style="{ left: `${keyframe.percentage}%` }"
                                class="absolute -mt-1 w-4 h-4 bg-blue-500 rounded-full transform -translate-x-1/2 cursor-pointer hover:bg-blue-600 group"
                                @click="toggleKeyframeSelection(keyframe)"
                                @mouseenter="handleKeyframeMouseEnter(keyframe)"
                            >
                                <div
                                    class="absolute -top-8 left-1/2 px-2 py-1 text-xs text-white bg-gray-800 rounded opacity-0 transition-opacity transform -translate-x-1/2 group-hover:opacity-100"
                                    :class="{
                                        'opacity-100':
                                            selectedKeyframe === keyframe,
                                    }"
                                >
                                    {{ keyframe.percentage }}%
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Selected keyframe editor -->
                    <div
                        v-if="selectedKeyframe"
                        class="p-4 bg-gray-50 rounded-lg border"
                    >
                        <div class="flex justify-between items-center mb-4">
                            <span class="font-medium">
                                Keyframe at {{ selectedKeyframe.percentage }}%
                            </span>
                            <div class="flex gap-2">
                                <button
                                    v-if="animation.keyframes.length > 2"
                                    @click="
                                        removeKeyframe(
                                            animation.keyframes.indexOf(
                                                selectedKeyframe
                                            )
                                        )
                                    "
                                    class="p-1 text-red-600 rounded hover:text-red-800"
                                >
                                    <Icon icon="mdi:delete" class="w-5 h-5" />
                                </button>
                                <button
                                    @click="selectedKeyframe = null"
                                    class="p-1 text-gray-600 rounded hover:text-gray-800"
                                >
                                    <Icon icon="mdi:close" class="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        <div class="space-y-4">
                            <div
                                v-for="prop in filteredAvailableProperties"
                                :key="prop.name"
                            >
                                <label
                                    class="block mb-1 text-sm font-medium text-gray-700"
                                >
                                    {{ prop.label }}
                                </label>
                                <div class="flex gap-2">
                                    <input
                                        v-if="prop.type === 'color'"
                                        :value="
                                            selectedKeyframe.properties[
                                                prop.name
                                            ]
                                        "
                                        @input="
                                            updateKeyframeProperty(
                                                animation.keyframes.indexOf(
                                                    selectedKeyframe
                                                ),
                                                prop.name,
                                                $event.target.value
                                            )
                                        "
                                        type="color"
                                        class="w-16 h-8"
                                    />
                                    <input
                                        v-else
                                        :value="
                                            selectedKeyframe.properties[
                                                prop.name
                                            ]
                                        "
                                        @input="
                                            updateKeyframeProperty(
                                                animation.keyframes.indexOf(
                                                    selectedKeyframe
                                                ),
                                                prop.name,
                                                $event.target.value
                                            )
                                        "
                                        :type="prop.type"
                                        :step="prop.step"
                                        :placeholder="prop.placeholder"
                                        class="flex-1 px-3 py-1 text-sm rounded-md border"
                                    />
                                    <select
                                        v-if="prop.units"
                                        v-model="
                                            selectedKeyframe.properties[
                                                `${prop.name}Unit`
                                            ]
                                        "
                                        class="px-2 py-1 w-20 text-sm rounded-md border"
                                    >
                                        <option
                                            v-for="unit in prop.units"
                                            :key="unit"
                                            :value="unit"
                                        >
                                            {{ unit }}
                                        </option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Add keyframe input -->
                    <div>
                        <label
                            class="block mb-2 text-sm font-medium text-gray-700"
                        >
                            Add Keyframe at Percentage
                        </label>
                        <div class="flex gap-2">
                            <input
                                v-model.number="customPercentage"
                                type="number"
                                min="0"
                                max="100"
                                step="1"
                                class="px-3 py-2 w-1/2 rounded-md border"
                                placeholder="Enter percentage (e.g., 25)"
                            />
                            <button
                                @click="addKeyframe(customPercentage)"
                                class="flex-1 px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700"
                            >
                                Add Keyframe
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Preview and Code Panel -->
            <div class="space-y-6 lg:col-span-2">
                <!-- Preview -->
                <div class="p-6 bg-white rounded-lg shadow">
                    <h2 class="mb-4 text-lg font-medium">Preview</h2>
                    <div
                        class="flex justify-center items-center h-64 bg-gray-100 rounded-lg"
                    >
                        <div
                            ref="previewElement"
                            class="w-32 h-32 bg-blue-500 rounded-lg"
                            :style="previewStyles"
                        ></div>
                    </div>
                    <div class="flex gap-4 justify-end mt-4">
                        <button
                            @click="resetAnimation"
                            class="px-4 py-2 text-white bg-gray-600 rounded-md hover:bg-gray-700"
                        >
                            Reset
                        </button>
                        <button
                            @click="playAnimation"
                            class="px-4 py-2 text-white bg-green-600 rounded-md hover:bg-green-700"
                        >
                            Play
                        </button>
                    </div>
                </div>

                <!-- Generated Code -->
                <div class="p-6 bg-white rounded-lg shadow">
                    <div class="flex justify-between items-center mb-4">
                        <h2 class="text-lg font-medium">Generated CSS</h2>
                        <button
                            @click="copyCode"
                            class="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700"
                        >
                            Copy Code
                        </button>
                    </div>
                    <pre class="overflow-x-auto p-4 bg-gray-100 rounded-lg">
                        {{ generatedCSS }}
                    </pre>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { useLocalStorage } from '@vueuse/core';
import { Icon } from '@iconify/vue';

const toast = useToast();
const { generateShareLink, getSharedData } = useShareLink();

// Animation State
const animation = useLocalStorage('animation', {
    animationName: 'myAnimation',
    duration: 1,
    timingFunction: 'ease',
    cubicBezier: [0.25, 0.1, 0.25, 1],
    iterationCount: '1',
    direction: 'normal',
    keyframes: [
        {
            percentage: 0,
            properties: {
                transform: 'scale(1)',
                backgroundColor: '#3B82F6',
                opacity: '1',
            },
        },
        {
            percentage: 100,
            properties: {
                transform: 'scale(1.5)',
                backgroundColor: '#EF4444',
                opacity: '0.8',
            },
        },
    ],
});
const customPercentage = ref(null);

// Timing Functions
const timingFunctions = [
    'linear',
    'ease',
    'ease-in',
    'ease-out',
    'ease-in-out',
    'step-start',
    'step-end',
    'cubic-bezier',
];

// Available Properties for Keyframes
const availableProperties = [
    {
        name: 'transform',
        label: 'Transform',
        type: 'text',
        placeholder: 'scale(1)',
    },
    { name: 'backgroundColor', label: 'Background Color', type: 'color' },
    {
        name: 'opacity',
        label: 'Opacity',
        type: 'number',
        step: '0.1',
        placeholder: '1',
    },
    {
        name: 'borderRadius',
        label: 'Border Radius',
        type: 'text',
        placeholder: '50%',
    },
    { name: 'color', label: 'Text Color', type: 'color' },
    {
        name: 'boxShadow',
        label: 'Box Shadow',
        type: 'text',
        placeholder: '0px 4px 6px rgba(0,0,0,0.1)',
    },
    { name: 'filter', label: 'Filter', type: 'text', placeholder: 'blur(5px)' },
    {
        name: 'clipPath',
        label: 'Clip Path',
        type: 'text',
        placeholder: 'circle(50%)',
    },
    { name: 'width', label: 'Width', type: 'text', placeholder: '100px' },
    { name: 'height', label: 'Height', type: 'text', placeholder: '100px' },
    {
        name: 'zIndex',
        label: 'Z-Index',
        type: 'number',
        step: '1',
        placeholder: '1',
    },
];

// Filtered Available Properties
const filteredAvailableProperties = computed(() => {
    return availableProperties.filter((prop) => {
        return Object.keys(selectedKeyframe.value.properties).includes(
            prop.name
        );
    });
});

// Preview Element Reference
const previewElement = ref(null);

// Selected Keyframe
const selectedKeyframe = ref(null);

// Sorted Keyframes
const sortedKeyframes = computed(() => {
    return [...animation.value.keyframes].sort(
        (a, b) => a.percentage - b.percentage
    );
});

// On Mounted: Check for Shared Data
onMounted(async () => {
    const shared = await getSharedData();
    if (shared) {
        animation.value = shared;
        toast.success('Shared animation loaded!');
    }
});

// Apply Preset
const applyPreset = (preset) => {
    if (preset) {
        animation.value = JSON.parse(JSON.stringify(preset));
        toast.success(`Preset "${preset.animationName}" applied!`);
        selectedKeyframe.value = null;
    } else {
        toast.error('Preset not found.');
    }
};

// Add Keyframe Method
const addKeyframe = (customPercentage, isDefault = true) => {
    const percentage = parseInt(customPercentage, 10);
    if (isNaN(percentage) || percentage < 0 || percentage > 100) {
        console.error('Invalid percentage');
        toast.error('Percentage must be a number between 0 and 100');
        return;
    }

    const exists = animation.value.keyframes.some(
        (keyframe) => keyframe.percentage === percentage
    );
    if (exists) {
        if (isDefault) {
            console.error('Keyframe with this percentage already exists');
            toast.error('Keyframe with this percentage already exists');
        }
        return;
    }

    const lastKeyframe =
        animation.value.keyframes[animation.value.keyframes.length - 1] || {};
    const newKeyframe = {
        percentage,
        properties: { ...(lastKeyframe.properties || {}) },
    };
    animation.value.keyframes.push(newKeyframe);
    animation.value.keyframes.sort((a, b) => a.percentage - b.percentage);

    toast.success(`Keyframe at ${percentage}% added`);
    return newKeyframe;
};

// Remove Keyframe Method
const removeKeyframe = (index) => {
    if (animation.value.keyframes.length > 2) {
        animation.value.keyframes.splice(index, 1);
        toast.success('Keyframe removed');
        toggleKeyframeSelection(null);
    } else {
        console.error('At least two keyframes are required');
        toast.error('At least two keyframes are required.');
    }
};

// Update Keyframe Property Method
const updateKeyframeProperty = (index, property, value) => {
    animation.value.keyframes[index].properties[property] = value;
};
// Generated CSS
const generatedCSS = computed(() => {
    const keyframes = animation.value.keyframes
        .map((keyframe) => {
            const properties = Object.entries(keyframe.properties)
                .map(
                    ([key, value]) =>
                        `${key.replace(/([A-Z])/g, '-$1').toLowerCase()}: ${value};`
                )
                .join('\n    ');
            return `${keyframe.percentage}% {\n    ${properties}\n  }`;
        })
        .join('\n\n');

    const timing =
        animation.value.timingFunction === 'cubic-bezier'
            ? `cubic-bezier(${animation.value.cubicBezier.join(', ')})`
            : animation.value.timingFunction;

    return `
@keyframes ${animation.value.animationName} {
${keyframes}
}

.${animation.value.animationName} {
  animation: ${animation.value.animationName} ${animation.value.duration}s ${timing} ${animation.value.iterationCount} ${animation.value.direction};
}`;
});

// Preview Styles
const previewStyles = computed(() => {
    const timing =
        animation.value.timingFunction === 'cubic-bezier'
            ? `cubic-bezier(${animation.value.cubicBezier.join(', ')})`
            : animation.value.timingFunction;

    return {
        animation: `${animation.value.animationName} ${animation.value.duration}s ${timing} ${animation.value.iterationCount} ${animation.value.direction} both`,
    };
});

// Reset Animation Method
const resetAnimation = () => {
    if (previewElement.value) {
        const element = previewElement.value;
        element.style.animation = 'none';
        void element.offsetHeight;
        element.style.animation = null;
    }
};

// Play Animation Method
const playAnimation = () => {
    resetAnimation();
    if (previewElement.value) {
        const element = previewElement.value;
        element.style.animation = 'none';
        void element.offsetHeight;
        const timing =
            animation.value.timingFunction === 'cubic-bezier'
                ? `cubic-bezier(${animation.value.cubicBezier.join(', ')})`
                : animation.value.timingFunction;
        element.style.animation = `${animation.value.animationName} ${animation.value.duration}s ${timing} ${animation.value.iterationCount} ${animation.value.direction} both`;
    }
};

// Copy Code Method
const copyCode = () => {
    navigator.clipboard.writeText(generatedCSS.value);
    toast.success('CSS copied to clipboard!');
};

// Share Animation Method
const shareAnimation = async () => {
    const link = await generateShareLink('/tools/animation', animation.value);
    if (link) {
        navigator.clipboard.writeText(link);
        toast.success('Share link copied to clipboard!');
    } else {
        console.error('Failed to generate share link.');
        toast.error('Failed to generate share link.');
    }
};

// Style Element for Generated CSS
let styleElement = null;

watch(
    generatedCSS,
    (css) => {
        try {
            if (!styleElement) {
                styleElement = document?.createElement('style');
                document?.head?.appendChild(styleElement);
            }
            styleElement.textContent = css;
        } catch (error) {
            console.error('Error updating style element:', error);
        }
    },
    { immediate: true }
);

// Keyframe Selection Method
const toggleKeyframeSelection = (keyframe) => {
    selectedKeyframe.value =
        keyframe === selectedKeyframe.value ? null : keyframe;
};

// Computed: Should Show Custom Percentage
const shouldShowCustomPercentage = computed(() => {
    return (
        customPercentage.value !== null &&
        !sortedKeyframes.value.some(
            (kf) => kf.percentage === customPercentage.value
        )
    );
});

// Timeline Event Handlers
const handleTimelineMouseMove = (e) => {
    if (e.target === e.currentTarget) {
        const rect = e.target.getBoundingClientRect();
        const percentage = calculatePercentageFromMousePosition(
            e.clientX,
            rect
        );
        customPercentage.value = clampPercentage(percentage);
    }
};

const handleTimelineMouseLeave = () => {
    customPercentage.value = null;
};

const handleTimelineDoubleClick = () => {
    const newKeyframe = addKeyframe(customPercentage.value, false);
    toggleKeyframeSelection(newKeyframe);
};

const handleKeyframeMouseEnter = (keyframe) => {
    customPercentage.value = keyframe.percentage;
};

// Helper Functions
const calculatePercentageFromMousePosition = (clientX, rect) => {
    const relativeX = clientX - rect.left;
    const percentage = (relativeX / rect.width) * 100;
    return Math.round(percentage);
};

const clampPercentage = (percentage) => {
    return Math.max(0, Math.min(100, percentage));
};

watch(
    () => animation.value,
    () => {
        console.log('Animation updated:', animation.value);
        playAnimation();
    },
    { deep: true }
);
</script>
