export default function CatalogoLoading() {
  return (
    <main className="min-h-screen bg-slate-100 p-4">
      <div className="max-w-[98vw] mx-auto flex flex-col gap-4 animate-pulse">
        {/* HEADER SKELETON */}
        <header className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="flex items-center justify-between w-full lg:w-auto">
            <div>
              <div className="h-7 w-48 bg-slate-200 rounded-lg" />
              <div className="h-3 w-32 bg-slate-100 rounded mt-2" />
            </div>
            <div className="lg:hidden h-10 w-16 bg-slate-100 rounded-lg" />
          </div>

          <div className="w-full lg:flex-1 lg:max-w-3xl">
            <div className="h-10 w-full bg-slate-100 rounded-lg" />
          </div>

          <div className="w-full lg:w-auto flex items-center gap-3">
            <div className="hidden lg:block h-12 w-24 bg-slate-50 rounded-lg border border-slate-100" />
            <div className="h-10 w-full lg:w-40 bg-slate-800 rounded-lg" />
          </div>
        </header>

        {/* CONTEÚDO SKELETON */}
        <div className="flex flex-col md:flex-row gap-4 items-start">
          {/* SIDEBAR SKELETON */}
          <aside className="w-full md:w-64 shrink-0 bg-white rounded-xl shadow-sm border border-slate-200 p-4 space-y-3">
            <div className="h-6 w-32 bg-slate-200 rounded" />
            <div className="h-8 w-full bg-slate-100 rounded-lg" />
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="h-8 w-full bg-slate-50 rounded-lg"
                style={{ opacity: 1 - i * 0.08 }}
              />
            ))}
          </aside>

          {/* TABLE SKELETON */}
          <section className="flex-1 w-full bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            {/* Toolbar */}
            <div className="bg-blue-600 h-12" />
            {/* Pagination top */}
            <div className="bg-slate-50 border-b border-slate-200 p-3 flex justify-end">
              <div className="h-7 w-48 bg-slate-100 rounded" />
            </div>
            {/* Table header */}
            <div className="flex gap-px bg-slate-100 border-b border-slate-200">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="h-11 bg-slate-100"
                  style={{
                    width:
                      i === 0 ? "4rem" : i === 2 ? "auto" : `${8 + i * 3}rem`,
                    flex: i === 2 ? 1 : undefined,
                  }}
                />
              ))}
            </div>
            {/* Rows */}
            {Array.from({ length: 15 }).map((_, i) => (
              <div
                key={i}
                className="flex gap-px border-b border-slate-50"
                style={{ opacity: 1 - i * 0.03 }}
              >
                {Array.from({ length: 8 }).map((_, j) => (
                  <div
                    key={j}
                    className="h-12 bg-slate-50"
                    style={{
                      width:
                        j === 0 ? "4rem" : j === 2 ? "auto" : `${8 + j * 3}rem`,
                      flex: j === 2 ? 1 : undefined,
                    }}
                  />
                ))}
              </div>
            ))}
            {/* Pagination bottom */}
            <div className="bg-slate-50 border-t border-slate-200 p-3 flex justify-end">
              <div className="h-7 w-48 bg-slate-100 rounded" />
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
