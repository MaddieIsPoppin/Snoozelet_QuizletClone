import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { recordReview } from "@/lib/db";
import { parseReviewRequest, ReviewRequestError } from "@/lib/review";

export const runtime = "nodejs";

export async function POST(request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Not signed in" }, { status: 401 });
    }

    const review = await parseReviewRequest(request);
    const result = await recordReview({ ...review, userId: user.id });

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof ReviewRequestError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.status }
      );
    }

    console.error("Could not record review:", error);
    return NextResponse.json(
      { error: "Could not save review" },
      { status: 500 }
    );
  }
}
