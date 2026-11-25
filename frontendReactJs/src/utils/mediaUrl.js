/**
 * Resolves an avatar / image URL so it works seamlessly whether hosted on Cloudinary,
 * uploaded locally to backend (/uploads/profileImages/...), or passed as a blob/data URI.
 */
export function getMediaUrl(url) {
  if (!url) return "";
  if (
    url.startsWith("http://") ||
    url.startsWith("https://") ||
    url.startsWith("blob:") ||
    url.startsWith("data:")
  ) {
    return url;
  }
  // If it's a relative path starting with /
  if (url.startsWith("/")) {
    const apiUrl = import.meta.env.VITE_API_URL;
    if (apiUrl && apiUrl.startsWith("http")) {
      try {
        const origin = new URL(apiUrl).origin;
        return `${origin}${url}`;
      } catch {
        return url;
      }
    }
  }
  return url;
}
