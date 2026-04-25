"use client";
import { useState } from "react";
import Input from "@/components/ui/input";
import Button from "@/components/ui/button";

export default function AddProductPage() {
  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    image_url: ""
  });

  async function handleSubmit(e) {
    e.preventDefault();

    const res = await fetch("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    if (!res.ok) {
      const text = await res.text(); // debug raw response
      console.error("Server returned:", text);
    } else {
      const data = await res.json();
      console.log("Product added:", data);
      alert("Product added successfully!");
    }
  }

  return (
    <div className="max-w-lg mx-auto p-6 bg-blue-900 shadow rounded">
      <h1 className="text-2xl font-bold mb-4">Add a New Product</h1>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <Input placeholder="Product Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <Input placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        <Input type="number" placeholder="Price" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
        <Input placeholder="Image URL" value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} />
        <Button type="submit">Add Product</Button>
      </form>
    </div>
  );
}
