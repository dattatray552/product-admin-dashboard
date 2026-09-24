
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import api from "../../lib/api";

export default function AddProductPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    title: "",
    category: "",
    price: "",
    stock: "",
    description: "",
  });

  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  // --------------------------------------------------
  // Handle input changes
  // --------------------------------------------------
  function handleChange(e) {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  }

  // --------------------------------------------------
  // Submit product
  // --------------------------------------------------
  async function handleSubmit(e) {
    e.preventDefault();

    // Prevent duplicate Save requests
    if (saving) {
      return;
    }

    setError("");

    // Validation
    if (!form.title.trim()) {
      setError("Product title is required");
      return;
    }

    if (!form.category.trim()) {
      setError("Category is required");
      return;
    }

    if (
      form.price === "" ||
      Number(form.price) <= 0
    ) {
      setError("Price must be greater than 0");
      return;
    }

    if (
      form.stock === "" ||
      Number(form.stock) < 0
    ) {
      setError("Stock cannot be negative");
      return;
    }

    try {
      setSaving(true);

      // Send product to DummyJSON
      const response = await api.post(
        "/products/add",
        {
          title: form.title.trim(),
          category: form.category.trim(),
          price: Number(form.price),
          stock: Number(form.stock),
          description: form.description.trim(),
        }
      );

      const newProduct = response.data;

      console.log("Product created:", newProduct);

      // ------------------------------------------------
      // Save product locally
      // ------------------------------------------------
      const existingProducts =
        localStorage.getItem("localProducts");

      let localProducts = [];

      if (existingProducts) {
        try {
          localProducts = JSON.parse(existingProducts);
        } catch (error) {
          console.error(
            "Failed to parse local products:",
            error
          );
        }
      }

      // Add some default values because
      // DummyJSON may not return all fields.
      const productToSave = {
        ...newProduct,

        title: newProduct.title || form.title.trim(),

        category:
          newProduct.category ||
          form.category.trim(),

        price:
          newProduct.price ??
          Number(form.price),

        stock:
          newProduct.stock ??
          Number(form.stock),

        description:
          newProduct.description ||
          form.description.trim(),

        rating: newProduct.rating ?? 0,

        thumbnail:
          newProduct.thumbnail ||
          newProduct.images?.[0] ||
          "",

        images:
          newProduct.images || [],
      };

      // Prevent duplicate local product
      const alreadyExists = localProducts.some(
        (product) => product.id === productToSave.id
      );

      if (!alreadyExists) {
        localProducts.push(productToSave);
      }

      localStorage.setItem(
        "localProducts",
        JSON.stringify(localProducts)
      );

      alert(
        "Product added successfully!"
      );

      // Go back to products
      router.push("/products");

    } catch (error) {
      console.error(error);

      setError(
        "Failed to add product. Please try again."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-100">

      {/* Header */}
      <header className="bg-white border-b">

        <div className="max-w-4xl mx-auto px-6 py-4">

          <h1 className="text-2xl font-bold text-gray-800">
            Product Admin
          </h1>

          <p className="text-sm text-gray-500">
            Add New Product
          </p>

        </div>

      </header>

      {/* Main */}
      <main className="max-w-4xl mx-auto px-6 py-8">

        {/* Back Button */}
        <button
          onClick={() => router.push("/products")}
          className="text-blue-600 hover:text-blue-700 mb-6"
        >
          ← Back to Products
        </button>

        {/* Form Card */}
        <div className="bg-white rounded-xl shadow-sm border p-8">

          <h2 className="text-2xl font-semibold text-gray-800 mb-6">
            Add Product
          </h2>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className="space-y-5"
          >

            {/* Title */}
            <div>

              <label className="block text-sm font-medium text-gray-700 mb-2">
                Product Title *
              </label>

              <input
                type="text"
                name="title"
                value={form.title}
                onChange={handleChange}
                placeholder="Enter product title"
                className="w-full border border-gray-300 px-4 py-3 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

            </div>

            {/* Category */}
            <div>

              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category *
              </label>

              <input
                type="text"
                name="category"
                value={form.category}
                onChange={handleChange}
                placeholder="Example: smartphones"
                className="w-full border border-gray-300 px-4 py-3 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

            </div>

            {/* Price + Stock */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

              {/* Price */}
              <div>

                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Price *
                </label>

                <input
                  type="number"
                  name="price"
                  value={form.price}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  placeholder="Enter price"
                  className="w-full border border-gray-300 px-4 py-3 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />

              </div>

              {/* Stock */}
              <div>

                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Stock *
                </label>

                <input
                  type="number"
                  name="stock"
                  value={form.stock}
                  onChange={handleChange}
                  min="0"
                  placeholder="Enter stock"
                  className="w-full border border-gray-300 px-4 py-3 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />

              </div>

            </div>

            {/* Description */}
            <div>

              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>

              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                rows="5"
                placeholder="Enter product description"
                className="w-full border border-gray-300 px-4 py-3 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

            </div>

            {/* Buttons */}
            <div className="flex justify-end gap-3 pt-4">

              <button
                type="button"
                onClick={() => router.push("/products")}
                className="px-5 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={saving}
                className="px-5 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white rounded-lg"
              >
                {saving
                  ? "Saving..."
                  : "Add Product"}
              </button>

            </div>

          </form>

        </div>

      </main>

    </div>
  );
}

