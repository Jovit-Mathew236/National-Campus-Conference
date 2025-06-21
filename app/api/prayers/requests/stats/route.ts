/* eslint-disable @typescript-eslint/no-explicit-any */
// app/api/prayers/requests/stats/route.ts
import { NextRequest, NextResponse } from "next/server";
import { Account, Client, Databases, Query, Models } from "node-appwrite"; // Added Models for User type

const DATABASE_ID = process.env.NEXT_PUBLIC_DATABASE_ID!;
const PRAYER_REQUESTS_COLLECTION_ID =
  process.env.NEXT_PUBLIC_PRAYER_REQUEST_COLLECTION_ID!;
const PRAYER_REACTIONS_COLLECTION_ID =
  process.env.NEXT_PUBLIC_PRAYER_REACTION_COLLECTION_ID!;

interface UserSessionData {
  user: Models.User<Models.Preferences>; // More specific type for user
  databases: Databases;
}

// Helper function to get user session and databases instance
async function getUserSession(
  request: NextRequest
): Promise<UserSessionData | NextResponse> {
  try {
    const sessionCookie = request.cookies.get("appwrite-session");
    if (!sessionCookie || !sessionCookie.value) {
      // Return a NextResponse directly for early exit, to be handled by the caller
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const client = new Client()
      .setEndpoint(
        process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT ||
          "https://cloud.appwrite.io/v1"
      )
      .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID as string)
      .setSession(sessionCookie.value);

    const account = new Account(client);
    const databases = new Databases(client);

    const user = await account.get();
    return { user, databases };
  } catch (error: any) {
    // Catch specific Appwrite errors if possible
    console.error("Error in getUserSession:", error);
    if (
      error.code === 401 ||
      (error.type && error.type.includes("user_unauthorized"))
    ) {
      return NextResponse.json(
        { error: "Session expired or invalid. Please log in again." },
        { status: 401 }
      );
    }
    return NextResponse.json(
      { error: "Failed to verify user session", details: error.message },
      { status: 500 }
    );
  }
}

// GET /api/prayers/requests/stats - Get prayer statistics
export async function GET(request: NextRequest) {
  try {
    const sessionData = await getUserSession(request);

    // Check if getUserSession returned a NextResponse (error case)
    if (sessionData instanceof NextResponse) {
      return sessionData; // Forward the error response
    }

    // If we reach here, sessionData is UserSessionData
    const { user, databases } = sessionData;

    // Get total prayer requests count
    const totalRequestsResponse = await databases.listDocuments(
      DATABASE_ID,
      PRAYER_REQUESTS_COLLECTION_ID,
      [Query.limit(1)] // Corrected to Query.limit(0) for efficient count
    );

    // Get total prayer reactions count
    const totalReactionsResponse = await databases.listDocuments(
      DATABASE_ID,
      PRAYER_REACTIONS_COLLECTION_ID,
      [Query.limit(1)] // Corrected to Query.limit(0)
    );

    // Get user's prayer requests count
    const userRequestsResponse = await databases.listDocuments(
      DATABASE_ID,
      PRAYER_REQUESTS_COLLECTION_ID,
      [Query.equal("user_id", user.$id), Query.limit(1)] // Corrected to Query.limit(0)
    );

    // Get user's prayer reactions count
    const userPrayersOfferedResponse = await databases.listDocuments(
      DATABASE_ID,
      PRAYER_REACTIONS_COLLECTION_ID,
      [Query.equal("user_id", user.$id), Query.limit(1)] // Corrected to Query.limit(0)
    );

    return NextResponse.json({
      success: true,
      data: {
        totalRequests: totalRequestsResponse.total,
        totalPrayers: totalReactionsResponse.total,
        userRequests: userRequestsResponse.total,
        userPrayers: userPrayersOfferedResponse.total, // Changed from userReactionsResponse.total for clarity
      },
    });
  } catch (error: any) {
    // Catch any unexpected errors from the GET handler itself
    console.error("Error fetching prayer statistics:", error);
    return NextResponse.json(
      { error: "Failed to fetch prayer statistics", details: error.message },
      { status: 500 }
    );
  }
}
