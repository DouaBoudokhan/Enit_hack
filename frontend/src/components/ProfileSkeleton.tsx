export function ProfileSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <div className="bg-surface rounded-[10px] shadow-card p-5">
        <div className="flex gap-4 items-center">
          <div className="skeleton w-[72px] h-[72px] !rounded-full" />
          <div className="flex flex-col gap-2 flex-1">
            <div className="skeleton h-4 w-44" />
            <div className="skeleton h-3 w-32" />
            <div className="flex gap-2 mt-1">
              <div className="skeleton h-5 w-16 rounded-full" />
              <div className="skeleton h-5 w-24 rounded-full" />
              <div className="skeleton h-5 w-16 rounded-full" />
            </div>
          </div>
          <div className="flex gap-8">
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex flex-col gap-2 w-28">
                <div className="skeleton h-8 w-20" />
                <div className="skeleton h-3 w-16" />
                <div className="skeleton h-4 w-14 rounded-full" />
              </div>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-4 gap-3 mt-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="bg-background rounded-[10px] p-4">
              <div className="skeleton h-3 w-24" />
              <div className="skeleton h-5 w-20 mt-2" />
            </div>
          ))}
        </div>
      </div>

      {[0, 1, 2].map((i) => (
        <div key={i} className="bg-surface rounded-[10px] shadow-card p-5">
          <div className="skeleton h-4 w-44 mb-4" />
          <div className="flex flex-col gap-3">
            <div className="skeleton h-3 w-full" />
            <div className="skeleton h-3 w-5/6" />
            <div className="skeleton h-3 w-4/6" />
          </div>
        </div>
      ))}
    </div>
  );
}
