"use client";

import { useState } from "react";
import Image from "next/image";
import { Package } from "lucide-react";

interface ProductImageProps {
  productId: number;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  fill?: boolean;
  sizes?: string;
}

export default function ProductImage({
  productId,
  alt,
  className = "",
  fill = true,
  sizes,
}: ProductImageProps) {
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return (
      <div
        className={`flex items-center justify-center bg-light-gray ${className}`}
      >
        <Package className="w-1/3 h-1/3 text-medium-gray" />
      </div>
    );
  }

  return (
    <Image
      src={`${process.env.NEXT_PUBLIC_API_URL}/api/products/${productId}/image/`}
      alt={alt}
      fill={fill}
      sizes={sizes}
      className={`object-cover ${className}`}
      onError={() => setHasError(true)}
      unoptimized
    />
  );
}
