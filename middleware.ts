// middleware.ts
import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function middleware(req: NextRequest) {
  // Create a Supabase client configured to use cookies
  const res = NextResponse.next()
  try {
    const supabase = createMiddlewareClient({ req, res })
    // Refresh session if expired - required for Server Components
    await supabase.auth.getSession()
    
    // Protected routes that require authentication
    const protectedPaths = ["/profile", "/profile/settings", "/profile/scores"]
    // Admin routes that require admin role
    const adminPaths = ["/admin"]
    const path = req.nextUrl.pathname
    
    // Check if the path is admin protected
    if (adminPaths.some((prefix) => path.startsWith(prefix))) {
      const { data: { session } } = await supabase.auth.getSession()
      
      // If no session, redirect to login
      if (!session) {
        const redirectUrl = new URL("/login", req.url)
        redirectUrl.searchParams.set("redirect", path)
        return NextResponse.redirect(redirectUrl)
      }
      
      // Check if user is admin
      const { data: { user } } = await supabase.auth.getUser()
      const isAdmin = user?.user_metadata?.role === 'admin'
      
      if (!isAdmin) {
        return NextResponse.redirect(new URL("/", req.url))
      }
    }
    
    // Check if the path is protected (regular auth)
    if (protectedPaths.some((prefix) => path.startsWith(prefix))) {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      // If no session, redirect to login
      if (!session) {
        const redirectUrl = new URL("/login", req.url)
        redirectUrl.searchParams.set("redirect", path)
        return NextResponse.redirect(redirectUrl)
      }
    }
    
    // Redirect /auth/* routes to new routes
    if (path.startsWith("/auth/")) {
      if (path === "/auth/login") {
        return NextResponse.redirect(new URL("/login", req.url))
      } else if (path === "/auth/register") {
        return NextResponse.redirect(new URL("/register", req.url))
      } else if (path === "/auth/forgot-password") {
        return NextResponse.redirect(new URL("/forgot-password", req.url))
      } else if (path === "/auth/reset-password") {
        return NextResponse.redirect(new URL("/reset-password", req.url))
      }
    }
  } catch (error) {
    console.error("Middleware error:", error)
    // Continue without authentication if Supabase client fails
  }
  return res
}

// Specify which paths this middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|public).*)",
  ],
}