'use client'

import { useEffect } from 'react'

export function ClientGuard() {
  useEffect(() => {
    const prevent = (e: Event) => e.preventDefault()

    document.addEventListener('contextmenu', prevent)
    document.addEventListener('copy', prevent)
    document.addEventListener('cut', prevent)
    document.addEventListener('paste', prevent)

    return () => {
      document.removeEventListener('contextmenu', prevent)
      document.removeEventListener('copy', prevent)
      document.removeEventListener('cut', prevent)
      document.removeEventListener('paste', prevent)
    }
  }, [])

  return null
}