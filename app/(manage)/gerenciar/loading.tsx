export default function GerenciarLoading() {
  return (
    <main className="min-h-screen bg-slate-100 p-4">
      <div className="max-w-5xl mx-auto">
        <div className="mb-4">
          <div className="h-5 w-36 bg-slate-200 rounded animate-pulse" />
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-4">
          <div className="h-7 w-72 bg-slate-200 rounded animate-pulse mb-2" />
          <div className="h-4 w-96 bg-slate-100 rounded animate-pulse" />
        </div>

        <div className="flex gap-1 bg-slate-200 p-1 rounded-xl mb-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-10 w-36 bg-slate-100 rounded-lg animate-pulse"
            />
          ))}
        </div>

        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center justify-between px-4 py-3 border-b border-slate-50 last:border-b-0"
            >
              <div className="flex items-center gap-3">
                <div className="h-4 w-4 bg-slate-200 rounded animate-pulse" />
                <div className="h-4 w-40 bg-slate-200 rounded animate-pulse" />
              </div>
              <div className="h-5 w-10 bg-slate-100 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
