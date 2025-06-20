import { Client, Account, Databases, Query } from "node-appwrite";
import { NextRequest, NextResponse } from "next/server";

// Helper function to create and configure client for user session
function getClientWithSession(sessionCookieValue: string) {
  const client = new Client()
    .setEndpoint(
      process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT ||
        "https://cloud.appwrite.io/v1"
    )
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID as string)
    .setSession(sessionCookieValue); // Use setSession directly
  return client;
}

// GET - Retrieve daily prayer data for current user
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
    const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD format
    console.log(
      "Fetching daily prayer data for user:",
      user.$id,
      "on date:",
      today
    );

    // Try to find existing daily prayer record for today
    const dailyPrayerQuery = await databases.listDocuments(
      process.env.NEXT_PUBLIC_DATABASE_ID as string,
      process.env.NEXT_PUBLIC_DAILY_PRAYER_COLLECTION_ID as string,
      [Query.equal("user_id", user.$id), Query.equal("date", today)]
    );

    let dailyPrayerData = {
      campus_prayer_done: false,
      mass_attended: false,
      rosary_prayed: false,
      word_of_god_read: false,
      our_father_done: false,
      date: today,
    };

    // If record exists, use that data
    if (dailyPrayerQuery.documents.length > 0) {
      const doc = dailyPrayerQuery.documents[0];
      dailyPrayerData = {
        campus_prayer_done: doc.campus_prayer_done || false,
        mass_attended: doc.mass_attended || false,
        rosary_prayed: doc.rosary_prayed || false,
        word_of_god_read: doc.word_of_god_read || false,
        our_father_done: doc.our_father_done || false,
        date: doc.date,
      };
    }

    return NextResponse.json({
      success: true,
      data: dailyPrayerData,
    });
  } catch (error: any) {
    console.error("Error fetching daily prayer data:", error);

    if (
      error.code === 401 ||
      (error.type && error.type.includes("user_unauthorized"))
    ) {
      // Check for common auth errors
      return NextResponse.json(
        { error: "Authentication failed or session expired" },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: "Failed to fetch daily prayer data", details: error.message },
      { status: 500 }
    );
  }
}

// POST - Update daily prayer data
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      campus_prayer_done,
      mass_attended,
      rosary_prayed,
      word_of_god_read,
      our_father_done,
    } = body;

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
    const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD format
    console.log(
      "Fetching daily prayer data for user:",
      user.$id,
      "on date:",
      today
    );

    // Check if record exists for today
    const existingQuery = await databases.listDocuments(
      process.env.NEXT_PUBLIC_DATABASE_ID as string,
      process.env.NEXT_PUBLIC_DAILY_PRAYER_COLLECTION_ID as string,
      [Query.equal("user_id", user.$id), Query.equal("date", today)]
    );

    const updateData = {
      user_id: user.$id,
      date: today,
      ...(campus_prayer_done !== undefined && { campus_prayer_done }),
      ...(mass_attended !== undefined && { mass_attended }),
      ...(rosary_prayed !== undefined && { rosary_prayed }),
      ...(word_of_god_read !== undefined && { word_of_god_read }),
      ...(our_father_done !== undefined && { our_father_done }),
      //   updated_at: new Date().toISOString(),
    };

    let result;

    if (existingQuery.documents.length > 0) {
      // Update existing document
      const docId = existingQuery.documents[0].$id;
      result = await databases.updateDocument(
        process.env.NEXT_PUBLIC_DATABASE_ID as string,
        process.env.NEXT_PUBLIC_DAILY_PRAYER_COLLECTION_ID as string,
        docId,
        updateData
      );
    } else {
      // Create new document
      result = await databases.createDocument(
        process.env.NEXT_PUBLIC_DATABASE_ID as string,
        process.env.NEXT_PUBLIC_DAILY_PRAYER_COLLECTION_ID as string,
        "unique()", // Let Appwrite generate unique ID
        {
          ...updateData,
          //   created_at: new Date().toISOString(),
        }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Daily prayer data updated successfully",
      data: {
        campus_prayer_done: result.campus_prayer_done,
        mass_attended: result.mass_attended,
        rosary_prayed: result.rosary_prayed,
        word_of_god_read: result.word_of_god_read,
        our_father_done: result.our_father_done,
        date: result.date,
      },
    });
  } catch (error: any) {
    console.error("Error updating daily prayer data:", error);
    console.error("Error code:", error.code);
    console.error("Error type:", error.type);

    if (error.code === 401) {
      return NextResponse.json(
        { error: "Authentication failed" },
        { status: 401 }
      );
    }

    if (error.code === 400) {
      return NextResponse.json(
        { error: error.message || "Invalid request parameters" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to update daily prayer data" },
      { status: 500 }
    );
  }
}

// PUT - Alternative endpoint for updating specific prayer item
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { prayer_type, completed } = body;

    // Validate prayer_type
    const validPrayerTypes = [
      "campus_prayer_done",
      "mass_attended",
      "rosary_prayed",
      "word_of_god_read",
      "our_father_done",
    ];

    if (!validPrayerTypes.includes(prayer_type)) {
      return NextResponse.json(
        { error: "Invalid prayer type" },
        { status: 400 }
      );
    }

    // Get session cookie
    const sessionCookie = request.cookies.get("appwrite-session");
    if (!sessionCookie || !sessionCookie.value) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Create client with user's session
    const client = getClientWithSession(sessionCookie.value);
    const account = new Account(client);
    const databases = new Databases(client);

    // Get current user
    const user = await account.get();
    const today = new Date().toISOString().split("T")[0];

    // Check if record exists for today
    const existingQuery = await databases.listDocuments(
      process.env.NEXT_PUBLIC_DATABASE_ID as string,
      process.env.NEXT_PUBLIC_DAILY_PRAYER_COLLECTION_ID as string,
      [Query.equal("user_id", user.$id), Query.equal("date", today)]
    );

    const updateData: any = {
      // Use 'any' or define a type
      user_id: user.$id,
      date: today,
      [prayer_type]: completed,
      //   updated_at: new Date().toISOString(),
    };

    let result;

    if (existingQuery.documents.length > 0) {
      // Update existing document
      const docId = existingQuery.documents[0].$id;
      result = await databases.updateDocument(
        process.env.NEXT_PUBLIC_DATABASE_ID as string,
        process.env.NEXT_PUBLIC_DAILY_PRAYER_COLLECTION_ID as string,
        docId,
        updateData // Only sends the specific prayer_type and other fixed fields
      );
    } else {
      // Create new document with default values for other prayer types
      const createData = {
        user_id: user.$id,
        date: today,
        campus_prayer_done: false,
        mass_attended: false,
        rosary_prayed: false,
        word_of_god_read: false,
        our_father_done: false,
        [prayer_type]: completed, // Set the specific prayer type
        // created_at: new Date().toISOString(),
        // updated_at: new Date().toISOString(),
      };

      result = await databases.createDocument(
        process.env.NEXT_PUBLIC_DATABASE_ID as string,
        process.env.NEXT_PUBLIC_DAILY_PRAYER_COLLECTION_ID as string,
        "unique()",
        createData
      );
    }

    return NextResponse.json({
      success: true,
      message: `${prayer_type} updated successfully`,
      data: {
        // Return what was updated for confirmation
        prayer_type,
        completed,
        date: today,
        documentId: result.$id, // Good to return the document ID
      },
    });
  } catch (error: any) {
    console.error("Error updating prayer item:", error);

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
      { error: "Failed to update prayer item", details: error.message },
      { status: 500 }
    );
  }
}
