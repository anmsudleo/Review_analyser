import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const [total, avg, byCategory, bySentiment, byRating, byDate] =
      await Promise.all([
        prisma.review.count(),
        prisma.review.aggregate({
          _avg: { rating: true },
        }),
        prisma.review.groupBy({
          by: ["category"],
          _count: { _all: true },
        }),
        prisma.review.groupBy({
          by: ["sentiment"],
          _count: { _all: true },
        }),
        prisma.review.groupBy({
          by: ["rating"],
          _count: { _all: true },
        }),
        prisma.review.groupBy({
          by: ["reviewDate"],
          _count: { _all: true },
        }),
      ]);

    // Compute most common issue category (excluding null)
    const issueCategories = byCategory.filter((c) => c.category);
    const mostCommon =
      issueCategories.sort((a, b) => b._count._all - a._count._all)[0]
        ?.category ?? null;

    return NextResponse.json({
      total,
      avgRating: avg._avg.rating ?? 0,
      byCategory,
      bySentiment,
      byRating,
      byDate,
      mostCommonCategory: mostCommon,
    });
  } catch (error) {
    console.error("Error loading stats", error);
    const message =
      error instanceof Error ? error.message : "Unknown error loading stats";
    return NextResponse.json(
      { message: "Failed to load stats", error: message },
      { status: 500 }
    );
  }
}

