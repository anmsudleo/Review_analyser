"use client";

import { useEffect, useMemo, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  CartesianGrid,
} from "recharts";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";

type Review = {
  id: string;
  source: "play_store" | "app_store";
  reviewId: string;
  author?: string | null;
  rating: number;
  title?: string | null;
  content: string;
  category?: string | null;
  sentiment?: string | null;
  appVersion?: string | null;
  reviewDate: string;
};

type StatsResponse = {
  total: number;
  avgRating: number;
  byCategory: { category: string | null; _count: { _all: number } }[];
  bySentiment: { sentiment: string | null; _count: { _all: number } }[];
  byRating: { rating: number; _count: { _all: number } }[];
  byDate: { reviewDate: string; _count: { _all: number } }[];
  mostCommonCategory: string | null;
};

const CATEGORY_OPTIONS = [
  "booking_issues",
  "payment_problems",
  "app_crashes",
  "ui_ux_issues",
  "login_auth",
  "search_filters",
  "communication",
  "property_info",
  "general_positive",
  "other",
];

const CATEGORY_LABELS: Record<string, string> = {
  booking_issues: "Booking issues",
  payment_problems: "Payment problems",
  app_crashes: "App crashes",
  ui_ux_issues: "UI/UX issues",
  login_auth: "Login & auth",
  search_filters: "Search & filters",
  communication: "Communication",
  property_info: "Property info",
  general_positive: "General positive",
  other: "Other",
};

const CATEGORY_COLORS: Record<string, string> = {
  booking_issues: "#F97316",
  payment_problems: "#EF4444",
  app_crashes: "#DC2626",
  ui_ux_issues: "#0EA5E9",
  login_auth: "#6366F1",
  search_filters: "#22C55E",
  communication: "#14B8A6",
  property_info: "#A855F7",
  general_positive: "#FACC15",
  other: "#9CA3AF",
};

function formatDate(date: string | Date) {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function StarRating({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-0.5 text-amber-400">
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i}>{i < value ? "★" : "☆"}</span>
      ))}
    </div>
  );
}

export default function DashboardPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [loadingStats, setLoadingStats] = useState(false);
  const [fetchingPlay, setFetchingPlay] = useState(false);
  const [fetchingApp, setFetchingApp] = useState(false);

  const [sourceFilter, setSourceFilter] = useState<"all" | "play_store" | "app_store">("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [ratingFilter, setRatingFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");

  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [editingCategory, setEditingCategory] = useState<string>("other");
  const [updatingCategory, setUpdatingCategory] = useState(false);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(total / pageSize)),
    [total, pageSize]
  );

  async function loadReviews() {
    setLoadingReviews(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("pageSize", String(pageSize));
      if (sourceFilter !== "all") params.set("source", sourceFilter);
      if (categoryFilter !== "all") params.set("category", categoryFilter);
      if (ratingFilter !== "all") params.set("rating", ratingFilter);
      if (dateFrom) params.set("dateFrom", dateFrom);
      if (dateTo) params.set("dateTo", dateTo);

      const res = await fetch(`/api/reviews?${params.toString()}`);
      if (!res.ok) {
        console.error("Failed to load reviews", await res.text());
        return;
      }
      const data = await res.json();
      setReviews(data.reviews ?? []);
      setTotal(data.total ?? 0);
    } finally {
      setLoadingReviews(false);
    }
  }

  async function loadStats() {
    setLoadingStats(true);
    try {
      const res = await fetch("/api/reviews/stats");
      if (!res.ok) {
        console.error("Failed to load stats", await res.text());
        return;
      }
      const data = (await res.json()) as StatsResponse;
      setStats(data);
    } finally {
      setLoadingStats(false);
    }
  }

  useEffect(() => {
    void loadReviews();
  }, [page, sourceFilter, categoryFilter, ratingFilter, dateFrom, dateTo]);

  useEffect(() => {
    void loadStats();
  }, []);

  async function triggerFetchPlayStore() {
    setFetchingPlay(true);
    try {
      await fetch("/api/reviews/fetch-playstore", { method: "POST" });
      await Promise.all([loadReviews(), loadStats()]);
    } finally {
      setFetchingPlay(false);
    }
  }

  async function triggerFetchAppStore() {
    setFetchingApp(true);
    try {
      await fetch("/api/reviews/fetch-appstore", { method: "POST" });
      await Promise.all([loadReviews(), loadStats()]);
    } finally {
      setFetchingApp(false);
    }
  }

  function openReviewDialog(review: Review) {
    setSelectedReview(review);
    setEditingCategory(review.category ?? "other");
  }

  async function saveCategory() {
    if (!selectedReview) return;
    setUpdatingCategory(true);
    try {
      await fetch(`/api/reviews/${selectedReview.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category: editingCategory }),
      });
      await Promise.all([loadReviews(), loadStats()]);
      setSelectedReview(null);
    } finally {
      setUpdatingCategory(false);
    }
  }

  const categoryPieData =
    stats?.byCategory
      .filter((c) => c.category)
      .map((c) => ({
        name: CATEGORY_LABELS[c.category as string] ?? c.category,
        value: c._count._all,
        key: c.category as string,
      })) ?? [];

  const ratingBarData =
    stats?.byRating
      .sort((a, b) => a.rating - b.rating)
      .map((r) => ({
        rating: r.rating,
        count: r._count._all,
      })) ?? [];

  const lineData =
    stats?.byDate
      .map((d) => ({
        date: formatDate(d.reviewDate),
        count: d._count._all,
      })) ?? [];

  const negativeCount =
    stats?.bySentiment.find((s) => s.sentiment === "negative")?._count._all ??
    0;

  return (
    <main className="min-h-screen bg-gradient-to-b from-background via-background to-secondary/10 px-4 py-8 md:px-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        {/* Header */}
        <header className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
              Insights · Experience · Quality
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-primary md:text-3xl">
              Amber App Feedback Tracker
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Collect, categorize, and act on reviews from Play Store and App
              Store.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              onClick={triggerFetchPlayStore}
              disabled={fetchingPlay}
            >
              {fetchingPlay ? "Fetching Play Store…" : "Fetch Play Store"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={triggerFetchAppStore}
              disabled={fetchingApp}
            >
              {fetchingApp ? "Fetching App Store…" : "Fetch App Store"}
            </Button>
          </div>
        </header>

        {/* Stats row */}
        <section className="grid gap-4 md:grid-cols-4">
          <Card className="border-border/60 bg-card/60 backdrop-blur">
            <CardHeader>
              <CardTitle>Total Reviews</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">
                {loadingStats ? "…" : total}
              </p>
            </CardContent>
          </Card>
          <Card className="border-border/60 bg-card/60 backdrop-blur">
            <CardHeader>
              <CardTitle>Average Rating</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center gap-2">
              <p className="text-2xl font-semibold">
                {loadingStats ? "…" : stats?.avgRating.toFixed(2) ?? "0.00"}
              </p>
              <StarRating value={Math.round(stats?.avgRating ?? 0)} />
            </CardContent>
          </Card>
          <Card className="border-border/60 bg-card/60 backdrop-blur">
            <CardHeader>
              <CardTitle>Negative Reviews</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold text-destructive">
                {loadingStats ? "…" : negativeCount}
              </p>
            </CardContent>
          </Card>
          <Card className="border-border/60 bg-card/60 backdrop-blur">
            <CardHeader>
              <CardTitle>Most Common Issue</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {loadingStats
                  ? "…"
                  : stats?.mostCommonCategory
                  ? CATEGORY_LABELS[stats.mostCommonCategory] ??
                    stats.mostCommonCategory
                  : "Not enough data yet"}
              </p>
            </CardContent>
          </Card>
        </section>

        {/* Filters */}
        <section className="rounded-2xl border border-border/60 bg-card/70 p-4 shadow-sm backdrop-blur">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-sm font-semibold">Filters</h2>
              <p className="text-xs text-muted-foreground">
                Slice your feedback by platform, category, rating, and date.
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSourceFilter("all");
                setCategoryFilter("all");
                setRatingFilter("all");
                setDateFrom("");
                setDateTo("");
                setPage(1);
              }}
            >
              Reset
            </Button>
          </div>
          <Separator className="my-3" />
          <div className="grid gap-3 md:grid-cols-5">
            <div className="flex flex-col gap-1 text-xs">
              <span className="text-muted-foreground">Source</span>
              <Select
                value={sourceFilter}
                onValueChange={(v) =>
                  setSourceFilter(v as "all" | "play_store" | "app_store")
                }
              >
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="All sources" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All sources</SelectItem>
                  <SelectItem value="play_store">Play Store</SelectItem>
                  <SelectItem value="app_store">App Store</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1 text-xs">
              <span className="text-muted-foreground">Category</span>
              <Select
                value={categoryFilter}
                onValueChange={(value) => setCategoryFilter(value)}
              >
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All categories</SelectItem>
                  {CATEGORY_OPTIONS.map((c) => (
                    <SelectItem key={c} value={c}>
                      {CATEGORY_LABELS[c]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1 text-xs">
              <span className="text-muted-foreground">Rating</span>
              <Select
                value={ratingFilter}
                onValueChange={(value) => setRatingFilter(value)}
              >
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="All ratings" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All ratings</SelectItem>
                  {[1, 2, 3, 4, 5].map((r) => (
                    <SelectItem key={r} value={String(r)}>
                      {r} stars
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1 text-xs">
              <span className="text-muted-foreground">From</span>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="h-9 text-xs"
              />
            </div>
            <div className="flex flex-col gap-1 text-xs">
              <span className="text-muted-foreground">To</span>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="h-9 text-xs"
              />
            </div>
          </div>
        </section>

        {/* Charts */}
        <section className="grid gap-4 md:grid-cols-2">
          <Card className="border-border/60 bg-card/70 shadow-sm backdrop-blur">
            <CardHeader>
              <CardTitle>Reviews by Category</CardTitle>
            </CardHeader>
            <CardContent className="h-64">
              {categoryPieData.length === 0 || loadingStats ? (
                <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                  {loadingStats
                    ? "Loading category insights…"
                    : "No data yet. Fetch reviews to see issue categories."}
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryPieData}
                      dataKey="value"
                      nameKey="name"
                      outerRadius={80}
                      label
                    >
                      {categoryPieData.map((entry) => (
                        <Cell
                          key={entry.key}
                          fill={CATEGORY_COLORS[entry.key] ?? "#64748B"}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
          <Card className="border-border/60 bg-card/70 shadow-sm backdrop-blur">
            <CardHeader>
              <CardTitle>Rating Distribution</CardTitle>
            </CardHeader>
            <CardContent className="h-64">
              {ratingBarData.length === 0 || loadingStats ? (
                <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                  {loadingStats
                    ? "Loading rating distribution…"
                    : "No ratings yet. Fetch reviews to analyze distribution."}
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={ratingBarData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                    <XAxis dataKey="rating" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#0ea5e9" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
          <Card className="border-border/60 bg-card/70 shadow-sm backdrop-blur md:col-span-2">
            <CardHeader>
              <CardTitle>Reviews over Time (all)</CardTitle>
            </CardHeader>
            <CardContent className="h-64">
              {lineData.length === 0 || loadingStats ? (
                <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                  {loadingStats
                    ? "Building timeline…"
                    : "No timeline yet. Fetch reviews to see trends over time."}
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={lineData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                    <XAxis dataKey="date" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="count"
                      stroke="#0ea5e9"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </section>

        {/* Reviews table */}
        <section className="space-y-3 rounded-2xl border border-border/60 bg-card/80 p-4 shadow-sm backdrop-blur">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold">
              Reviews ({total})
            </h2>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>
                Page {page} of {totalPages}
              </span>
              <Button
                size="sm"
                variant="outline"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Prev
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Next
              </Button>
            </div>
          </div>
          <ScrollArea className="h-[420px] w-full rounded-xl border border-border/60 bg-background/60">
            <div className="min-w-full overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="cursor-default bg-muted/40">
                    <TableHead className="whitespace-nowrap">Date</TableHead>
                    <TableHead className="whitespace-nowrap">Source</TableHead>
                    <TableHead className="whitespace-nowrap">Rating</TableHead>
                    <TableHead className="whitespace-nowrap">Author</TableHead>
                    <TableHead className="whitespace-nowrap">
                      Content
                    </TableHead>
                    <TableHead className="whitespace-nowrap">
                      Category
                    </TableHead>
                    <TableHead className="whitespace-nowrap">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingReviews ? (
                    <TableRow className="cursor-default">
                      <TableCell colSpan={7} className="py-6 text-center">
                        Loading reviews…
                      </TableCell>
                    </TableRow>
                  ) : reviews.length === 0 ? (
                    <TableRow className="cursor-default">
                      <TableCell colSpan={7} className="py-6 text-center">
                        No reviews yet. Fetch from the stores to get started.
                      </TableCell>
                    </TableRow>
                  ) : (
                    reviews.map((r) => (
                      <TableRow
                        key={r.id}
                        className="hover:bg-muted/60"
                        onClick={() => openReviewDialog(r)}
                      >
                        <TableCell>{formatDate(r.reviewDate)}</TableCell>
                        <TableCell className="capitalize">
                          {r.source === "play_store" ? "Play Store" : "App Store"}
                        </TableCell>
                        <TableCell>
                          <StarRating value={r.rating} />
                        </TableCell>
                        <TableCell>{r.author || "Anonymous"}</TableCell>
                        <TableCell className="max-w-xs truncate">
                          {r.title ? `${r.title} — ` : ""}
                          {r.content}
                        </TableCell>
                        <TableCell>
                          <Badge variant={r.category ? "default" : "outline"}>
                            {r.category
                              ? CATEGORY_LABELS[r.category] ?? r.category
                              : "Uncategorized"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              openReviewDialog(r);
                            }}
                          >
                            Edit
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </ScrollArea>
        </section>

        <Dialog
          open={!!selectedReview}
          onOpenChange={(open) => {
            if (!open) setSelectedReview(null);
          }}
        >
          <DialogContent>
            {selectedReview && (
              <>
                <DialogHeader>
                  <DialogTitle>Review details</DialogTitle>
                </DialogHeader>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                    <span>{formatDate(selectedReview.reviewDate)}</span>
                    <span className="capitalize">
                      {selectedReview.source === "play_store"
                        ? "Play Store"
                        : "App Store"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium">
                      {selectedReview.author || "Anonymous"}
                    </div>
                    <StarRating value={selectedReview.rating} />
                  </div>
                  {selectedReview.title && (
                    <div className="text-sm font-semibold">
                      {selectedReview.title}
                    </div>
                  )}
                  <p className="whitespace-pre-wrap">
                    {selectedReview.content}
                  </p>
                  <div className="flex flex-col gap-1 text-xs">
                    <span className="text-muted-foreground">Category</span>
                    <Select
                      value={editingCategory}
                      onValueChange={(value) => setEditingCategory(value)}
                    >
                      <SelectTrigger className="h-9 text-xs">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORY_OPTIONS.map((c) => (
                          <SelectItem key={c} value={c}>
                            {CATEGORY_LABELS[c]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter className="pt-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedReview(null)}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={saveCategory}
                    disabled={updatingCategory}
                  >
                    {updatingCategory ? "Saving…" : "Save"}
                  </Button>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </main>
  );
}
