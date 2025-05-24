<template>
    <div class="mx-auto max-w-7xl">
        <div class="flex items-center justify-between mb-6">
            <h1 class="text-2xl font-bold">YouTube Transcriptor</h1>
            <button
                @click="shareTranscript"
                class="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700"
            >
                Share Transcript
            </button>
        </div>

        <!-- Input Section -->
        <div class="p-4 mb-4 bg-white rounded-lg shadow">
            <div class="flex flex-col gap-4 md:flex-row">
                <div class="relative flex-grow">
                    <input
                        v-model="transcriptorState.youtubeUrl"
                        type="text"
                        placeholder="Enter YouTube URL or Video ID"
                        class="w-full px-4 py-2 pr-10 border rounded-md"
                        @keyup.enter="fetchTranscript"
                    />
                    <button
                        v-if="transcriptorState.youtubeUrl"
                        @click="clearInputField"
                        type="button"
                        class="absolute text-gray-500 -translate-y-1/2 right-2 top-1/2 hover:text-gray-700"
                        title="Clear input"
                    >
                        <Icon icon="mdi:close-circle" />
                    </button>
                </div>
                <div class="flex gap-2">
                    <button
                        @click="fetchTranscript"
                        class="flex items-center justify-center gap-1 px-4 py-2 text-white bg-green-600 rounded-md hover:bg-green-700"
                        :disabled="loading"
                    >
                        <Icon
                            v-if="loading"
                            icon="mdi:loading"
                            class="animate-spin"
                        />
                        <Icon v-else icon="mdi:play" />
                        <span v-if="loading">Loading...</span>
                        <span v-else>Get Transcript</span>
                    </button>
                    <button
                        @click="clearTranscript"
                        class="px-4 py-2 text-white bg-red-600 rounded-md hover:bg-red-700"
                    >
                        Clear
                    </button>
                </div>
            </div>
        </div>

        <div v-if="loading" class="flex justify-center my-8">
            <div
                class="w-8 h-8 border-4 border-blue-600 rounded-full animate-spin border-t-transparent"
            ></div>
        </div>

        <div v-if="error" class="p-4 my-4 text-red-700 bg-red-100 rounded-lg">
            {{ error }}
        </div>

        <!-- Main Content Area -->
        <div
            v-if="transcriptorState.transcript.length > 0"
            class="grid grid-cols-1 gap-6 lg:grid-cols-3"
        >
            <!-- Video Player Section -->
            <div class="p-4 bg-white rounded-lg shadow lg:col-span-1">
                <h2 class="mb-4 text-lg font-medium">Video</h2>
                <div class="relative mb-4 aspect-video">
                    <div id="youtube-player"></div>
                </div>

                <!-- Video Details Section -->
                <div
                    v-if="transcriptorState.videoDetails"
                    class="pt-3 mt-3 border-t"
                >
                    <h3 class="text-lg font-bold line-clamp-2">
                        {{ transcriptorState.videoDetails.title }}
                    </h3>
                    <div
                        class="flex items-center justify-between mt-2 text-sm text-gray-600"
                    >
                        <span>{{
                            transcriptorState.videoDetails.channelTitle
                        }}</span>
                        <span>{{
                            formatDate(
                                transcriptorState.videoDetails.publishedAt
                            )
                        }}</span>
                    </div>

                    <!-- Only show view count when it's a valid number -->
                    <div
                        v-if="
                            isValidViewCount(
                                transcriptorState.videoDetails.viewCount
                            )
                        "
                        class="mt-2 text-sm text-gray-500"
                    >
                        {{
                            formatViewCount(
                                transcriptorState.videoDetails.viewCount
                            )
                        }}
                        views
                    </div>

                    <div
                        class="mt-3"
                        v-if="transcriptorState.videoDetails.description"
                    >
                        <div
                            :class="{
                                'line-clamp-3':
                                    !transcriptorState.showFullDescription,
                            }"
                            class="text-sm text-gray-700"
                        >
                            {{ transcriptorState.videoDetails.description }}
                        </div>
                        <button
                            @click="
                                transcriptorState.showFullDescription =
                                    !transcriptorState.showFullDescription
                            "
                            class="mt-1 text-sm text-blue-600 hover:underline"
                        >
                            {{
                                transcriptorState.showFullDescription
                                    ? 'Show less'
                                    : 'Show more'
                            }}
                        </button>
                    </div>
                </div>
            </div>

            <!-- Transcript Section -->
            <div class="p-4 bg-white rounded-lg shadow lg:col-span-2">
                <div
                    class="flex flex-wrap items-center justify-between gap-2 mb-4"
                >
                    <h2 class="text-lg font-medium">Transcript</h2>
                    <div class="flex flex-wrap items-center gap-2">
                        <label class="flex items-center">
                            <input
                                v-model="transcriptorState.showTimestamps"
                                type="checkbox"
                                class="mr-2"
                            />
                            Show Timestamps
                        </label>
                        <div class="flex gap-2">
                            <button
                                @click="copyTranscript"
                                class="px-3 py-1 text-sm text-white bg-blue-600 rounded hover:bg-blue-700"
                                title="Copy to clipboard"
                            >
                                <span class="flex items-center">
                                    <Icon
                                        icon="mdi:content-copy"
                                        class="mr-1"
                                    />
                                    Copy
                                </span>
                            </button>
                            <button
                                @click="exportPdf"
                                class="px-3 py-1 text-sm text-white bg-purple-600 rounded hover:bg-purple-700"
                                title="Export as PDF"
                            >
                                <span class="flex items-center">
                                    <Icon
                                        icon="mdi:file-pdf-box"
                                        class="mr-1"
                                    />
                                    PDF
                                </span>
                            </button>
                            <button
                                @click="exportAsText"
                                class="px-3 py-1 text-sm text-white bg-green-600 rounded hover:bg-green-700"
                                title="Export as Text File"
                            >
                                <span class="flex items-center">
                                    <Icon
                                        icon="mdi:file-document-outline"
                                        class="mr-1"
                                    />
                                    Text
                                </span>
                            </button>
                        </div>
                    </div>
                </div>
                <div class="overflow-y-auto max-h-[60vh]">
                    <div
                        v-if="transcriptorState.transcript.length > 0"
                        class="space-y-2"
                    >
                        <div
                            v-for="(
                                segment, index
                            ) in transcriptorState.transcript"
                            :key="index"
                            @click="jumpToTimestamp(segment.offset)"
                            class="p-2 transition-colors rounded cursor-pointer hover:bg-gray-100"
                            :class="{ 'bg-blue-50': isCurrentSegment(segment) }"
                        >
                            <span
                                v-if="transcriptorState.showTimestamps"
                                class="mr-2 font-mono text-xs text-gray-500"
                            >
                                {{ formatTime(segment.offset) }}
                            </span>
                            {{ segment.text }}
                        </div>
                    </div>
                    <div v-else class="text-gray-500">
                        No transcript available. Please enter a valid YouTube
                        URL and click "Get Transcript".
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted, watch, onUnmounted } from 'vue';
import { useLocalStorage } from '@vueuse/core';
import { useToast } from '@/composables/useToast';
import { useShareLink } from '@/composables/useShareLink';
import { Icon } from '@iconify/vue';
import { jsPDF } from 'jspdf';

const toast = useToast();
const { generateShareLink, getSharedData } = useShareLink();

// Unified state object
const transcriptorState = useLocalStorage('youtube-transcriptor', {
    youtubeUrl: '',
    transcript: [],
    showTimestamps: true,
    videoDetails: null,
    showFullDescription: false,
});

// Runtime state (not part of shared/stored state)
const loading = ref(false);
const error = ref(null);
const player = ref(null);
const currentTime = ref(0);
const playerReady = ref(false);

// Methods
const extractVideoId = (url) => {
    if (!url) return null;

    try {
        // Simple video ID validation (11 characters)
        if (/^[a-zA-Z0-9_-]{11}$/.test(url)) {
            return url;
        }

        // Handle youtu.be format
        if (url.includes('youtu.be')) {
            const id = url.split('/').pop().split('?')[0];
            return id;
        }

        // Handle youtube.com format
        const urlObj = new URL(url);
        if (
            urlObj.hostname === 'www.youtube.com' ||
            urlObj.hostname === 'youtube.com'
        ) {
            const searchParams = new URLSearchParams(urlObj.search);
            return searchParams.get('v');
        }

        throw new Error('Could not extract YouTube video ID');
    } catch (err) {
        console.error('Error parsing URL:', err);
        return null;
    }
};

const loadYouTubeAPI = () => {
    return new Promise((resolve) => {
        if (window.YT && window.YT.Player) {
            resolve();
            return;
        }

        // Define callback for when API is ready
        window.onYouTubeIframeAPIReady = () => {
            resolve();
        };

        // Load the API
        const tag = document.createElement('script');
        tag.src = 'https://www.youtube.com/iframe_api';
        const firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    });
};

const initYouTubePlayer = async (videoId) => {
    if (!videoId) return;

    try {
        // Make sure the API is loaded
        await loadYouTubeAPI();

        // Create a new player or destroy the existing one
        if (player.value) {
            player.value.destroy();
        }

        player.value = new window.YT.Player('youtube-player', {
            height: '100%',
            width: '100%',
            videoId: videoId,
            playerVars: {
                autoplay: 0,
                controls: 1,
            },
            events: {
                onReady: () => {
                    playerReady.value = true;
                },
                onStateChange: (event) => {
                    // Update current time when playing
                    if (event.data === window.YT.PlayerState.PLAYING) {
                        startTimeTracking();
                    } else if (event.data === window.YT.PlayerState.PAUSED) {
                        stopTimeTracking();
                    }
                },
            },
        });
    } catch (err) {
        console.error('Error initializing YouTube player:', err);
        toast.error('Failed to load YouTube player');
    }
};

let timeTracker = null;

const startTimeTracking = () => {
    if (timeTracker) clearInterval(timeTracker);

    timeTracker = setInterval(() => {
        if (player.value && player.value.getCurrentTime) {
            currentTime.value = player.value.getCurrentTime();
        }
    }, 1000);
};

const stopTimeTracking = () => {
    if (timeTracker) {
        clearInterval(timeTracker);
        timeTracker = null;
    }
};

const isCurrentSegment = (segment) => {
    if (!currentTime.value) return false;

    // Find the next segment to determine the end time of the current segment
    const segmentIndex = transcriptorState.value.transcript.indexOf(segment);
    const nextSegment = transcriptorState.value.transcript[segmentIndex + 1];
    const endTime = nextSegment ? nextSegment.offset : segment.offset + 10; // Approximate if it's the last segment

    return currentTime.value >= segment.offset && currentTime.value < endTime;
};

const fetchTranscript = async () => {
    const videoId = extractVideoId(transcriptorState.value.youtubeUrl);
    if (!videoId) {
        error.value =
            'Invalid YouTube URL or Video ID. Please enter a valid URL or video ID.';
        toast.error(error.value);
        return;
    }

    try {
        loading.value = true;
        error.value = null;

        // Using our enhanced API endpoint
        const response = await fetch(
            `/api/youtube-transcript-env?videoId=${videoId}`
        );
        const data = await response.json();

        if (!response.ok || data.error) {
            // Enhanced error handling with more specific messages
            if (
                data.errorType === 'TRANSCRIPT_DISABLED' ||
                (data.error &&
                    data.error.includes('blocking transcript access'))
            ) {
                throw new Error(
                    `YouTube is blocking transcript access from our server. This may work if you run the tool locally on your computer. Error details: ${data.error || 'Transcript access denied'}`
                );
            } else if (data.errorType === 'NOT_AVAILABLE') {
                throw new Error(
                    `This video doesn't have any captions or transcripts available.`
                );
            } else if (data.errorType === 'VIDEO_UNAVAILABLE') {
                throw new Error(
                    `This video appears to be unavailable or private.`
                );
            } else if (data.errorType === 'RATE_LIMIT') {
                throw new Error(
                    `We've hit YouTube's rate limit. Please try again in a few minutes.`
                );
            } else {
                throw new Error(data.error || 'Failed to fetch transcript');
            }
        }

        // If we got a transcript successfully
        if (data.transcript) {
            transcriptorState.value.transcript = data.transcript;

            // Also fetch video details
            await fetchVideoDetails(videoId);

            // Initialize the YouTube player
            await initYouTubePlayer(videoId);

            toast.success('Transcript loaded successfully');
        }
    } catch (err) {
        error.value = `Error fetching transcript: ${err.message}`;
        toast.error(error.value);
        console.error(err);
    } finally {
        loading.value = false;
    }
};

const clearTranscript = () => {
    transcriptorState.value.transcript = [];
    transcriptorState.value.videoDetails = null;
    transcriptorState.value.showFullDescription = false;
    error.value = null;

    if (player.value) {
        player.value.destroy();
        player.value = null;
        playerReady.value = false;
    }

    if (timeTracker) {
        clearInterval(timeTracker);
        timeTracker = null;
    }

    currentTime.value = 0;
    toast.info('Transcript cleared');
};

const formatTime = (seconds) => {
    // Handle invalid inputs
    if (
        seconds === undefined ||
        seconds === null ||
        isNaN(parseFloat(seconds))
    ) {
        return '00:00';
    }

    // Convert to number if it's a string
    seconds = parseFloat(seconds);

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = Math.floor(seconds % 60);

    if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }

    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

const jumpToTimestamp = (seconds) => {
    if (player.value && player.value.seekTo && playerReady.value) {
        player.value.seekTo(seconds, true);
        player.value.playVideo();

        // Scroll the transcript segment into view
        const segment = transcriptorState.value.transcript.find(
            (s) => s.offset === seconds
        );
        if (segment) {
            const index = transcriptorState.value.transcript.indexOf(segment);
            const el = document.querySelectorAll(
                '.overflow-y-auto > div > div'
            )[index];
            if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
    }
};

const copyTranscript = () => {
    // Create a formatted transcript
    const formattedTranscript = transcriptorState.value.transcript
        .map((segment) => {
            return transcriptorState.value.showTimestamps
                ? `${formatTime(segment.offset)} ${segment.text}`
                : segment.text;
        })
        .join('\n');

    // Try using the Clipboard API if available
    if (navigator && navigator.clipboard) {
        navigator.clipboard
            .writeText(formattedTranscript)
            .then(() => {
                toast.success('Transcript copied to clipboard');
            })
            .catch((err) => {
                console.error('Clipboard API failed:', err);
                fallbackCopyToClipboard(formattedTranscript);
            });
    } else {
        // Fallback for browsers without Clipboard API support
        fallbackCopyToClipboard(formattedTranscript);
    }
};

// Fallback method using document.execCommand
const fallbackCopyToClipboard = (text) => {
    try {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        // Make the textarea out of viewport
        textarea.style.position = 'fixed';
        textarea.style.left = '-999999px';
        textarea.style.top = '-999999px';
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();

        const successful = document.execCommand('copy');
        document.body.removeChild(textarea);

        if (successful) {
            toast.success('Transcript copied to clipboard');
        } else {
            toast.error('Unable to copy transcript');
        }
    } catch (err) {
        console.error('Fallback clipboard copy failed:', err);
        toast.error('Failed to copy transcript. Please try another method.');
    }
};

const exportPdf = async () => {
    // Check if transcript contains non-Latin characters (like Telugu, Chinese, etc.)
    const hasNonLatinChars = transcriptorState.value.transcript.some(
        (segment) =>
            /[^\u0000-\u007F\u0080-\u00FF\u0100-\u017F\s]/.test(segment.text)
    );

    try {
        // For Latin-based text, use simple PDF generation
        const doc = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4',
        });

        // Use a built-in font
        doc.setFont('helvetica', 'normal');

        // Add title
        const videoId = extractVideoId(transcriptorState.value.youtubeUrl);
        doc.setFontSize(16);
        doc.text('YouTube Transcript', 20, 20);
        doc.setFontSize(12);
        doc.text(`Video ID: ${videoId || 'Unknown'}`, 20, 30);
        doc.text(`Generated on: ${new Date().toLocaleString()}`, 20, 40);

        // Add transcript content
        let y = 50;
        const formattedTranscript = transcriptorState.value.transcript.map(
            (segment) => {
                return transcriptorState.value.showTimestamps
                    ? `${formatTime(segment.offset)} ${segment.text}`
                    : segment.text;
            }
        );

        formattedTranscript.forEach((line) => {
            const textLines = doc.splitTextToSize(line, 170);
            textLines.forEach((textLine) => {
                if (y > 280) {
                    doc.addPage();
                    y = 20;
                }
                doc.text(textLine, 20, y);
                y += 7;
            });
            y += 3;
        });

        // Save the PDF
        doc.save('youtube-transcript.pdf');
        if (hasNonLatinChars) {
            toast.success(
                'PDF exported, but may not display non-Latin characters correctly.'
            );
        } else {
            toast.success('PDF exported successfully');
        }
    } catch (err) {
        console.error('Error exporting PDF:', err);
        toast.error(
            'Failed to export PDF. Consider using text export instead.'
        );
    }
};

// Helper function to export as text
const exportAsText = () => {
    try {
        const formattedText = transcriptorState.value.transcript
            .map((segment) =>
                transcriptorState.value.showTimestamps
                    ? `${formatTime(segment.offset)} ${segment.text}`
                    : segment.text
            )
            .join('\n');

        const blob = new Blob([formattedText], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');

        // Get video title for the filename if available
        let filename = 'youtube-transcript';
        if (transcriptorState.value.videoDetails?.title) {
            // Clean the title for use as a filename
            filename = transcriptorState.value.videoDetails.title
                .replace(/[^\w\s]/gi, '') // Remove special characters
                .replace(/\s+/g, '_') // Replace spaces with underscores
                .substring(0, 50); // Limit length
        }

        link.href = url;
        link.download = `${filename}.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        toast.success('Transcript exported as text file');
    } catch (err) {
        console.error('Text export failed:', err);
        toast.error('Export failed. Please try copying the text directly.');
    }
};

const fetchVideoDetails = async (videoId) => {
    if (!videoId) return;

    try {
        // Using a server endpoint to fetch video details
        const response = await fetch(`/api/youtube-details?videoId=${videoId}`);

        if (!response.ok) {
            // If API call fails, create basic video details from player
            console.warn(
                'Failed to fetch video details from API, using fallback'
            );
            await createFallbackVideoDetails(videoId);
            return;
        }

        const data = await response.json();

        if (data.error) {
            console.error('API returned error:', data.error);
            await createFallbackVideoDetails(videoId);
            return;
        }

        transcriptorState.value.videoDetails = data;
    } catch (err) {
        console.error('Error fetching video details:', err);
        await createFallbackVideoDetails(videoId);
    }
};

// Fallback method to create basic video details when API fails
const createFallbackVideoDetails = async (videoId) => {
    // Wait for player to be ready
    if (player.value && playerReady.value) {
        try {
            // Get basic info from player if available
            const title = player.value.getVideoData?.()
                ? player.value.getVideoData().title
                : `Video ${videoId}`;

            transcriptorState.value.videoDetails = {
                title: title,
                channelTitle: 'YouTube Channel',
                publishedAt: new Date().toISOString(),
                viewCount: null,
                description:
                    'Video details unavailable. Please check the YouTube page for more information.',
            };
        } catch (err) {
            console.error('Error creating fallback video details:', err);
            transcriptorState.value.videoDetails = {
                title: `YouTube Video (${videoId})`,
                channelTitle: 'Unknown Channel',
                publishedAt: null,
                viewCount: null,
                description: 'Video details unavailable.',
            };
        }
    } else {
        // Most basic fallback
        transcriptorState.value.videoDetails = {
            title: `YouTube Video (${videoId})`,
            channelTitle: 'YouTube Channel',
            publishedAt: null,
            viewCount: null,
            description: 'Loading video details...',
        };
    }
};

const isValidViewCount = (count) => {
    if (!count || count === 'N/A' || isNaN(parseInt(count))) {
        return false;
    }
    return true;
};

const formatViewCount = (count) => {
    if (!count || count === 'N/A' || isNaN(parseInt(count))) {
        return '0';
    }

    const num = parseInt(count);
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    } else {
        return num.toString();
    }
};

const formatDate = (dateString) => {
    if (!dateString) return '';

    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
};

// Clean up on unmount
onUnmounted(() => {
    if (timeTracker) {
        clearInterval(timeTracker);
    }
    if (player.value) {
        player.value.destroy();
    }
});

// Handle shared data
onMounted(async () => {
    const sharedData = await getSharedData();
    if (sharedData) {
        // With our consolidated state, we can simply assign the whole shared state
        Object.assign(transcriptorState.value, sharedData);

        if (transcriptorState.value.youtubeUrl) {
            const videoId = extractVideoId(transcriptorState.value.youtubeUrl);
            if (videoId) {
                await initYouTubePlayer(videoId);
                // Only fetch video details if they're not included in shared data
                if (!transcriptorState.value.videoDetails) {
                    await fetchVideoDetails(videoId);
                }
            }
        }

        toast.success('Shared transcript loaded successfully');
    } else if (
        transcriptorState.value.youtubeUrl &&
        transcriptorState.value.transcript.length > 0
    ) {
        // If URL and transcript exist in localStorage but no shared data, try to load video
        const videoId = extractVideoId(transcriptorState.value.youtubeUrl);
        if (videoId) {
            await initYouTubePlayer(videoId);
            if (!transcriptorState.value.videoDetails) {
                await fetchVideoDetails(videoId);
            }
        }
    }
});

// Watch for changes in the URL to clear error message
watch(
    () => transcriptorState.value.youtubeUrl,
    () => {
        if (error.value) {
            error.value = null;
        }
    }
);

// Add this function after copyTranscript or before the exportPdf function
const shareTranscript = async () => {
    // Check if there's anything to share
    if (transcriptorState.value.transcript.length === 0) {
        toast.error('No transcript to share');
        return;
    }

    try {
        // Generate share link with the current transcriptorState
        const link = await generateShareLink(
            '/tools/transcriptor',
            transcriptorState.value
        );

        if (link) {
            // Use the same clipboard handling pattern as in the copyTranscript function
            if (navigator && navigator.clipboard) {
                navigator.clipboard
                    .writeText(link)
                    .then(() => {
                        toast.success('Share link copied to clipboard!');
                    })
                    .catch((err) => {
                        console.error('Clipboard API failed:', err);
                        fallbackCopyToClipboard(link);
                    });
            } else {
                fallbackCopyToClipboard(link);
            }
        } else {
            toast.error('Failed to generate share link');
        }
    } catch (error) {
        console.error('Error sharing transcript:', error);
        toast.error('An error occurred while sharing');
    }
};

// Add this function to clear just the input field
const clearInputField = () => {
    transcriptorState.value.youtubeUrl = '';
};
</script>
