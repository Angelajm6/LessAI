export default function DashboardLoading() {
  return (
    <div className="flex gap-0 min-h-[calc(100vh-72px)] animate-pulse">
      {/* Sidebar skeleton */}
      <aside className="hidden sm:block w-56 shrink-0 border-r border-gray-100 pr-4 mr-6">
        <div className="sticky top-24 space-y-3 pt-2">
          <div className="px-3 py-3 mb-4 space-y-2">
            <div className="h-4 w-28 bg-gray-100 rounded-lg" />
            <div className="h-3 w-20 bg-gray-100 rounded-lg" />
            <div className="h-1.5 w-full bg-gray-100 rounded-full mt-3" />
          </div>
          {[1,2,3,4].map(i => (
            <div key={i} className="h-9 bg-gray-100 rounded-xl mx-1" />
          ))}
          <div className="mt-6 px-3 space-y-2">
            <div className="h-3 w-16 bg-gray-100 rounded" />
            {[1,2,3].map(i => <div key={i} className="h-3 w-full bg-gray-100 rounded" />)}
          </div>
        </div>
      </aside>

      {/* Main skeleton */}
      <main className="flex-1 min-w-0 space-y-4">
        {/* Stack map banner */}
        <div className="h-28 bg-emerald-100 rounded-2xl" />
        {/* Task cards */}
        {[1,2,3].map(i => (
          <div key={i} className="bg-white border border-gray-100 rounded-2xl p-5 space-y-2 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="h-4 w-32 bg-gray-100 rounded" />
              <div className="h-4 w-16 bg-gray-100 rounded" />
            </div>
            <div className="h-3 w-64 bg-gray-100 rounded" />
          </div>
        ))}
      </main>
    </div>
  )
}
