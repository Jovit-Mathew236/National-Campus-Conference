"use client";
import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Heart,
  Check,
  Star,
  MessageCircle,
  Church,
  BookOpen,
  Cross,
  Sparkles,
  Plus,
  Clock,
  Users,
  Loader2,
  Send,
  RefreshCw,
  LogOut, // Added for logout button
} from "lucide-react";
import confetti from "canvas-confetti";

// --- INTERFACES ---

// For Daily Spiritual Checklist
type ChecklistItemKey =
  | "mass_attended"
  | "rosary_prayed"
  | "word_of_god_read"
  | "our_father_done";

const initialChecklistState: Record<ChecklistItemKey, boolean> = {
  mass_attended: false,
  rosary_prayed: false,
  word_of_god_read: false,
  our_father_done: false,
};

interface DailyActivityData {
  // Renamed from DailyPrayerData for clarity
  campus_prayer_done: boolean;
  mass_attended: boolean;
  rosary_prayed: boolean;
  word_of_god_read: boolean;
  our_father_done: boolean;
  date: string; // Assuming API returns date
}

// For Prayer Wall (from new code)
interface PrayerRequest {
  id: string;
  user: string; // Name of the user or "Anonymous"
  message: string;
  isAnonymous: boolean;
  prayerCount: number;
  userPrayed: boolean; // Has the current logged-in user prayed for this?
  createdAt: string; // Should be a parsable date string or pre-formatted
  userId: string; // ID of the user who submitted
  avatar?: string; // Optional avatar URL
}

interface PrayerWallStats {
  totalRequests: number;
  totalPrayers: number;
  userRequests: number; // Logged-in user's requests
  userPrayers: number; // Logged-in user's prayers offered
}

interface DailyCampusPrayerCount {
  count: number;
  date: string;
}

// --- COMPONENT ---

export default function ComprehensivePrayerDashboard() {
  // --- STATE ---

  // Daily Prayer & Checklist States (from old code)
  const [dailyCampusPrayerDone, setDailyCampusPrayerDone] = useState(false);
  const [spiritualChecklist, setSpiritualChecklist] = useState(
    initialChecklistState
  );
  const [pageLoading, setPageLoading] = useState(true); // For initial load of daily activities
  const [dailyPrayerSaving, setDailyPrayerSaving] = useState(false);
  const [checklistSaving, setChecklistSaving] = useState(false);

  const [dailyCampusPrayerCount, setDailyCampusPrayerCount] = useState(0);
  const [countLoading, setCountLoading] = useState(true);

  // Prayer Wall States (from new code)
  const [prayerRequests, setPrayerRequests] = useState<PrayerRequest[]>([]);
  const [prayerWallStats, setPrayerWallStats] = useState<PrayerWallStats>({
    totalRequests: 0,
    totalPrayers: 0,
    userRequests: 0,
    userPrayers: 0,
  });
  const [prayerWallLoading, setPrayerWallLoading] = useState(true); // Initial load for prayer wall
  const [prayerWallRefreshing, setPrayerWallRefreshing] = useState(false);
  const [prayerRequestSubmitting, setPrayerRequestSubmitting] = useState(false);
  const [newPrayerRequestDialogOpen, setNewPrayerRequestDialogOpen] =
    useState(false);
  const [newPrayerMessage, setNewPrayerMessage] = useState("");
  const [newPrayerIsAnonymous, setNewPrayerIsAnonymous] = useState(false);
  const [prayerWallHasMore, setPrayerWallHasMore] = useState(true);
  const [prayerWallLoadingMore, setPrayerWallLoadingMore] = useState(false);

  // --- EFFECTS ---

  // Initial data loading for daily activities and prayer wall
  useEffect(() => {
    const loadInitialData = async () => {
      setPageLoading(true); // For daily activities part
      setPrayerWallLoading(true); // For prayer wall part

      await Promise.all([
        loadDailyActivityData(),
        loadDailyCampusPrayerCount(), // Add this
        loadPrayerRequestsFromApi(0, false),
        loadPrayerWallStatsFromApi(),
      ]);

      setPageLoading(false);
      setPrayerWallLoading(false);
      setCountLoading(false);
    };
    loadInitialData();
  }, []);

  // --- DAILY ACTIVITY & CHECKLIST FUNCTIONS (adapted from old code) ---

  const loadDailyActivityData = async () => {
    try {
      const response = await fetch("/api/prayers/daily", {
        method: "GET",
        credentials: "include",
      });
      if (response.ok) {
        const result = await response.json();
        const data: DailyActivityData = result.data;
        setDailyCampusPrayerDone(data.campus_prayer_done);
        setSpiritualChecklist({
          mass_attended: data.mass_attended,
          rosary_prayed: data.rosary_prayed,
          word_of_god_read: data.word_of_god_read,
          our_father_done: data.our_father_done,
        });
      } else {
        console.error("Failed to load daily activity data");
      }
    } catch (error) {
      console.error("Error loading daily activity data:", error);
    }
  };

  // NEW: Load daily campus prayer count
  const loadDailyCampusPrayerCount = async () => {
    try {
      const response = await fetch("/api/prayers/daily/count", {
        method: "GET",
        credentials: "include",
      });
      if (response.ok) {
        const result = await response.json();
        const data: DailyCampusPrayerCount = result.data;
        setDailyCampusPrayerCount(data.count);
      } else {
        console.error("Failed to load daily campus prayer count");
      }
    } catch (error) {
      console.error("Error loading daily campus prayer count:", error);
    }
  };
  const updateDailyActivityApi = async (
    updates: Partial<DailyActivityData>
  ) => {
    // Determine which saving state to set
    if (updates.hasOwnProperty("campus_prayer_done")) {
      setDailyPrayerSaving(true);
    } else {
      setChecklistSaving(true);
    }

    try {
      const response = await fetch("/api/prayers/daily", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(updates),
      });
      if (!response.ok) throw new Error("Failed to update daily activity data");
      return (await response.json()).success;
    } catch (error) {
      console.error("Error updating daily activity data:", error);
      alert("Failed to save your progress. Please try again."); // User feedback
      return false;
    } finally {
      setDailyPrayerSaving(false);
      setChecklistSaving(false);
    }
  };

  const handleAmenClick = async () => {
    const success = await updateDailyActivityApi({ campus_prayer_done: true });
    if (success) {
      setDailyCampusPrayerDone(true);
      // Confetti effect (from old code)
      const duration = 3 * 1000;
      const animationEnd = Date.now() + duration;
      const defaults = {
        startVelocity: 30,
        spread: 360,
        ticks: 60,
        zIndex: 100,
      };
      const randomInRange = (min: number, max: number) =>
        Math.random() * (max - min) + min;
      const interval = window.setInterval(() => {
        const timeLeft = animationEnd - Date.now();
        if (timeLeft <= 0) return clearInterval(interval);
        const particleCount = 50 * (timeLeft / duration);
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
        });
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
        });
      }, 250);
    }
  };

  const toggleChecklistItem = async (itemKey: ChecklistItemKey) => {
    if (checklistSaving) return; // Prevent multiple clicks while saving

    const newValue = !spiritualChecklist[itemKey];
    // Optimistic UI update
    setSpiritualChecklist((prev) => ({ ...prev, [itemKey]: newValue }));

    const success = await updateDailyActivityApi({ [itemKey]: newValue });
    if (!success) {
      // Revert on failure
      setSpiritualChecklist((prev) => ({ ...prev, [itemKey]: !newValue }));
    }
  };

  // --- PRAYER WALL FUNCTIONS (adapted from new code) ---

  const loadPrayerRequestsFromApi = useCallback(
    async (offset = 0, append = false) => {
      if (offset === 0 && !append) setPrayerWallLoading(true);
      else setPrayerWallLoadingMore(true);

      try {
        const response = await fetch(
          `/api/prayers/requests?limit=10&offset=${offset}`,
          {
            // limit 10 for smaller column
            method: "GET",
            credentials: "include",
          }
        );
        if (response.ok) {
          const result = await response.json();
          setPrayerRequests((prev) =>
            append ? [...prev, ...result.data] : result.data
          );
          setPrayerWallHasMore(result.pagination.hasMore);
        } else {
          console.error("Failed to load prayer requests");
        }
      } catch (error) {
        console.error("Error loading prayer requests:", error);
      } finally {
        if (offset === 0 && !append) setPrayerWallLoading(false);
        setPrayerWallLoadingMore(false);
      }
    },
    []
  ); // Add dependencies if they change, e.g. current user ID for filtering

  const loadPrayerWallStatsFromApi = async () => {
    try {
      const response = await fetch("/api/prayers/requests/stats", {
        method: "GET",
        credentials: "include",
      });
      if (response.ok) {
        setPrayerWallStats((await response.json()).data);
      } else {
        console.error("Failed to load prayer wall stats");
      }
    } catch (error) {
      console.error("Error loading prayer wall stats:", error);
    }
  };

  const handlePrayerWallRefresh = async () => {
    setPrayerWallRefreshing(true);
    await Promise.all([
      loadPrayerRequestsFromApi(0, false),
      loadPrayerWallStatsFromApi(),
    ]);
    setPrayerWallRefreshing(false);
  };

  const handlePrayerWallLoadMore = () => {
    if (!prayerWallLoadingMore && prayerWallHasMore) {
      loadPrayerRequestsFromApi(prayerRequests.length, true);
    }
  };

  const handlePrayerReactionApi = async (requestId: string) => {
    // Find the request to know its current userPrayed state for optimistic update
    const currentRequest = prayerRequests.find((r) => r.id === requestId);
    if (!currentRequest) return;

    // Optimistic update for UI responsiveness
    const originalRequests = [...prayerRequests];
    setPrayerRequests((prev) =>
      prev.map((req) =>
        req.id === requestId
          ? {
              ...req,
              userPrayed: !req.userPrayed,
              prayerCount: req.userPrayed
                ? req.prayerCount - 1
                : req.prayerCount + 1,
            }
          : req
      )
    );

    try {
      const response = await fetch(`/api/prayers/requests/${requestId}/react`, {
        method: "POST",
        credentials: "include",
      });
      if (response.ok) {
        const result = await response.json();
        // Update with server confirmed data (might be slightly different if multiple users reacted)
        setPrayerRequests((prev) =>
          prev.map((req) =>
            req.id === requestId
              ? {
                  ...req,
                  userPrayed: result.data.userPrayed,
                  prayerCount: result.data.prayerCount,
                }
              : req
          )
        );
        loadPrayerWallStatsFromApi(); // Refresh stats
      } else {
        console.error("Failed to toggle prayer reaction, reverting.");
        setPrayerRequests(originalRequests); // Revert optimistic update
        alert("Failed to record your prayer. Please try again.");
      }
    } catch (error) {
      console.error("Error toggling prayer reaction, reverting:", error);
      setPrayerRequests(originalRequests); // Revert optimistic update
      alert("An error occurred while recording your prayer. Please try again.");
    }
  };

  const handleSubmitPrayerRequestApi = async () => {
    if (!newPrayerMessage.trim()) return;
    setPrayerRequestSubmitting(true);
    try {
      const response = await fetch("/api/prayers/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          message: newPrayerMessage.trim(),
          isAnonymous: newPrayerIsAnonymous,
        }),
      });
      if (response.ok) {
        const newRequest = (await response.json()).data;
        setPrayerRequests((prev) => [newRequest, ...prev]);
        loadPrayerWallStatsFromApi();
        setNewPrayerMessage("");
        setNewPrayerIsAnonymous(false);
        setNewPrayerRequestDialogOpen(false);
      } else {
        const errorData = await response.json();
        alert(
          errorData.error ||
            "Failed to submit prayer request. Please try again."
        );
      }
    } catch (error) {
      console.error("Error submitting prayer request:", error);
      alert("An unexpected error occurred. Failed to submit prayer request.");
    } finally {
      setPrayerRequestSubmitting(false);
    }
  };

  // --- DERIVED STATE & UI HELPERS ---
  const checklistCompletedCount =
    Object.values(spiritualChecklist).filter(Boolean).length;
  const checklistTotalCount = Object.keys(spiritualChecklist).length;
  const checklistProgressPercentage =
    checklistTotalCount > 0
      ? (checklistCompletedCount / checklistTotalCount) * 100
      : 0;

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
      window.location.href = "/login"; // Or your desired redirect path
    } catch (e) {
      alert("Logout failed. Please try again.");
      console.error("Logout error:", e);
    }
  };

  // --- RENDER ---

  if (pageLoading && prayerWallLoading) {
    // Combined initial loading state
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          <span className="text-xl text-indigo-600">
            Loading your prayer journey...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {(dailyPrayerSaving || checklistSaving) && ( // Combined saving indicator from old code
        <div className="fixed top-4 right-4 z-50">
          <div className="bg-white border border-indigo-200 rounded-lg shadow-lg px-4 py-2 flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
            <span className="text-sm text-indigo-600">Saving progress...</span>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {" "}
        {/* Max width increased slightly */}
        {/* Top Bar with Logout Button (from old code) */}
        <div className="flex justify-between items-center mb-6">
          <div />{" "}
          {/* Empty div for spacing if needed, or put a logo/title here */}
          <Button
            variant="outline"
            className="flex items-center gap-2 border-indigo-500 text-indigo-700 hover:bg-indigo-50 hover:text-indigo-900 font-semibold shadow-sm px-5 py-2 rounded-full transition-all duration-200"
            onClick={handleLogout}
          >
            <LogOut className="w-5 h-5" />
            Logout
          </Button>
        </div>
        {/* Header Section (from old code) */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 bg-clip-text text-transparent mb-4">
            Daily Prayer Journey
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground">
            Connect with God and your community through prayer
          </p>
        </div>
        <div className="grid lg:grid-cols-3 gap-8">
          {/* --- LEFT COLUMN: Daily Prayer & Checklist (from old code) --- */}
          <div className="lg:col-span-2 space-y-8">
            {/* Daily Campus Prayer Card */}
            <Card className="relative overflow-hidden border-0 shadow-xl">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 via-purple-500 to-blue-600" />
              <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%2523ffffff%22%20fill-opacity%3D%220.1%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-30" />
              <CardContent className="relative p-8 text-center text-white">
                {pageLoading ? (
                  <div className="flex justify-center items-center h-40">
                    {" "}
                    <Loader2 className="w-8 h-8 animate-spin text-white" />{" "}
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="flex justify-center">
                      <div className="p-4 bg-white/20 rounded-full backdrop-blur-sm">
                        <Sparkles className="w-8 h-8 text-yellow-200" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <h2 className="text-3xl font-bold">Campus Prayer</h2>
                      <p className="text-lg leading-relaxed">
                        Lord, Bless NCC and all the campuses in India Oh Lord,
                        Let the Campuses be filled with the Love of the Father,
                        Grace of Christ and the Anointing of the Holy Spirit.
                        Holy Mary, intercede for us.
                      </p>
                      <p className="text-lg text-white/90">
                        Have you connected with God today?
                      </p>
                      {/* Updated count display with better UI */}
                      <div className="flex items-center justify-center gap-2 mt-4">
                        <Users className="w-5 h-5 text-yellow-200" />
                        {countLoading ? (
                          <div className="flex items-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span className="text-white/90">
                              Loading count...
                            </span>
                          </div>
                        ) : (
                          <span className="text-lg font-semibold text-yellow-200">
                            {dailyCampusPrayerCount}{" "}
                            {dailyCampusPrayerCount === 1
                              ? "person has"
                              : "people have"}{" "}
                            prayed today
                          </span>
                        )}
                      </div>
                    </div>
                    {!dailyCampusPrayerDone ? (
                      <Button
                        onClick={handleAmenClick}
                        disabled={dailyPrayerSaving}
                        size="lg"
                        className="bg-white text-indigo-600 hover:bg-white/90 text-xl px-12 py-6 h-auto rounded-full font-bold shadow-lg transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:transform-none"
                      >
                        {dailyPrayerSaving ? (
                          <>
                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          "🙏 AMEN"
                        )}
                      </Button>
                    ) : (
                      <div className="space-y-4">
                        <div className="flex items-center justify-center space-x-3">
                          <div className="p-2 bg-emerald-500 rounded-full">
                            <Check className="w-6 h-6 text-white" />
                          </div>
                          <span className="text-2xl font-bold">
                            Prayer Completed!
                          </span>
                        </div>
                        <Badge
                          variant="secondary"
                          className="bg-white/20 text-white border-white/30"
                        >
                          ✨ Well done, keep up the blessed work! ✨
                        </Badge>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Daily Spiritual Checklist Card */}
            <Card className="shadow-lg">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl md:text-2xl font-bold flex items-center gap-2">
                    <Check className="w-6 h-6 text-emerald-600" />
                    Daily Spiritual Practice
                  </CardTitle>
                  <Badge variant="outline" className="text-sm">
                    {checklistCompletedCount}/{checklistTotalCount} Complete
                  </Badge>
                </div>
                {pageLoading ? (
                  <div className="flex justify-center items-center h-10 mt-2">
                    {" "}
                    <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />{" "}
                  </div>
                ) : (
                  <div className="space-y-2 mt-2">
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>Progress</span>
                      <span>{Math.round(checklistProgressPercentage)}%</span>
                    </div>
                    <Progress
                      value={checklistProgressPercentage}
                      className="h-2"
                    />
                  </div>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                {pageLoading ? (
                  <div className="flex justify-center items-center py-10">
                    {" "}
                    <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />{" "}
                  </div>
                ) : (
                  [
                    {
                      key: "mass_attended",
                      icon: Church,
                      label: "Holy Mass",
                      description: "Attend or watch Mass",
                    },
                    {
                      key: "rosary_prayed",
                      icon: Star,
                      label: "Rosary",
                      description: "Pray the Holy Rosary",
                    },
                    {
                      key: "word_of_god_read",
                      icon: BookOpen,
                      label: "Word of God",
                      description: "Read Scripture",
                    },
                    {
                      key: "our_father_done",
                      icon: Cross,
                      label: "Our Father",
                      description: "Pray the Lord's Prayer",
                    },
                  ].map(({ key, icon: Icon, label, description }) => (
                    <div key={key}>
                      <div
                        className={`group p-4 rounded-lg border-2 cursor-pointer transition-all duration-300 hover:shadow-md ${
                          spiritualChecklist[key as ChecklistItemKey]
                            ? "border-emerald-200 bg-emerald-50 shadow-sm"
                            : "border-border hover:border-indigo-200 hover:bg-accent/50"
                        } ${
                          checklistSaving || dailyPrayerSaving
                            ? "opacity-50 pointer-events-none"
                            : ""
                        }`}
                        onClick={() =>
                          !(checklistSaving || dailyPrayerSaving) &&
                          toggleChecklistItem(key as ChecklistItemKey)
                        }
                        role="checkbox"
                        aria-checked={
                          spiritualChecklist[key as ChecklistItemKey]
                        }
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ")
                            toggleChecklistItem(key as ChecklistItemKey);
                        }}
                      >
                        <div className="flex items-center space-x-4">
                          <div
                            className={`p-2 rounded-full transition-colors ${
                              spiritualChecklist[key as ChecklistItemKey]
                                ? "bg-emerald-100 text-emerald-600"
                                : "bg-muted text-muted-foreground group-hover:bg-indigo-100 group-hover:text-indigo-600"
                            }`}
                          >
                            <Icon className="w-5 h-5" />
                          </div>
                          <div className="flex-1">
                            <div className="font-semibold">{label}</div>
                            <div className="text-sm text-muted-foreground">
                              {description}
                            </div>
                          </div>
                          <div className="flex-shrink-0">
                            {spiritualChecklist[key as ChecklistItemKey] ? (
                              <div className="p-1 bg-emerald-500 rounded-full">
                                <Check className="w-4 h-4 text-white" />
                              </div>
                            ) : (
                              <div className="w-6 h-6 border-2 border-muted-foreground/30 rounded-full group-hover:border-indigo-400" />
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          {/* --- RIGHT COLUMN: Prayer Wall (from new code, integrated) --- */}
          <div className="space-y-6 lg:col-span-1">
            {" "}
            {/* Adjusted to lg:col-span-1 */}
            <Card className="shadow-lg">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <MessageCircle className="w-5 h-5 text-indigo-600" />
                    Prayer Wall
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handlePrayerWallRefresh}
                    disabled={
                      prayerWallRefreshing ||
                      prayerWallLoadingMore ||
                      prayerWallLoading
                    }
                    aria-label="Refresh prayer requests"
                  >
                    <RefreshCw
                      className={`w-4 h-4 ${
                        prayerWallRefreshing ? "animate-spin" : ""
                      }`}
                    />
                  </Button>
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground pt-2">
                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    {prayerWallStats.totalRequests} requests
                  </div>
                  <div className="flex items-center gap-1">
                    <Heart className="w-4 h-4" />
                    {prayerWallStats.totalPrayers} prayers
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4 max-h-[600px] overflow-y-auto">
                {" "}
                {/* Added max-height and scroll */}
                {prayerWallLoading ? (
                  <div className="flex items-center justify-center p-8 min-h-[200px]">
                    <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
                  </div>
                ) : prayerRequests.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <MessageCircle className="w-10 h-10 mx-auto mb-3 opacity-50" />
                    <p className="text-sm">
                      No prayer requests yet. Be the first to share!
                    </p>
                  </div>
                ) : (
                  <>
                    {prayerRequests.map((request, index) => (
                      <div key={request.id}>
                        <div className="space-y-3">
                          <div className="flex items-start space-x-3">
                            <Avatar className="w-10 h-10 border-2 border-white shadow-sm">
                              {request.avatar && !request.isAnonymous ? (
                                <AvatarImage
                                  src={request.avatar}
                                  alt={request.user}
                                />
                              ) : null}
                              <AvatarFallback className="bg-gradient-to-br from-slate-400 to-slate-500 text-white">
                                {request.isAnonymous
                                  ? "🙏"
                                  : request.user.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 space-y-2">
                              <div className="flex items-center gap-2 text-sm">
                                <span className="font-semibold">
                                  {request.isAnonymous
                                    ? "Anonymous"
                                    : request.user}
                                </span>
                                <Badge variant="secondary" className="text-xs">
                                  <Clock className="w-3 h-3 mr-1" />
                                  {request.createdAt}
                                </Badge>
                              </div>
                              <p className="text-sm leading-relaxed text-foreground/90 whitespace-pre-wrap">
                                {request.message}
                              </p>
                              <div className="flex items-center justify-between pt-2">
                                <Button
                                  variant={
                                    request.userPrayed ? "default" : "outline"
                                  }
                                  size="sm"
                                  onClick={() =>
                                    handlePrayerReactionApi(request.id)
                                  }
                                  className={`text-xs transition-colors duration-150 ${
                                    request.userPrayed
                                      ? "bg-red-500 hover:bg-red-600 text-white border-red-500"
                                      : "border-gray-300 text-gray-700 hover:bg-red-50 hover:text-red-600 hover:border-red-300"
                                  }`}
                                >
                                  <Heart
                                    className={`w-3 h-3 mr-1 ${
                                      request.userPrayed ? "fill-current" : ""
                                    }`}
                                  />
                                  {request.userPrayed ? "Prayed" : "I Prayed"}
                                </Button>
                                <Badge variant="secondary" className="text-xs">
                                  <Heart className="w-3 h-3 mr-1 text-red-400" />
                                  {request.prayerCount}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </div>
                        {index < prayerRequests.length - 1 && (
                          <Separator className="my-4" />
                        )}
                      </div>
                    ))}
                    {prayerWallHasMore && (
                      <Button
                        variant="outline"
                        className="w-full mt-4"
                        onClick={handlePrayerWallLoadMore}
                        disabled={prayerWallLoadingMore || prayerWallRefreshing}
                      >
                        {prayerWallLoadingMore ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Loading more...
                          </>
                        ) : (
                          "Load More Requests"
                        )}
                      </Button>
                    )}
                  </>
                )}
                <Dialog
                  open={newPrayerRequestDialogOpen}
                  onOpenChange={setNewPrayerRequestDialogOpen}
                >
                  <DialogTrigger asChild>
                    <Button
                      className="w-full mt-6 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white"
                      size="lg" // Kept size="lg" from old code for prominence
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Share Prayer Request
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <MessageCircle className="w-5 h-5 text-indigo-600" />
                        Share Your Prayer Request
                      </DialogTitle>
                      <DialogDescription>
                        Your request will be shared with the community. Please
                        be mindful and respectful.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="newPrayerMessage">
                          Your Prayer Request
                        </Label>
                        <Textarea
                          id="newPrayerMessage"
                          placeholder="Please pray for..."
                          value={newPrayerMessage}
                          onChange={(e) => setNewPrayerMessage(e.target.value)}
                          maxLength={500}
                          rows={4}
                          className="resize-none focus-visible:ring-indigo-500"
                        />
                        <div className="flex justify-end text-xs text-muted-foreground">
                          <span>{newPrayerMessage.length}/500 characters</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 pt-2">
                        <Switch
                          id="newPrayerIsAnonymous"
                          checked={newPrayerIsAnonymous}
                          onCheckedChange={setNewPrayerIsAnonymous}
                          aria-label="Post anonymously"
                        />
                        <Label
                          htmlFor="newPrayerIsAnonymous"
                          className="text-sm cursor-pointer"
                        >
                          Post anonymously
                        </Label>
                      </div>
                    </div>
                    <DialogFooter className="gap-2 sm:gap-0">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setNewPrayerRequestDialogOpen(false)}
                        disabled={prayerRequestSubmitting}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        onClick={handleSubmitPrayerRequestApi}
                        disabled={
                          prayerRequestSubmitting ||
                          !newPrayerMessage.trim() ||
                          newPrayerMessage.length > 500
                        }
                        className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white"
                      >
                        {prayerRequestSubmitting ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Sharing...
                          </>
                        ) : (
                          <>
                            <Send className="w-4 h-4 mr-2" />
                            Share Request
                          </>
                        )}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
