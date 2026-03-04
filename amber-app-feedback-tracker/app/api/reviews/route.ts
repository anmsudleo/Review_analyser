import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const source = searchParams.get("source") || undefined;
    const category = searchParams.get("category") || undefined;
    const rating = searchParams.get("rating");
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");
    const page = Number(searchParams.get("page") || "1");
    const pageSize = Number(searchParams.get("pageSize") || "20");

    const where: any = {};
    if (source && source !== "all") {
      where.source = source;
    }
    if (category && category !== "all") {
      where.category = category;
    }
    if (rating && rating !== "all") {
      where.rating = Number(rating);
    }
    if (dateFrom || dateTo) {
      where.reviewDate = {};
      if (dateFrom) {
        where.reviewDate.gte = new Date(dateFrom);
      }
      if (dateTo) {
        where.reviewDate.lte = new Date(dateTo);
      }
    }

    const [total, reviews] = await Promise.all([
      prisma.review.count({ where }),
      prisma.review.findMany({
        where,
        orderBy: { reviewDate: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return NextResponse.json({
      total,
      page,
      pageSize,
      reviews,
    });
  } catch (error) {
    console.error("Error loading reviews", error);
    const message =
      error instanceof Error ? error.message : "Unknown error loading reviews";
    return NextResponse.json(
      { message: "Failed to load reviews", error: message },
      { status: 500 }
    );
  }
}

