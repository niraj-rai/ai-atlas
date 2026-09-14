import { useLayoutEffect, useRef, useState } from 'react'

export function useSize<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  const [size, setSize] = useState({ w: 0, h: 0 })

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return

    // Measure straight away. ResizeObserver's first callback is asynchronous,
    // and when this remounts into a container that is already laid out at its
    // final size the observer may never report anything — leaving the map stuck
    // at scale 1 with no idea how big its viewport is.
    const rect = el.getBoundingClientRect()
    setSize({ w: rect.width, h: rect.height })

    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect
      setSize((current) =>
        current.w === width && current.h === height ? current : { w: width, h: height },
      )
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  return { ref, size }
}
