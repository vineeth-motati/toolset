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
                        v-model="animationName"
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
                        v-model="duration"
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
                        v-model="timingFunction"
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

                <div v-if="timingFunction === 'cubic-bezier'" class="space-y-2">
                    <label class="block mb-2 text-sm font-medium text-gray-700">Cubic-Bezier Points</label>
                    <div class="flex space-x-2">
                        <input
                            v-model="cubicBezier[0]"
                            type="number"
                            step="0.01"
                            min="0"
                            max="1"
                            class="px-3 py-1 w-1/4 text-sm rounded-md border"
                            placeholder="P1x"
                        />
                        <input
                            v-model="cubicBezier[1]"
                            type="number"
                            step="0.01"
                            min="0"
                            max="1"
                            class="px-3 py-1 w-1/4 text-sm rounded-md border"
                            placeholder="P1y"
                        />
                        <input
                            v-model="cubicBezier[2]"
                            type="number"
                            step="0.01"
                            min="0"
                            max="1"
                            class="px-3 py-1 w-1/4 text-sm rounded-md border"
                            placeholder="P2x"
                        />
                        <input
                            v-model="cubicBezier[3]"
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
                        v-model="iterationCount"
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
                        v-model="direction"
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
                    <h3 class="font-medium">Keyframe Properties</h3>

                    <div
                        v-for="(keyframe, index) in keyframes"
                        :key="index"
                        class="p-4 rounded-md border"
                    >
                        <div class="flex justify-between items-center mb-4">
                            <span class="font-medium"
                                >{{ keyframe.percentage }}%</span
                            >
                            <button
                                @click="removeKeyframe(index)"
                                class="text-red-600 hover:text-red-800"
                            >
                                <Icon icon="mdi:close" class="w-5 h-5" />
                            </button>
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
                                        :value="keyframe.properties[prop.name]"
                                        @input="
                                            updateKeyframeProperty(
                                                index,
                                                prop.name,
                                                $event.target.value
                                            )
                                        "
                                        type="color"
                                        class="w-16 h-8"
                                    />
                                    <input
                                        v-else
                                        :value="keyframe.properties[prop.name]"
                                        @input="
                                            updateKeyframeProperty(
                                                index,
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
                                            keyframe.properties[
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

                    <div>
                        <label class="block mb-2 text-sm font-medium text-gray-700">
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

const animationName = useLocalStorage('animationName', 'myAnimation');
const duration = useLocalStorage('duration', 1);
const timingFunction = useLocalStorage('timingFunction', 'ease');
const cubicBezier = useLocalStorage('cubicBezier', [0.25, 0.1, 0.25, 1]);
const iterationCount = useLocalStorage('iterationCount', '1');
const direction = useLocalStorage('direction', 'normal');
const customPercentage = ref(0);
const keyframes = useLocalStorage('keyframes', [
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
]);


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

onMounted(async () => {
    const shared = await getSharedData();
    if (shared) {
        animationName.value = shared.animationName;
        duration.value = shared.duration;
        timingFunction.value = shared.timingFunction;
        cubicBezier.value = shared.cubicBezier || [0.25, 0.1, 0.25, 1]; 
        iterationCount.value = shared.iterationCount;
        direction.value = shared.direction;
        keyframes.value = shared.keyframes;
    }
});


const addKeyframe = (customPercentage) => {
    const percentage = parseInt(customPercentage, 10);
    if (isNaN(percentage) || percentage < 0 || percentage > 100) {
        toast.error('Percentage must be a number between 0 and 100');
        return;
    }

    const exists = keyframes.value.some((keyframe) => keyframe.percentage === percentage);
    if (exists) {
        toast.error('Keyframe with this percentage already exists');
        return;
    }

    // Add new keyframe
    const lastKeyframe = keyframes.value[keyframes.value.length - 1] || {};
    keyframes.value.push({
        percentage,
        properties: { ...lastKeyframe.properties || {} },
    });

    // Sort keyframes by percentage
    keyframes.value.sort((a, b) => a.percentage - b.percentage);

    toast.success(`Keyframe at ${percentage}% added`);
};


const removeKeyframe = (index) => {
    if (keyframes.value.length > 2) {
        keyframes.value.splice(index, 1);
        toast.success('Keyframe removed');
    } else {
        toast.error('At least two keyframes are required.');
    }
};

const updateKeyframeProperty = (index, property, value) => {
    keyframes.value[index].properties[property] = value;
};

const generatedCSS = computed(() => {
    const sortedKeyframes = [...keyframes.value].sort((a, b) => a.percentage - b.percentage);

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

        const timing = timingFunction.value === 'cubic-bezier'
        ? `cubic-bezier(${cubicBezier.value.join(', ')})`
        : timingFunction.value;

    return `
@keyframes ${animationName.value} {
${keyframeRules}
}

.${animationName.value} {
  animation: ${animationName.value} ${duration.value}s ${timing} ${iterationCount.value} ${direction.value};
}`;
});



const previewStyles = computed(() => {
    const timing = timingFunction.value === 'cubic-bezier'
        ? `cubic-bezier(${cubicBezier.value.join(', ')})`
        : timingFunction.value;

    return {
        animation: `${animationName.value} ${duration.value}s ${timing} ${iterationCount.value} ${direction.value}`,
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
        const timing = timingFunction.value === 'cubic-bezier'
            ? `cubic-bezier(${cubicBezier.value.join(', ')})`
            : timingFunction.value;
        element.style.animation = `${animationName.value} ${duration.value}s ${timing} ${iterationCount.value} ${direction.value}`;
    }
};

const copyCode = () => {
    navigator.clipboard.writeText(generatedCSS.value);
    toast.success('CSS copied to clipboard!');
};

const shareAnimation = async () => {
    const animationData = {
        animationName: animationName.value,
        duration: duration.value,
        timingFunction: timingFunction.value,
        cubicBezier: cubicBezier.value,
        iterationCount: iterationCount.value,
        direction: direction.value,
        keyframes: keyframes.value,
    };

    const link = await generateShareLink('/tools/animation', animationData);
    if (link) {
        navigator.clipboard.writeText(link);
        toast.success('Share link copied to clipboard!');
    } else {
        toast.error('Failed to generate share link.');
    }
};

let styleElement = null;

watch(
    generatedCSS,
    (css) => {
        try {
            if (!styleElement) {
                console.log('Creating new <style> element');
                styleElement = document.createElement('style');
                document.head.appendChild(styleElement);
            }
            console.log('Updating <style> element content');
            styleElement.textContent = css; 
        } catch (error) {
            console.error('Error updating style element:', error); 
        }
    },
    { immediate: true }
);

</script>
