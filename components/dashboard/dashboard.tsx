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
  LogOut,
  Menu,
  X,
  Home,
  MessageSquare,
  Calendar,
  Settings,
  TrendingUp,
  Award,
  ChevronRight,
  Flame,
  Target,
} from "lucide-react";
import confetti from "canvas-confetti";

// --- INTERFACES ---
type ChecklistItemKey =
  | "mass_attended"
  | "rosary_prayed"
  | "word_of_god_read"
  | "our_father_done"
  | "fasting"
  | "glory_be_to"
  | "memorare";

const initialChecklistState: Record<ChecklistItemKey, boolean> = {
  mass_attended: false,
  rosary_prayed: false,
  word_of_god_read: false,
  our_father_done: false,
  fasting: false,
  glory_be_to: false,
  memorare: false,
};

interface DailyActivityData {
  campus_prayer_done: boolean;
  mass_attended: boolean;
  rosary_prayed: boolean;
  word_of_god_read: boolean;
  our_father_done: boolean;
  fasting: boolean;
  glory_be_to: boolean;
  memorare: boolean;
  date: string;
}

interface PrayerRequest {
  id: string;
  user: string;
  message: string;
  isAnonymous: boolean;
  prayerCount: number;
  userPrayed: boolean;
  createdAt: string;
  userId: string;
  avatar?: string;
}

interface User {
  $id: string;
  name: string | null;
  email: string;
  emailVerification: boolean;
  registration: number;
}

interface PrayerWallStats {
  totalRequests: number;
  totalPrayers: number;
  userRequests: number;
  userPrayers: number;
}

interface DailyCampusPrayerCountData {
  count: number;
  date: string;
}

// --- COMPONENT ---
export default function MinimalPrayerDashboard() {
  // --- STATE ---
  const [user, setUser] = useState<User | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [dailyCampusPrayerDone, setDailyCampusPrayerDone] = useState(false);
  const [spiritualChecklist, setSpiritualChecklist] = useState(
    initialChecklistState
  );
  const [pageLoading, setPageLoading] = useState(true);
  const [dailyPrayerSaving, setDailyPrayerSaving] = useState(false);
  const [checklistSaving, setChecklistSaving] = useState(false);
  const [dailyCampusPrayerCount, setDailyCampusPrayerCount] = useState(0);
  const [countLoading, setCountLoading] = useState(true);
  const [prayerRequests, setPrayerRequests] = useState<PrayerRequest[]>([]);
  const [prayerWallStats, setPrayerWallStats] = useState<PrayerWallStats>({
    totalRequests: 0,
    totalPrayers: 0,
    userRequests: 0,
    userPrayers: 0,
  });
  const [prayerWallLoading, setPrayerWallLoading] = useState(true);
  const [prayerWallRefreshing, setPrayerWallRefreshing] = useState(false);
  const [prayerRequestSubmitting, setPrayerRequestSubmitting] = useState(false);
  const [newPrayerRequestDialogOpen, setNewPrayerRequestDialogOpen] =
    useState(false);
  const [newPrayerMessage, setNewPrayerMessage] = useState("");
  const [newPrayerIsAnonymous, setNewPrayerIsAnonymous] = useState(false);
  const [prayerWallHasMore, setPrayerWallHasMore] = useState(true);
  const [prayerWallLoadingMore, setPrayerWallLoadingMore] = useState(false);

  // --- API HELPER FUNCTIONS ---
  const loadDailyActivityData = useCallback(async () => {
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
          fasting: data.fasting,
          glory_be_to: data.glory_be_to,
          memorare: data.memorare,
        });
      } else {
        console.error("Failed to load daily activity data");
      }
    } catch (error) {
      console.error("Error loading daily activity data:", error);
    }
  }, []);

  const loadDailyCampusPrayerCount = useCallback(async () => {
    setCountLoading(true);
    try {
      const response = await fetch("/api/prayers/daily/count", {
        method: "GET",
        credentials: "include",
      });
      if (response.ok) {
        const data: DailyCampusPrayerCountData = (await response.json()).data;
        setDailyCampusPrayerCount(data.count);
      } else {
        console.error("Failed to load daily campus prayer count");
      }
    } catch (error) {
      console.error("Error loading daily campus prayer count:", error);
    } finally {
      setCountLoading(false);
    }
  }, []);

  const updateDailyActivityApi = useCallback(
    async (updates: Partial<DailyActivityData>) => {
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
        if (!response.ok) throw new Error("Failed to update daily activity");
        return (await response.json()).success;
      } catch (error) {
        console.error("Error updating daily activity:", error);
        alert("Failed to save progress. Try again.");
        return false;
      } finally {
        setDailyPrayerSaving(false);
        setChecklistSaving(false);
      }
    },
    []
  );

  const loadPrayerRequestsFromApi = useCallback(
    async (offset = 0, append = false) => {
      if (offset === 0 && !append) {
        if (!prayerWallRefreshing) setPrayerWallLoading(true);
      } else {
        setPrayerWallLoadingMore(true);
      }
      try {
        const response = await fetch(
          `/api/prayers/requests?limit=10&offset=${offset}`,
          { method: "GET", credentials: "include" }
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
    [prayerWallRefreshing]
  );

  const loadPrayerWallStatsFromApi = useCallback(async () => {
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
  }, []);

  // --- EFFECTS ---
  useEffect(() => {
    const loadInitialData = async () => {
      setPageLoading(true);
      setPrayerWallLoading(true);
      await Promise.all([
        loadDailyActivityData(),
        loadDailyCampusPrayerCount(),
        loadPrayerRequestsFromApi(0, false),
        loadPrayerWallStatsFromApi(),
      ]);
      setPageLoading(false);
      setPrayerWallLoading(false);
    };
    loadInitialData();
  }, [
    loadDailyActivityData,
    loadDailyCampusPrayerCount,
    loadPrayerRequestsFromApi,
    loadPrayerWallStatsFromApi,
  ]);

  // --- EVENT HANDLERS ---
  const handleAmenClick = useCallback(async () => {
    const success = await updateDailyActivityApi({ campus_prayer_done: true });
    if (success) {
      setDailyCampusPrayerDone(true);
      setDailyCampusPrayerCount((prev) => prev + 1);
      const duration = 3 * 1000;
      const animationEnd = Date.now() + duration;
      const defaults = {
        startVelocity: 30,
        spread: 360,
        ticks: 60,
        zIndex: 1000,
      };
      const randomInRange = (min: number, max: number) =>
        Math.random() * (max - min) + min;
      const intervalId = window.setInterval(() => {
        const timeLeft = animationEnd - Date.now();
        if (timeLeft <= 0) return window.clearInterval(intervalId);
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
  }, [updateDailyActivityApi]);

  const toggleChecklistItem = useCallback(
    async (itemKey: ChecklistItemKey) => {
      if (checklistSaving) return;
      const newValue = !spiritualChecklist[itemKey];
      setSpiritualChecklist((prev) => ({ ...prev, [itemKey]: newValue }));
      const success = await updateDailyActivityApi({ [itemKey]: newValue });
      if (!success) {
        setSpiritualChecklist((prev) => ({ ...prev, [itemKey]: !newValue }));
      }
    },
    [spiritualChecklist, checklistSaving, updateDailyActivityApi]
  );

  const handlePrayerWallRefresh = useCallback(async () => {
    setPrayerWallRefreshing(true);
    await Promise.all([
      loadPrayerRequestsFromApi(0, false),
      loadPrayerWallStatsFromApi(),
    ]);
    setPrayerWallRefreshing(false);
  }, [loadPrayerRequestsFromApi, loadPrayerWallStatsFromApi]);

  const handlePrayerWallLoadMore = useCallback(() => {
    if (!prayerWallLoadingMore && prayerWallHasMore) {
      loadPrayerRequestsFromApi(prayerRequests.length, true);
    }
  }, [
    prayerWallLoadingMore,
    prayerWallHasMore,
    prayerRequests.length,
    loadPrayerRequestsFromApi,
  ]);

  const handlePrayerReactionApi = useCallback(
    async (requestId: string) => {
      const currentRequest = prayerRequests.find((r) => r.id === requestId);
      if (!currentRequest) return;
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
      setPrayerWallStats((prev) => ({
        ...prev,
        totalPrayers: currentRequest.userPrayed
          ? prev.totalPrayers - 1
          : prev.totalPrayers + 1,
        userPrayers: currentRequest.userPrayed
          ? prev.userPrayers - 1
          : prev.userPrayers + 1,
      }));
      try {
        const response = await fetch(
          `/api/prayers/requests/${requestId}/react`,
          { method: "POST", credentials: "include" }
        );
        if (response.ok) {
          const result = (await response.json()).data;
          setPrayerRequests((prev) =>
            prev.map((req) =>
              req.id === requestId
                ? {
                    ...req,
                    userPrayed: result.userPrayed,
                    prayerCount: result.prayerCount,
                  }
                : req
            )
          );
          loadPrayerWallStatsFromApi();
        } else {
          setPrayerRequests(originalRequests);
          setPrayerWallStats((prev) => ({
            ...prev,
            totalPrayers: currentRequest.userPrayed
              ? prev.totalPrayers + 1
              : prev.totalPrayers - 1,
            userPrayers: currentRequest.userPrayed
              ? prev.userPrayers + 1
              : prev.userPrayers - 1,
          }));
          alert("Failed to record prayer. Try again.");
        }
      } catch (error) {
        setPrayerRequests(originalRequests);
        setPrayerWallStats((prev) => ({
          ...prev,
          totalPrayers: currentRequest.userPrayed
            ? prev.totalPrayers + 1
            : prev.totalPrayers - 1,
          userPrayers: currentRequest.userPrayed
            ? prev.userPrayers + 1
            : prev.userPrayers - 1,
        }));
        alert("Error recording prayer.");
        console.log(error);
      }
    },
    [prayerRequests, loadPrayerWallStatsFromApi]
  );

  const handleSubmitPrayerRequestApi = useCallback(async () => {
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
        alert(
          (await response.json()).error || "Failed to submit prayer request."
        );
      }
    } catch (error) {
      alert("Unexpected error submitting prayer.");
      console.log(error);
    } finally {
      setPrayerRequestSubmitting(false);
    }
  }, [newPrayerMessage, newPrayerIsAnonymous, loadPrayerWallStatsFromApi]);

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const response = await fetch("/api/auth/me", {
          method: "GET",
          credentials: "include",
        });

        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error("Error fetching current user:", error);
        setUser(null);
      } finally {
      }
    };

    fetchCurrentUser();
  }, []);

  const handleLogout = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
      window.location.href = "/login";
    } catch (e) {
      alert("Logout failed.");
      console.log(e);
    }
  }, []);

  // --- DERIVED STATE & UI HELPERS ---
  const checklistCompletedCount =
    Object.values(spiritualChecklist).filter(Boolean).length;
  const checklistTotalCount = Object.keys(spiritualChecklist).length;
  const checklistProgressPercentage =
    checklistTotalCount > 0
      ? (checklistCompletedCount / checklistTotalCount) * 100
      : 0;

  const sidebarItems = [
    { id: "dashboard", label: "Dashboard", icon: Home },
    { id: "prayers", label: "Prayer Wall", icon: MessageSquare },
    { id: "calendar", label: "Calendar", icon: Calendar },
    { id: "stats", label: "Statistics", icon: TrendingUp },
    { id: "achievements", label: "Achievements", icon: Award },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  // --- RENDER ---
  if (pageLoading || (prayerWallLoading && prayerRequests.length === 0)) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto" />
          <div className="space-y-1">
            <h2 className="text-xl font-medium text-gray-900">
              Loading your prayer journey...
            </h2>
            <p className="text-sm text-gray-500">
              Preparing your spiritual dashboard
            </p>
          </div>
        </div>
      </div>
    );
  }

  const renderPrayerWallContent = (isFullPage: boolean) => (
    <>
      {prayerRequests.map((request, index) => (
        <div key={request.id + (isFullPage ? "-full" : "-dash")}>
          <div
            className={`space-y-3 ${
              isFullPage
                ? "p-4 rounded-lg border border-gray-100 hover:border-gray-200 transition-colors"
                : ""
            }`}
          >
            <div className="flex items-start space-x-3">
              <Avatar className="w-8 h-8 border border-gray-200">
                {request.avatar && !request.isAnonymous ? (
                  <AvatarImage src={request.avatar} alt={request.user} />
                ) : null}
                <AvatarFallback className="bg-blue-50 text-blue-600 text-xs">
                  {request.isAnonymous
                    ? "🙏"
                    : request.user.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 text-sm">
                  <span className="font-medium text-gray-900">
                    {request.isAnonymous ? "Anonymous" : request.user}
                  </span>
                  <Badge
                    variant="outline"
                    className="text-xs border-gray-200 text-gray-500 self-start sm:self-center"
                  >
                    <Clock className="w-3 h-3 mr-1" />
                    {request.createdAt}
                  </Badge>
                </div>
                <p className="text-sm leading-relaxed text-gray-700 whitespace-pre-wrap">
                  {request.message}
                </p>
                <div className="flex items-center justify-between pt-2">
                  <Button
                    variant={request.userPrayed ? "default" : "outline"}
                    size="sm"
                    onClick={() => handlePrayerReactionApi(request.id)}
                    className={`text-xs py-1 px-2 transition-colors ${
                      request.userPrayed
                        ? "bg-blue-600 hover:bg-blue-700 text-white"
                        : "border-gray-200 text-gray-600 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200"
                    }`}
                  >
                    <Heart
                      className={`w-3 h-3 mr-1 ${
                        request.userPrayed ? "fill-current" : ""
                      }`}
                    />
                    {request.userPrayed ? "Prayed" : "I Prayed"}
                    {isFullPage ? ` (${request.prayerCount})` : ""}
                  </Button>
                  <Badge
                    variant="outline"
                    className="text-xs border-blue-200 text-blue-600"
                  >
                    <Heart className="w-3 h-3 mr-1" />
                    {request.prayerCount} {isFullPage ? "prayers" : ""}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
          {index < prayerRequests.length - 1 && <Separator className="my-4" />}
        </div>
      ))}
      {prayerWallHasMore && (
        <Button
          variant="outline"
          className="w-full mt-4 text-sm border-blue-200 text-blue-600 hover:bg-blue-50"
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
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {(dailyPrayerSaving || checklistSaving) && (
        <div className="fixed top-4 right-4 z-50 bg-white border border-gray-200 rounded-lg shadow-lg px-4 py-2 flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
          <span className="text-sm text-gray-700">Saving...</span>
        </div>
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0`}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-6 border-b border-gray-100">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="font-semibold text-lg text-gray-900">
                  HOLY रास्ता
                </h1>
                <p className="text-xs text-gray-500">Your spiritual journey</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          <nav className="flex-1 p-4 space-y-1">
            {sidebarItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                  activeTab === item.id
                    ? "bg-blue-50 text-blue-700 border border-blue-100"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
                {activeTab === item.id && (
                  <ChevronRight className="w-4 h-4 ml-auto" />
                )}
              </button>
            ))}
          </nav>

          <div className="p-4 border-t border-gray-100">
            <div className="flex items-center space-x-3 p-3 rounded-lg bg-gray-50">
              <Avatar className="w-8 h-8 border border-gray-200">
                <AvatarImage src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face" />
                <AvatarFallback className="bg-blue-100 text-blue-700 text-sm">
                  JD
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-gray-900 truncate">
                  {user?.name || "John Doe"}
                </p>
                <p className="text-xs text-gray-500 truncate">{user?.email}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-gray-400 hover:text-red-600 p-2"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="lg:ml-64 min-h-screen">
        <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                className="lg:hidden"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  {sidebarItems.find((item) => item.id === activeTab)?.label ||
                    "Dashboard"}
                </h1>
                <p className="text-sm text-gray-500">
                  {activeTab === "dashboard"
                    ? "Your journey to enlightenment starts here"
                    : activeTab === "prayers"
                    ? "Community prayer requests"
                    : `Manage ${sidebarItems
                        .find((item) => item.id === activeTab)
                        ?.label.toLowerCase()}`}
                </p>
              </div>
            </div>
          </div>
        </header>

        <main className="p-6 space-y-8">
          {activeTab === "dashboard" && (
            <>
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="border border-gray-200">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-500 text-sm font-medium">
                          Today&apos;s Prayers
                        </p>
                        <p className="text-2xl font-semibold text-gray-900">
                          {dailyCampusPrayerCount}
                        </p>
                      </div>
                      <div className="p-3 bg-blue-50 rounded-lg">
                        <Users className="w-6 h-6 text-blue-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border border-gray-200">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-500 text-sm font-medium">
                          Your Streak
                        </p>
                        <p className="text-2xl font-semibold text-gray-900">
                          7 Days
                        </p>
                      </div>
                      <div className="p-3 bg-blue-50 rounded-lg">
                        <Flame className="w-6 h-6 text-blue-600" />
                      </div>
                    </div>
                    <div className="mt-4 flex items-center text-gray-500 text-sm">
                      <Target className="w-4 h-4 mr-1" />
                      Keep it up!
                    </div>
                  </CardContent>
                </Card>

                <Card className="border border-gray-200">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-500 text-sm font-medium">
                          Completed
                        </p>
                        <p className="text-2xl font-semibold text-gray-900">
                          {checklistCompletedCount}/{checklistTotalCount}
                        </p>
                      </div>
                      <div className="p-3 bg-blue-50 rounded-lg">
                        <Check className="w-6 h-6 text-blue-600" />
                      </div>
                    </div>
                    <div className="mt-4 flex items-center text-gray-500 text-sm">
                      <Award className="w-4 h-4 mr-1" />
                      {Math.round(checklistProgressPercentage)}% today
                    </div>
                  </CardContent>
                </Card>

                <Card className="border border-gray-200">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-500 text-sm font-medium">
                          Community
                        </p>
                        <p className="text-2xl font-semibold text-gray-900">
                          {prayerWallStats.totalPrayers}
                        </p>
                      </div>
                      <div className="p-3 bg-blue-50 rounded-lg">
                        <Heart className="w-6 h-6 text-blue-600" />
                      </div>
                    </div>
                    <div className="mt-4 flex items-center text-gray-500 text-sm">
                      <MessageCircle className="w-4 h-4 mr-1" />
                      Total prayers offered
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                  {/* Campus Prayer Card */}
                  <Card className="border border-gray-200">
                    <CardContent className="p-8 text-center">
                      <div className="space-y-6">
                        <div className="flex justify-center">
                          <div className="p-4 bg-blue-50 rounded-full">
                            <Sparkles className="w-8 h-8 text-blue-600" />
                          </div>
                        </div>
                        <div className="space-y-4">
                          <h2 className="text-2xl font-semibold text-gray-900">
                            Campus Prayer
                          </h2>
                          <div className="max-w-2xl mx-auto">
                            <p className="text-gray-600 leading-relaxed">
                              Oh Lord, Let the Campuses be filled with the Love
                              of the Father, Grace of Christ and the Anointing
                              of the Holy Spirit. Holy Mary, intercede for us.
                              <br />
                              Lord, Bless NCC and all the campuses in India
                            </p>
                          </div>
                          <div className="flex items-center justify-center gap-3 mt-6">
                            <div className="flex items-center gap-2 bg-gray-50 rounded-full px-4 py-2">
                              <Users className="w-4 h-4 text-blue-600" />
                              {countLoading ? (
                                <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                              ) : (
                                <span className="font-medium text-gray-700">
                                  {dailyCampusPrayerCount} people prayed
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        {!dailyCampusPrayerDone ? (
                          <Button
                            onClick={handleAmenClick}
                            disabled={dailyPrayerSaving}
                            size="lg"
                            className="bg-blue-600 hover:bg-blue-700 text-white px-12 py-4 h-auto rounded-full font-semibold text-lg"
                          >
                            {dailyPrayerSaving ? (
                              <>
                                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                Saving...
                              </>
                            ) : (
                              <>
                                <span className="text-xl mr-2">🙏</span>
                                AMEN
                              </>
                            )}
                          </Button>
                        ) : (
                          <div className="space-y-4">
                            <div className="flex items-center justify-center space-x-4">
                              <div className="p-2 bg-blue-600 rounded-full">
                                <Check className="w-6 h-6 text-white" />
                              </div>
                              <span className="text-xl font-semibold text-gray-900">
                                Prayer Completed!
                              </span>
                            </div>
                            <Badge className="bg-blue-50 text-blue-700 border-blue-200 px-6 py-2">
                              ✨ Well done! ✨
                            </Badge>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Spiritual Checklist */}
                  <Card className="border border-gray-200">
                    <CardHeader className="pb-6">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <CardTitle className="text-xl font-semibold flex items-center gap-3">
                          <div className="p-2 bg-blue-50 rounded-lg">
                            <Check className="w-5 h-5 text-blue-600" />
                          </div>
                          Daily Spiritual Practice
                        </CardTitle>
                        <Badge
                          variant="outline"
                          className="px-4 py-2 bg-blue-50 border-blue-200 text-blue-700 self-start sm:self-center"
                        >
                          {checklistCompletedCount}/{checklistTotalCount}{" "}
                          Complete
                        </Badge>
                      </div>
                      <div className="space-y-2 mt-4">
                        <div className="flex items-center justify-between text-sm text-gray-600">
                          <span className="font-medium">Progress</span>
                          <span className="font-semibold">
                            {Math.round(checklistProgressPercentage)}%
                          </span>
                        </div>
                        <Progress
                          value={checklistProgressPercentage}
                          className="h-2"
                        />
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {[
                        {
                          key: "mass_attended",
                          icon: Church,
                          label: "Holy Mass",
                          description: "Celebrate a Holy Mass",
                        },
                        {
                          key: "fasting",
                          icon: Star,
                          label: "Fasting",
                          description: "Skip something for NCC",
                        },
                        {
                          key: "word_of_god_read",
                          icon: BookOpen,
                          label: "Word of God",
                          description: "Learn and reflect on a bible verse",
                        },
                        {
                          key: "memorare",
                          icon: BookOpen,
                          label: "Memorare",
                          description: "Recite the Memorare prayer",
                        },
                        {
                          key: "our_father_done",
                          icon: Cross,
                          label: "Our Father",
                          description: "Pray the Lord's Prayer",
                        },
                        {
                          key: "rosary_prayed",
                          icon: Cross,
                          label: "3 Hail Mary",
                          description: "Let's be to with mamma Mary",
                        },
                        {
                          key: "glory_be_to",
                          icon: Cross,
                          label: "5 Glory be to",
                          description: "Let's adore the Holy Trinity",
                        },
                      ].map(({ key, icon: Icon, label, description }) => (
                        <div
                          key={key}
                          className={`group p-4 rounded-lg border-2 cursor-pointer transition-all ${
                            spiritualChecklist[key as ChecklistItemKey]
                              ? "border-blue-200 bg-blue-50"
                              : "border-gray-200 hover:border-blue-200 hover:bg-blue-50"
                          } ${
                            checklistSaving
                              ? "opacity-50 pointer-events-none"
                              : ""
                          }`}
                          onClick={() =>
                            toggleChecklistItem(key as ChecklistItemKey)
                          }
                        >
                          <div className="flex items-center space-x-4">
                            <div
                              className={`p-2 rounded-full transition-colors ${
                                spiritualChecklist[key as ChecklistItemKey]
                                  ? "bg-blue-600 text-white"
                                  : "bg-gray-100 text-gray-500 group-hover:bg-blue-600 group-hover:text-white"
                              }`}
                            >
                              <Icon className="w-4 h-4" />
                            </div>
                            <div className="flex-1">
                              <div className="font-medium text-gray-900">
                                {label}
                              </div>
                              <div className="text-sm text-gray-500">
                                {description}
                              </div>
                            </div>
                            <div className="flex-shrink-0">
                              {spiritualChecklist[key as ChecklistItemKey] ? (
                                <div className="p-1 bg-blue-600 rounded-full">
                                  <Check className="w-3 h-3 text-white" />
                                </div>
                              ) : (
                                <div className="w-5 h-5 border-2 border-gray-300 rounded-full group-hover:border-blue-600" />
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>

                {/* Prayer Wall Sidebar */}
                <div className="space-y-6">
                  <Card className="border border-gray-200">
                    <CardHeader className="pb-4">
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2 text-lg">
                          <MessageCircle className="w-5 h-5 text-blue-600" />
                          Prayer Wall
                        </CardTitle>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handlePrayerWallRefresh}
                          disabled={
                            prayerWallRefreshing || prayerWallLoadingMore
                          }
                        >
                          <RefreshCw
                            className={`w-4 h-4 ${
                              prayerWallRefreshing ? "animate-spin" : ""
                            }`}
                          />
                        </Button>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-500 pt-2">
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
                      {prayerWallLoading &&
                      prayerRequests.length === 0 &&
                      !prayerWallRefreshing ? (
                        <div className="flex items-center justify-center p-8 min-h-[200px]">
                          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                        </div>
                      ) : prayerRequests.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          <MessageCircle className="w-10 h-10 mx-auto mb-3 opacity-50" />
                          <p className="text-sm">No prayer requests yet.</p>
                        </div>
                      ) : (
                        renderPrayerWallContent(false)
                      )}

                      <Dialog
                        open={newPrayerRequestDialogOpen}
                        onOpenChange={setNewPrayerRequestDialogOpen}
                      >
                        <DialogTrigger asChild>
                          <Button className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white">
                            <Plus className="w-4 h-4 mr-2" />
                            Share Prayer
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md">
                          <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                              <MessageCircle className="w-5 h-5 text-blue-600" />
                              Share Prayer
                            </DialogTitle>
                            <DialogDescription>
                              Share with community. Be mindful.
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4 py-4">
                            <div className="space-y-2">
                              <Label htmlFor="newPrayerMessage">
                                Your Prayer
                              </Label>
                              <Textarea
                                id="newPrayerMessage"
                                value={newPrayerMessage}
                                onChange={(e) =>
                                  setNewPrayerMessage(e.target.value)
                                }
                                maxLength={500}
                                rows={3}
                                className="resize-none"
                              />
                              <div className="flex justify-end text-xs text-gray-500">
                                <span>{newPrayerMessage.length}/500</span>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Switch
                                id="newPrayerIsAnonymous"
                                checked={newPrayerIsAnonymous}
                                onCheckedChange={setNewPrayerIsAnonymous}
                              />
                              <Label
                                htmlFor="newPrayerIsAnonymous"
                                className="cursor-pointer"
                              >
                                Post anonymously
                              </Label>
                            </div>
                          </div>
                          <DialogFooter className="gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() =>
                                setNewPrayerRequestDialogOpen(false)
                              }
                              disabled={prayerRequestSubmitting}
                            >
                              Cancel
                            </Button>
                            <Button
                              type="button"
                              onClick={handleSubmitPrayerRequestApi}
                              disabled={
                                prayerRequestSubmitting ||
                                !newPrayerMessage.trim() ||
                                newPrayerMessage.length > 500
                              }
                              className="bg-blue-600 hover:bg-blue-700"
                            >
                              {prayerRequestSubmitting ? (
                                <>
                                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                  Sharing...
                                </>
                              ) : (
                                <>
                                  <Send className="w-4 h-4 mr-2" />
                                  Share
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
            </>
          )}

          {activeTab === "prayers" && (
            <div className="p-0">
              <Card className="border border-gray-200 w-full">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-xl">
                      <MessageSquare className="w-6 h-6 text-blue-600" />
                      Community Prayer Wall
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handlePrayerWallRefresh}
                      disabled={prayerWallRefreshing || prayerWallLoadingMore}
                    >
                      <RefreshCw
                        className={`w-4 h-4 ${
                          prayerWallRefreshing ? "animate-spin" : ""
                        }`}
                      />
                    </Button>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-500 pt-2">
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
                <CardContent className="space-y-4 max-h-[calc(100vh-250px)] overflow-y-auto">
                  {prayerWallLoading &&
                  prayerRequests.length === 0 &&
                  !prayerWallRefreshing ? (
                    <div className="flex items-center justify-center p-8 min-h-[300px]">
                      <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                    </div>
                  ) : prayerRequests.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      <MessageCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>Prayer wall is empty.</p>
                      <p className="text-sm">Share a request!</p>
                    </div>
                  ) : (
                    renderPrayerWallContent(true)
                  )}

                  <Dialog
                    open={newPrayerRequestDialogOpen}
                    onOpenChange={setNewPrayerRequestDialogOpen}
                  >
                    <DialogTrigger asChild>
                      <Button className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white sticky bottom-4 shadow-xl z-10">
                        <Plus className="w-4 h-4 mr-2" />
                        Share Prayer
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                          <MessageCircle className="w-5 h-5 text-blue-600" />
                          Share Prayer
                        </DialogTitle>
                        <DialogDescription>
                          Share with community.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="newPrayerMessageFull">
                            Your Prayer
                          </Label>
                          <Textarea
                            id="newPrayerMessageFull"
                            value={newPrayerMessage}
                            onChange={(e) =>
                              setNewPrayerMessage(e.target.value)
                            }
                            maxLength={500}
                            rows={3}
                            className="resize-none"
                          />
                          <div className="flex justify-end text-xs text-gray-500">
                            <span>{newPrayerMessage.length}/500</span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="newPrayerIsAnonymousFull"
                            checked={newPrayerIsAnonymous}
                            onCheckedChange={setNewPrayerIsAnonymous}
                          />
                          <Label
                            htmlFor="newPrayerIsAnonymousFull"
                            className="cursor-pointer"
                          >
                            Post anonymously
                          </Label>
                        </div>
                      </div>
                      <DialogFooter className="gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setNewPrayerRequestDialogOpen(false)}
                          disabled={prayerRequestSubmitting}
                        >
                          Cancel
                        </Button>
                        <Button
                          type="button"
                          onClick={handleSubmitPrayerRequestApi}
                          disabled={
                            prayerRequestSubmitting ||
                            !newPrayerMessage.trim() ||
                            newPrayerMessage.length > 500
                          }
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          {prayerRequestSubmitting ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Sharing...
                            </>
                          ) : (
                            <>
                              <Send className="w-4 h-4 mr-2" />
                              Share
                            </>
                          )}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab !== "dashboard" && activeTab !== "prayers" && (
            <div className="p-6 text-center">
              <Card className="inline-block p-10 border border-gray-200">
                <CardHeader>
                  <CardTitle className="text-xl text-gray-800">
                    Coming Soon!
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">
                    Content for{" "}
                    <span className="font-semibold text-gray-700">
                      {
                        sidebarItems.find((item) => item.id === activeTab)
                          ?.label
                      }
                    </span>{" "}
                    is under development.
                  </p>
                  <div className="mt-6">
                    {React.createElement(
                      sidebarItems.find((item) => item.id === activeTab)
                        ?.icon || Home,
                      { className: "w-16 h-16 mx-auto text-blue-600" }
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
