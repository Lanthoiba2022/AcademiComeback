interface LoadingSkeletonProps {
  className?: string
  count?: number
  height?: string
  width?: string
}

export const LoadingSkeleton = ({ 
  className = '', 
  count = 1, 
  height = 'h-4', 
  width = 'w-full' 
}: LoadingSkeletonProps) => {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className={`
            ${height} ${width} bg-dark-700 rounded animate-pulse
            ${className}
          `}
        />
      ))}
    </>
  )
}

export const CardSkeleton = () => (
  <div className="bg-card-gradient backdrop-blur-xl border border-dark-700/50 rounded-2xl p-6 animate-pulse">
    <div className="space-y-4">
      <LoadingSkeleton height="h-6" width="w-3/4" />
      <LoadingSkeleton height="h-4" count={2} />
      <div className="flex space-x-2">
        <LoadingSkeleton height="h-6" width="w-16" />
        <LoadingSkeleton height="h-6" width="w-20" />
      </div>
    </div>
  </div>
)

export const ListSkeleton = ({ count = 5 }: { count?: number }) => (
  <div className="space-y-4">
    {Array.from({ length: count }).map((_, index) => (
      <div key={index} className="flex items-center space-x-4 p-4 bg-dark-800/50 rounded-lg animate-pulse">
        <LoadingSkeleton height="h-12" width="w-12" className="rounded-full" />
        <div className="flex-1 space-y-2">
          <LoadingSkeleton height="h-4" width="w-1/2" />
          <LoadingSkeleton height="h-3" width="w-3/4" />
        </div>
        <LoadingSkeleton height="h-8" width="w-20" />
      </div>
    ))}
  </div>
)