export default function Loading() {
  return (
    <div className="w-full min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-2xl shadow-xl flex flex-col items-center gap-4">
        
        {/* Spinner */}
        <div className="w-14 h-14 border-4 border-gray-300 border-t-black rounded-full animate-spin"></div>

        <h2 className="text-2xl font-semibold text-gray-800">
          Loading...
        </h2>

        <p className="text-gray-500 text-sm">
          Please wait while we fetch your data
        </p>
      </div>
    </div>
  );
}