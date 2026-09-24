"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import api from "../lib/api";

export default function ProductsPage() {
  // const searchParams = useSearchParams();
  const router = useRouter();

  // Used to ignore old/stale API responses
  const requestIdRef = useRef(0);

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Search
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");

  // Pagination
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);

  // Category and Sort
  const [category, setCategory] = useState("");
  const [categories, setCategories] = useState([]);
  const [sortBy, setSortBy] = useState("");

  // --------------------------------------------------
  // Read filters from URL
  // --------------------------------------------------
  useEffect(() => {
  const params = new URLSearchParams(window.location.search);

  const pageFromUrl = Number(params.get("page"));
  const searchFromUrl = params.get("search") || "";
  const categoryFromUrl = params.get("category") || "";
  const sortFromUrl = params.get("sort") || "";

  const validPage =
    Number.isInteger(pageFromUrl) && pageFromUrl > 0
      ? pageFromUrl
      : 1;

  setPage(validPage);
  setSearch(searchFromUrl);
  setSearchInput(searchFromUrl);
  setCategory(categoryFromUrl);
  setSortBy(sortFromUrl);
}, []);
  // --------------------------------------------------
  // Load products saved in localStorage
  // --------------------------------------------------
  function loadLocalProducts() {
    const savedProducts = localStorage.getItem("localProducts");

    if (!savedProducts) {
      return [];
    }

    try {
      return JSON.parse(savedProducts);
    } catch (error) {
      console.error("Failed to read local products:", error);
      return [];
    }
  }

  // --------------------------------------------------
  // Load deleted product IDs
  // --------------------------------------------------
  function loadDeletedProducts() {
    const deletedProducts = localStorage.getItem("deletedProducts");

    if (!deletedProducts) {
      return [];
    }

    try {
      return JSON.parse(deletedProducts);
    } catch (error) {
      console.error("Failed to read deleted products:", error);
      return [];
    }
  }

  // --------------------------------------------------
  // Fetch products
  // --------------------------------------------------
  async function fetchProducts() {
    const requestId = ++requestIdRef.current;

    try {
      setLoading(true);
      setError("");

      const localProducts = loadLocalProducts();
      const deletedProducts = loadDeletedProducts();

      let apiProducts = [];

      // ------------------------------------------------
      // Search API
      // ------------------------------------------------
      if (search.trim()) {
        const response = await api.get(
          `/products/search?q=${encodeURIComponent(search.trim())}`,
        );

        apiProducts = response.data.products || [];
      }

      // ------------------------------------------------
      // Category API
      // ------------------------------------------------
      else if (category) {
        const response = await api.get(
          `/products/category/${encodeURIComponent(
            category,
          )}?limit=194&skip=0`,
        );

        apiProducts = response.data.products || [];
      }

      // ------------------------------------------------
      // All products API
      // ------------------------------------------------
      else {
        const response = await api.get(
          "/products?limit=194&skip=0",
        );

        apiProducts = response.data.products || [];
      }

      // ------------------------------------------------
      // Remove deleted API products
      // ------------------------------------------------
      apiProducts = apiProducts.filter(
        (apiProduct) =>
          !deletedProducts.some(
            (deletedId) =>
              String(deletedId) === String(apiProduct.id),
          ),
      );

      // ------------------------------------------------
      // Combine local + API products
      // ------------------------------------------------
      let allProducts = [
        ...localProducts,
        ...apiProducts.filter(
          (apiProduct) =>
            !localProducts.some(
              (localProduct) =>
                String(localProduct.id) ===
                String(apiProduct.id),
            ),
        ),
      ];

      // ------------------------------------------------
      // Search local products also
      // ------------------------------------------------
      if (search.trim()) {
        const searchText = search.trim().toLowerCase();

        allProducts = allProducts.filter(
          (product) =>
            product.title
              ?.toLowerCase()
              .includes(searchText) ||
            product.category
              ?.toLowerCase()
              .includes(searchText) ||
            product.description
              ?.toLowerCase()
              .includes(searchText),
        );
      }

      // ------------------------------------------------
      // Category filter
      // ------------------------------------------------
      if (category) {
        allProducts = allProducts.filter(
          (product) =>
            product.category === category,
        );
      }

      // ------------------------------------------------
      // Sort
      // ------------------------------------------------
      if (sortBy === "price-asc") {
        allProducts.sort(
          (a, b) =>
            Number(a.price) - Number(b.price),
        );
      }

      if (sortBy === "price-desc") {
        allProducts.sort(
          (a, b) =>
            Number(b.price) - Number(a.price),
        );
      }

      if (sortBy === "rating-asc") {
        allProducts.sort(
          (a, b) =>
            Number(a.rating ?? 0) -
            Number(b.rating ?? 0),
        );
      }

      if (sortBy === "rating-desc") {
        allProducts.sort(
          (a, b) =>
            Number(b.rating ?? 0) -
            Number(a.rating ?? 0),
        );
      }

      if (sortBy === "title-asc") {
        allProducts.sort((a, b) =>
          (a.title || "").localeCompare(
            b.title || "",
          ),
        );
      }

      if (sortBy === "title-desc") {
        allProducts.sort((a, b) =>
          (b.title || "").localeCompare(
            a.title || "",
          ),
        );
      }

      // ------------------------------------------------
      // Protect against stale/old API response
      // ------------------------------------------------
      if (requestId !== requestIdRef.current) {
        return;
      }

      // ------------------------------------------------
      // Total products
      // ------------------------------------------------
      setTotal(allProducts.length);

      // ------------------------------------------------
      // Protect page number
      // ------------------------------------------------
      const calculatedTotalPages = Math.ceil(
        allProducts.length / limit,
      );

      if (
        calculatedTotalPages > 0 &&
        page > calculatedTotalPages
      ) {
        setPage(calculatedTotalPages);
        return;
      }

      // If there are no products, use page 1
      if (
        calculatedTotalPages === 0 &&
        page !== 1
      ) {
        setPage(1);
        return;
      }

      // ------------------------------------------------
      // Client-side pagination
      // ------------------------------------------------
      const startIndex =
        (page - 1) * limit;

      const endIndex =
        startIndex + limit;

      const paginatedProducts =
        allProducts.slice(
          startIndex,
          endIndex,
        );

      setProducts(paginatedProducts);
    } catch (error) {
      // Ignore errors from old requests
      if (requestId !== requestIdRef.current) {
        return;
      }

      console.error(
        "Failed to fetch products:",
        error,
      );

      setError(
        "Failed to load products. Please try again.",
      );
    } finally {
      // Only latest request controls loading state
      if (
        requestId === requestIdRef.current
      ) {
        setLoading(false);
      }
    }
  }

  // --------------------------------------------------
  // Fetch categories
  // --------------------------------------------------
  async function fetchCategories() {
    try {
      const response = await api.get(
        "/products/categories",
      );

      const apiCategories =
        response.data || [];

      const localProducts =
        loadLocalProducts();

      const localCategoryNames =
        localProducts
          .map(
            (product) =>
              product.category,
          )
          .filter(Boolean);

      const categoryMap = new Map();

      // API categories
      apiCategories.forEach((item) => {
        if (typeof item === "string") {
          categoryMap.set(item, {
            slug: item,
            name: item,
          });
        } else if (item?.slug) {
          categoryMap.set(
            item.slug,
            item,
          );
        }
      });

      // Local categories
      localCategoryNames.forEach(
        (categoryName) => {
          if (
            !categoryMap.has(
              categoryName,
            )
          ) {
            categoryMap.set(
              categoryName,
              {
                slug: categoryName,
                name: categoryName,
              },
            );
          }
        },
      );

      setCategories(
        Array.from(
          categoryMap.values(),
        ),
      );
    } catch (error) {
      console.error(
        "Failed to load categories:",
        error,
      );
    }
  }

  // --------------------------------------------------
  // Sync filters with URL
  // --------------------------------------------------
  useEffect(() => {
    const params =
      new URLSearchParams();

    if (page > 1) {
      params.set("page", page);
    }

    if (search) {
      params.set("search", search);
    }

    if (category) {
      params.set(
        "category",
        category,
      );
    }

    if (sortBy) {
      params.set("sort", sortBy);
    }

    const queryString =
      params.toString();

    const newUrl = queryString
      ? `/products?${queryString}`
      : "/products";

    const currentQuery =
  window.location.search.replace("?", "");

const currentUrl = currentQuery
  ? `/products?${currentQuery}`
  : "/products";

    if (currentUrl !== newUrl) {
      router.replace(newUrl);
    }
  }, [
    page,
    search,
    category,
    sortBy,
    router,
    
  ]);

  // --------------------------------------------------
  // Search debounce
  // --------------------------------------------------
  useEffect(() => {
    const timer =
      setTimeout(() => {
        setSearch(searchInput);
        setPage(1);
      }, 500);

    return () => {
      clearTimeout(timer);
    };
  }, [searchInput]);

  // --------------------------------------------------
  // Authentication + categories
  // --------------------------------------------------
  useEffect(() => {
    const token =
      localStorage.getItem(
        "accessToken",
      );

    if (!token) {
      window.location.href =
        "/login";
      return;
    }

    fetchCategories();
  }, []);

  // --------------------------------------------------
  // Fetch products when filters change
  // --------------------------------------------------
  useEffect(() => {
    const token =
      localStorage.getItem(
        "accessToken",
      );

    if (!token) {
      return;
    }

    fetchProducts();
  }, [
    page,
    limit,
    search,
    category,
    sortBy,
  ]);

  // --------------------------------------------------
  // Logout
  // --------------------------------------------------
  function logout() {
    localStorage.removeItem(
      "accessToken",
    );

    window.location.href =
      "/login";
  }

  // --------------------------------------------------
  // Delete product
  // --------------------------------------------------
  async function handleDelete(
    product,
  ) {
    const confirmed =
      window.confirm(
        `Are you sure you want to delete "${product.title}"?`,
      );

    if (!confirmed) {
      return;
    }

    try {
      setError("");

      // Call DummyJSON DELETE API
      const response =
        await api.delete(
          `/products/${product.id}`,
        );

      console.log(
        "API delete:",
        response.data,
      );

      // Remove from local products
      const localProducts =
        loadLocalProducts();

      const updatedProducts =
        localProducts.filter(
          (item) =>
            String(item.id) !==
            String(product.id),
        );

      localStorage.setItem(
        "localProducts",
        JSON.stringify(
          updatedProducts,
        ),
      );

      // Store deleted ID
      const deletedProducts =
        loadDeletedProducts();

      if (
        !deletedProducts.some(
          (deletedId) =>
            String(deletedId) ===
            String(product.id),
        )
      ) {
        deletedProducts.push(
          product.id,
        );
      }

      localStorage.setItem(
        "deletedProducts",
        JSON.stringify(
          deletedProducts,
        ),
      );

      // Remove immediately from UI
      setProducts(
        (currentProducts) =>
          currentProducts.filter(
            (item) =>
              String(item.id) !==
              String(product.id),
          ),
      );

      setTotal(
        (currentTotal) =>
          Math.max(
            currentTotal - 1,
            0,
          ),
      );

      alert(
        "Product deleted successfully!",
      );

      fetchCategories();
    } catch (error) {
      console.error(
        "Delete error:",
        error,
      );

      setError(
        "Failed to delete product. Please try again.",
      );
    }
  }

  // --------------------------------------------------
  // Pagination calculations
  // --------------------------------------------------
  const totalPages =
    Math.ceil(total / limit);

  const start =
    total === 0
      ? 0
      : (page - 1) * limit + 1;

  const end =
    Math.min(
      page * limit,
      total,
    );

  // --------------------------------------------------
  // Loading
  // --------------------------------------------------
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <p className="text-gray-600 text-lg">
          Loading products...
        </p>
      </div>
    );
  }

  // --------------------------------------------------
  // Error
  // --------------------------------------------------
  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
        <div className="bg-white p-8 rounded-xl shadow-sm border max-w-md w-full text-center">
          <p className="text-red-500 mb-4">
            {error}
          </p>

          <button
            onClick={fetchProducts}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // --------------------------------------------------
  // Dashboard
  // --------------------------------------------------
  return (
    <div className="min-h-screen bg-gray-100">

      {/* HEADER */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">

          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              Product Admin
            </h1>

            <p className="text-sm text-gray-500">
              Manage your products
            </p>
          </div>

          <button
            onClick={logout}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg"
          >
            Logout
          </button>

        </div>
      </header>

      {/* MAIN */}
      <main className="max-w-7xl mx-auto px-6 py-8">

        {/* Page Heading */}
        <div className="mb-6 flex flex-col md:flex-row md:justify-between md:items-center gap-4">

          <div>
            <h2 className="text-2xl font-semibold text-gray-800">
              Products
            </h2>

            <p className="text-gray-500 mt-1">
              View and manage all products
            </p>
          </div>

          <button
            onClick={() => {
              window.location.href =
                "/products/new";
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
          >
            + Add Product
          </button>

        </div>

        {/* MAIN CARD */}
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">

          {/* Search + Filters */}
          <div className="px-6 py-4 border-b flex flex-col md:flex-row gap-3 justify-between">

            {/* Search */}
            <input
              type="text"
              value={searchInput}
              onChange={(e) =>
                setSearchInput(
                  e.target.value,
                )
              }
              placeholder="Search products..."
              className="border border-gray-300 rounded-lg px-4 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full md:w-80"
            />

            <div className="flex flex-col md:flex-row gap-3">

              {/* Category */}
              <select
                value={category}
                onChange={(e) => {
                  setCategory(
                    e.target.value,
                  );
                  setPage(1);
                }}
                className="border border-gray-300 rounded-lg px-4 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >

                <option value="">
                  All Categories
                </option>

                {categories.map(
                  (item) => (
                    <option
                      key={
                        item.slug ||
                        item
                      }
                      value={
                        item.slug ||
                        item
                      }
                    >
                      {item.name ||
                        item}
                    </option>
                  ),
                )}

              </select>

              {/* Sort */}
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(
                    e.target.value,
                  );
                  setPage(1);
                }}
                className="border border-gray-300 rounded-lg px-4 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >

                <option value="">
                  Sort By
                </option>

                <option value="price-asc">
                  Price: Low to High
                </option>

                <option value="price-desc">
                  Price: High to Low
                </option>

                <option value="rating-asc">
                  Rating: Low to High
                </option>

                <option value="rating-desc">
                  Rating: High to Low
                </option>

                <option value="title-asc">
                  Title: A to Z
                </option>

                <option value="title-desc">
                  Title: Z to A
                </option>

              </select>

            </div>
          </div>

          {/* Product List Title */}
          <div className="px-6 py-4 border-b">
            <h3 className="font-semibold text-gray-800">
              Product List
            </h3>
          </div>

          {/* DESKTOP TABLE */}
          <div className="hidden md:block overflow-x-auto">

            <table className="w-full">

              <thead className="bg-gray-50">
                <tr>

                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">
                    Image
                  </th>

                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">
                    Title
                  </th>

                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">
                    Category
                  </th>

                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">
                    Price
                  </th>

                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">
                    Rating
                  </th>

                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">
                    Stock
                  </th>

                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">
                    Actions
                  </th>

                </tr>
              </thead>

              <tbody>

                {products.length > 0 ? (

                  products.map(
                    (product) => (

                      <tr
                        key={product.id}
                        className="border-t hover:bg-gray-50 transition"
                      >

                        {/* Image */}
                        <td className="px-6 py-4">
                          <img
                            src={
                              product.thumbnail ||
                              product.images?.[0] ||
                              "https://via.placeholder.com/60"
                            }
                            alt={product.title}
                            className="w-14 h-14 object-cover rounded-lg border"
                          />
                        </td>

                        {/* Title */}
                        <td className="px-6 py-4">
                          <button
                            onClick={() => {
                              window.location.href =
                                `/products/${product.id}`;
                            }}
                            className="font-medium text-blue-600 hover:text-blue-800 text-left"
                          >
                            {product.title}
                          </button>
                        </td>

                        {/* Category */}
                        <td className="px-6 py-4">
                          <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-sm">
                            {product.category}
                          </span>
                        </td>

                        {/* Price */}
                        <td className="px-6 py-4 font-medium text-gray-800">
                          ${product.price}
                        </td>

                        {/* Rating */}
                        <td className="px-6 py-4">
                          ⭐ {product.rating ?? "N/A"}
                        </td>

                        {/* Stock */}
                        <td className="px-6 py-4">

                          {product.stock > 0 ? (

                            <span className="px-3 py-1 bg-green-50 text-green-600 rounded-full text-sm">
                              {product.stock} in stock
                            </span>

                          ) : (

                            <span className="px-3 py-1 bg-red-50 text-red-600 rounded-full text-sm">
                              Out of stock
                            </span>

                          )}

                        </td>

                        {/* Actions */}
                        <td className="px-6 py-4">

                          <div className="flex items-center gap-2">

                            <button
                              onClick={() => {
                                window.location.href =
                                  `/products/edit/${product.id}`;
                              }}
                              className="px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 text-sm"
                            >
                              Edit
                            </button>

                            <button
                              onClick={() =>
                                handleDelete(product)
                              }
                              className="px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 text-sm"
                            >
                              Delete
                            </button>

                          </div>

                        </td>

                      </tr>

                    ),
                  )

                ) : (

                  <tr>

                    <td
                      colSpan="7"
                      className="text-center py-12 text-gray-500"
                    >
                      No products found.
                    </td>

                  </tr>

                )}

              </tbody>

            </table>

          </div>

          {/* MOBILE CARDS */}
          <div className="md:hidden p-4 space-y-4">

            {products.length > 0 ? (

              products.map(
                (product) => (

                  <div
                    key={product.id}
                    className="border rounded-xl p-4"
                  >

                    <div className="flex gap-4">

                      <img
                        src={
                          product.thumbnail ||
                          product.images?.[0] ||
                          "https://via.placeholder.com/60"
                        }
                        alt={product.title}
                        className="w-20 h-20 object-cover rounded-lg border"
                      />

                      <div className="flex-1">

                        <button
                          onClick={() => {
                            window.location.href =
                              `/products/${product.id}`;
                          }}
                          className="font-semibold text-blue-600 text-left"
                        >
                          {product.title}
                        </button>

                        <p className="text-sm text-gray-500 mt-1">
                          {product.category}
                        </p>

                        <p className="font-semibold text-gray-800 mt-2">
                          ${product.price}
                        </p>

                        <p className="text-sm mt-1">
                          ⭐ {product.rating ?? "N/A"}
                        </p>

                        <p className="text-sm text-gray-500 mt-1">
                          Stock: {product.stock}
                        </p>

                      </div>

                    </div>

                    {/* Mobile Actions */}
                    <div className="flex gap-2 mt-4">

                      <button
                        onClick={() => {
                          window.location.href =
                            `/products/edit/${product.id}`;
                        }}
                        className="flex-1 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 text-sm"
                      >
                        Edit
                      </button>

                      <button
                        onClick={() =>
                          handleDelete(product)
                        }
                        className="flex-1 px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 text-sm"
                      >
                        Delete
                      </button>

                    </div>

                  </div>

                ),
              )

            ) : (

              <p className="text-center py-8 text-gray-500">
                No products found.
              </p>

            )}

          </div>

          {/* PAGINATION */}
          <div className="px-6 py-4 border-t flex flex-col md:flex-row justify-between items-center gap-4">

            {/* Showing */}
            <p className="text-sm text-gray-500">
              Showing {start}–{end} of {total}
            </p>

            {/* Page Size */}
            <div className="flex items-center gap-2">

              <span className="text-sm text-gray-500">
                Page size:
              </span>

              <select
                value={limit}
                onChange={(e) => {
                  setLimit(
                    Number(e.target.value),
                  );
                  setPage(1);
                }}
                className="border rounded-lg px-3 py-2 text-sm text-gray-700"
              >

                <option value={10}>
                  10
                </option>

                <option value={20}>
                  20
                </option>

                <option value={50}>
                  50
                </option>

              </select>

            </div>

            {/* Pagination Buttons */}
            <div className="flex items-center gap-2 flex-wrap justify-center">

              <button
                disabled={page === 1}
                onClick={() =>
                  setPage(page - 1)
                }
                className="px-4 py-2 border rounded-lg text-sm disabled:opacity-40 hover:bg-gray-50"
              >
                Previous
              </button>

              {Array.from(
                {
                  length: totalPages,
                },
                (_, index) => (

                  <button
                    key={index + 1}
                    onClick={() =>
                      setPage(index + 1)
                    }
                    className={`px-3 py-2 rounded-lg text-sm ${
                      page === index + 1
                        ? "bg-blue-600 text-white"
                        : "border hover:bg-gray-50"
                    }`}
                  >
                    {index + 1}
                  </button>

                ),
              )}

              <button
                disabled={
                  page === totalPages ||
                  totalPages === 0
                }
                onClick={() =>
                  setPage(page + 1)
                }
                className="px-4 py-2 border rounded-lg text-sm disabled:opacity-40 hover:bg-gray-50"
              >
                Next
              </button>

            </div>

          </div>

        </div>
      </main>

    </div>
  );
}