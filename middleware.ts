import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()

  // Check if Supabase environment variables are available
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.log("Supabase environment variables not found, skipping auth check")
    return res
  }

  try {
    // Create supabase middleware client
    const supabase = createMiddlewareClient({ req, res })

    // Refresh session if expired
    await supabase.auth.getSession()

    // Check if user is trying to access protected routes
    const url = req.nextUrl.pathname
    const session = await supabase.auth.getSession()

    // Protected routes that require authentication
    const protectedRoutes = ["/profile"]

    if (protectedRoutes.includes(url) && !session.data.session) {
      // Redirect to login if trying to access protected route without session
      const redirectUrl = req.nextUrl.clone()
      redirectUrl.pathname = "/auth/login"
      redirectUrl.searchParams.set("redirectTo", url)
      return NextResponse.redirect(redirectUrl)
    }
  } catch (error) {
    console.error("Error in middleware:", error)
  }

  return res
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.svg).*)"],
}
