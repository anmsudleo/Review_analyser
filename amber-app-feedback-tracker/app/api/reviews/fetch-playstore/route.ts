import { NextResponse } from "next/server";
import { fetchAndStorePlayStoreReviews } from "@/lib/scrapers";

export async function POST() {
  try {
    const result = await fetchAndStorePlayStoreReviews();
    return NextResponse.json(
      { message: "Fetched Play Store reviews", ...result },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching Play Store reviews", error);
    const message =
      error instanceof Error ? error.message : "Unknown error fetching Play Store reviews";
    return NextResponse.json(
      { message: "Failed to fetch Play Store reviews", error: message },
      { status: 500 }
    );
  }
}

