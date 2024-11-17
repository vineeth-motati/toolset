export const getBaseUrl = (): string => {
  const config = useRuntimeConfig();

  // Check if baseUrl is defined in runtime config
  if (config.public.baseUrl) {
    return config.public.baseUrl;
  }

  // Fallback to window.location.href (browser only)
  if (process.client) {
    const { protocol, host } = window.location;
    return `${protocol}//${host}`;
  }

  // Default fallback for server-side
  return '';
};
