import gplay from "google-play-scraper";
import appStore, { Review as AppStoreReview } from "app-store-scraper";
import { categorizeReview, sentimentFromRating } from "./reviewCategorizer";
import { prisma } from "./prisma";

type StoreSource = "play_store" | "app_store";

interface BaseReviewInput {
  source: StoreSource;
  reviewId: string;
  author?: string | null;
  rating: number;
  title?: string | null;
  content: string;
  appVersion?: string | null;
  reviewDate: Date;
}

function mapToPrismaData(input: BaseReviewInput) {
  const category = categorizeReview(`${input.title ?? ""} ${input.content}`);
  const sentiment = sentimentFromRating(input.rating);

  return {
    source: input.source,
    reviewId: input.reviewId,
    author: input.author ?? undefined,
    rating: input.rating,
    title: input.title ?? undefined,
    content: input.content,
    category,
    sentiment,
    appVersion: input.appVersion ?? undefined,
    reviewDate: input.reviewDate,
  };
}

export async function fetchAndStorePlayStoreReviews() {
  // From Play Store URL:
  // https://play.google.com/store/apps/details?id=com.amberstudent&hl=en_IN
  const appId = process.env.PLAY_STORE_APP_ID || "com.amberstudent";

  // #region agent log
  fetch("http://127.0.0.1:7926/ingest/8c200ea0-aabb-4cb1-b929-53d2dfd3c250", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Debug-Session-Id": "af86e9",
    },
    body: JSON.stringify({
      sessionId: "af86e9",
      runId: "playstore",
      hypothesisId: "H1",
      location: "lib/scrapers.ts:41",
      message: "fetchAndStorePlayStoreReviews start",
      data: { appId },
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion

  const result = await gplay.reviews({
    appId,
    lang: "en",
    country: "in",
    sort: gplay.sort.NEWEST,
    num: 100,
    paginate: false,
  });

  // #region agent log
  fetch("http://127.0.0.1:7926/ingest/8c200ea0-aabb-4cb1-b929-53d2dfd3c250", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Debug-Session-Id": "af86e9",
    },
    body: JSON.stringify({
      sessionId: "af86e9",
      runId: "playstore",
      hypothesisId: "H2",
      location: "lib/scrapers.ts:54",
      message: "google-play-scraper returned reviews",
      data: { count: result.data.length },
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion

  let created = 0;
  for (const r of result.data) {
    const rating = r.score;
    const rawDate = r.date instanceof Date ? r.date : new Date(r.date);
    if (!rating || Number.isNaN(rating)) {
      // Skip reviews without a valid rating
      continue;
    }
    if (Number.isNaN(rawDate.getTime())) {
      // Skip reviews with invalid dates
      continue;
    }

    const data = mapToPrismaData({
      source: "play_store",
      reviewId: String(r.id),
      author: (r.userName as string) ?? null,
      rating,
      title: (r.title as string) ?? null,
      content: r.text,
      appVersion: (r.version as string) ?? null,
      reviewDate: rawDate,
    });

    try {
      await prisma.review.upsert({
        where: { reviewId: data.reviewId },
        create: data,
        update: data,
      });
    } catch (error) {
      // #region agent log
      fetch(
        "http://127.0.0.1:7926/ingest/8c200ea0-aabb-4cb1-b929-53d2dfd3c250",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Debug-Session-Id": "af86e9",
          },
          body: JSON.stringify({
            sessionId: "af86e9",
            runId: "playstore",
            hypothesisId: "H3",
            location: "lib/scrapers.ts:76",
            message: "Prisma upsert failed for Play Store review",
            data: {
              reviewId: data.reviewId,
              error:
                error instanceof Error ? error.message : String(error ?? ""),
            },
            timestamp: Date.now(),
          }),
        }
      ).catch(() => {});
      // #endregion
      throw error;
    }
    created += 1;
  }

  return { created };
}

export async function fetchAndStoreAppStoreReviews() {
  // From App Store URL:
  // https://apps.apple.com/us/app/amber-student-housing-apt/id6447250749
  // app-store-scraper expects the numeric id
  const appId = process.env.APP_STORE_APP_ID || "6447250749";

  // #region agent log
  fetch("http://127.0.0.1:7926/ingest/8c200ea0-aabb-4cb1-b929-53d2dfd3c250", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Debug-Session-Id": "af86e9",
    },
    body: JSON.stringify({
      sessionId: "af86e9",
      runId: "appstore",
      hypothesisId: "H1",
      location: "lib/scrapers.ts:96",
      message: "fetchAndStoreAppStoreReviews start",
      data: { appId },
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion

  const result: AppStoreReview[] = await appStore.reviews({
    id: appId,
    sort: appStore.sort.RECENT,
    page: 1,
    num: 100,
  });

  let created = 0;
  for (const r of result) {
    // app-store-scraper returns `score` and `updated` in practice
    const rating = (r as any).score ?? (r as any).rating;
    const dateValue = (r as any).updated ?? (r as any).date;
    const rawDate =
      dateValue instanceof Date ? dateValue : new Date(dateValue as any);

    if (!rating || Number.isNaN(rating)) {
      // Skip reviews without a valid rating
      continue;
    }
    if (Number.isNaN(rawDate.getTime())) {
      // Skip reviews with invalid dates
      continue;
    }

    const data = mapToPrismaData({
      source: "app_store",
      reviewId: String(r.id),
      author: (r.userName as string) ?? null,
      rating,
      title: (r.title as string) ?? null,
      content: r.text,
      appVersion: (r.version as string) ?? null,
      reviewDate: rawDate,
    });

    try {
      await prisma.review.upsert({
        where: { reviewId: data.reviewId },
        create: data,
        update: data,
      });
    } catch (error) {
      // #region agent log
      fetch(
        "http://127.0.0.1:7926/ingest/8c200ea0-aabb-4cb1-b929-53d2dfd3c250",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Debug-Session-Id": "af86e9",
          },
          body: JSON.stringify({
            sessionId: "af86e9",
            runId: "appstore",
            hypothesisId: "H3",
            location: "lib/scrapers.ts:122",
            message: "Prisma upsert failed for App Store review",
            data: {
              reviewId: data.reviewId,
              error:
                error instanceof Error ? error.message : String(error ?? ""),
            },
            timestamp: Date.now(),
          }),
        }
      ).catch(() => {});
      // #endregion
      throw error;
    }
    created += 1;
  }

  return { created };
}

