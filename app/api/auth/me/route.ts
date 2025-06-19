// app/api/auth/me/route.ts
import { NextRequest, NextResponse } from "next/server";
import { Client, Account } from "node-appwrite";

export async function GET(request: NextRequest) {
  try {
    // Get the session cookie
    const sessionCookie = request.cookies.get("appwrite-session");

    console.log("Session cookie:", sessionCookie);

    if (!sessionCookie || !sessionCookie.value) {
      console.log("No session cookie found");
      return NextResponse.json({ error: "No session found" }, { status: 401 });
    }

    console.log("Session value:", sessionCookie.value);

    const client = new Client()
      .setEndpoint(
        process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT ||
          "https://cloud.appwrite.io/v1"
      )
      .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID as string)
      .setSession(sessionCookie.value);

    const account = new Account(client);

    console.log("Attempting to get user with session...");
    const user = await account.get();
    console.log("User retrieved successfully:", user.email);

    return NextResponse.json({
      user: {
        $id: user.$id,
        name: user.name,
        email: user.email,
        emailVerification: user.emailVerification,
        registration: user.registration,
      },
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error("Auth check error:", error);
    console.error("Error code:", error.code);
    console.error("Error type:", error.type);

    // Clear the invalid session cookie
    const response = NextResponse.json(
      { error: "Invalid or expired session" },
      { status: 401 }
    );

    // Clear the cookie if session is invalid
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
