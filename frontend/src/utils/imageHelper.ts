import { BACKEND_URL } from '../lib/api';

/**
 * Resolves full URL paths for uploaded images.
 * Prepend the backend server domain to any local relative paths (e.g. starting with '/uploads/').
 */
export const getImageUrl = (image: string | undefined | null): string => {
  if (!image) return '';
  if (
    image.startsWith('http://') || 
    image.startsWith('https://') || 
    image.startsWith('data:') ||
    image.startsWith('blob:')
  ) {
    return image;
  }
  // Remove absolute or leading slash if present to prevent double slash
  const cleanPath = image.startsWith('/') ? image : `/${image}`;
  return `${BACKEND_URL}${cleanPath}`;
};
