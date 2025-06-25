// app/api/prayers/streak/route.ts
import { Client, Account, Databases, Query } from "node-appwrite";
import { NextRequest, NextResponse } from "next/server";

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

    const account = new Account(client);
    const databases = new Databases(client);

    // Get current user
    const user = await account.get();
    console.log("Calculating streak for user:", user.$id);

    // Get all daily prayer records for the user where campus prayer is completed
    // Order by date descending to start from most recent
    const prayerRecords = await databases.listDocuments(
      process.env.NEXT_PUBLIC_DATABASE_ID as string,
      process.env.NEXT_PUBLIC_DAILY_PRAYER_COLLECTION_ID as string,
      [
        Query.equal("user_id", user.$id),
        Query.equal("campus_prayer_done", true),
        Query.orderDesc("date"),
        Query.limit(100), // Limit to prevent excessive data retrieval
      ]
    );

    console.log("Found prayer records:", prayerRecords.documents.length);

    if (prayerRecords.documents.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          streak: 0,
          lastPrayerDate: null,
          message: "No campus prayers completed yet",
        },
      });
    }

    // Extract dates and calculate streak
    const prayerDates = prayerRecords.documents
      .map((doc) => new Date(doc.date))
      .sort((a, b) => b.getTime() - a.getTime()); // Sort descending (most recent first)

    const streak = calculateConsecutiveStreak(prayerDates);
    const lastPrayerDate = prayerDates[0].toISOString().split("T")[0];

    console.log("Calculated streak:", streak);

    return NextResponse.json({
      success: true,
      data: {
        streak: streak,
        lastPrayerDate: lastPrayerDate,
        totalPrayerDays: prayerDates.length,
        message:
          streak > 0 ? `${streak} day streak!` : "Start your streak today!",
      },
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error("Error calculating prayer streak:", error);

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
        error: "Failed to calculate prayer streak",
        details: error.message,
      },
      { status: 500 }
    );
  }
}

// Helper function to calculate consecutive streak from today backwards
function calculateConsecutiveStreak(dates: Date[]): number {
  if (!dates || dates.length === 0) {
    return 0;
  }

  // Get today's date (without time)
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Convert all dates to YYYY-MM-DD format for easier comparison
  const prayerDatesSet = new Set(
    dates.map((date) => {
      const d = new Date(date);
      return d.toISOString().split("T")[0]; // YYYY-MM-DD format
    })
  );

  let streak = 0;
  const checkDate = new Date(today);

  // Start from today and go backwards
  while (true) {
    const dateString = checkDate.toISOString().split("T")[0];

    // If this date has a prayer record, increment streak
    if (prayerDatesSet.has(dateString)) {
      streak++;
      // Move to previous day
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      // No prayer found for this date, streak is broken
      break;
    }
  }

  return streak;
}
