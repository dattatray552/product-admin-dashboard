"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "../../../lib/api";

export default function EditProductPage() {
  const params = useParams();
  const router = useRouter();

  const [form, setForm] = useState({
    title: "",
    category: "",
    price: "",
    stock: "",
    description: "",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notFound, setNotFound] = useState(false);

  // --------------------------------------------------
  // Authentication + Load Product
  // --------------------------------------------------
  useEffect(() => {
    const token = localStorage.getItem("accessToken");

    if (!token) {
      window.location.href = "/login";
      return;
    }

    if (!params.id) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    loadProduct();
  }, [params.id]);

  // --------------------------------------------------
  // Load product
  // --------------------------------------------------
  async function loadProduct() {
    try {
      setLoading(true);
      setError("");
      setNotFound(false);

      // ----------------------------------------------
      // First check localStorage
      // ----------------------------------------------
      const savedProducts =
        localStorage.getItem("localProducts");

      if (savedProducts) {
        try {
          const localProducts =
            JSON.parse(savedProducts);

          const localProduct =
            localProducts.find(
              (product) =>
                String(product.id) ===
                String(params.id)
            );

          if (localProduct) {
            setForm({
              title: localProduct.title || "",
              category: localProduct.category || "",
              price: localProduct.price ?? "",
              stock: localProduct.stock ?? "",
              description:
                localProduct.description || "",
            });

            setLoading(false);
            return;
          }
        } catch (error) {
          console.error(
            "Failed to read local products:",
            error
          );
        }
      }

      // ----------------------------------------------
      // If not local, load from DummyJSON
      // ----------------------------------------------
      try {
        const response = await api.get(
          `/products/${params.id}`
        );

        const product = response.data;

        if (!product || !product.id) {
          setNotFound(true);
          return;
        }

        setForm({
          title: product.title || "",
          category: product.category || "",
          price: product.price ?? "",
          stock: product.stock ?? "",
          description:
            product.description || "",
        });
      } catch (error) {
        // DummyJSON returns 404 for invalid product ID
        if (error.response?.status === 404) {
          setNotFound(true);
          return;
        }

        throw error;
      }
    } catch (error) {
      console.error(error);

      setError(
        "Failed to load product. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  // --------------------------------------------------
  // Handle input
  // --------------------------------------------------
  function handleChange(e) {
    const { name, value } = e.target;

    setForm((previousForm) => ({
      ...previousForm,
      [name]: value,
    }));
  }

  // --------------------------------------------------
  // Validate form
  // --------------------------------------------------
  function validateForm() {
    if (!form.title.trim()) {
      return "Product title is required";
    }

    if (!form.category.trim()) {
      return "Category is required";
    }

    if (
      form.price === "" ||
      Number(form.price) <= 0
    ) {
      return "Price must be greater than 0";
    }

    if (
      form.stock === "" ||
      Number(form.stock) < 0
    ) {
      return "Stock cannot be negative";
    }

    return "";
  }

  // --------------------------------------------------
  // Save Changes
  // --------------------------------------------------
  async function handleSubmit(e) {
    e.preventDefault();

    // Prevent duplicate Save requests
    if (saving) {
      return;
    }

    setError("");

    const validationError =
      validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setSaving(true);

      // ----------------------------------------------
      // Update DummyJSON API
      // ----------------------------------------------
      const response = await api.put(
        `/products/${params.id}`,
        {
          title: form.title.trim(),
          category: form.category.trim(),
          price: Number(form.price),
          stock: Number(form.stock),
          description: form.description.trim(),
        }
      );

      const apiProduct = response.data;

      console.log(
        "Product updated:",
        apiProduct
      );

      // ----------------------------------------------
      // Read existing local products
      // ----------------------------------------------
      const savedProducts =
        localStorage.getItem("localProducts");

      let localProducts = [];

      if (savedProducts) {
        try {
          localProducts =
            JSON.parse(savedProducts);

          if (!Array.isArray(localProducts)) {
            localProducts = [];
          }
        } catch (error) {
          console.error(
            "Failed to parse local products:",
            error
          );

          localProducts = [];
        }
      }

      // ----------------------------------------------
      // Find existing local product
      // ----------------------------------------------
      const existingIndex =
        localProducts.findIndex(
          (product) =>
            String(product.id) ===
            String(params.id)
        );

      // ----------------------------------------------
      // Preserve existing image/rating information
      // ----------------------------------------------
      const oldProduct =
        existingIndex !== -1
          ? localProducts[existingIndex]
          : null;

      const updatedProduct = {
        ...(oldProduct || apiProduct),

        id:
          oldProduct?.id ??
          apiProduct.id,

        title: form.title.trim(),

        category:
          form.category.trim(),

        price: Number(form.price),

        stock: Number(form.stock),

        description:
          form.description.trim(),

        rating:
          oldProduct?.rating ??
          apiProduct.rating ??
          0,

        thumbnail:
          oldProduct?.thumbnail ||
          apiProduct.thumbnail ||
          apiProduct.images?.[0] ||
          "",

        images:
          oldProduct?.images ||
          apiProduct.images ||
          [],
      };

      // ----------------------------------------------
      // Update or create local copy
      // ----------------------------------------------
      if (existingIndex !== -1) {
        localProducts[existingIndex] =
          updatedProduct;
      } else {
        localProducts.push(
          updatedProduct
        );
      }

      // ----------------------------------------------
      // Save to localStorage
      // ----------------------------------------------
      localStorage.setItem(
        "localProducts",
        JSON.stringify(localProducts)
      );

      // ----------------------------------------------
      // Success
      // ----------------------------------------------
      alert(
        "Product updated successfully!"
      );

      router.push("/products");
    } catch (error) {
      console.error(error);

      if (error.response?.status === 404) {
        setNotFound(true);
        return;
      }

      setError(
        "Failed to update product. Please try again."
      );
    } finally {
      setSaving(false);
    }
  }

  // --------------------------------------------------
  // Loading Screen
  // --------------------------------------------------
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
        <div className="bg-white rounded-xl shadow-sm border p-8 text-center">

          <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>

          <p className="text-gray-600">
            Loading product...
          </p>

        </div>
      </div>
    );
  }

  // --------------------------------------------------
  // Product Not Found
  // --------------------------------------------------
  if (notFound) {
    return (
      <div className="min-h-screen bg-gray-100">

        <header className="bg-white border-b">
          <div className="max-w-4xl mx-auto px-6 py-4">

            <h1 className="text-2xl font-bold text-gray-800">
              Product Admin
            </h1>

            <p className="text-sm text-gray-500">
              Edit Product
            </p>

          </div>
        </header>

        <main className="max-w-4xl mx-auto px-6 py-12">

          <div className="bg-white rounded-xl shadow-sm border p-10 text-center">

            <div className="text-5xl mb-4">
              🔍
            </div>

            <h2 className="text-2xl font-semibold text-gray-800 mb-2">
              Product Not Found
            </h2>

            <p className="text-gray-500 mb-6">
              The product you are trying to edit
              does not exist.
            </p>

            <div className="flex justify-center gap-3">

              <button
                onClick={() =>
                  router.push("/products")
                }
                className="px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
              >
                Back to Products
              </button>

              <button
                onClick={() =>
                  router.push("/products/new")
                }
                className="px-5 py-3 border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg"
              >
                Add New Product
              </button>

            </div>

          </div>

        </main>

      </div>
    );
  }

  // --------------------------------------------------
  // Main Edit Page
  // --------------------------------------------------
  return (
    <div className="min-h-screen bg-gray-100">

      {/* Header */}
      <header className="bg-white border-b">

        <div className="max-w-4xl mx-auto px-6 py-4 flex justify-between items-center">

          <div>

            <h1 className="text-2xl font-bold text-gray-800">
              Product Admin
            </h1>

            <p className="text-sm text-gray-500">
              Edit Product
            </p>

          </div>

          <button
            onClick={() => {
              localStorage.removeItem(
                "accessToken"
              );

              window.location.href =
                "/login";
            }}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg"
          >
            Logout
          </button>

        </div>

      </header>

      {/* Main */}
      <main className="max-w-4xl mx-auto px-6 py-8">

        <button
          onClick={() =>
            router.push("/products")
          }
          className="text-blue-600 hover:text-blue-700 mb-6"
        >
          ← Back to Products
        </button>

        <div className="bg-white rounded-xl shadow-sm border p-8">

          <div className="mb-6">

            <h2 className="text-2xl font-semibold text-gray-800">
              Edit Product
            </h2>

            <p className="text-sm text-gray-500 mt-1">
              Update the product information below.
            </p>

          </div>

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
                disabled={saving}
                placeholder="Enter product title"
                className="w-full border border-gray-300 px-4 py-3 rounded-lg text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
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
                disabled={saving}
                placeholder="Example: smartphones"
                className="w-full border border-gray-300 px-4 py-3 rounded-lg text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
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
                  disabled={saving}
                  min="0"
                  step="0.01"
                  placeholder="Enter price"
                  className="w-full border border-gray-300 px-4 py-3 rounded-lg text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
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
                  disabled={saving}
                  min="0"
                  step="1"
                  placeholder="Enter stock"
                  className="w-full border border-gray-300 px-4 py-3 rounded-lg text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
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
                disabled={saving}
                rows="5"
                placeholder="Enter product description"
                className="w-full border border-gray-300 px-4 py-3 rounded-lg text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              />

            </div>

            {/* Buttons */}
            <div className="flex justify-end gap-3 pt-4">

              <button
                type="button"
                disabled={saving}
                onClick={() =>
                  router.push("/products")
                }
                className="px-5 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={saving}
                className="px-5 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white rounded-lg min-w-32"
              >
                {saving
                  ? "Saving..."
                  : "Save Changes"}
              </button>

            </div>

          </form>

        </div>

      </main>

    </div>
  );
}