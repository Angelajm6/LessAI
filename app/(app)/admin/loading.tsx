export default function AdminLoading() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-pulse">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="h-7 w-40 bg-gray-100 rounded-lg" />
          <div className="h-4 w-56 bg-gray-100 rounded" />
        </div>
        <div className="flex gap-2">
          <div className="h-8 w-24 bg-gray-100 rounded-lg" />
          <div className="h-8 w-28 bg-gray-100 rounded-lg" />
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[1,2,3,4].map(i => <div key={i} className="h-24 bg-gray-100 rounded-2xl" />)}
      </div>
      <div className="h-11 bg-gray-100 rounded-xl" />
      {[1,2,3].map(i => (
        <div key={i} className="bg-white border border-gray-100 rounded-2xl p-4 flex items-center gap-4 shadow-sm">
          <div className="w-9 h-9 rounded-full bg-gray-100 shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-36 bg-gray-100 rounded" />
            <div className="h-3 w-48 bg-gray-100 rounded" />
          </div>
          <div className="w-24 h-4 bg-gray-100 rounded" />
        </div>
      ))}
    </div>
  )
}
