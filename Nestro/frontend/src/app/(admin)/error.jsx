"use client";

import Link from "next/link";

export default function Error({
  error,
  reset,
}) {
  return (
    <div className="w-full min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="max-w-md w-full bg-white shadow-xl rounded-2xl p-8 text-center">
        
        <h1 className="text-5xl font-bold text-red-500 mb-4">
          Oops!
        </h1>

        <h2 className="text-2xl font-semibold text-gray-800 mb-3">
          Something went wrong
        </h2>

        <p className="text-gray-500 mb-6">
          {error?.message || "Unexpected error occurred."}
        </p>

        <div className="flex items-center justify-center gap-4">
          
          <button
            onClick={() => reset()}
            className="bg-black text-white px-5 py-2 rounded-lg hover:bg-gray-800 transition"
          >
            Try Again
          </button>

          <Link
            href="/admin"
            className="border border-black px-5 py-2 rounded-lg hover:bg-black hover:text-white transition"
          >
            Go Home
          </Link>

        </div>
      </div>
    </div>
  );
}