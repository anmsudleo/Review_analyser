import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface Params {
  params: {
    id: string;
  };
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = params;
  const body = await req.json();

  try {
    const updated = await prisma.review.update({
      where: { id },
      data: {
        category: body.category,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating review", error);
    return NextResponse.json(
      { message: "Failed to update review" },
      { status: 500 }
    );
  }
}

