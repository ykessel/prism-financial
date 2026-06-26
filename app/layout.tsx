import type { Metadata, Viewport } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const jetbrains = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains',
  weight: ['400', '500', '600'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Prism — Financial Data Dashboard',
  description: 'Interactive financial data visualization. Real-time charts, sector heatmaps, and market intelligence in one dashboard.',
  openGraph: {
    title: 'Prism — Financial Data Dashboard',
    description: 'Interactive financial data visualization with D3.js.',
    type: 'website',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${jetbrains.variable} font-body antialiased`}>
        {children}
      </body>
    </html>
  )
}
