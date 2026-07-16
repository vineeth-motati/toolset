import axios from 'axios';
import { getBaseUrl } from '~/utils/baseUrl';

export default defineNuxtPlugin(() => {
    const axiosInstance = axios.create({
        // In the browser this resolves to the current origin, so internal
        // API calls (e.g. /api/share) hit the server actually running the
        // app instead of the configured production domain.
        baseURL: getBaseUrl(),
    });

    return {
        provide: {
            axios: axiosInstance,
        },
    };
});
