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
            // If we get a "transcript disabled" error, try the YouTube API fallback
            if (
                error instanceof YoutubeTranscriptDisabledError ||
                error.message.includes('Transcript is disabled') ||
                error.message.includes('Could not retrieve')
            ) {
                console.log(
                    'Primary transcript method failed, trying YouTube API fallback...'
                );

                // Check if we have an API key available
                const apiKey = process.env.YOUTUBE_API_KEY;
                const clientId = process.env.YOUTUBE_CLIENT_ID;
                const clientSecret = process.env.YOUTUBE_CLIENT_SECRET;
                const refreshToken = process.env.YOUTUBE_REFRESH_TOKEN;

                if (apiKey) {
                    try {
                        // First try with just API key if available
                        const apiTranscript =
                            await fetchTranscriptWithYouTubeAPI(videoId, {
                                apiKey,
                                clientId,
                                clientSecret,
                                refreshToken,
                            });

                        if (apiTranscript && apiTranscript.length > 0) {
                            console.log(
                                'Successfully retrieved transcript via YouTube API'
                            );
                            return {
                                transcript: apiTranscript,
                                source: 'youtube_api',
                            };
                        }
                    } catch (apiError) {
                        console.error(
                            'YouTube API fallback failed:',
                            apiError.message
                        );
                    }
                }

                // If YouTube API also failed or wasn't available, return the original error
                if (isVercel) {
                    console.log(
                        'Using alternative YouTube transcript approach for Vercel...'
                    );
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

/**
 * Fetches transcript using the YouTube Data API
 * @param {string} videoId - YouTube video ID
 * @param {Object} credentials - API credentials
 * @returns {Promise<Array>} - Transcript formatted like the youtube-transcript library output
 */
async function fetchTranscriptWithYouTubeAPI(videoId, credentials) {
    const { apiKey, clientId, clientSecret, refreshToken } = credentials;

    // First, get the caption tracks available for the video
    const captionsListUrl = `https://www.googleapis.com/youtube/v3/captions?part=snippet&videoId=${videoId}&key=${apiKey}`;

    const response = await fetch(captionsListUrl);
    const data = await response.json();

    if (!response.ok) {
        console.error('YouTube API error:', data);
        throw new Error(data.error?.message || 'Failed to fetch captions list');
    }

    if (!data.items || data.items.length === 0) {
        throw new Error('No captions available for this video');
    }

    // Find an English track, or use the first available track
    let captionTrack = data.items.find(
        (item) =>
            item.snippet.language === 'en' ||
            item.snippet.language === 'en-US' ||
            item.snippet.language === 'en-GB'
    );

    // If no English track found, use the first available
    if (!captionTrack) {
        captionTrack = data.items[0];
    }

    const captionId = captionTrack.id;

    // If we have OAuth credentials, try to download the actual captions
    if (clientId && clientSecret && refreshToken) {
        try {
            // Get a fresh access token using the refresh token
            const accessToken = await getAccessToken(
                clientId,
                clientSecret,
                refreshToken
            );

            // Download the caption track
            const captionUrl = `https://www.googleapis.com/youtube/v3/captions/${captionId}?key=${apiKey}`;

            const captionResponse = await fetch(captionUrl, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });

            if (!captionResponse.ok) {
                throw new Error('Failed to download captions with OAuth');
            }

            // Parse the caption content (may need format conversion)
            const captionData = await captionResponse.json();
            return parseCaptionData(captionData);
        } catch (oauthError) {
            console.error('OAuth caption download failed:', oauthError);
            // Fall back to the alternative method
        }
    }

    // Alternative method: Use the videos.list endpoint to get transcript
    // This is a limited fallback when OAuth isn't available
    try {
        // Get video details with potential transcript info
        const videoUrl = `https://www.googleapis.com/youtube/v3/videos?part=id,snippet,contentDetails&id=${videoId}&key=${apiKey}`;
        const videoResponse = await fetch(videoUrl);
        const videoData = await videoResponse.json();

        if (!videoResponse.ok) {
            throw new Error('Failed to fetch video details');
        }

        // Try to find auto-generated captions using timedtext API
        // This is a non-official approach but can work in some cases
        const videoInfo = videoData.items[0];
        if (!videoInfo) {
            throw new Error('Video not found');
        }

        // Use a direct caption fetch approach
        const transcript = await fetchCaptionsViaTimedText(videoId);
        if (transcript && transcript.length > 0) {
            return transcript;
        }

        throw new Error(
            'Could not retrieve captions without OAuth authentication'
        );
    } catch (err) {
        console.error('Error getting transcript:', err);
        throw new Error('Failed to retrieve transcript: ' + err.message);
    }
}

/**
 * Gets a fresh access token using a refresh token
 */
async function getAccessToken(clientId, clientSecret, refreshToken) {
    const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
            client_id: clientId,
            client_secret: clientSecret,
            refresh_token: refreshToken,
            grant_type: 'refresh_token',
        }),
    });

    const data = await response.json();
    if (!response.ok) {
        throw new Error('Failed to refresh access token: ' + data.error);
    }

    return data.access_token;
}

/**
 * Parse caption data into transcript format
 */
function parseCaptionData(captionData) {
    // Implementation depends on the format returned by the API
    // This is a placeholder - proper implementation would parse the caption format
    // and convert it to the expected transcript format
    const segments = [];

    // Process the caption data based on its format
    // The format might be XML, JSON, or another format depending on the API

    return segments;
}

/**
 * Alternative method to fetch captions using YouTube's timedtext API
 * This is a non-official approach but can work in some cases
 */
async function fetchCaptionsViaTimedText(videoId) {
    try {
        // First get the available caption tracks
        const response = await fetch(
            `https://www.youtube.com/watch?v=${videoId}`
        );
        const html = await response.text();

        // Try to extract caption URL from the video page
        // This is a simplified approach and may need adjustments
        const segments = [];

        // Using the direct API library as alternative
        const transcript = await YoutubeTranscript.fetchTranscript(videoId, {
            lang: 'en',
            country: 'US',
        });

        return transcript;
    } catch (error) {
        console.error('Error fetching via timedtext:', error);
        return null;
    }
}
