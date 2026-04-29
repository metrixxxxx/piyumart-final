"use client";

import { useEffect, useState } from "react";

export default function HeroSlider() {
  const [products, setProducts] = useState([]);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/products/featured");
      const data = await res.json();
      setProducts(Array.isArray(data) ? data : []);
    }

    load();
  }, []);

  useEffect(() => {
    if (products.length === 0) return;

    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % products.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [products]);

  if (products.length === 0) {
    return (
      <div className="h-[400px] flex items-center justify-center text-gray-400">
        Loading featured products...
      </div>
    );
  }

  const product = products[index];

  async function load() {
  try {
    const res = await fetch("/api/products/featured");

    const data = await res.json().catch(() => []);

    setProducts(Array.isArray(data) ? data : []);
  } catch (err) {
    console.error("Fetch failed:", err);
    setProducts([]);
  }
}

  return (
    <div className="relative w-full h-[400px] overflow-hidden rounded-xl">

      {/* IMAGE */}
      <img
        src={
          product.image_url?.startsWith("http")
            ? product.image_url
            : "https://via.placeholder.com/1200x400?text=Invalid+Image"
        }
        alt={product.name}
        className="w-full h-full object-cover transition-all duration-700"
      />

      {/* OVERLAY */}
      <div className="absolute inset-0 bg-black/50 flex flex-col justify-center px-10">

        <h1 className="text-3xl font-bold text-white">
          {product.name}
        </h1>

        <p className="text-gray-200 mt-2 max-w-md">
          {product.description}
        </p>

        <p className="text-blue-300 mt-2 font-semibold">
          ₱{product.price}
        </p>

        <button className="mt-4 bg-blue-500 px-4 py-2 rounded hover:bg-blue-600 w-fit">
          View Product
        </button>
      </div>

      {/* DOTS */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
        {products.map((_, i) => (
          <button
            key={i}
            onClick={() => setIndex(i)}
            className={`w-2 h-2 rounded-full ${
              i === index ? "bg-white" : "bg-gray-500"
            }`}
          />
        ))}
      </div>

    </div>
  );
}