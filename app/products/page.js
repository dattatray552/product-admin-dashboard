"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import api from "../lib/api";

const PAGE_SIZES = [10, 20, 50];

const SORT_OPTIONS = [
  { value: "", label: "Default" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "rating-asc", label: "Rating: Low to High" },
  { value: "rating-desc", label: "Rating: High to Low" },
  { value: "title-asc", label: "Title: A to Z" },
  { value: "title-desc", label: "Title: Z to A" },
];

export default function ProductsPage() {
  // useSearchParams needs a Suspense boundary in the app router
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-100 flex items-center justify-center">
          <p className="text-gray-500">Loading...</p>
        </div>
      }
    >
      <ProductsContent />
    </Suspense>
  );
}

function ProductsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // ------------------------------------------------------------
  // Read state from the URL (source of truth)
  // ------------------------------------------------------------
  const rawPage = parseInt(searchParams.get("page"), 10);
  const page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1;

  const rawLimit = parseInt(searchParams.get("limit"), 10);
  const limit = PAGE_SIZES.includes(rawLimit) ? rawLimit : 10;

  const search = searchParams.get("search") || "";
  const category = searchParams.get("category") || "";
  const sort = searchParams.get("sort") || "";

  // Local input state so the text box feels instant while we debounce
  const [searchInput, setSearchInput] = useState(search);

  const [products, setProducts] = useState([]);
  const [total, setTotal] = useState(0);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState(null);

  // Used to ignore slow/old API responses (stale response protection)
  const requestIdRef = useRef(0);

  // ------------------------------------------------------------
  // Helper: update the URL query string
  // ------------------------------------------------------------
  function updateParams(updates, { resetPage = false } = {}) {
    const params = new URLSearchParams(searchParams.toString());

    Object.entries(updates).forEach(([key, value]) => {
      if (value === "" || value === null || value === undefined) {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });

    if (resetPage) {
      params.set("page", "1");
    }

    router.push(`/products?${params.toString()}`, { scroll: false });
  }

  // ------------------------------------------------------------
  // Auth check (runs once)
  // ------------------------------------------------------------
  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      router.push("/login");
    }
  }, []);

  // ------------------------------------------------------------
  // Load categories once
  // ------------------------------------------------------------
  useEffect(() => {
    async function loadCategories() {
      try {
        const response = await api.get("/products/categories");
        // API returns [{ slug, name, url }, ...]
        const list = Array.isArray(response.data) ? response.data : [];
        setCategories(
          list.map((item) =>
            typeof item === "string"
              ? { slug: item, name: item }
              : { slug: item.slug, name: item.name }
          )
        );
      } catch (err) {
        console.error("Failed to load categories:", err);
      }
    }

    loadCategories();
  }, []);

  // ------------------------------------------------------------
  // Debounce the search box -> only then update the URL
  // ------------------------------------------------------------
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== search) {
        updateParams({ search: searchInput }, { resetPage: true });
      }
    }, 500);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  // Keep the input in sync if the URL changes from elsewhere (back/forward)
  useEffect(() => {
    setSearchInput(search);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  // ------------------------------------------------------------
  // Fetch products whenever page/limit/search/category/sort change
  // ------------------------------------------------------------
  useEffect(() => {
    loadProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit, search, category, sort]);

  async function loadProducts() {
    const thisRequestId = ++requestIdRef.current;

    try {
      setLoading(true);
      setError("");

      const skip = (page - 1) * limit;
      let url = "/products";
      const params = { limit, skip };

      // NOTE on a known API limitation:
      // DummyJSON cannot search (/products/search) and filter by
      // category (/products/category/{cat}) at the same time - it's
      // one endpoint or the other. We decided that "search" wins:
      // if the user is searching, the category dropdown is disabled
      // (see the UI below) so the two filters never conflict and
      // pagination/totals stay accurate.
      if (search.trim()) {
        url = "/products/search";
        params.q = search.trim();
      } else if (category) {
        url = `/products/category/${category}`;
      }

      // Sorting is supported by /products and /products/category.
      // /products/search does not reliably support it, so in that
      // case we sort the current page's results on the client
      // instead (good enough for a demo dataset, called out here).
      if (sort) {
        const [field, order] = sort.split("-");
        if (!search.trim()) {
          params.sortBy = field;
          params.order = order;
        }
      }

      const response = await api.get(url, { params });

      // Ignore this response if a newer request has since started
      if (thisRequestId !== requestIdRef.current) return;

      let items = response.data.products || [];
      let apiTotal = response.data.total ?? items.length;

      // Client-side sort fallback for the search endpoint
      if (sort && search.trim()) {
        const [field, order] = sort.split("-");
        items = [...items].sort((a, b) => {
          const valA = a[field];
          const valB = b[field];
          if (typeof valA === "string") {
            return order === "asc"
              ? valA.localeCompare(valB)
              : valB.localeCompare(valA);
          }
          return order === "asc" ? valA - valB : valB - valA;
        });
      }

      // ---- Merge in local add/edit/delete state (see README) ----
      const deletedIds = getDeletedIds();
      items = items.filter((p) => !deletedIds.includes(p.id));

      const localProducts = getLocalProducts();
      items = items.map((p) => {
        const localMatch = localProducts.find((lp) => lp.id === p.id);
        return localMatch || p;
      });

      // Locally-added products aren't part of the real dataset, so
      // DummyJSON never returns them from the API. We show them by
      // prepending any local product whose id wasn't in this page's
      // results, but only on page 1 with no search/category/sort
      // active, so they don't distort pagination elsewhere.
      if (page === 1 && !search.trim() && !category && !sort) {
        const extraLocal = localProducts.filter(
          (lp) =>
            !deletedIds.includes(lp.id) &&
            !items.some((p) => p.id === lp.id)
        );
        items = [...extraLocal, ...items];
        apiTotal += extraLocal.length;
      }

      // ---- Clamp an out-of-range page to the last valid page ----
      const totalPages = Math.max(1, Math.ceil(apiTotal / limit));
      if (page > totalPages) {
        updateParams({ page: String(totalPages) });
        return;
      }

      setProducts(items);
      setTotal(apiTotal);
    } catch (err) {
      if (thisRequestId !== requestIdRef.current) return;
      console.error(err);
      setError("Failed to load products. Please try again.");
    } finally {
      if (thisRequestId === requestIdRef.current) setLoading(false);
    }
  }

  function getDeletedIds() {
    const saved = localStorage.getItem("deletedProductIds");
    if (!saved) return [];
    try {
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  function getLocalProducts() {
    const saved = localStorage.getItem("localProducts");
    if (!saved) return [];
    try {
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  // ------------------------------------------------------------
  // Delete product
  // ------------------------------------------------------------
  async function handleDelete(id) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this product?"
    );
    if (!confirmed) return;

    try {
      setDeletingId(id);
      await api.delete(`/products/${id}`);

      const deletedIds = getDeletedIds();
      if (!deletedIds.includes(id)) {
        deletedIds.push(id);
        localStorage.setItem("deletedProductIds", JSON.stringify(deletedIds));
      }

      const localProducts = getLocalProducts().filter((p) => p.id !== id);
      localStorage.setItem("localProducts", JSON.stringify(localProducts));

      setProducts((prev) => prev.filter((p) => p.id !== id));
      setTotal((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error(err);
      alert("Failed to delete product. Please try again.");
    } finally {
      setDeletingId(null);
    }
  }

  function handleLogout() {
    localStorage.removeItem("accessToken");
    router.push("/login");
  }

  // ------------------------------------------------------------
  // Pagination helpers
  // ------------------------------------------------------------
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const rangeStart = total === 0 ? 0 : (page - 1) * limit + 1;
  const rangeEnd = Math.min(page * limit, total);

  function goToPage(newPage) {
    if (newPage < 1 || newPage > totalPages) return;
    updateParams({ page: String(newPage) });
  }

  function getPageNumbers() {
    const pages = [];
    const start = Math.max(1, page - 2);
    const end = Math.min(totalPages, page + 2);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  }

  // ------------------------------------------------------------
  // Render
  // ------------------------------------------------------------
  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Product Admin</h1>
            <p className="text-sm text-gray-500">Manage your products</p>
          </div>

          <button
            onClick={handleLogout}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg"
          >
            Logout
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Toolbar: search, category, sort, add */}
        <div className="bg-white rounded-xl shadow-sm border p-4 mb-6 flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
          <div className="flex flex-col md:flex-row gap-3 flex-1">
            {/* Search */}
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search products..."
              className="w-full md:w-64 border border-gray-300 px-4 py-2.5 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            {/* Category */}
            <select
              value={category}
              disabled={!!search.trim()}
              onChange={(e) =>
                updateParams({ category: e.target.value }, { resetPage: true })
              }
              title={
                search.trim()
                  ? "Clear search to filter by category"
                  : "Filter by category"
              }
              className="w-full md:w-56 border border-gray-300 px-4 py-2.5 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-400"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>

            {/* Sort */}
            <select
              value={sort}
              onChange={(e) =>
                updateParams({ sort: e.target.value }, { resetPage: true })
              }
              className="w-full md:w-56 border border-gray-300 px-4 py-2.5 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => router.push("/products/new")}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-medium whitespace-nowrap"
          >
            + Add Product
          </button>
        </div>

        {/* Loading */}
        {loading && (
          <div className="bg-white rounded-xl shadow-sm border p-16 text-center">
            <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading products...</p>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="bg-white rounded-xl shadow-sm border p-10 text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={loadProducts}
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg"
            >
              Retry
            </button>
          </div>
        )}

        {/* Empty */}
        {!loading && !error && products.length === 0 && (
          <div className="bg-white rounded-xl shadow-sm border p-10 text-center">
            <p className="text-gray-500">No products found.</p>
          </div>
        )}

        {/* Results */}
        {!loading && !error && products.length > 0 && (
          <>
            {/* Desktop table */}
            <div className="hidden md:block bg-white rounded-xl shadow-sm border overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-gray-50 text-gray-600 text-sm border-b">
                  <tr>
                    <th className="p-4">Image</th>
                    <th className="p-4">Title</th>
                    <th className="p-4">Category</th>
                    <th className="p-4">Price</th>
                    <th className="p-4">Rating</th>
                    <th className="p-4">Stock</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr key={product.id} className="border-b last:border-0 hover:bg-gray-50">
                      <td className="p-4">
                        <img
                          src={product.thumbnail}
                          alt={product.title}
                          className="w-12 h-12 object-cover rounded-lg border"
                        />
                      </td>
                      <td className="p-4 text-gray-800 font-medium">{product.title}</td>
                      <td className="p-4 text-gray-600">{product.category}</td>
                      <td className="p-4 text-gray-800">${product.price}</td>
                      <td className="p-4 text-gray-600">⭐ {product.rating}</td>
                      <td className="p-4 text-gray-600">{product.stock}</td>
                      <td className="p-4">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => router.push(`/products/${product.id}`)}
                            className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100"
                          >
                            View
                          </button>
                          <button
                            onClick={() => router.push(`/products/edit/${product.id}`)}
                            className="px-3 py-1.5 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(product.id)}
                            disabled={deletingId === product.id}
                            className="px-3 py-1.5 text-sm bg-red-50 text-red-600 rounded-lg hover:bg-red-100 disabled:opacity-50"
                          >
                            {deletingId === product.id ? "Deleting..." : "Delete"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden grid grid-cols-1 gap-4">
              {products.map((product) => (
                <div key={product.id} className="bg-white rounded-xl shadow-sm border p-4">
                  <div className="flex gap-4">
                    <img
                      src={product.thumbnail}
                      alt={product.title}
                      className="w-16 h-16 object-cover rounded-lg border"
                    />
                    <div className="flex-1">
                      <p className="font-medium text-gray-800">{product.title}</p>
                      <p className="text-sm text-gray-500">{product.category}</p>
                      <p className="text-sm text-gray-700 mt-1">
                        ${product.price} · ⭐ {product.rating} · Stock: {product.stock}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={() => router.push(`/products/${product.id}`)}
                      className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg text-gray-700"
                    >
                      View
                    </button>
                    <button
                      onClick={() => router.push(`/products/edit/${product.id}`)}
                      className="flex-1 px-3 py-2 text-sm bg-blue-50 text-blue-600 rounded-lg"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(product.id)}
                      disabled={deletingId === product.id}
                      className="flex-1 px-3 py-2 text-sm bg-red-50 text-red-600 rounded-lg disabled:opacity-50"
                    >
                      {deletingId === product.id ? "..." : "Delete"}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            <div className="mt-6 flex flex-col md:flex-row items-center justify-between gap-4 bg-white rounded-xl shadow-sm border p-4">
              <p className="text-sm text-gray-600">
                Showing {rangeStart}–{rangeEnd} of {total}
              </p>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => goToPage(page - 1)}
                  disabled={page <= 1}
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg text-gray-700 disabled:opacity-40"
                >
                  Previous
                </button>

                {getPageNumbers()[0] > 1 && (
                  <>
                    <button
                      onClick={() => goToPage(1)}
                      className="w-9 h-9 text-sm rounded-lg text-gray-700 hover:bg-gray-100"
                    >
                      1
                    </button>
                    <span className="text-gray-400">…</span>
                  </>
                )}

                {getPageNumbers().map((p) => (
                  <button
                    key={p}
                    onClick={() => goToPage(p)}
                    className={`w-9 h-9 text-sm rounded-lg ${
                      p === page
                        ? "bg-blue-600 text-white"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    {p}
                  </button>
                ))}

                {getPageNumbers().slice(-1)[0] < totalPages && (
                  <>
                    <span className="text-gray-400">…</span>
                    <button
                      onClick={() => goToPage(totalPages)}
                      className="w-9 h-9 text-sm rounded-lg text-gray-700 hover:bg-gray-100"
                    >
                      {totalPages}
                    </button>
                  </>
                )}

                <button
                  onClick={() => goToPage(page + 1)}
                  disabled={page >= totalPages}
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg text-gray-700 disabled:opacity-40"
                >
                  Next
                </button>
              </div>

              {/* Page size */}
              <select
                value={limit}
                onChange={(e) =>
                  updateParams({ limit: e.target.value }, { resetPage: true })
                }
                className="border border-gray-300 px-3 py-1.5 rounded-lg text-sm text-gray-700"
              >
                {PAGE_SIZES.map((size) => (
                  <option key={size} value={size}>
                    {size} / page
                  </option>
                ))}
              </select>
            </div>
          </>
        )}
      </main>
    </div>
  );
}