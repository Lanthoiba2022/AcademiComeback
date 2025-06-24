import { useEffect, useState } from 'react'

export const MemoryMonitor = () => {
  const [memoryInfo, setMemoryInfo] = useState<any>(null)

  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return

    const interval = setInterval(() => {
      if ('memory' in performance) {
        setMemoryInfo({
          used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024),
          total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024),
          limit: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024)
        })
      }
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  if (process.env.NODE_ENV !== 'development' || !memoryInfo) return null

  return (
    <div style={{ position: 'fixed', bottom: 8, right: 8, background: '#222', color: '#fff', padding: '6px 12px', borderRadius: 6, fontSize: 12, zIndex: 9999 }}>
      Memory: {memoryInfo.used}MB / {memoryInfo.total}MB (Limit: {memoryInfo.limit}MB)
    </div>
  )
} 