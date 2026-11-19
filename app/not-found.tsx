import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 text-white p-4">
      <div className="text-center max-w-md">
        <h1 className="text-6xl font-black text-amber-500 mb-2">404</h1>
        <h2 className="text-2xl font-bold mb-4">Page Not Found</h2>
        <p className="text-slate-400 text-sm mb-6">
          The requested page or record could not be found or you may not have permission to access it.
        </p>
        <Link
          href="/dashboard"
          className="inline-flex items-center px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg transition-colors text-sm"
        >
          Return to Dashboard
        </Link>
      </div>
    </div>
  );
}
