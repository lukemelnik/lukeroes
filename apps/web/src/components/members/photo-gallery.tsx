import { useState } from "react";
import { Lightbox } from "./lightbox";

interface GalleryImage {
  url: string;
  alt: string;
  caption: string | null;
  width: number | null;
  height: number | null;
}

interface FeedGalleryProps {
  images: GalleryImage[];
}

export function FeedGallery({ images }: FeedGalleryProps) {
  if (images.length === 0) return null;

  if (images.length === 1) {
    return (
      <div className="overflow-hidden rounded-lg">
        <img
          src={images[0].url}
          alt={images[0].alt}
          className="aspect-video w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          loading="lazy"
        />
      </div>
    );
  }

  if (images.length === 2) {
    return (
      <div className="grid grid-cols-2 gap-1 overflow-hidden rounded-lg">
        {images.map((image) => (
          <img
            key={image.url}
            src={image.url}
            alt={image.alt}
            className="aspect-square w-full object-cover"
            loading="lazy"
          />
        ))}
      </div>
    );
  }

  if (images.length === 3) {
    return (
      <div className="grid grid-cols-2 gap-1 overflow-hidden rounded-lg">
        <img
          src={images[0].url}
          alt={images[0].alt}
          className="col-span-2 aspect-video w-full object-cover"
          loading="lazy"
        />
        {images.slice(1).map((image) => (
          <img
            key={image.url}
            src={image.url}
            alt={image.alt}
            className="aspect-square w-full object-cover"
            loading="lazy"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-1 overflow-hidden rounded-lg">
      {images.slice(0, 4).map((image, i) => (
        <div key={image.url} className="relative">
          <img
            src={image.url}
            alt={image.alt}
            className="aspect-square w-full object-cover"
            loading="lazy"
          />
          {i === 3 && images.length > 4 && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 font-medium text-lg text-white">
              +{images.length - 4}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

interface DetailGalleryProps {
  images: GalleryImage[];
}

export function DetailGallery({ images }: DetailGalleryProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  if (images.length === 0) return null;

  function openLightbox(index: number) {
    setLightboxIndex(index);
  }

  const lightboxImages = images.map((img) => ({
    url: img.url,
    alt: img.alt,
    caption: img.caption,
  }));

  if (images.length === 1) {
    return (
      <>
        <button type="button" onClick={() => openLightbox(0)} className="block w-full">
          <img
            src={images[0].url}
            alt={images[0].alt}
            className="w-full cursor-zoom-in rounded-lg object-cover"
            loading="lazy"
          />
        </button>
        {lightboxIndex !== null && (
          <Lightbox
            images={lightboxImages}
            initialIndex={lightboxIndex}
            onClose={() => setLightboxIndex(null)}
          />
        )}
      </>
    );
  }

  if (images.length === 2) {
    return (
      <>
        <div className="grid grid-cols-2 gap-2">
          {images.map((image, i) => (
            <button key={image.url} type="button" onClick={() => openLightbox(i)} className="block">
              <img
                src={image.url}
                alt={image.alt}
                className="aspect-square w-full cursor-zoom-in rounded-lg object-cover"
                loading="lazy"
              />
            </button>
          ))}
        </div>
        {lightboxIndex !== null && (
          <Lightbox
            images={lightboxImages}
            initialIndex={lightboxIndex}
            onClose={() => setLightboxIndex(null)}
          />
        )}
      </>
    );
  }

  if (images.length === 3) {
    return (
      <>
        <div className="grid grid-cols-2 gap-2">
          <button type="button" onClick={() => openLightbox(0)} className="col-span-2 block">
            <img
              src={images[0].url}
              alt={images[0].alt}
              className="aspect-video w-full cursor-zoom-in rounded-lg object-cover"
              loading="lazy"
            />
          </button>
          {images.slice(1).map((image, i) => (
            <button
              key={image.url}
              type="button"
              onClick={() => openLightbox(i + 1)}
              className="block"
            >
              <img
                src={image.url}
                alt={image.alt}
                className="aspect-square w-full cursor-zoom-in rounded-lg object-cover"
                loading="lazy"
              />
            </button>
          ))}
        </div>
        {lightboxIndex !== null && (
          <Lightbox
            images={lightboxImages}
            initialIndex={lightboxIndex}
            onClose={() => setLightboxIndex(null)}
          />
        )}
      </>
    );
  }

  return (
    <>
      <div className="columns-2 gap-2 space-y-2">
        {images.map((image, i) => (
          <button
            key={image.url}
            type="button"
            onClick={() => openLightbox(i)}
            className="block w-full"
          >
            <img
              src={image.url}
              alt={image.alt}
              className="w-full cursor-zoom-in rounded-lg object-cover"
              loading="lazy"
              style={
                image.width && image.height
                  ? { aspectRatio: `${image.width} / ${image.height}` }
                  : undefined
              }
            />
          </button>
        ))}
      </div>
      {lightboxIndex !== null && (
        <Lightbox
          images={lightboxImages}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </>
  );
}
