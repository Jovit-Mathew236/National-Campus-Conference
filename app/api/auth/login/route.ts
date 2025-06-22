import { Client, Account } from "node-appwrite";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }
    const client = new Client()
      .setEndpoint(
        process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT ||
          "https://cloud.appwrite.io/v1"
      )
      .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID as string)
      .setKey(process.env.NEXT_PUBLIC_APPWRITE_API_KEY as string);
    // Use Account service instead of Users service for registration
    const account = new Account(client);
    const session = await account.createEmailPasswordSession(email, password);
    console.log("Session created:", session.$id);
    console.log("Session secret:", session.secret);

    const response = NextResponse.json(
      {
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
      sameSite: "none",
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: "/dashboard",
    });

    return response;
    // return NextResponse.json({ sessionId: session.$id }, { status: 200 });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }
}
