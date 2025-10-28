import React, { useMemo, useCallback, useState, useEffect, useRef } from 'react'

// Memoized components for performance optimization
export const MemoizedComponent = React.memo

// Custom hook for memoized values
export function useMemoizedValue<T>(value: T, deps: React.DependencyList): T {
  return useMemo(() => value, deps)
}

// Custom hook for memoized callbacks
export function useMemoizedCallback<T extends (...args: any[]) => any>(
  callback: T,
  deps: React.DependencyList
): T {
  return useCallback(callback, deps)
}

// Debounced hook
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

// Throttled hook
export function useThrottle<T>(value: T, delay: number): T {
  const [throttledValue, setThrottledValue] = useState<T>(value)
  const lastExecuted = useRef<number>(Date.now())

  useEffect(() => {
    if (Date.now() >= lastExecuted.current + delay) {
      lastExecuted.current = Date.now()
      setThrottledValue(value)
    } else {
      const timer = setTimeout(() => {
        lastExecuted.current = Date.now()
        setThrottledValue(value)
      }, delay)

      return () => clearTimeout(timer)
    }
  }, [value, delay])

  return throttledValue
}

// Virtual scrolling hook
export function useVirtualScroll(
  items: any[],
  itemHeight: number,
  containerHeight: number
) {
  const [scrollTop, setScrollTop] = useState(0)

  const visibleItems = useMemo(() => {
    const startIndex = Math.floor(scrollTop / itemHeight)
    const endIndex = Math.min(
      startIndex + Math.ceil(containerHeight / itemHeight) + 1,
      items.length
    )

    return items.slice(startIndex, endIndex).map((item, index) => ({
      ...item,
      index: startIndex + index,
    }))
  }, [items, itemHeight, containerHeight, scrollTop])

  const totalHeight = items.length * itemHeight
  const offsetY = Math.floor(scrollTop / itemHeight) * itemHeight

  return {
    visibleItems,
    totalHeight,
    offsetY,
    setScrollTop,
  }
}

// Intersection Observer hook for lazy loading
export function useIntersectionObserver(
  ref: React.RefObject<Element>,
  options: IntersectionObserverInit = {}
) {
  const [isIntersecting, setIsIntersecting] = useState(false)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting)
      },
      options
    )

    observer.observe(element)

    return () => {
      observer.unobserve(element)
    }
  }, [ref, options])

  return isIntersecting
}

// Performance monitoring hook
export function usePerformanceMonitor(componentName: string) {
  useEffect(() => {
    const startTime = performance.now()

    return () => {
      const endTime = performance.now()
      const renderTime = endTime - startTime
      
      // @ts-ignore
      if (import.meta.env.MODE === 'development') {
        console.log(`${componentName} render time: ${renderTime.toFixed(2)}ms`)
      }
    }
  }, [componentName])
}

// Memory usage hook
export function useMemoryUsage() {
  const [memoryInfo, setMemoryInfo] = useState<any>(null)

  useEffect(() => {
    if ('memory' in performance) {
      const updateMemoryInfo = () => {
        setMemoryInfo((performance as any).memory)
      }

      updateMemoryInfo()
      const interval = setInterval(updateMemoryInfo, 5000)

      return () => clearInterval(interval)
    }
  }, [])

  return memoryInfo
}

// Image lazy loading hook
export function useLazyImage(src: string, placeholder?: string) {
  const [imageSrc, setImageSrc] = useState(placeholder || '')
  const [isLoaded, setIsLoaded] = useState(false)
  const [isError, setIsError] = useState(false)

  useEffect(() => {
    const img = new Image()
    
    img.onload = () => {
      setImageSrc(src)
      setIsLoaded(true)
    }
    
    img.onerror = () => {
      setIsError(true)
    }
    
    img.src = src
  }, [src])

  return { imageSrc, isLoaded, isError }
}

// Batch updates hook
export function useBatchedUpdates() {
  const [updates, setUpdates] = useState<any[]>([])
  // @ts-ignore
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>()

  const batchUpdate = useCallback((update: any) => {
    setUpdates(prev => [...prev, update])
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    
    timeoutRef.current = setTimeout(() => {
      // Process all batched updates
      setUpdates([])
    }, 16) // ~60fps
  }, [])

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return { batchUpdate, pendingUpdates: updates.length }
}

export default {
  MemoizedComponent,
  useMemoizedValue,
  useMemoizedCallback,
  useDebounce,
  useThrottle,
  useVirtualScroll,
  useIntersectionObserver,
  usePerformanceMonitor,
  useMemoryUsage,
  useLazyImage,
  useBatchedUpdates,
}
