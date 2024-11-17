import { nanoid } from 'nanoid';

export const useShareLink = () => {
  const config = useRuntimeConfig();

  const generateShareLink = (toolPath: string, data: any) => {
    const id = nanoid(10);
    const shareData = JSON.stringify(data);

    // In a real app, you'd save this to a database
    // For demo, we'll use URL parameters
    const params = new URLSearchParams({ data: shareData });
    return `${config.public.baseUrl}${toolPath}?share=${id}&${params.toString()}`;
  };

  const getSharedData = () => {
    const route = useRoute();
    const sharedData = route.query.data;

    if (sharedData) {
      try {
        const data = JSON.parse(sharedData as string);
        const query = { ...route.query };
        delete query.data;
        navigateTo({ path: route.path , query });
        return data;
      } catch (e) {
        console.error('Failed to parse shared data:', e);
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
