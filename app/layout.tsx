import "./globals.css"
import { Inter } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import DatabaseInitializer from "@/components/db-initializer"
import LanguageSelector from "@/components/language-selector"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "Finnish Harbor Guesser",
  description: "Test your knowledge of Finnish harbors and marinas",
    generator: 'v0.dev'
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link
          rel="stylesheet"
          href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
          integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
          crossOrigin="anonymous"
        />
      </head>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
          <DatabaseInitializer />
          <div className="fixed top-4 right-4 z-50">
            <LanguageSelector />
          </div>
        </ThemeProvider>
      </body>
    </html>
  )
}
