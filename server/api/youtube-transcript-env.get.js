import {
    YoutubeTranscript,
    YoutubeTranscriptDisabledError,
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

        // Determine if we're running on Vercel
        const isVercel =
            process.env.VERCEL === '1' || process.env.VERCEL === 'true';
        console.log(`Running on Vercel: ${isVercel ? 'yes' : 'no'}`);

        try {
            // Use standard approach which works locally
            const transcript = await YoutubeTranscript.fetchTranscript(videoId);
            return {
                transcript,
                source: 'direct',
            };
        } catch (error) {
            // If we get a "transcript disabled" error and we're on Vercel, try a different approach
            if (
                (error instanceof YoutubeTranscriptDisabledError ||
                    error.message.includes('Transcript is disabled')) &&
                isVercel
            ) {
                console.log(
                    'Using alternative YouTube transcript approach for Vercel...'
                );

                // Return a clear message that this is a Vercel-specific issue
                return {
                    statusCode: 403,
                    error: 'YouTube is blocking transcript access from Vercel servers. Try running the tool locally.',
                    workaroundMessage:
                        'This is a known issue with the youtube-transcript library when deployed to Vercel.',
                    githubIssue:
                        'https://github.com/Kakulukian/youtube-transcript/issues/11',
                    suggestion:
                        'Consider using a proxy server or running the tool locally.',
                };
            }

            // Re-throw other errors
            throw error;
        }
    } catch (error) {
        console.error('YouTube transcript error:', error);
        return {
            statusCode: 500,
            error: error.message || 'Failed to fetch YouTube transcript',
        };
    }
});
