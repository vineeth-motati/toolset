import { YoutubeTranscript } from 'youtube-transcript';

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

        // Fetch transcript using the youtube-transcript package
        const transcript = await YoutubeTranscript.fetchTranscript(videoId);

        return transcript;
    } catch (error) {
        console.error('Error fetching YouTube transcript:', error);

        return {
            statusCode: 500,
            error: error.message || 'Failed to fetch YouTube transcript',
        };
    }
});
