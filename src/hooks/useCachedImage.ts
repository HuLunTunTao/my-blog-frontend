import { useEffect, useState } from "react";
import { getCachedImageObjectUrl } from "@/lib/imageCache";

export function useCachedImage(src: string) {
  const [resolvedSrc, setResolvedSrc] = useState(src);

  useEffect(() => {
    let cancelled = false;
    let objectUrl: string | null = null;

    setResolvedSrc(src);

    if (!src) {
      return;
    }

    const loadCachedImage = async () => {
      try {
        const nextSrc = await getCachedImageObjectUrl(src);
        if (cancelled) {
          if (nextSrc.startsWith("blob:")) {
            URL.revokeObjectURL(nextSrc);
          }
          return;
        }

        objectUrl = nextSrc.startsWith("blob:") ? nextSrc : null;
        setResolvedSrc(nextSrc);
      } catch (error) {
        if (!cancelled) {
          console.warn("Failed to load cached image:", error);
          setResolvedSrc(src);
        }
      }
    };

    void loadCachedImage();

    return () => {
      cancelled = true;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [src]);

  return resolvedSrc;
}
