// app/api/auth/signup/route.ts
import { Client, Account, ID } from "node-appwrite";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { email, password, name } = await request.json();

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: "Email, password, and name are required" },
        { status: 400 }
      );
    }

    // Validate input formats
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters long" },
        { status: 400 }
      );
    }

    // Create client for server-side operations
    const client = new Client()
      .setEndpoint(
        process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT ||
          "https://cloud.appwrite.io/v1"
      )
      .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID as string);

    // Use Account service instead of Users service for registration
    const account = new Account(client);

    // Create account using the account service
    console.log("Creating user account...");
    const user = await account.create(ID.unique(), email, password, name);
    console.log("User created:", user.email);

    // Create a session for the new user
    console.log("Creating session...");
    const session = await account.createEmailPasswordSession(email, password);
    console.log("Session created:", session.$id);
    console.log("Session secret:", session.secret);

    const response = NextResponse.json(
      {
        userId: user.$id,
        sessionId: session.$id,
        message: "Account created successfully",
      },
      { status: 201 }
    );

    // Set the session cookie with the session secret
    console.log("Setting cookie with session secret:", session.secret);
    response.cookies.set("appwrite-session", session.secret, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: "/",
    });

    return response;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error("Signup error:", error);
    console.error("Error code:", error.code);
    console.error("Error type:", error.type);

    // Handle specific Appwrite errors
    if (error.code === 409) {
      return NextResponse.json(
        { error: "A user with the same email already exists" },
        { status: 409 }
      );
    }

    if (error.code === 400) {
      return NextResponse.json(
        { error: error.message || "Invalid request parameters" },
        { status: 400 }
      );
    }

    if (error.code === 401) {
      return NextResponse.json(
        { error: "Authentication failed" },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create account. Please try again." },
      { status: 500 }
    );
  }
}
