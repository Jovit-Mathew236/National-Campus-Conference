/* eslint-disable @typescript-eslint/no-explicit-any */
// app/api/prayers/requests/[id]/react/route.ts
import { NextRequest, NextResponse } from "next/server";
import { Account, Client, Databases, Query, Models, ID } from "node-appwrite"; // Added Models for User type

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
// POST /api/prayers/requests/[id]/react - Toggle prayer reaction
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sessionData = await getUserSession(request);

    // Check if getUserSession returned a NextResponse (error case)
    if (sessionData instanceof NextResponse) {
      return sessionData; // Forward the error response
    }

    // If we reach here, sessionData is UserSessionData
    const { user, databases } = sessionData;
    const requestId = params.id;

    // Check if prayer request exists
    try {
      await databases.getDocument(
        DATABASE_ID,
        PRAYER_REQUESTS_COLLECTION_ID,
        requestId
      );
    } catch (error) {
      console.error("Prayer request not found:", error);
      return NextResponse.json(
        { error: "Prayer request not found" },
        { status: 404 }
      );
    }

    // Check if user has already reacted to this request
    const existingReactions = await databases.listDocuments(
      DATABASE_ID,
      PRAYER_REACTIONS_COLLECTION_ID,
      [Query.equal("user_id", user.$id), Query.equal("request_id", requestId)]
    );

    let prayerCountChange = 0;
    let userPrayed = false;

    if (existingReactions.documents.length > 0) {
      // User has already prayed - remove the reaction
      await databases.deleteDocument(
        DATABASE_ID,
        PRAYER_REACTIONS_COLLECTION_ID,
        existingReactions.documents[0].$id
      );
      prayerCountChange = -1;
      userPrayed = false;
    } else {
      // User hasn't prayed yet - add the reaction
      await databases.createDocument(
        DATABASE_ID,
        PRAYER_REACTIONS_COLLECTION_ID,
        ID.unique(),
        {
          user_id: user.$id,
          request_id: requestId,
          timestamp: new Date().toISOString(),
        }
      );
      prayerCountChange = 1;
      userPrayed = true;
    }

    // Update prayer count in the request document
    const prayerRequest = await databases.getDocument(
      DATABASE_ID,
      PRAYER_REQUESTS_COLLECTION_ID,
      requestId
    );

    const newPrayerCount = Math.max(
      0,
      (prayerRequest.prayer_count || 0) + prayerCountChange
    );

    await databases.updateDocument(
      DATABASE_ID,
      PRAYER_REQUESTS_COLLECTION_ID,
      requestId,
      {
        prayer_count: newPrayerCount,
      }
    );

    return NextResponse.json({
      success: true,
      data: {
        userPrayed,
        prayerCount: newPrayerCount,
      },
    });
  } catch (error) {
    console.error("Error toggling prayer reaction:", error);
    return NextResponse.json(
      { error: "Failed to toggle prayer reaction" },
      { status: 500 }
    );
  }
}
