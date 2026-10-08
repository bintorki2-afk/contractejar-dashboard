"use client";

import { useState } from "react";

import { DEFAULT_AVATAR, resolveBackendAssetUrl } from "@/src/lib/asset-url";

/**
 * صورة موظف/مستخدم من الخادم: يبني الرابط على أصل الخادم، وعند غياب الصورة أو
 * فشل تحميلها يعرض `fallback` (مثل الأحرف الأولى) أو الصورة الافتراضية.
 * <img> عادي (وليس next/image) لأن مصدر الصورة دومين الخادم المتغيّر بين البيئات.
 */
export default function AvatarImage({ src, alt = "", fallback, fallbackSrc = DEFAULT_AVATAR, className, ...props }) {
  const resolved = resolveBackendAssetUrl(src);
  const [failedSrc, setFailedSrc] = useState(null);
  const broken = !resolved || failedSrc === resolved;

  if (broken && fallback !== undefined) return fallback;

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={broken ? fallbackSrc : resolved}
      alt={alt}
      className={className}
      loading="lazy"
      decoding="async"
      onError={() => {
        if (!broken) setFailedSrc(resolved);
      }}
      {...props}
    />
  );
}
