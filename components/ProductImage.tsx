"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Package } from "lucide-react";
import { productsApi } from "@/api/products";

interface ProductImageProps {
  productId: number;
  imageId?: number; // Optional - if provided, uses specific image
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  fill?: boolean;
  sizes?: string;
}

export default function ProductImage({
  productId,
  imageId,
  alt,
  className = "",
  fill = true,
  sizes,
}: ProductImageProps) {
  const [hasError, setHasError] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  // Fetch the proper image URL for this product
  useEffect(() => {
    const getImageUrl = async () => {
      try {
        if (imageId) {
          // If we have a specific imageId, construct the direct URL to the backend
          setImageUrl(`${apiBaseUrl}/media/product_images/${imageId}.jpg`);
        } else {
          // Otherwise, fetch product and use main_image_url from the backend
          const product = await productsApi.getProduct(productId);
          // Make sure the URL points to the backend, not frontend
          if (
            product.main_image_url &&
            !product.main_image_url.startsWith("http")
          ) {
            setImageUrl(`${apiBaseUrl}${product.main_image_url}`);
          } else {
            setImageUrl(product.main_image_url || null);
          }
        }
      } catch (error) {
        console.error("Error fetching image URL:", error);
        setHasError(true);
      }
    };

    getImageUrl();
  }, [productId, imageId, apiBaseUrl]);

  if (hasError || !imageUrl) {
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
      src={imageUrl}
      alt={alt}
      fill={fill}
      sizes={sizes}
      className={`object-cover ${className}`}
      onError={() => setHasError(true)}
      unoptimized
    />
  );
}
