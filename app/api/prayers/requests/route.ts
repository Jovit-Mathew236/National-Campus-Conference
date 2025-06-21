// app/api/prayers/requests/route.ts
import { NextRequest, NextResponse } from "next/server";
import { Client, Databases, Query, ID, Account } from "node-appwrite";

// function getClientWithSession(sessionCookieValue: string) {
//   const client = new Client()
//     .setEndpoint(
//       process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT ||
//         "https://cloud.appwrite.io/v1"
//     )
//     .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID as string)
//     .setSession(sessionCookieValue); // Use setSession directly
//   return client;
// }

// GET /api/prayers/requests - Fetch all prayer requests with user reaction status
export async function GET(request: NextRequest) {
  try {
    // Get session cookie
    const sessionCookie = request.cookies.get("appwrite-session");
    if (!sessionCookie || !sessionCookie.value) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Create client with user's session
    const client = new Client()
      .setEndpoint(
        process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT ||
          "https://cloud.appwrite.io/v1"
      )
      .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID as string)
      .setSession(sessionCookie.value);
    const account = new Account(client);
    const databases = new Databases(client);

    // Get current user
    const user = await account.get();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");

    // Fetch prayer requests with pagination, ordered by creation date (newest first)
    const prayerRequestsResponse = await databases.listDocuments(
      process.env.NEXT_PUBLIC_DATABASE_ID as string,
      process.env.NEXT_PUBLIC_PRAYER_REQUEST_COLLECTION_ID as string,
      [Query.orderDesc("created_at"), Query.limit(limit), Query.offset(offset)]
    );

    // Get user's reactions to check which requests they've prayed for
    const userReactionsResponse = await databases.listDocuments(
      process.env.NEXT_PUBLIC_DATABASE_ID as string,
      process.env.NEXT_PUBLIC_PRAYER_REACTION_COLLECTION_ID as string,
      [
        Query.equal("user_id", user.$id),
        Query.limit(1000), // Assuming reasonable limit for user reactions
      ]
    );

    const userReactedRequestIds = new Set(
      userReactionsResponse.documents.map((reaction) => reaction.request_id)
    );

    // Format the response data
    const formattedRequests = prayerRequestsResponse.documents.map(
      (request) => ({
        id: request.$id,
        user: request.is_anonymous
          ? "Anonymous"
          : request.user_name || "Unknown User",
        message: request.message,
        isAnonymous: request.is_anonymous,
        prayerCount: request.prayer_count || 0,
        userPrayed: userReactedRequestIds.has(request.$id),
        createdAt: formatTimeAgo(new Date(request.created_at)),
        userId: request.user_id,
      })
    );

    return NextResponse.json({
      success: true,
      data: formattedRequests,
      pagination: {
        total: prayerRequestsResponse.total,
        limit,
        offset,
        hasMore: offset + limit < prayerRequestsResponse.total,
      },
    });
  } catch (error) {
    console.error("Error fetching prayer requests:", error);
    return NextResponse.json(
      { error: "Failed to fetch prayer requests" },
      { status: 500 }
    );
  }
}

// POST /api/prayers/requests - Create a new prayer request
export async function POST(request: NextRequest) {
  try {
    // Get session cookie
    const sessionCookie = request.cookies.get("appwrite-session");
    if (!sessionCookie || !sessionCookie.value) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Create client with user's session
    const client = new Client()
      .setEndpoint(
        process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT ||
          "https://cloud.appwrite.io/v1"
      )
      .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID as string)
      .setSession(sessionCookie.value);
    const account = new Account(client);
    const databases = new Databases(client);

    // Get current user
    const user = await account.get();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { message, isAnonymous = false } = body;

    if (!message || message.trim().length === 0) {
      return NextResponse.json(
        { error: "Prayer message is required" },
        { status: 400 }
      );
    }

    if (message.length > 500) {
      return NextResponse.json(
        { error: "Prayer message is too long (max 500 characters)" },
        { status: 400 }
      );
    }

    // Create new prayer request
    const newRequest = await databases.createDocument(
      process.env.NEXT_PUBLIC_DATABASE_ID as string,
      process.env.NEXT_PUBLIC_PRAYER_REQUEST_COLLECTION_ID as string,
      ID.unique(),
      {
        user_id: user.$id,
        user_name: user.name || user.email,
        message: message.trim(),
        is_anonymous: isAnonymous,
        prayer_count: 0,
        created_at: new Date().toISOString(),
      }
    );

    return NextResponse.json(
      {
        success: true,
        data: {
          id: newRequest.$id,
          user: isAnonymous ? "Anonymous" : user.name || user.email,
          message: newRequest.message,
          isAnonymous: newRequest.is_anonymous,
          prayerCount: 0,
          userPrayed: false,
          createdAt: "Just now",
          userId: user.$id,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating prayer request:", error);
    return NextResponse.json(
      { error: "Failed to create prayer request" },
      { status: 500 }
    );
  }
}

// Helper function to format time ago
function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return "Just now";
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  } else if (diffInSeconds < 604800) {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} day${days > 1 ? "s" : ""} ago`;
  } else {
    return date.toLocaleDateString();
  }
}
