// middleware.ts
import { NextRequest, NextResponse } from "next/server";

const PUBLIC_PATHS = [
  "/login",
  "/signup",
  "/api/auth/login",
  "/api/auth/signup",
  "/favicon.ico",
  "/_next",
  "/images",
  "/public",
  "/api/auth/oauth/callback",
  "/api/auth/me", // Add the /api/auth/me path to public paths
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = request.cookies.get("appwrite-session");

  // Allow public paths
  if (PUBLIC_PATHS.some((path) => pathname.startsWith(path))) {
    // If user is authenticated and tries to access login/signup, redirect to dashboard
    if ((pathname === "/login" || pathname === "/signup") && sessionCookie) {
      // Optionally, you can check the /api/auth/me endpoint here to confirm authentication
      // before redirecting. This adds an extra layer of certainty.
      const authResponse = await fetch(
        `${request.nextUrl.origin}/api/auth/me`,
        {
          headers: {
            cookie: `appwrite-session=${sessionCookie.value}`,
          },
        }
      );
      if (authResponse.ok) {
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }
    }
    return NextResponse.next();
  }

  // For protected routes, check authentication
  if (!sessionCookie) {
    // If there's no session cookie, redirect to login
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // If there's a session cookie, try to validate it using the /api/auth/me endpoint
  try {
    const authResponse = await fetch(`${request.nextUrl.origin}/api/auth/me`, {
      headers: {
        cookie: `appwrite-session=${sessionCookie.value}`,
      },
    });

    // If the user is authenticated (200 OK from /api/auth/me)
    if (authResponse.ok) {
      // If the user is trying to access a public path like login/signup while authenticated
      if (pathname === "/login" || pathname === "/signup") {
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }
      // Continue to the requested protected route
      return NextResponse.next();
    } else {
      // If /api/auth/me returns an error (e.g., 401 for invalid session)
      // Clear the invalid session cookie
      const response = NextResponse.redirect(new URL("/login", request.url));
      response.cookies.set("appwrite-session", "", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 0, // Expire immediately
        path: "/",
      });
      return response;
    }
  } catch (error) {
    console.error("Middleware auth check error:", error);
    // Treat any fetch error as an unauthenticated state
    const response = NextResponse.redirect(new URL("/login", request.url));
    response.cookies.set("appwrite-session", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 0, // Expire immediately
      path: "/",
    });
    return response;
  }
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|images|public).*)"],
};
