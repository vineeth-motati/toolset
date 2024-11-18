import { getBaseUrl } from '~/utils/baseUrl';

export const useShareLink = () => {
    const { $axios } = useNuxtApp();

    const generateShareLink = async (
        toolPath: string,
        data: Record<string, any>
    ) => {
        try {
            const response = await $axios.post('/api/share', { data }); // Send structured data
            const { id } = response.data;
            const baseUrl = getBaseUrl();
            return `${baseUrl}${toolPath}?share=${id}`;
        } catch (err) {
            console.error('Error generating share link:', err);
            return null;
        }
    };

    const getSharedData = async () => {
        const route = useRoute();
        const id = route.query.share;

        if (id) {
            try {
                const response = await $axios.get(`/api/share/${id}`);
                return response.data;
            } catch (err) {
                console.error('Failed to fetch shared data:', err);
                return null;
            }
        }

        return null;
    };

    return {
        generateShareLink,
        getSharedData,
    };
};
