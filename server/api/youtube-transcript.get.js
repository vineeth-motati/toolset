import {
    YoutubeTranscript,
    YoutubeTranscriptError,
    YoutubeTranscriptDisabledError,
    YoutubeTranscriptNotAvailableError,
    YoutubeTranscriptVideoUnavailableError,
    YoutubeTranscriptTooManyRequestError,
} from 'youtube-transcript';

export default defineEventHandler(async (event) => {
    try {
        const query = getQuery(event);
        const { videoId } = query;

        if (!videoId) {
            return {
                statusCode: 400,
                error: 'Video ID is required',
            };
        }

        // Log the request for debugging on Vercel
        console.log(`Fetching transcript for video ID: ${videoId}`);

        try {
            // Add custom user agent and origin headers to avoid YouTube blocking
            const transcript = await YoutubeTranscript.fetchTranscript(videoId);
            console.log(
                `Successfully fetched transcript with ${transcript.length} segments`
            );
            return transcript;
        } catch (primaryError) {
            // Handle specific errors with better messages
            console.error(
                `Transcript error for ${videoId}:`,
                primaryError.message
            );

            // Provide specific error messages based on error type
            if (primaryError instanceof YoutubeTranscriptDisabledError) {
                // This is likely a false negative when running on Vercel
                return {
                    statusCode: 403,
                    error: `YouTube is blocking transcript access from our server. This is a common issue with Vercel deployments. Try using the tool locally or try a different video.`,
                    videoId,
                    errorType: 'TRANSCRIPT_DISABLED',
                };
            } else if (
                primaryError instanceof YoutubeTranscriptNotAvailableError
            ) {
                return {
                    statusCode: 404,
                    error: `No transcript is available for this video. The creator may not have added captions.`,
                    videoId,
                    errorType: 'NOT_AVAILABLE',
                };
            } else if (
                primaryError instanceof YoutubeTranscriptVideoUnavailableError
            ) {
                return {
                    statusCode: 404,
                    error: `The video is unavailable or may be private.`,
                    videoId,
                    errorType: 'VIDEO_UNAVAILABLE',
                };
            } else if (
                primaryError instanceof YoutubeTranscriptTooManyRequestError
            ) {
                return {
                    statusCode: 429,
                    error: `YouTube rate limit reached. Please try again later.`,
                    videoId,
                    errorType: 'RATE_LIMIT',
                };
            } else {
                // Re-throw unknown errors
                throw primaryError;
            }
        }
    } catch (error) {
        console.error('Error fetching YouTube transcript:', error);

        return {
            statusCode: 500,
            error: error.message || 'Failed to fetch YouTube transcript',
            details: error.stack,
        };
    }
});
