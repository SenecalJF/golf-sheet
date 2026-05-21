import Image from "next/image";
import { Users } from "lucide-react";

export function PlayerPhoto({
  src,
  alt,
  className,
  fallbackClassName = "",
  iconClassName = "h-6 w-6",
  sizes = "96px",
  fill = false,
}: {
  src: string | null;
  alt: string;
  className: string;
  fallbackClassName?: string;
  iconClassName?: string;
  sizes?: string;
  fill?: boolean;
}) {
  if (!src) {
    return (
      <div
        className={`grid place-items-center bg-primary/15 text-primary ${className} ${fallbackClassName}`}
      >
        <Users className={iconClassName} />
      </div>
    );
  }

  if (src.startsWith("/")) {
    return fill ? (
      <Image src={src} alt={alt} fill sizes={sizes} className={`${className} object-cover`} />
    ) : (
      <Image src={src} alt={alt} width={96} height={96} className={`${className} object-cover`} />
    );
  }

  return (
    <div
      role="img"
      aria-label={alt}
      className={`bg-cover bg-center ${className}`}
      style={{ backgroundImage: `url("${src.replaceAll('"', "%22")}")` }}
    />
  );
}
