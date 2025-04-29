export default defineEventHandler(async (event) => {
    try {
        const query = getQuery(event);
        const videoId = query.videoId;

        if (!videoId) {
            return {
                error: 'Video ID is required',
            };
        }

        // In a real implementation, you'd use the YouTube Data API with your API key
        // This is a simplified example that fetches the oEmbed data which doesn't require an API key
        const response = await fetch(
            `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`
        );

        if (!response.ok) {
            throw new Error('Failed to fetch video data');
        }

        const oembedData = await response.json();

        // Return basic information from oembed
        return {
            title: oembedData.title,
            channelTitle: oembedData.author_name,
            publishedAt: new Date().toISOString(), // Not available in oembed
            viewCount: 'N/A', // Not available in oembed
            description: `Video by ${oembedData.author_name}`, // Not available in oembed
            thumbnailUrl: oembedData.thumbnail_url,
        };
    } catch (error) {
        console.error('Error in youtube-details API:', error);

        return {
            error: error.message || 'Failed to fetch video details',
        };
    }
});
