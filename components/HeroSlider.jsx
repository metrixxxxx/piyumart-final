"use client";

import { useEffect, useState, useRef } from "react";

export default function HeroSlider() {
  const [products, setProducts] = useState([]);
  const [index, setIndex] = useState(0);
  const [animating, setAnimating] = useState(false);
  const [direction, setDirection] = useState("next");
  const intervalRef = useRef(null);

  useEffect(() => {
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
    load();
  }, []);

  const goTo = (nextIndex, dir = "next") => {
    if (animating) return;
    setDirection(dir);
    setAnimating(true);
    setTimeout(() => {
      setIndex(nextIndex);
      setAnimating(false);
    }, 500);
  };

  useEffect(() => {
    if (products.length === 0) return;
    intervalRef.current = setInterval(() => {
      goTo((index + 1) % products.length, "next");
    }, 4000);
    return () => clearInterval(intervalRef.current);
  }, [products, index, animating]);

  if (products.length === 0) {
    return (
      <div className="h-[400px] flex items-center justify-center text-gray-400">
        Loading featured products...
      </div>
    );
  }

  const product = products[index];

  return (
    <>
      <style>{`
        @keyframes slideInFromRight {
          from { transform: translateX(100%); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
        @keyframes slideInFromLeft {
          from { transform: translateX(-100%); opacity: 0; }
          to   { transform: translateX(0);     opacity: 1; }
        }
        .slide-enter-next {
          animation: slideInFromRight 0.5s ease forwards;
        }
        .slide-enter-prev {
          animation: slideInFromLeft 0.5s ease forwards;
        }
      `}</style>

      <div className="relative w-full h-[400px] overflow-hidden rounded-xl">

        {/* IMAGE — re-keyed to trigger animation on change */}
        <img
          key={`img-${index}`}
          src={
            product.image_url?.startsWith("http")
              ? product.image_url
              : "https://via.placeholder.com/1200x400?text=No+Image"
          }
          alt={product.name}
          className={`w-full h-full object-cover absolute inset-0 ${
            direction === "next" ? "slide-enter-next" : "slide-enter-prev"
          }`}
        />

        {/* OVERLAY — centered content */}
        <div
          key={`overlay-${index}`}
          className={`absolute inset-0 bg-black/50 flex flex-col items-center justify-center text-center px-10 ${
            direction === "next" ? "slide-enter-next" : "slide-enter-prev"
          }`}
        >
          <h1 className="text-3xl font-bold text-white">
            {product.name}
          </h1>

          <p className="text-gray-200 mt-2 max-w-md">
            {product.description}
          </p>

          <p className="text-blue-300 mt-2 font-semibold">
            ₱{Number(product.price).toLocaleString()}
          </p>

          <button className="mt-4 bg-blue-500 px-4 py-2 rounded hover:bg-blue-600">
            View Product
          </button>
        </div>

        {/* PREV / NEXT ARROWS */}
        <button
          onClick={() =>
            goTo((index - 1 + products.length) % products.length, "prev")
          }
          className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full w-9 h-9 flex items-center justify-center z-10"
        >
          ‹
        </button>
        <button
          onClick={() => goTo((index + 1) % products.length, "next")}
          className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full w-9 h-9 flex items-center justify-center z-10"
        >
          ›
        </button>

        {/* DOTS */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2 z-10">
          {products.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i, i > index ? "next" : "prev")}
              className={`w-2 h-2 rounded-full ${
                i === index ? "bg-white" : "bg-gray-500"
              }`}
            />
          ))}
        </div>

      </div>
    </>
  );
}