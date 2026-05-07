// src/app/dashboard/acrylic/loading.tsx
export default function Loading() {
  return (
    <div className="space-y-5 animate-pulse">
      <div className="flex justify-between items-start">
        <div>
          <div className="h-7 w-32 bg-stone-200 rounded-lg mb-2" />
          <div className="h-4 w-20 bg-stone-200 rounded" />
        </div>
        <div className="h-10 w-32 bg-stone-200 rounded-lg" />
      </div>
      <div className="flex gap-3">
        <div className="h-10 flex-1 bg-stone-200 rounded-lg" />
        <div className="h-10 w-48 bg-stone-200 rounded-lg" />
      </div>
      <div className="card p-4">
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-4 p-4 border border-stone-100 rounded-xl">
              <div className="w-14 h-14 bg-stone-100 rounded-lg" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-32 bg-stone-100 rounded" />
                <div className="h-3 w-48 bg-stone-100 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
