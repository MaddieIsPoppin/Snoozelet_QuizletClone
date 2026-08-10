export default function CardImage({ src, alt = "", className = "" }) {
  if (!src) return null;

  return (
    // Cloudinary URLs are validated before persistence and provide responsive CDN delivery.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      className={className}
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer"
    />
  );
}
