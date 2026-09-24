"use client";

import { useState } from "react";
import { loginUser } from "../lib/auth";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (loading) return;

    setError("");
    setLoading(true);

    try {
      const data = await loginUser(username, password);

      console.log("Login successful:", data);

      localStorage.setItem("accessToken", data.accessToken);

      window.location.href = "/products";
    } catch (error) {
      console.error(error);
      setError("Invalid username or password");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">

      <div className="w-full max-w-md">

        {/* Logo / App Name */}
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

          {/* Username */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Username
            </label>

            <input
              type="text"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full border border-gray-300 px-4 py-3 rounded-lg
                         text-gray-800 placeholder-gray-400
                         focus:outline-none focus:ring-2 focus:ring-blue-500
                         focus:border-blue-500"
            />
          </div>

          {/* Password */}
          <div className="mb-5">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>

            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-gray-300 px-4 py-3 rounded-lg
                         text-gray-800 placeholder-gray-400
                         focus:outline-none focus:ring-2 focus:ring-blue-500
                         focus:border-blue-500"
            />
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-5 text-sm">
              {error}
            </div>
          )}

          {/* Login Button */}
          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700
                       disabled:bg-blue-300
                       text-white font-medium py-3 rounded-lg
                       transition"
          >
            {loading ? "Logging in..." : "Login"}
          </button>

          {/* Demo Credentials */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm font-medium text-gray-700 mb-2">
              Demo Credentials
            </p>

            <p className="text-sm text-gray-500">
              Username: <span className="font-medium">emilys</span>
            </p>

            <p className="text-sm text-gray-500">
              Password: <span className="font-medium">emilyspass</span>
            </p>
          </div>

        </div>

        <p className="text-center text-sm text-gray-400 mt-6">
          Product Admin Dashboard
        </p>

      </div>
    </div>
  );
}