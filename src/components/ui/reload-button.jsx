import { useState, useCallback } from 'react'

export default function ReloadButton({ onReload, label = 'รีเฟรช', className = '' }) {
  const [loading, setLoading] = useState(false)

  const handleClick = useCallback(async () => {
    if (loading) return
    setLoading(true)
    try {
      await onReload()
    } finally {
      setLoading(false)
    }
  }, [onReload, loading])

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      title={label}
      className={`inline-flex items-center justify-center h-10 px-3.5 rounded-xl text-sm font-medium bg-white text-neutral-600 border border-neutral-200 hover:bg-neutral-50 hover:border-neutral-300 active:bg-neutral-100 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-lime-300 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none shadow-sm ${className}`}
    >
      <svg
        className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M21 2v6h-6" />
        <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
        <path d="M3 22v-6h6" />
        <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
      </svg>
    </button>
  )
}
