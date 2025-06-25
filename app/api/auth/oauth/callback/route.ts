// app/api/auth/oauth/callback/route.ts
import { Client, Account, Databases, ID, Query } from "node-appwrite";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const userId = url.searchParams.get("userId");
  const secret = url.searchParams.get("secret");

  if (!userId || !secret) {
    return NextResponse.redirect(
      new URL("/login?oauth_error=missing_params", request.url)
    );
  }

  const sessionClient = new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT as string)
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID as string)
    .setKey(process.env.NEXT_PUBLIC_APPWRITE_API_KEY as string);

  try {
    // Create session
    const account = new Account(sessionClient);
    const session = await account.createSession(userId, secret);

    // Create authenticated client for user operations
    const authenticatedClient = new Client()
      .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT as string)
      .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID as string)
      .setSession(session.secret);

    const authenticatedAccount = new Account(authenticatedClient);
    const databases = new Databases(sessionClient);

    // Get user details with authenticated client
    const user = await authenticatedAccount.get();
    console.log("User details:", user);

    // Check if user already exists in your custom collection
    let existingUser;
    try {
      const userDocs = await databases.listDocuments(
        process.env.NEXT_PUBLIC_DATABASE_ID as string,
        process.env.NEXT_PUBLIC_USERS_COLLECTION_ID as string,
        [Query.equal("email", user.email)]
      );
      existingUser = userDocs.documents[0];
      console.log("Existing user found:", !!existingUser);
    } catch (error) {
      console.log("Error checking existing user:", error);
    }

    // If user doesn't exist, create new document with available info
    if (!existingUser) {
      console.log("Creating new user document...");

      const email = user.email;
      const name = user.name;

      try {
        await databases.createDocument(
          process.env.NEXT_PUBLIC_DATABASE_ID as string,
          process.env.NEXT_PUBLIC_USERS_COLLECTION_ID as string,
          ID.unique(), // ✅ Generate unique document ID
          {
            user_id: user.$id, // ✅ Use Appwrite user ID as reference
            email: email,
            display_name: name,
            pro_pic: "https://via.placeholder.com/150",
            joined_date: new Date().toISOString(),
          }
        );
        console.log("New user document created successfully");
      } catch (createError) {
        console.error("Error creating user document:", createError);
        // Don't fail the entire flow if document creation fails
      }
    } else {
      console.log("User already exists, skipping document creation");
    }

    const response = NextResponse.redirect(new URL("/dashboard", request.url));
    response.cookies.set("appwrite-session", session.secret, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
    });
    return response;
  } catch (error) {
    console.error("OAuth callback error:", error);
    return NextResponse.redirect(
      new URL("/login?oauth_error=session_failed", request.url)
    );
  }
}
