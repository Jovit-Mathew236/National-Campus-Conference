// app/api/auth/oauth/callback/route.ts
import { Client, Account } from "node-appwrite";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get("userId");
    const secret = url.searchParams.get("secret");

    console.log("OAuth callback received:", {
      userId: !!userId,
      secret: !!secret,
    });

    if (!userId || !secret) {
      console.error("Missing OAuth parameters:", { userId, secret });
      return NextResponse.redirect(
        new URL("/login?oauth_error=missing_params", request.url)
      );
    }

    // For OAuth callback, we also don't need API key
    const client = new Client()
      .setEndpoint(
        process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT ||
          "https://cloud.appwrite.io/v1"
      )
      .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID as string);

    const account = new Account(client);

    try {
      // Set the session using the secret from OAuth
      client.setSession(secret);

      // Verify the session by getting current session
      const session = await account.get();
      console.log("OAuth session verified:", {
        userId: session.$id,
        email: session.email,
      });

      // Create response and redirect to dashboard
      const response = NextResponse.redirect(
        new URL("/dashboard", request.url)
      );

      // Set the session cookie
      response.cookies.set("appwrite-session", secret, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 30, // 30 days
        path: "/",
      });

      return response;
    } catch (sessionError) {
      console.error("Session verification failed:", sessionError);
      return NextResponse.redirect(
        new URL("/login?oauth_error=session_invalid", request.url)
      );
    }
  } catch (error) {
    console.error("OAuth callback error:", error);
    return NextResponse.redirect(
      new URL("/login?oauth_error=callback_failed", request.url)
    );
  }
}
