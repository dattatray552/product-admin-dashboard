
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "../../lib/api";

export default function ProductDetailsPage() {
  const params = useParams();
  const router = useRouter();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function fetchProduct() {
    try {
      setLoading(true);
      setError("");

      const response = await api.get(`/products/${params.id}`);

      setProduct(response.data);
    } catch (error) {
      console.error(error);
      setError("Product not found");
    } finally {
      setLoading(false);
    }
  }


  useEffect(() => {
    const token = localStorage.getItem("accessToken");

    if (!token) {
      router.push("/login");
      return;
    }

    fetchProduct();
  }, [params.id]);
  

  function logout() {
    localStorage.removeItem("accessToken");
    router.push("/login");
  }

  // Loading
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <p className="text-gray-600 text-lg">
          Loading product...
        </p>
      </div>
    );
  }

  // Error / invalid ID
  if (error || !product) {
    return (
      <div className="min-h-screen bg-gray-100">

        <header className="bg-white border-b">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <h1 className="text-2xl font-bold text-gray-800">
              Product Admin
            </h1>
          </div>
        </header>

        <main className="max-w-3xl mx-auto px-6 py-20 text-center">

          <div className="bg-white rounded-xl shadow-sm border p-10">

            <h2 className="text-2xl font-semibold text-gray-800 mb-3">
              Product Not Found
            </h2>

            <p className="text-gray-500 mb-6">
              The product you are looking for does not exist.
            </p>

            <button
              onClick={() => router.push("/products")}
              className="bg-blue-600 hover:bg-blue-700
                         text-white px-5 py-2.5 rounded-lg"
            >
              Back to Products
            </button>

          </div>

        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">

      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">

          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              Product Admin
            </h1>

            <p className="text-sm text-gray-500">
              Product Details
            </p>
          </div>

          <button
            onClick={logout}
            className="bg-red-500 hover:bg-red-600
                       text-white px-4 py-2 rounded-lg"
          >
            Logout
          </button>

        </div>
      </header>

      {/* Content */}
      <main className="max-w-6xl mx-auto px-6 py-8">

        <button
          onClick={() => router.push("/products")}
          className="text-blue-600 hover:text-blue-700
                     mb-6 text-sm font-medium"
        >
          ← Back to Products
        </button>

        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-8">

            {/* Image */}
            <div>

              <img
                src={product.thumbnail}
                alt={product.title}
                className="w-full h-80 object-contain
                           bg-gray-50 rounded-xl border"
              />

              {/* Additional images */}
              {product.images && product.images.length > 1 && (
                <div className="flex gap-3 mt-4 overflow-x-auto">

                  {product.images.map((image, index) => (
                    <img
                      key={index}
                      src={image}
                      alt={`${product.title} ${index + 1}`}
                      className="w-20 h-20 object-cover
                                 rounded-lg border"
                    />
                  ))}

                </div>
              )}

            </div>

            {/* Product information */}
            <div>

              <span className="inline-block px-3 py-1
                               bg-blue-50 text-blue-600
                               rounded-full text-sm mb-4">
                {product.category}
              </span>

              <h2 className="text-3xl font-bold text-gray-800 mb-4">
                {product.title}
              </h2>

              <p className="text-gray-600 leading-7 mb-6">
                {product.description}
              </p>

              <div className="text-3xl font-bold text-gray-800 mb-4">
                ${product.price}
              </div>

              <div className="flex gap-4 mb-6">

                <div className="bg-yellow-50 px-4 py-3 rounded-lg">
                  <p className="text-sm text-gray-500">
                    Rating
                  </p>

                  <p className="font-semibold text-gray-800">
                    ⭐ {product.rating}
                  </p>
                </div>

                <div className="bg-green-50 px-4 py-3 rounded-lg">
                  <p className="text-sm text-gray-500">
                    Stock
                  </p>

                  <p className="font-semibold text-gray-800">
                    {product.stock}
                  </p>
                </div>

              </div>

              <div className="border-t pt-5">

                <p className="text-sm text-gray-500">
                  Brand
                </p>

                <p className="font-medium text-gray-800">
                  {product.brand || "N/A"}
                </p>

              </div>

            </div>

          </div>

          {/* Reviews */}
          <div className="border-t p-8">

            <h3 className="text-xl font-semibold text-gray-800 mb-6">
              Customer Reviews
            </h3>

            {product.reviews && product.reviews.length > 0 ? (

              <div className="space-y-4">

                {product.reviews.map((review, index) => (

                  <div
                    key={index}
                    className="border rounded-lg p-5"
                  >

                    <div className="flex justify-between mb-2">

                      <p className="font-semibold text-gray-800">
                        {review.reviewerName}
                      </p>

                      <span className="text-sm">
                        ⭐ {review.rating}
                      </span>

                    </div>

                    <p className="text-gray-600">
                      {review.comment}
                    </p>

                  </div>

                ))}

              </div>

            ) : (

              <p className="text-gray-500">
                No reviews available.
              </p>

            )}

          </div>

        </div>

      </main>
    </div>
  );
}

