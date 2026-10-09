'use client'

import { useEffect } from 'react'

// Route-segment error boundary: replaces the blank screen a render error used
// to produce, and surfaces the error to the console so monitoring can see it.
export default function Error({ error, reset }) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div
      dir="rtl"
      style={{
        minHeight: '60vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '16px',
        padding: '24px',
        textAlign: 'center',
        fontFamily: 'var(--font-tajawal), "IBM Plex Sans Arabic", Arial, sans-serif',
      }}
    >
      <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#111827', margin: 0 }}>
        حدث خطأ غير متوقع
      </h2>
      <p style={{ color: '#6B7280', margin: 0 }}>
        تعذّر عرض هذه الصفحة. حاول مرة أخرى، وإن تكرّر الخطأ تواصل مع الدعم.
      </p>
      <button
        onClick={() => reset()}
        style={{
          padding: '10px 22px',
          borderRadius: '8px',
          background: '#0F5B3E',
          color: '#fff',
          border: 'none',
          cursor: 'pointer',
          fontWeight: 600,
        }}
      >
        إعادة المحاولة
      </button>
    </div>
  )
}
