<template>
    <div class="w-full nested-view">
        <!-- Object View - Display as a table -->
        <table class="w-full text-sm border-collapse">
            <tbody>
                <tr
                    v-for="(val, key) in value"
                    :key="key"
                    class="border-t border-gray-100"
                >
                    <td class="px-2 py-1 font-medium">{{ key }}</td>
                    <td class="px-2 py-1">
                        <!-- Nested Object or Array -->
                        <template v-if="isNestedObject(val)">
                            <div class="flex items-center">
                                <button
                                    @click="toggleExpand(key)"
                                    class="p-1 mr-1 text-blue-600 rounded hover:bg-blue-100"
                                >
                                    <Icon
                                        :icon="
                                            expandedKeys.has(key)
                                                ? 'tabler:circle-minus'
                                                : 'tabler:circle-plus'
                                        "
                                        class="w-4 h-4"
                                    />
                                </button>
                                <span class="font-mono text-gray-500">
                                    {{
                                        isArray(val) ? `[${val.length}]` : '{}'
                                    }}
                                </span>
                            </div>

                            <!-- Nested content when expanded -->
                            <div
                                v-if="expandedKeys.has(key)"
                                class="pt-2 pl-2 mt-2 border-t border-l border-gray-200"
                            >
                                <!-- For Arrays - New table-like display -->
                                <div v-if="isArray(val)" class="nested-grid">
                                    <table
                                        class="w-full text-sm border-collapse dark-grid"
                                    >
                                        <tbody>
                                            <tr
                                                v-for="(item, index) in val"
                                                :key="`${key}-${index}`"
                                                class="border-t border-gray-100"
                                            >
                                                <td
                                                    class="w-8 px-2 py-1.5 text-gray-500 font-mono bg-gray-50 text-center"
                                                >
                                                    {{ index + 1 }}
                                                </td>
                                                <td class="px-3 py-1.5">
                                                    <!-- Handle nested objects in arrays -->
                                                    <template
                                                        v-if="
                                                            isNestedObject(item)
                                                        "
                                                    >
                                                        <div
                                                            class="flex items-center"
                                                        >
                                                            <button
                                                                @click="
                                                                    toggleExpand(
                                                                        `${key}-${index}`
                                                                    )
                                                                "
                                                                class="p-1 mr-1 text-blue-600 rounded hover:bg-blue-100"
                                                            >
                                                                <Icon
                                                                    :icon="
                                                                        expandedKeys.has(
                                                                            `${key}-${index}`
                                                                        )
                                                                            ? 'tabler:circle-minus'
                                                                            : 'tabler:circle-plus'
                                                                    "
                                                                    class="w-4 h-4"
                                                                />
                                                            </button>
                                                            <span
                                                                class="font-mono text-gray-500"
                                                            >
                                                                {{
                                                                    isArray(
                                                                        item
                                                                    )
                                                                        ? `[${item.length}]`
                                                                        : '{}'
                                                                }}
                                                            </span>
                                                        </div>
                                                        <div
                                                            v-if="
                                                                expandedKeys.has(
                                                                    `${key}-${index}`
                                                                )
                                                            "
                                                            class="pt-2 pl-2 mt-2 border-t border-l border-gray-200"
                                                        >
                                                            <NestedObjectView
                                                                :value="item"
                                                                :level="
                                                                    level + 1
                                                                "
                                                                :editable="
                                                                    editable
                                                                "
                                                                :path="`${path}.${key}[${index}]`"
                                                                @update:value="
                                                                    handleNestedUpdate
                                                                "
                                                            />
                                                        </div>
                                                    </template>
                                                    <div
                                                        v-else
                                                        class="editable-cell"
                                                        :contenteditable="
                                                            editable
                                                        "
                                                        @blur="
                                                            updateArrayValue(
                                                                key,
                                                                index,
                                                                $event
                                                            )
                                                        "
                                                        @click="
                                                            emitFocus(
                                                                `${path}.${key}[${index}]`
                                                            )
                                                        "
                                                    >
                                                        {{ formatValue(item) }}
                                                    </div>
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>

                                <!-- For Objects - Enhanced mini-grid display -->
                                <div v-else class="nested-grid">
                                    <table
                                        class="w-full text-sm bg-white border-collapse"
                                    >
                                        <tbody>
                                            <tr
                                                v-for="(
                                                    nestedVal, nestedKey
                                                ) in val"
                                                :key="`${key}-${nestedKey}`"
                                                class="border-t border-gray-100"
                                            >
                                                <td
                                                    class="px-2 py-1 font-medium text-gray-700"
                                                >
                                                    {{ nestedKey }}
                                                </td>
                                                <td class="px-2 py-1">
                                                    <!-- Handle nested objects recursively -->
                                                    <template
                                                        v-if="
                                                            isNestedObject(
                                                                nestedVal
                                                            )
                                                        "
                                                    >
                                                        <div
                                                            class="flex items-center"
                                                        >
                                                            <button
                                                                @click="
                                                                    toggleExpand(
                                                                        `${key}-${nestedKey}`
                                                                    )
                                                                "
                                                                class="p-1 mr-1 text-blue-600 rounded hover:bg-blue-100"
                                                            >
                                                                <Icon
                                                                    :icon="
                                                                        expandedKeys.has(
                                                                            `${key}-${nestedKey}`
                                                                        )
                                                                            ? 'tabler:circle-minus'
                                                                            : 'tabler:circle-plus'
                                                                    "
                                                                    class="w-4 h-4"
                                                                />
                                                            </button>
                                                            <span
                                                                class="font-mono text-gray-500"
                                                            >
                                                                {{
                                                                    isArray(
                                                                        nestedVal
                                                                    )
                                                                        ? `[${nestedVal.length}]`
                                                                        : '{}'
                                                                }}
                                                            </span>
                                                        </div>
                                                        <div
                                                            v-if="
                                                                expandedKeys.has(
                                                                    `${key}-${nestedKey}`
                                                                )
                                                            "
                                                            class="pt-2 pl-2 mt-2 border-t border-l border-gray-200"
                                                        >
                                                            <NestedObjectView
                                                                :value="
                                                                    nestedVal
                                                                "
                                                                :level="
                                                                    level + 1
                                                                "
                                                                :editable="
                                                                    editable
                                                                "
                                                                :path="`${path}.${key}.${nestedKey}`"
                                                                @update:value="
                                                                    handleNestedUpdate
                                                                "
                                                            />
                                                        </div>
                                                    </template>
                                                    <div
                                                        v-else
                                                        class="editable-cell"
                                                        :contenteditable="
                                                            editable
                                                        "
                                                        @blur="
                                                            updateObjectValue(
                                                                key,
                                                                nestedKey,
                                                                $event
                                                            )
                                                        "
                                                        @click="
                                                            emitFocus(
                                                                `${path}.${key}.${nestedKey}`
                                                            )
                                                        "
                                                    >
                                                        {{
                                                            formatValue(
                                                                nestedVal
                                                            )
                                                        }}
                                                    </div>
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </template>

                        <!-- Regular Value -->
                        <div
                            v-else
                            class="editable-cell"
                            :contenteditable="editable"
                            @blur="updateValue(key, $event)"
                            @click="emitFocus(`${path}.${key}`)"
                        >
                            {{ formatValue(val) }}
                        </div>
                    </td>
                </tr>
            </tbody>
        </table>
    </div>
</template>

<script setup>
import { ref } from 'vue';
import { Icon } from '@iconify/vue';

const props = defineProps({
    value: {
        type: Object,
        required: true,
    },
    level: {
        type: Number,
        default: 0,
    },
    editable: {
        type: Boolean,
        default: false,
    },
    path: {
        type: String,
        default: 'root',
    },
});

const emit = defineEmits(['update:value', 'focus']);

const expandedKeys = ref(new Set());

function isNestedObject(val) {
    return typeof val === 'object' && val !== null;
}

function isArray(val) {
    return Array.isArray(val);
}

function toggleExpand(key) {
    if (expandedKeys.value.has(key)) {
        expandedKeys.value.delete(key);
    } else {
        expandedKeys.value.add(key);
    }
}

// Helper to format values nicely
function formatValue(value) {
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    if (typeof value === 'boolean') return value ? 'true' : 'false';
    return value;
}

// Parse user input to appropriate type
function parseValue(value) {
    if (value.toLowerCase() === 'null') return null;
    if (value.toLowerCase() === 'undefined') return undefined;
    if (value.toLowerCase() === 'true') return true;
    if (value.toLowerCase() === 'false') return false;
    if (!isNaN(Number(value))) return Number(value);
    return value;
}

// Update top-level object values
function updateValue(key, event) {
    if (!props.editable) return;

    const newValue = event.target.innerText;
    const parsedValue = parseValue(newValue);

    emit('update:value', {
        path: `${props.path}.${key}`,
        value: parsedValue,
    });
}

// Update nested object values
function updateObjectValue(objKey, nestedKey, event) {
    if (!props.editable) return;

    const newValue = event.target.innerText;
    const parsedValue = parseValue(newValue);

    emit('update:value', {
        path: `${props.path}.${objKey}.${nestedKey}`,
        value: parsedValue,
    });
}

// Update array values
function updateArrayValue(arrayKey, index, event) {
    if (!props.editable) return;

    const newValue = event.target.innerText;
    const parsedValue = parseValue(newValue);

    emit('update:value', {
        path: `${props.path}.${arrayKey}[${index}]`,
        value: parsedValue,
    });
}

// Handle updates from deeper nested components
function handleNestedUpdate(update) {
    emit('update:value', update);
}

// Improve the emitFocus function to provide better context
function emitFocus(path) {
    // Get the actual value at this path to ensure we're highlighting the right one
    let value = getValueByPath(props.value, getRelativePath(path));

    // For objects/arrays, get their key name since we can't match on values
    const isComplex = typeof value === 'object' && value !== null;
    const context = {
        path: path,
        value: value,
        isComplex: isComplex,
        dataType: typeof value,
        // If it's a complex value, we focus on its container rather than contents
        containerPath: isComplex ? getParentPath(path) : path,
    };

    emit('focus', context);
}

// New helper to get parent path
function getParentPath(path) {
    const parts = path.split('.');
    if (parts.length <= 1) return path;

    // Handle array notation in the last segment
    const lastPart = parts[parts.length - 1];
    if (lastPart.includes('[')) {
        const match = lastPart.match(/(\w+)\[(\d+)\]/);
        if (match) {
            // Return the path to the array itself
            parts.pop();
            return [...parts, match[1]].join('.');
        }
    }

    // Regular object path
    parts.pop();
    return parts.join('.');
}

// Enhance the existing getValueByPath function for better precision
function getValueByPath(obj, path) {
    // Handle simple root-level properties
    if (!path.includes('.') && !path.includes('[')) {
        return obj[path];
    }

    const parts = path.split('.');
    let current = obj;

    for (const part of parts) {
        if (part === 'root') continue;

        // Handle array notation like "items[0]"
        if (part.includes('[')) {
            const match = part.match(/(\w+)\[(\d+)\]/);
            if (match) {
                const arrayName = match[1];
                const arrayIndex = parseInt(match[2]);

                if (!current[arrayName]) return undefined;
                if (!Array.isArray(current[arrayName])) return undefined;
                if (arrayIndex >= current[arrayName].length) return undefined;

                current = current[arrayName][arrayIndex];
                continue;
            }
        }

        // Handle regular property access
        if (current === undefined || current === null || !(part in current)) {
            return undefined;
        }

        current = current[part];
    }

    return current;
}

// Convert an absolute path to a relative path within the current object
function getRelativePath(absolutePath) {
    const basePath = props.path === 'root' ? '' : props.path;
    return absolutePath.replace(`${basePath}.`, '');
}
</script>

<style scoped>
.nested-view {
    font-size: 0.875rem;
}

.nested-grid {
    max-height: 300px;
    overflow-y: auto;
    border: 1px solid #edf2f7;
    border-radius: 4px;
}

/* Add style for the dark grid rows */
.dark-grid tr:nth-child(odd) {
    background-color: rgba(249, 250, 251, 0.5);
}

.dark-grid tr:hover {
    background-color: rgba(236, 242, 255, 0.6);
}

.editable-cell {
    min-height: 1.5rem;
    padding: 0.25rem;
    border-radius: 0.25rem;
    outline: none;
}

.editable-cell[contenteditable='true']:hover {
    background-color: rgba(59, 130, 246, 0.1);
    cursor: text;
}

.editable-cell[contenteditable='true']:focus {
    background-color: rgba(59, 130, 246, 0.2);
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.4);
}
</style>
