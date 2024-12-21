<template>
    <div class="mx-auto max-w-6xl">
        <div class="flex justify-between items-center mb-6">
            <h1 class="text-2xl font-bold">CSS Animation Generator</h1>
            <button
                @click="shareAnimation"
                class="px-4 py-2 text-white bg-purple-600 rounded-md hover:bg-purple-700"
            >
                Share Animation
            </button>
        </div>

        <div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <!-- Controls Panel -->
            <div class="p-6 space-y-6 bg-white rounded-lg shadow lg:col-span-1">
                <div>
                    <label class="block mb-2 text-sm font-medium text-gray-700">
                        Animation Name
                    </label>
                    <input
                        v-model="animationState.animationName"
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
                        v-model="animationState.duration"
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
                        v-model="animationState.timingFunction"
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
                    v-if="animationState.timingFunction === 'cubic-bezier'"
                    class="space-y-2"
                >
                    <label class="block mb-2 text-sm font-medium text-gray-700"
                        >Cubic-Bezier Points</label
                    >
                    <div class="flex space-x-2">
                        <input
                            v-model="animationState.cubicBezier[0]"
                            type="number"
                            step="0.01"
                            min="0"
                            max="1"
                            class="px-3 py-1 w-1/4 text-sm rounded-md border"
                            placeholder="P1x"
                        />
                        <input
                            v-model="animationState.cubicBezier[1]"
                            type="number"
                            step="0.01"
                            min="0"
                            max="1"
                            class="px-3 py-1 w-1/4 text-sm rounded-md border"
                            placeholder="P1y"
                        />
                        <input
                            v-model="animationState.cubicBezier[2]"
                            type="number"
                            step="0.01"
                            min="0"
                            max="1"
                            class="px-3 py-1 w-1/4 text-sm rounded-md border"
                            placeholder="P2x"
                        />
                        <input
                            v-model="animationState.cubicBezier[3]"
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
                        v-model="animationState.iterationCount"
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
                        v-model="animationState.direction"
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
                                :style="`left: ${customPercentage}%`"
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
                                :style="`left: ${keyframe.percentage}%`"
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
                            <span class="font-medium"
                                >Keyframe at
                                {{ selectedKeyframe.percentage }}%</span
                            >
                            <div class="flex gap-2">
                                <button
                                    v-if="animationState.keyframes.length > 2"
                                    @click="
                                        removeKeyframe(
                                            animationState.keyframes.indexOf(
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
                                v-for="prop in availableProperties"
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
                                                animationState.keyframes.indexOf(
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
                                                animationState.keyframes.indexOf(
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
                                                prop.name + 'Unit'
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
                                v-model="customPercentage"
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
import { useToast } from '~/composables/useToast';
import { useShareLink } from '~/composables/useShareLink';
import { Icon } from '@iconify/vue';

const toast = useToast();
const { generateShareLink, getSharedData } = useShareLink();

const animationState = useLocalStorage('animationState', {
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
];

const previewElement = ref(null);
const selectedKeyframe = ref(null);

const sortedKeyframes = computed(() => {
    return [...animationState.value.keyframes].sort(
        (a, b) => a.percentage - b.percentage
    );
});

onMounted(async () => {
    const shared = await getSharedData();
    if (shared) {
        animationState.value = shared;
    }
});

const addKeyframe = (customPercentage) => {
    const percentage = parseInt(customPercentage, 10);
    if (isNaN(percentage) || percentage < 0 || percentage > 100) {
        console.error('Invalid percentage');
        toast.error('Percentage must be a number between 0 and 100');
        return;
    }

    const exists = animationState.value.keyframes.some(
        (keyframe) => keyframe.percentage === percentage
    );
    if (exists) {
        console.error('Keyframe with this percentage already exists');
        toast.error('Keyframe with this percentage already exists');
        return;
    }

    const lastKeyframe =
        animationState.value.keyframes[
            animationState.value.keyframes.length - 1
        ] || {};
    const newKeyframe = {
        percentage,
        properties: { ...(lastKeyframe.properties || {}) },
    };
    animationState.value.keyframes.push(newKeyframe);
    animationState.value.keyframes.sort((a, b) => a.percentage - b.percentage);

    toast.success(`Keyframe at ${percentage}% added`);
    return newKeyframe;
};

const removeKeyframe = (index) => {
    if (animationState.value.keyframes.length > 2) {
        animationState.value.keyframes.splice(index, 1);
        toast.success('Keyframe removed');
        toggleKeyframeSelection(null);
    } else {
        console.error('At least two keyframes are required');
        toast.error('At least two keyframes are required.');
    }
};

const updateKeyframeProperty = (index, property, value) => {
    animationState.value.keyframes[index].properties[property] = value;
};

const generatedCSS = computed(() => {
    const sortedKeyframes = [...animationState.value.keyframes].sort(
        (a, b) => a.percentage - b.percentage
    );

    const keyframeRules = sortedKeyframes
        .map((keyframe) => {
            const properties = Object.entries(keyframe.properties)
                .map(([key, value]) => {
                    const cssKey = key.replace(/([A-Z])/g, '-$1').toLowerCase();
                    return `${cssKey}: ${value};`;
                })
                .join('\n    ');
            return `  ${keyframe.percentage}% {\n    ${properties}\n  }`;
        })
        .join('\n\n');

    const timing =
        animationState.value.timingFunction === 'cubic-bezier'
            ? `cubic-bezier(${animationState.value.cubicBezier.join(', ')})`
            : animationState.value.timingFunction;

    return `
@keyframes ${animationState.value.animationName} {
${keyframeRules}
}

.${animationState.value.animationName} {
  animation: ${animationState.value.animationName} ${animationState.value.duration}s ${timing} ${animationState.value.iterationCount} ${animationState.value.direction};
}`;
});

const previewStyles = computed(() => {
    const timing =
        animationState.value.timingFunction === 'cubic-bezier'
            ? `cubic-bezier(${animationState.value.cubicBezier.join(', ')})`
            : animationState.value.timingFunction;

    return {
        animation: `${animationState.value.animationName} ${animationState.value.duration}s ${timing} ${animationState.value.iterationCount} ${animationState.value.direction}`,
    };
});

const resetAnimation = () => {
    if (previewElement.value) {
        const element = previewElement.value;
        element.style.animation = 'none';
        void element.offsetHeight;
        element.style.animation = null;
    }
};

const playAnimation = () => {
    resetAnimation();
    if (previewElement.value) {
        const element = previewElement.value;
        element.style.animation = 'none';
        void element.offsetHeight;
        const timing =
            animationState.value.timingFunction === 'cubic-bezier'
                ? `cubic-bezier(${animationState.value.cubicBezier.join(', ')})`
                : animationState.value.timingFunction;
        element.style.animation = `${animationState.value.animationName} ${animationState.value.duration}s ${timing} ${animationState.value.iterationCount} ${animationState.value.direction}`;
    }
};

const copyCode = () => {
    navigator.clipboard.writeText(generatedCSS.value);
    toast.success('CSS copied to clipboard!');
};

const shareAnimation = async () => {
    const link = await generateShareLink(
        '/tools/animation',
        animationState.value
    );
    if (link) {
        navigator.clipboard.writeText(link);
        toast.success('Share link copied to clipboard!');
    } else {
        console.error('Failed to generate share link.');
        toast.error('Failed to generate share link.');
    }
};

let styleElement = null;

watch(
    generatedCSS,
    (css) => {
        try {
            if (!styleElement) {
                styleElement = document.createElement('style');
                document.head.appendChild(styleElement);
            }
            styleElement.textContent = css;
        } catch (error) {
            console.error('Error updating style element:', error);
        }
    },
    { immediate: true }
);

const toggleKeyframeSelection = (keyframe) => {
    selectedKeyframe.value =
        keyframe === selectedKeyframe.value ? null : keyframe;
};

// Timeline related computed properties
const shouldShowCustomPercentage = computed(() => {
    return (
        customPercentage.value !== null &&
        !sortedKeyframes.value.some(
            (kf) => kf.percentage === customPercentage.value
        )
    );
});

// Timeline event handlers
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
    const newKeyframe = addKeyframe(customPercentage.value);
    toggleKeyframeSelection(newKeyframe);
};

const handleKeyframeMouseEnter = (keyframe) => {
    customPercentage.value = keyframe.percentage;
};

// Helper functions
const calculatePercentageFromMousePosition = (clientX, rect) => {
    return Math.round(((clientX - rect.left) / rect.width) * 100);
};

const clampPercentage = (percentage) => {
    return Math.max(0, Math.min(100, percentage));
};
</script>
