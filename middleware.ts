// middleware.ts
import { NextRequest, NextResponse } from "next/server";

// Define public paths that don't require authentication
const PUBLIC_PATHS = [
  "/login",
  "/signup",
  "/api/auth/login",
  "/api/auth/signup",
  "/forgot-password",
  "/reset-password",
] as const;

// Define static asset paths that should be ignored
const STATIC_PATHS = [
  "/favicon.ico",
  "/_next",
  "/images",
  "/public",
  "/static",
  "/assets",
] as const;

// Define API paths that need special handling
const API_AUTH_PATHS = ["/api/auth/verify", "/api/auth/refresh"] as const;

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = request.cookies.get("appwrite-session");
  const url = request.nextUrl.clone();

  // Mobile browser detection
  const isMobile =
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      request.headers.get("user-agent") || ""
    );

  // Check for alternative session storage methods
  const authHeader = request.headers.get("authorization");
  const sessionFromHeader = authHeader?.replace("Bearer ", "");

  // Try multiple cookie names (Appwrite might use different formats)
  const alternativeSession =
    request.cookies.get(
      `a_session_${process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID}`
    ) ||
    request.cookies.get("session") ||
    request.cookies.get("auth-token");

  const hasValidSession =
    sessionCookie?.value || sessionFromHeader || alternativeSession?.value;

  // Skip middleware for static assets
  if (STATIC_PATHS.some((path) => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // Handle API routes
  if (pathname.startsWith("/api/")) {
    // Allow auth API endpoints
    if (API_AUTH_PATHS.some((path) => pathname.startsWith(path))) {
      return NextResponse.next();
    }

    // For other API routes, check authentication
    if (!sessionCookie?.value) {
      return NextResponse.json(
        { error: "Unauthorized", message: "Authentication required" },
        { status: 401 }
      );
    }

    // Optionally validate session here with your auth service
    // const isValid = await validateSession(sessionCookie.value);
    // if (!isValid) {
    //   return NextResponse.json(
    //     { error: "Invalid session", message: "Please login again" },
    //     { status: 401 }
    //   );
    // }

    return NextResponse.next();
  }

  // Handle public paths
  if (PUBLIC_PATHS.some((path) => pathname === path)) {
    // For mobile browsers, be more lenient with session checking
    if (isMobile && pathname === "/login") {
      // Add a query parameter to indicate mobile access
      url.searchParams.set("mobile", "true");
      // Let the login page handle the session check client-side
      return NextResponse.rewrite(url);
    }

    // If user has session and tries to access auth pages, redirect to dashboard
    if (hasValidSession && (pathname === "/login" || pathname === "/signup")) {
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  // Handle root path redirect
  if (pathname === "/") {
    if (isMobile) {
      // For mobile, always redirect to login and let client-side handle auth check
      url.pathname = "/login";
      url.searchParams.set("mobile", "true");
      url.searchParams.set("autocheck", "true");
      return NextResponse.redirect(url);
    }

    if (hasValidSession) {
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    } else {
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }
  }

  // For all other protected routes
  if (!hasValidSession) {
    // For mobile browsers, be more forgiving
    if (isMobile && pathname.startsWith("/dashboard")) {
      url.pathname = "/login";
      url.searchParams.set("redirect", pathname);
      url.searchParams.set("mobile", "true");
      return NextResponse.redirect(url);
    }

    // Store the intended destination for redirect after login
    url.pathname = "/login";
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  // Optional: Add session validation for protected routes
  // You can uncomment and implement this if you want server-side session validation
  /*
  try {
    const isValidSession = await validateSessionWithAppwrite(sessionCookie.value);
    if (!isValidSession) {
      // Clear invalid cookie and redirect to login
      const response = NextResponse.redirect(new URL("/login", request.url));
      response.cookies.delete("appwrite-session");
      return response;
    }
  } catch (error) {
    console.error("Session validation error:", error);
    const response = NextResponse.redirect(new URL("/login", request.url));
    response.cookies.delete("appwrite-session");
    return response;
  }
  */

  return NextResponse.next();
}

// Utility function to validate session with Appwrite (implement based on your setup)
/*
async function validateSessionWithAppwrite(sessionId: string): Promise<boolean> {
  try {
    // Make a request to your auth service to validate the session
    const response = await fetch(`${process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT}/account`, {
      headers: {
        'X-Appwrite-Project': process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!,
        'Cookie': `a_session_${process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID}=${sessionId}`
      }
    });
    return response.ok;
  } catch {
    return false;
  }
}
*/

// Enhanced matcher configuration
export const config = {
  matcher: [
    // Match all paths except static files and Next.js internals
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
    // Specific API route matching
    "/api/:path*",
    // Dashboard and protected routes
    "/dashboard/:path*",
    "/profile/:path*",
    "/settings/:path*",
    // Auth routes
    "/login",
    "/signup",
    "/forgot-password",
    "/reset-password",
  ],
};
