"use client";

import { useState } from "react";
import { loginUser } from "../lib/auth";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();

    if (loading) return;

    setError("");

    // Basic validation
    if (!username.trim()) {
      setError("Please enter username");
      return;
    }

    if (!password.trim()) {
      setError("Please enter password");
      return;
    }

    setLoading(true);

    try {
      console.log("Login started");

      const data = await loginUser(username, password);

      console.log("Login successful:", data);

      // Check whether token was received
      if (!data.accessToken) {
        throw new Error("Access token was not received");
      }

      // Save token
      localStorage.setItem("accessToken", data.accessToken);

      // Optional: save user information
      if (data.id) {
        localStorage.setItem("userId", String(data.id));
      }

      console.log("Token saved");

      // Go to products page
      window.location.href = "/products";
    } catch (error) {
      console.error("Login failed:", error);

      const message =
        error.response?.data?.message ||
        error.message ||
        "Login failed";

      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">

      <div className="w-full max-w-md">

        {/* App Name */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">
            Product Admin
          </h1>

          <p className="text-gray-500 mt-2">
            Sign in to manage your products
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-xl shadow-sm border p-8">

          <h2 className="text-xl font-semibold text-gray-800 mb-6">
            Welcome Back
          </h2>

          <form onSubmit={handleLogin}>

            {/* Username */}
            <div className="mb-4">

              <label
                htmlFor="username"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Username
              </label>

              <input
                id="username"
                type="text"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                disabled={loading}
                className="w-full border border-gray-300 px-4 py-3 rounded-lg
                           text-gray-800 placeholder-gray-400
                           focus:outline-none focus:ring-2 focus:ring-blue-500
                           focus:border-blue-500
                           disabled:bg-gray-100"
              />

            </div>

            {/* Password */}
            <div className="mb-5">

              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Password
              </label>

              <input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                disabled={loading}
                className="w-full border border-gray-300 px-4 py-3 rounded-lg
                           text-gray-800 placeholder-gray-400
                           focus:outline-none focus:ring-2 focus:ring-blue-500
                           focus:border-blue-500
                           disabled:bg-gray-100"
              />

            </div>

            {/* Error */}
            {error && (
              <div className="bg-red-50 border border-red-200
                              text-red-600 px-4 py-3 rounded-lg
                              mb-5 text-sm">
                {error}
              </div>
            )}

            {/* Login Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700
                         disabled:bg-blue-300
                         text-white font-medium py-3 rounded-lg
                         transition"
            >
              {loading ? "Logging in..." : "Login"}
            </button>

          </form>

          {/* Demo Credentials */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">

            <p className="text-sm font-medium text-gray-700 mb-2">
              Demo Credentials
            </p>

            <p className="text-sm text-gray-500">
              Username:
              <span className="font-medium ml-1">
                emilys
              </span>
            </p>

            <p className="text-sm text-gray-500">
              Password:
              <span className="font-medium ml-1">
                emilyspass
              </span>
            </p>

          </div>

        </div>

        {/* Footer */}
        <p className="text-center text-sm text-gray-400 mt-6">
          Product Admin Dashboard
        </p>

      </div>

    </div>
  );
}