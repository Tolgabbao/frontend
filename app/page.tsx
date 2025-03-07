"use client";

import React, { Suspense } from "react";
import ProductListContent from "@/components/products/ProductListContent";

// Simple loading spinner component
const Spinner = () => (
  <div className="flex justify-center items-center min-h-screen">
    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
  </div>
);

// Main page component wrapped in Suspense
export default function ProductList() {
  return (
    <Suspense fallback={<Spinner />}>
      <ProductListContent />
    </Suspense>
  );
}
