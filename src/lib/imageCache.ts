const IMAGE_CACHE_NAME = "my-blog-image-cache-v1";

function supportsImageCache() {
  return typeof window !== "undefined" && "caches" in window && "URL" in window;
}

function createCacheRequest(src: string) {
  return new Request(src, {
    mode: "cors",
    credentials: "omit",
  });
}

export async function warmImageCache(src: string) {
  if (!src || !supportsImageCache()) {
    return;
  }

  try {
    const cache = await window.caches.open(IMAGE_CACHE_NAME);
    const request = createCacheRequest(src);
    const cachedResponse = await cache.match(request);

    if (cachedResponse) {
      return;
    }

    const response = await fetch(request);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status}`);
    }

    await cache.put(request, response.clone());
  } catch (error) {
    console.warn("Failed to warm image cache:", error);
  }
}

export async function getCachedImageObjectUrl(src: string) {
  if (!src || !supportsImageCache()) {
    return src;
  }

  const cache = await window.caches.open(IMAGE_CACHE_NAME);
  const request = createCacheRequest(src);
  let response = await cache.match(request);

  if (!response) {
    response = await fetch(request);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status}`);
    }
    await cache.put(request, response.clone());
  }

  const blob = await response.blob();
  return URL.createObjectURL(blob);
}
