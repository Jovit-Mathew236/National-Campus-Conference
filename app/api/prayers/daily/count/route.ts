/* eslint-disable @typescript-eslint/no-explicit-any */
import { Client, Databases, Query } from "node-appwrite";
import { NextRequest, NextResponse } from "next/server";

// GET - Get count of people who prayed campus prayer today
export async function GET(request: NextRequest) {
  try {
    // Get session cookie for authentication
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

    const databases = new Databases(client);
    const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD format

    console.log("Fetching daily campus prayer count for date:", today);

    // Count documents where campus_prayer_done is true for today
    const campusPrayerCountQuery = await databases.listDocuments(
      process.env.NEXT_PUBLIC_DATABASE_ID as string,
      process.env.NEXT_PUBLIC_DAILY_PRAYER_COLLECTION_ID as string,
      [Query.equal("date", today), Query.equal("campus_prayer_done", true)]
    );

    const count =
      campusPrayerCountQuery.total || campusPrayerCountQuery.documents.length;

    console.log("Campus prayer count for today:", count);

    return NextResponse.json({
      success: true,
      data: {
        count: count,
        date: today,
      },
    });
  } catch (error: any) {
    console.error("Error fetching daily campus prayer count:", error);

    if (
      error.code === 401 ||
      (error.type && error.type.includes("user_unauthorized"))
    ) {
      return NextResponse.json(
        { error: "Authentication failed or session expired" },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        error: "Failed to fetch daily campus prayer count",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
