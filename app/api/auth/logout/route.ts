// app/api/auth/logout/route.ts
import { Client, Account } from "node-appwrite";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get("appwrite-session");

    if (sessionCookie) {
      const client = new Client()
        .setEndpoint(
          process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT ||
            "https://cloud.appwrite.io/v1"
        )
        .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID as string)
        .setSession(sessionCookie.value);

      const account = new Account(client);

      try {
        // Delete the current session
        await account.deleteSession("current");
      } catch (error) {
        // Session might already be invalid, continue with cookie cleanup
        console.log("Session already invalid or deleted", error);
      }
    }

    // Clear the session cookie
    const response = NextResponse.json(
      { message: "Logged out successfully" },
      { status: 200 }
    );

    response.cookies.set("appwrite-session", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 0, // Expire immediately
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Logout error:", error);

    // Even if there's an error, clear the cookie
    const response = NextResponse.json(
      { message: "Logged out" },
      { status: 200 }
    );

    response.cookies.set("appwrite-session", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 0,
      path: "/",
    });

    return response;
  }
}
