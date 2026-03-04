import { NextResponse } from "next/server";
import { fetchAndStoreAppStoreReviews } from "@/lib/scrapers";

export async function POST() {
  try {
    const result = await fetchAndStoreAppStoreReviews();
    return NextResponse.json(
      { message: "Fetched App Store reviews", ...result },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching App Store reviews", error);
    const message =
      error instanceof Error ? error.message : "Unknown error fetching App Store reviews";
    return NextResponse.json(
      { message: "Failed to fetch App Store reviews", error: message },
      { status: 500 }
    );
  }
}

