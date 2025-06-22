// app/api/auth/oauth/callback/route.ts
import { Client, Account } from "node-appwrite";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get("userId");
    const secret = url.searchParams.get("secret");

    if (!userId || !secret) {
      console.error("Missing userId or secret in OAuth callback");
      return NextResponse.redirect(
        new URL("/login?oauth_error=missing_params", request.url)
      );
    }

    const client = new Client()
      .setEndpoint(
        process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT ||
          "https://cloud.appwrite.io/v1"
      )
      .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID as string)
      .setKey(process.env.NEXT_PUBLIC_APPWRITE_API_KEY as string);

    const account = new Account(client);

    // Get the session using the secret
    const session = await account.getSession(secret);
    console.log("OAuth session retrieved:", session.$id);

    // Create response and redirect to dashboard
    const response = NextResponse.redirect(new URL("/dashboard", request.url));

    // Set the session cookie
    response.cookies.set("appwrite-session", session.secret, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax", // Changed from "none" to "lax" for OAuth flow
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("OAuth callback error:", error);
    return NextResponse.redirect(
      new URL("/login?oauth_error=callback_failed", request.url)
    );
  }
}
