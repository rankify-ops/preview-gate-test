import { asset } from "@/lib/basePath";

/**
 * Every photograph on the site.
 *
 * scripts/images.mjs writes each source at two widths as webp; this picks
 * between them with a plain srcset. next/image is deliberately not used —
 * `output: "export"` runs it unoptimised anyway, so it would add a wrapper and
 * layout behaviour for no optimisation at all.
 *
 * Pass the real `sizes` wherever the image is smaller than the viewport, or
 * phones download the 1600 for a 380px slot.
 */
export function Photo({
  name,
  alt,
  className = "",
  sizes = "100vw",
  priority = false,
}: {
  name: string;
  alt: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={asset(`/img/${name}-1600.webp`)}
      srcSet={`${asset(`/img/${name}-800.webp`)} 800w, ${asset(`/img/${name}-1600.webp`)} 1600w`}
      sizes={sizes}
      alt={alt}
      className={className}
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : undefined}
      decoding="async"
    />
  );
}
