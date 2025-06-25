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
  // Bell,
  ChevronRight,
  Flame,
  Target,
} from "lucide-react";
import confetti from "canvas-confetti";

// --- INTERFACES (Remain the same) ---
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
  campus_prayer_done: boolean;
  mass_attended: boolean;
  rosary_prayed: boolean;
  word_of_god_read: boolean;
  our_father_done: boolean;
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
export default function MergedPrayerDashboard() {
  // --- STATE (Remains the same) ---
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

  // --- API HELPER FUNCTIONS (Remain the same, ensure useCallback dependencies are correct) ---
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

  // --- EFFECTS (Remain the same) ---
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

  // --- EVENT HANDLERS (Remain the same logic, ensure useCallback dependencies are good) ---
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
          credentials: "include", // Ensure cookies are sent
        });

        if (response.ok) {
          const data = await response.json();
          // --- CORRECTED: Access user data from the 'user' key ---
          setUser(data.user);
        } else {
          // If response is not ok (e.g., 401), clear user state
          setUser(null);
          // You might also want to handle redirection to login here if desired
          // For example: window.location.href = '/login';
        }
      } catch (error) {
        console.error("Error fetching current user:", error);
        setUser(null); // Clear user state on error
      } finally {
      }
    };

    fetchCurrentUser(); // Call the async function
  }, []); // Empty dependency array means this runs once on mount

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

  // --- DERIVED STATE & UI HELPERS (Remain the same) ---
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
    // Show main loader if page is loading OR prayer wall is loading AND no requests are yet shown
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 sm:w-16 sm:h-16 text-indigo-600 animate-spin mx-auto" />
          <div className="space-y-1">
            <h2 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Loading your prayer journey...
            </h2>
            <p className="text-sm sm:text-base text-gray-600">
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
            className={`space-y-2 sm:space-y-3 ${
              isFullPage
                ? "p-3 sm:p-4 rounded-lg border bg-card hover:shadow-md transition-shadow"
                : ""
            }`}
          >
            <div className="flex items-start space-x-3">
              <Avatar className="w-8 h-8 sm:w-10 sm:h-10 border-2 border-white shadow-sm">
                {request.avatar && !request.isAnonymous ? (
                  <AvatarImage src={request.avatar} alt={request.user} />
                ) : null}
                <AvatarFallback className="bg-gradient-to-br from-slate-400 to-slate-500 text-white text-xs sm:text-sm">
                  {request.isAnonymous ? (
                    <span role="img" aria-label="anonymous">
                      🙏
                    </span>
                  ) : (
                    request.user.charAt(0).toUpperCase()
                  )}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-1.5 sm:space-y-2">
                <div
                  className={`flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 text-xs sm:text-sm ${
                    isFullPage ? "sm:justify-between" : ""
                  }`}
                >
                  <span
                    className={`font-semibold ${
                      isFullPage ? "text-sm sm:text-base" : ""
                    }`}
                  >
                    {request.isAnonymous ? "Anonymous" : request.user}
                  </span>
                  <Badge
                    variant={isFullPage ? "outline" : "secondary"}
                    className="text-xs self-start sm:self-center"
                  >
                    <Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-1" />
                    {request.createdAt}
                  </Badge>
                </div>
                <p className="text-xs sm:text-sm leading-relaxed text-foreground/90 whitespace-pre-wrap">
                  {request.message}
                </p>
                <div className="flex items-center justify-between pt-1 sm:pt-2">
                  <Button
                    variant={request.userPrayed ? "default" : "outline"}
                    size="sm" // size="xs" could be an option if you make a custom variant
                    onClick={() => handlePrayerReactionApi(request.id)}
                    className={`text-[10px] sm:text-xs py-1 px-2 sm:py-1.5 sm:px-2.5 transition-colors duration-150 ${
                      request.userPrayed
                        ? "bg-red-500 hover:bg-red-600 text-white border-red-500"
                        : "border-gray-300 text-gray-700 hover:bg-red-50 hover:text-red-600 hover:border-red-300"
                    }`}
                  >
                    <Heart
                      className={`w-2.5 h-2.5 sm:w-3 sm:h-3 mr-1 ${
                        request.userPrayed ? "fill-current" : ""
                      }`}
                    />
                    {request.userPrayed ? "Prayed" : "I Prayed"}{" "}
                    {isFullPage ? `(${request.prayerCount})` : ""}
                  </Button>
                  <Badge
                    variant={isFullPage ? "outline" : "secondary"}
                    className="text-[10px] sm:text-xs"
                  >
                    <Heart className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-1 text-red-400" />
                    {request.prayerCount} {isFullPage ? "prayers" : ""}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
          {index < prayerRequests.length - 1 && (
            <Separator className="my-3 sm:my-4" />
          )}
        </div>
      ))}
      {prayerWallHasMore && (
        <Button
          variant="outline"
          className="w-full mt-3 sm:mt-4 text-xs sm:text-sm"
          onClick={handlePrayerWallLoadMore}
          disabled={prayerWallLoadingMore || prayerWallRefreshing}
        >
          {prayerWallLoadingMore ? (
            <>
              <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 mr-2 animate-spin" />
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {(dailyPrayerSaving || checklistSaving) && (
        <div className="fixed top-2 right-2 sm:top-4 sm:right-4 z-[1001]">
          <div className="bg-white border border-indigo-200 rounded-lg shadow-lg px-3 py-1.5 sm:px-4 sm:py-2 flex items-center gap-2">
            <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin text-indigo-600" />
            <span className="text-xs sm:text-sm text-indigo-600">
              Saving...
            </span>
          </div>
        </div>
      )}
      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white/80 backdrop-blur-xl border-r border-white/20 shadow-2xl transform transition-transform duration-300 ease-in-out ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0`}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200/50">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg sm:rounded-xl flex items-center justify-center">
                <Sparkles className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-base sm:text-lg text-gray-900">
                  PrayerSpace
                </h1>
                <p className="text-[10px] sm:text-xs text-gray-500">
                  Your spiritual journey
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden"
              onClick={() => setSidebarOpen(false)}
              aria-label="Close sidebar"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
          <nav className="flex-1 p-2 sm:p-4 space-y-1 sm:space-y-2">
            {sidebarItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center space-x-2 sm:space-x-3 px-3 py-2.5 sm:px-4 sm:py-3 rounded-lg sm:rounded-xl text-left transition-all duration-200 group ${
                  activeTab === item.id
                    ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg"
                    : "text-gray-700 hover:bg-gray-100/70 hover:text-gray-900"
                }`}
              >
                <item.icon
                  className={`w-4 h-4 sm:w-5 sm:h-5 ${
                    activeTab === item.id
                      ? "text-white"
                      : "text-gray-500 group-hover:text-gray-700"
                  }`}
                />
                <span className="font-medium text-sm sm:text-base">
                  {item.label}
                </span>
                {activeTab === item.id && (
                  <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 ml-auto" />
                )}
              </button>
            ))}
          </nav>
          <div className="p-2 sm:p-4 border-t border-gray-200/50">
            <div className="flex items-center space-x-2 sm:space-x-3 p-2 sm:p-3 rounded-lg sm:rounded-xl bg-gray-50/70 hover:bg-gray-100/70 transition-colors">
              <Avatar className="w-8 h-8 sm:w-10 sm:h-10 border-2 border-white shadow-sm">
                <AvatarImage src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face" />
                <AvatarFallback className="bg-gradient-to-br from-indigo-400 to-purple-500 text-white text-xs sm:text-sm">
                  JD
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-xs sm:text-sm text-gray-900 truncate">
                  {user?.name || "John Doe"}
                </p>
                <p className="text-[10px] sm:text-xs text-gray-500 truncate">
                  {user?.email}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-gray-500 hover:text-red-600 p-1 sm:p-2"
                aria-label="Log out"
              >
                <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="lg:ml-64">
        <header className="bg-white/80 backdrop-blur-xl border-b border-white/20 sticky top-0 z-40">
          <div className="flex items-center justify-between px-4 py-3 sm:px-6 sm:py-4">
            <div className="flex items-center space-x-2 sm:space-x-4">
              <Button
                variant="ghost"
                size="sm"
                className="lg:hidden"
                onClick={() => setSidebarOpen(true)}
                aria-label="Open sidebar"
              >
                <Menu className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-lg sm:text-xl md:text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  {sidebarItems.find((item) => item.id === activeTab)?.label ||
                    "Dashboard"}
                </h1>
                <p className="text-xs sm:text-sm text-gray-600">
                  {activeTab === "dashboard"
                    ? "Your daily spiritual journey"
                    : activeTab === "prayers"
                    ? "Community prayer requests"
                    : `Manage ${sidebarItems
                        .find((item) => item.id === activeTab)
                        ?.label.toLowerCase()}`}
                </p>
              </div>
            </div>
            {/* <div className="flex items-center space-x-1 sm:space-x-3">
              <Button
                variant="ghost"
                size="sm"
                className="relative p-1 sm:p-2"
                aria-label="Notifications"
              >
                <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="absolute -top-0.5 -right-0.5 sm:-top-1 sm:-right-1 w-2.5 h-2.5 sm:w-3 sm:h-3 bg-red-500 rounded-full flex items-center justify-center">
                  <span className="text-[8px] sm:text-xs text-white font-bold">
                    2
                  </span>
                </span>
              </Button>
            </div> */}
          </div>
        </header>

        <main className="p-4 sm:p-6 space-y-6 sm:space-y-8">
          {activeTab === "dashboard" && (
            <>
              {/* Stats Cards: Already responsive with grid-cols-1 md:grid-cols-2 lg:grid-cols-4 */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                {/* Card content adjusted for smaller text */}
                <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-blue-100 text-xs sm:text-sm font-medium">
                          Today&apos;s Prayers
                        </p>
                        <p className="text-2xl sm:text-3xl font-bold">
                          {dailyCampusPrayerCount}
                        </p>
                      </div>
                      <div className="p-2 sm:p-3 bg-white/20 rounded-full">
                        <Users className="w-5 h-5 sm:w-8 sm:h-8" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-purple-100 text-xs sm:text-sm font-medium">
                          Your Streak
                        </p>
                        <p className="text-2xl sm:text-3xl font-bold">7 Days</p>
                      </div>
                      <div className="p-2 sm:p-3 bg-white/20 rounded-full">
                        <Flame className="w-5 h-5 sm:w-8 sm:h-8" />
                      </div>
                    </div>
                    <div className="mt-2 sm:mt-4 flex items-center text-purple-100 text-xs sm:text-sm">
                      <Target className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                      Keep it up!
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-emerald-100 text-xs sm:text-sm font-medium">
                          Completed
                        </p>
                        <p className="text-2xl sm:text-3xl font-bold">
                          {checklistCompletedCount}/{checklistTotalCount}
                        </p>
                      </div>
                      <div className="p-2 sm:p-3 bg-white/20 rounded-full">
                        <Check className="w-5 h-5 sm:w-8 sm:h-8" />
                      </div>
                    </div>
                    <div className="mt-2 sm:mt-4 flex items-center text-emerald-100 text-xs sm:text-sm">
                      <Award className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                      {Math.round(checklistProgressPercentage)}% today
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-orange-100 text-xs sm:text-sm font-medium">
                          Community
                        </p>
                        <p className="text-2xl sm:text-3xl font-bold">
                          {prayerWallStats.totalPrayers}
                        </p>
                      </div>
                      <div className="p-2 sm:p-3 bg-white/20 rounded-full">
                        <Heart className="w-5 h-5 sm:w-8 sm:h-8" />
                      </div>
                    </div>
                    <div className="mt-2 sm:mt-4 flex items-center text-orange-100 text-xs sm:text-sm">
                      <MessageCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                      Total prayers offered
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid lg:grid-cols-3 gap-6 sm:gap-8">
                {" "}
                {/* This grid already stacks on mobile */}
                <div className="lg:col-span-2 space-y-6 sm:space-y-8">
                  <Card className="relative overflow-hidden border-0 shadow-2xl hover:shadow-3xl transition-all duration-500">
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-700" />
                    <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%2523ffffff%22%20fill-opacity%3D%220.1%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-20" />
                    <CardContent className="relative p-6 sm:p-8 text-center text-white">
                      <div className="space-y-4 sm:space-y-6">
                        <div className="flex justify-center">
                          <div className="p-3 sm:p-4 bg-white/20 rounded-full backdrop-blur-sm animate-pulse">
                            <Sparkles className="w-8 h-8 sm:w-10 sm:h-10 text-yellow-300" />
                          </div>
                        </div>
                        <div className="space-y-2 sm:space-y-4">
                          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold">
                            Campus Prayer
                          </h2>
                          <div className="max-w-2xl mx-auto">
                            <p className="text-sm sm:text-base md:text-lg leading-relaxed opacity-95">
                              Oh Lord, Let the Campuses be filled with the Love
                              of the Father, Grace of Christ and the Anointing
                              of the Holy Spirit. Holy Mary, intercede for us.
                              <br />
                              Lord, Bless NCC and all the campuses in India{" "}
                            </p>
                          </div>
                          <div className="flex items-center justify-center gap-2 sm:gap-3 mt-3 sm:mt-6">
                            <div className="flex items-center gap-1.5 sm:gap-2 bg-white/20 rounded-full px-3 py-1.5 sm:px-4 sm:py-2 backdrop-blur-sm">
                              <Users className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-300" />
                              {countLoading ? (
                                <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                              ) : (
                                <span className="font-semibold text-sm sm:text-base">
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
                            className="bg-white text-indigo-600 hover:bg-white/95 text-base sm:text-lg md:text-xl px-8 py-3 sm:px-12 sm:py-4 md:px-16 md:py-5 h-auto rounded-full font-bold shadow-xl transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:transform-none hover:shadow-2xl"
                          >
                            {dailyPrayerSaving ? (
                              <>
                                <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3 animate-spin" />
                                Saving...
                              </>
                            ) : (
                              <>
                                <span
                                  className="text-xl sm:text-2xl mr-1.5 sm:mr-2"
                                  role="img"
                                  aria-label="pray"
                                >
                                  🙏
                                </span>
                                AMEN
                              </>
                            )}
                          </Button>
                        ) : (
                          <div className="space-y-3 sm:space-y-4 animate-fade-in">
                            <div className="flex items-center justify-center space-x-2 sm:space-x-4">
                              <div className="p-2 sm:p-3 bg-emerald-500 rounded-full animate-bounce">
                                <Check className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                              </div>
                              <span className="text-xl sm:text-2xl md:text-3xl font-bold">
                                Prayer Completed!
                              </span>
                            </div>
                            <Badge className="bg-white/20 text-white border-white/30 text-sm sm:text-base px-4 py-1.5 sm:px-6 sm:py-2">
                              ✨ Well done! ✨
                            </Badge>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="shadow-xl border-0 bg-white/70 backdrop-blur-sm hover:shadow-2xl transition-all duration-300">
                    <CardHeader className="pb-4 sm:pb-6">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <CardTitle className="text-lg sm:text-xl md:text-2xl font-bold flex items-center gap-2 sm:gap-3">
                          <div className="p-1.5 sm:p-2 bg-emerald-100 rounded-lg sm:rounded-xl">
                            <Check className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600" />
                          </div>
                          Daily Spiritual Practice
                        </CardTitle>
                        <Badge
                          variant="outline"
                          className="text-xs sm:text-sm px-3 py-1 sm:px-4 sm:py-2 bg-emerald-50 border-emerald-200 text-emerald-700 self-start sm:self-center"
                        >
                          {checklistCompletedCount}/{checklistTotalCount}{" "}
                          Complete
                        </Badge>
                      </div>
                      <div className="space-y-2 mt-3 sm:mt-4">
                        <div className="flex items-center justify-between text-xs sm:text-sm text-gray-600">
                          <span className="font-medium">Progress</span>
                          <span className="font-bold">
                            {Math.round(checklistProgressPercentage)}%
                          </span>
                        </div>
                        <div className="relative h-2 sm:h-3 bg-gray-200 rounded-full">
                          <Progress
                            value={checklistProgressPercentage}
                            className="absolute h-2 sm:h-3 bg-transparent"
                          />
                          <div
                            className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full opacity-80"
                            style={{ width: `${checklistProgressPercentage}%` }}
                          />
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3 sm:space-y-4">
                      {[
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
                        <div
                          key={key}
                          className={`group p-3 sm:p-4 rounded-lg border-2 cursor-pointer transition-all duration-300 hover:shadow-md ${
                            spiritualChecklist[key as ChecklistItemKey]
                              ? "border-emerald-200 bg-emerald-50 shadow-sm"
                              : "border-border hover:border-indigo-200 hover:bg-accent/50"
                          } ${
                            checklistSaving
                              ? "opacity-50 pointer-events-none"
                              : ""
                          }`}
                          onClick={() =>
                            toggleChecklistItem(key as ChecklistItemKey)
                          }
                          role="checkbox"
                          aria-checked={
                            spiritualChecklist[key as ChecklistItemKey]
                          }
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              toggleChecklistItem(key as ChecklistItemKey);
                            }
                          }}
                        >
                          <div className="flex items-center space-x-3 sm:space-x-4">
                            <div
                              className={`p-1.5 sm:p-2 rounded-full transition-colors ${
                                spiritualChecklist[key as ChecklistItemKey]
                                  ? "bg-emerald-100 text-emerald-600"
                                  : "bg-muted text-muted-foreground group-hover:bg-indigo-100 group-hover:text-indigo-600"
                              }`}
                            >
                              <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                            </div>
                            <div className="flex-1">
                              <div className="font-semibold text-sm sm:text-base">
                                {label}
                              </div>
                              <div className="text-xs sm:text-sm text-muted-foreground">
                                {description}
                              </div>
                            </div>
                            <div className="flex-shrink-0">
                              {spiritualChecklist[key as ChecklistItemKey] ? (
                                <div className="p-0.5 sm:p-1 bg-emerald-500 rounded-full">
                                  <Check className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                                </div>
                              ) : (
                                <div className="w-5 h-5 sm:w-6 sm:h-6 border-2 border-muted-foreground/30 rounded-full group-hover:border-indigo-400" />
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>
                <div className="space-y-6 lg:col-span-1">
                  <Card className="shadow-lg">
                    <CardHeader className="pb-3 sm:pb-4">
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-1.5 sm:gap-2 text-base sm:text-lg md:text-xl">
                          <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600" />
                          Prayer Wall
                        </CardTitle>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handlePrayerWallRefresh}
                          disabled={
                            prayerWallRefreshing || prayerWallLoadingMore
                          }
                          aria-label="Refresh prayer requests"
                          className="p-1 sm:p-1.5"
                        >
                          <RefreshCw
                            className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${
                              prayerWallRefreshing ? "animate-spin" : ""
                            }`}
                          />
                        </Button>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-3 sm:gap-x-4 gap-y-1 sm:gap-y-2 text-xs sm:text-sm text-muted-foreground pt-1.5 sm:pt-2">
                        <div className="flex items-center gap-1">
                          <Users className="w-3 h-3 sm:w-4 sm:h-4" />
                          {prayerWallStats.totalRequests} reqs
                        </div>
                        <div className="flex items-center gap-1">
                          <Heart className="w-3 h-3 sm:w-4 sm:h-4" />
                          {prayerWallStats.totalPrayers} prayers
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3 sm:space-y-4 max-h-[350px] sm:max-h-[450px] md:max-h-[500px] lg:max-h-[600px] overflow-y-auto">
                      {prayerWallLoading &&
                      prayerRequests.length === 0 &&
                      !prayerWallRefreshing ? (
                        <div className="flex items-center justify-center p-6 sm:p-8 min-h-[150px] sm:min-h-[200px]">
                          <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 animate-spin text-indigo-600" />
                        </div>
                      ) : prayerRequests.length === 0 ? (
                        <div className="text-center py-6 sm:py-8 text-muted-foreground">
                          <MessageCircle className="w-8 h-8 sm:w-10 sm:h-10 mx-auto mb-2 sm:mb-3 opacity-50" />
                          <p className="text-xs sm:text-sm">
                            No prayer requests yet.
                          </p>
                        </div>
                      ) : (
                        renderPrayerWallContent(false)
                      )}
                      <Dialog
                        open={newPrayerRequestDialogOpen}
                        onOpenChange={setNewPrayerRequestDialogOpen}
                      >
                        <DialogTrigger asChild>
                          <Button className="w-full mt-4 sm:mt-6 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white text-sm sm:text-base py-2 sm:py-2.5">
                            <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-2" />
                            Share Prayer
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md w-[90vw] rounded-lg">
                          {" "}
                          {/* Responsive width for dialog */}
                          <DialogHeader>
                            <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
                              <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600" />
                              Share Prayer
                            </DialogTitle>
                            <DialogDescription className="text-xs sm:text-sm">
                              Share with community. Be mindful.
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-3 sm:space-y-4 py-3 sm:py-4">
                            <div className="space-y-1.5 sm:space-y-2">
                              <Label
                                htmlFor="newPrayerMessageDash"
                                className="text-xs sm:text-sm"
                              >
                                Your Prayer
                              </Label>
                              <Textarea
                                id="newPrayerMessageDash"
                                value={newPrayerMessage}
                                onChange={(e) =>
                                  setNewPrayerMessage(e.target.value)
                                }
                                maxLength={500}
                                rows={3}
                                // sm:rows={4}
                                className="resize-none focus-visible:ring-indigo-500 text-xs sm:text-sm"
                              />
                              <div className="flex justify-end text-[10px] sm:text-xs text-muted-foreground">
                                <span>{newPrayerMessage.length}/500</span>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2 pt-1 sm:pt-2">
                              <Switch
                                id="newPrayerIsAnonymousDash"
                                checked={newPrayerIsAnonymous}
                                onCheckedChange={setNewPrayerIsAnonymous}
                              />
                              <Label
                                htmlFor="newPrayerIsAnonymousDash"
                                className="text-xs sm:text-sm cursor-pointer"
                              >
                                Post anonymously
                              </Label>
                            </div>
                          </div>
                          <DialogFooter className="gap-2 flex-col sm:flex-row">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() =>
                                setNewPrayerRequestDialogOpen(false)
                              }
                              disabled={prayerRequestSubmitting}
                              className="text-xs sm:text-sm w-full sm:w-auto"
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
                              className="text-xs sm:text-sm bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white w-full sm:w-auto"
                            >
                              {prayerRequestSubmitting ? (
                                <>
                                  <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 mr-2 animate-spin" />
                                  Sharing...
                                </>
                              ) : (
                                <>
                                  <Send className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
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
              {" "}
              {/* Full page prayers, minimal padding on smallest screens */}
              <Card className="shadow-lg w-full">
                <CardHeader className="pb-3 sm:pb-4 px-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-1.5 sm:gap-2 text-base sm:text-lg md:text-xl">
                      <MessageSquare className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-600" />
                      Community Prayer Wall
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handlePrayerWallRefresh}
                      disabled={prayerWallRefreshing || prayerWallLoadingMore}
                      aria-label="Refresh"
                      className="p-1 sm:p-1.5"
                    >
                      <RefreshCw
                        className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${
                          prayerWallRefreshing ? "animate-spin" : ""
                        }`}
                      />
                    </Button>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 sm:gap-x-4 gap-y-1 sm:gap-y-2 text-xs sm:text-sm text-muted-foreground pt-1.5 sm:pt-2">
                    <div className="flex items-center gap-1">
                      <Users className="w-3 h-3 sm:w-4 sm:h-4" />
                      {prayerWallStats.totalRequests} reqs
                    </div>
                    <div className="flex items-center gap-1">
                      <Heart className="w-3 h-3 sm:w-4 sm:h-4" />
                      {prayerWallStats.totalPrayers} prayers
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 sm:space-y-4 max-h-[calc(100vh-200px)] sm:max-h-[calc(100vh-220px)] md:max-h-[calc(100vh-250px)] overflow-y-auto px-4 sm:px-6 pb-4 sm:pb-6">
                  {prayerWallLoading &&
                  prayerRequests.length === 0 &&
                  !prayerWallRefreshing ? (
                    <div className="flex items-center justify-center p-6 sm:p-8 min-h-[200px] sm:min-h-[300px]">
                      <Loader2 className="w-6 h-6 sm:w-8 sm:h-8 animate-spin text-indigo-600" />
                    </div>
                  ) : prayerRequests.length === 0 ? (
                    <div className="text-center py-10 sm:py-12 text-muted-foreground">
                      <MessageCircle className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 sm:mb-4 opacity-50" />
                      <p className="text-sm sm:text-base">
                        Prayer wall is empty.
                      </p>
                      <p className="text-xs sm:text-sm">Share a request!</p>
                    </div>
                  ) : (
                    renderPrayerWallContent(true)
                  )}
                  <Dialog
                    open={newPrayerRequestDialogOpen}
                    onOpenChange={setNewPrayerRequestDialogOpen}
                  >
                    <DialogTrigger asChild>
                      <Button className="w-full mt-4 sm:mt-6 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white sticky bottom-4 shadow-xl z-10 text-sm sm:text-base py-2.5 sm:py-3">
                        <Plus className="w-4 h-4 mr-2" />
                        Share Prayer
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md w-[90vw] rounded-lg">
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
                          <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600" />
                          Share Prayer
                        </DialogTitle>
                        <DialogDescription className="text-xs sm:text-sm">
                          Share with community.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-3 sm:space-y-4 py-3 sm:py-4">
                        <div className="space-y-1.5 sm:space-y-2">
                          <Label
                            htmlFor="newPrayerMessageFull"
                            className="text-xs sm:text-sm"
                          >
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
                            // sm:rows={4}
                            className="resize-none focus-visible:ring-indigo-500 text-xs sm:text-sm"
                          />
                          <div className="flex justify-end text-[10px] sm:text-xs text-muted-foreground">
                            <span>{newPrayerMessage.length}/500</span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 pt-1 sm:pt-2">
                          <Switch
                            id="newPrayerIsAnonymousFull"
                            checked={newPrayerIsAnonymous}
                            onCheckedChange={setNewPrayerIsAnonymous}
                          />
                          <Label
                            htmlFor="newPrayerIsAnonymousFull"
                            className="text-xs sm:text-sm cursor-pointer"
                          >
                            Post anonymously
                          </Label>
                        </div>
                      </div>
                      <DialogFooter className="gap-2 flex-col sm:flex-row">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setNewPrayerRequestDialogOpen(false)}
                          disabled={prayerRequestSubmitting}
                          className="text-xs sm:text-sm w-full sm:w-auto"
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
                          className="text-xs sm:text-sm bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white w-full sm:w-auto"
                        >
                          {prayerRequestSubmitting ? (
                            <>
                              <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 mr-2 animate-spin" />
                              Sharing...
                            </>
                          ) : (
                            <>
                              <Send className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
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
            <div className="p-4 sm:p-6 text-center">
              <Card className="inline-block p-6 sm:p-10">
                <CardHeader>
                  <CardTitle className="text-lg sm:text-xl md:text-2xl">
                    Coming Soon!
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm sm:text-base text-muted-foreground">
                    Content for{" "}
                    <span className="font-semibold">
                      {
                        sidebarItems.find((item) => item.id === activeTab)
                          ?.label
                      }
                    </span>{" "}
                    is under development.
                  </p>
                  <div className="mt-4 sm:mt-6">
                    {React.createElement(
                      sidebarItems.find((item) => item.id === activeTab)
                        ?.icon || Home,
                      {
                        className:
                          "w-12 h-12 sm:w-16 sm:h-16 mx-auto text-indigo-300",
                      }
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
