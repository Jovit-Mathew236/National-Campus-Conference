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
  MessageCircle,
  Church,
  BookOpen,
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
  Award,
  ChevronRight,
  Flame,
  Target,
  Circle,
  Crown,
  Shield,
  Minus,
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
  campus_prayer_participants_done_2: boolean;
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
  const [campusPrayerStep, setCampusPrayerStep] = useState(0);
  const [userStreak, setUserStreak] = useState(0);
  const [streakLoading, setStreakLoading] = useState(true);

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

        if (data.campus_prayer_done && data.campus_prayer_participants_done_2) {
          setCampusPrayerStep(2);
        } else if (data.campus_prayer_done) {
          setCampusPrayerStep(1);
        } else {
          setCampusPrayerStep(0);
        }

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

  const loadUserStreak = useCallback(async () => {
    setStreakLoading(true);
    try {
      const response = await fetch("/api/prayers/streak", {
        method: "GET",
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setUserStreak(data.data.streak);
      } else {
        console.error("Failed to load user streak");
      }
    } catch (error) {
      console.error("Error loading user streak:", error);
    } finally {
      setStreakLoading(false);
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
      } else if (updates.hasOwnProperty("campus_prayer_participants_done_2")) {
        setDailyPrayerSaving(true);
        if (campusPrayerStep === 0) {
          setCampusPrayerStep(1);
        } else if (campusPrayerStep === 1) {
          setCampusPrayerStep(2);
        }
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
    [campusPrayerStep]
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
        loadUserStreak(),
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
    loadUserStreak,
  ]);

  // --- EVENT HANDLERS ---
  const handleAmenClick = useCallback(async () => {
    let updateData = {};
    let newStep = campusPrayerStep;

    if (campusPrayerStep === 0) {
      updateData = { campus_prayer_done: true };
      newStep = 1;
    } else if (campusPrayerStep === 1) {
      updateData = { campus_prayer_participants_done_2: true };
      newStep = 2;
    }

    const success = await updateDailyActivityApi(updateData);
    if (success) {
      setCampusPrayerStep(newStep);

      if (newStep === 2) {
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

        loadUserStreak();
      }
    }
  }, [campusPrayerStep, updateDailyActivityApi, loadUserStreak]);

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
  ];

  // --- RENDER ---
  if (pageLoading || (prayerWallLoading && prayerRequests.length === 0)) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center space-y-6">
          <div className="w-16 h-16 mx-auto bg-[#0791c4] rounded-2xl flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-white animate-spin" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold text-gray-900">
              Loading your prayer journey
            </h2>
            <p className="text-[#faaf36] font-medium">
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
            className={`space-y-4 ${
              isFullPage
                ? "p-6 rounded-xl border border-gray-100 hover:border-[#faaf36] hover:shadow-sm transition-all duration-200"
                : ""
            }`}
          >
            <div className="flex items-start space-x-4">
              <Avatar className="w-10 h-10 border-2 border-[#faaf36]">
                {request.avatar && !request.isAnonymous ? (
                  <AvatarImage src={request.avatar} alt={request.user} />
                ) : null}
                <AvatarFallback className="bg-[#0791c4] text-white text-sm font-medium">
                  {request.isAnonymous
                    ? "🙏"
                    : request.user.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-3">
                <div className="flex flex-wrap sm:flex-row sm:items-center gap-2 text-sm">
                  <span className="font-semibold text-gray-900">
                    {request.isAnonymous ? "Anonymous" : request.user}
                  </span>
                  <Badge
                    variant="outline"
                    className="text-xs border-[#faaf36] text-[#faaf36] bg-[#faaf36]/5 self-start sm:self-center"
                  >
                    <Clock className="w-3 h-3 mr-1" />
                    {request.createdAt}
                  </Badge>
                </div>
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {request.message}
                </p>
                <div className="flex items-center justify-between pt-2">
                  <Button
                    variant={request.userPrayed ? "default" : "outline"}
                    size="sm"
                    onClick={() => handlePrayerReactionApi(request.id)}
                    className={`transition-all duration-200 ${
                      request.userPrayed
                        ? "bg-[#0791c4] hover:bg-[#0791c4]/90 text-white border-[#0791c4]"
                        : "border-[#faaf36] text-[#0791c4] hover:bg-[#faaf36]/10 hover:border-[#faaf36]"
                    }`}
                  >
                    <Heart
                      className={`w-4 h-4 mr-2 ${
                        request.userPrayed ? "fill-current" : ""
                      }`}
                    />
                    {request.userPrayed ? "Prayed" : "I Prayed"}
                    {isFullPage ? ` (${request.prayerCount})` : ""}
                  </Button>
                  <Badge
                    variant="outline"
                    className="border-gray-200 text-gray-600 bg-gray-50"
                  >
                    <Heart className="w-3 h-3 mr-1" />
                    {request.prayerCount} {isFullPage ? "prayers" : ""}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
          {index < prayerRequests.length - 1 && (
            <Separator className="my-6 border-gray-100" />
          )}
        </div>
      ))}
      {prayerWallHasMore && (
        <Button
          variant="outline"
          className="w-full mt-6 border-[#faaf36] text-[#0791c4] hover:bg-[#faaf36]/10"
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
        <div className="fixed top-6 right-6 z-50 bg-white border border-[#faaf36] rounded-xl shadow-lg px-4 py-3 flex items-center gap-3">
          <div className="w-5 h-5 bg-[#0791c4] rounded-full flex items-center justify-center">
            <Loader2 className="w-3 h-3 text-white animate-spin" />
          </div>
          <span className="text-sm font-medium text-gray-700">Saving...</span>
        </div>
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-gray-100 transform transition-transform duration-300 ease-in-out ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0`}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-8 border-b border-gray-100">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-[#0791c4] rounded-xl flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-xl text-gray-900">HOLY रास्ता</h1>
                <p className="text-sm text-[#faaf36] font-medium">
                  Your spiritual journey
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden hover:bg-gray-100"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="w-5 h-5 text-gray-500" />
            </Button>
          </div>

          <nav className="flex-1 p-6 space-y-2">
            {sidebarItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center space-x-4 px-4 py-3 rounded-xl text-left transition-all duration-200 ${
                  activeTab === item.id
                    ? "bg-[#0791c4] text-white shadow-sm"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <item.icon
                  className={`w-5 h-5 ${
                    activeTab === item.id ? "text-white" : "text-[#faaf36]"
                  }`}
                />
                <span className="font-medium">{item.label}</span>
                {activeTab === item.id && (
                  <ChevronRight className="w-4 h-4 ml-auto text-white" />
                )}
              </button>
            ))}
          </nav>

          <div className="p-6 border-t border-gray-100">
            <div className="flex items-center space-x-4 p-4 rounded-xl bg-gray-50">
              <Avatar className="w-10 h-10 border-2 border-[#faaf36]">
                <AvatarFallback className="bg-[#0791c4] text-white font-medium">
                  {(user?.name && user?.name.charAt(0).toUpperCase()) || "JD"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 truncate">
                  {user?.name || "John Doe"}
                </p>
                <p className="text-sm text-[#faaf36] truncate font-medium">
                  {user?.email}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-gray-400 hover:text-red-600 hover:bg-red-50"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="lg:ml-72 min-h-screen">
        <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
          <div className="flex items-center justify-between px-8 py-6">
            <div className="flex items-center space-x-6">
              <Button
                variant="ghost"
                size="sm"
                className="lg:hidden hover:bg-gray-100"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="w-5 h-5 text-gray-600" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {sidebarItems.find((item) => item.id === activeTab)?.label ||
                    "Dashboard"}
                </h1>
                <p className="text-[#faaf36] text-xs sm:text-sm font-medium mt-1">
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
                <Card className="border border-gray-100 hover:border-[#faaf36] hover:shadow-sm transition-all duration-200">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-500 text-sm font-medium mb-2">
                          Today&apos;s Total Prayers
                        </p>
                        <p className="text-3xl font-bold text-gray-900">
                          {dailyCampusPrayerCount}
                        </p>
                      </div>
                      <div className="w-12 h-12 bg-[#0791c4] rounded-xl flex items-center justify-center">
                        <Users className="w-6 h-6 text-white" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border border-gray-100 hover:border-[#faaf36] hover:shadow-sm transition-all duration-200">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-500 text-sm font-medium mb-2">
                          Your Streak
                        </p>
                        <p className="text-3xl font-bold text-gray-900">
                          {streakLoading ? (
                            <Loader2 className="w-8 h-8 animate-spin text-[#0791c4]" />
                          ) : (
                            `${userStreak}`
                          )}
                        </p>
                        {!streakLoading && (
                          <p className="text-sm text-gray-500 mt-1">Days</p>
                        )}
                      </div>
                      <div className="w-12 h-12 bg-[#faaf36] rounded-xl flex items-center justify-center">
                        <Flame className="w-6 h-6 text-white" />
                      </div>
                    </div>
                    <div className="mt-4 flex items-center text-[#faaf36] text-sm font-medium">
                      <Target className="w-4 h-4 mr-2" />
                      {userStreak > 0
                        ? "Keep it up!"
                        : "Start your streak today!"}
                    </div>
                  </CardContent>
                </Card>

                <Card className="border border-gray-100 hover:border-[#faaf36] hover:shadow-sm transition-all duration-200">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-500 text-sm font-medium mb-2">
                          Completed
                        </p>
                        <p className="text-3xl font-bold text-gray-900">
                          {checklistCompletedCount}/{checklistTotalCount}
                        </p>
                      </div>
                      <div className="w-12 h-12 bg-[#28bce7] rounded-xl flex items-center justify-center">
                        <Check className="w-6 h-6 text-white" />
                      </div>
                    </div>
                    <div className="mt-4 flex items-center text-[#faaf36] text-sm font-medium">
                      <Award className="w-4 h-4 mr-2" />
                      {Math.round(checklistProgressPercentage)}% today
                    </div>
                  </CardContent>
                </Card>

                <Card className="border border-gray-100 hover:border-[#faaf36] hover:shadow-sm transition-all duration-200">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-500 text-sm font-medium mb-2">
                          Community
                        </p>
                        <p className="text-3xl font-bold text-gray-900">
                          {prayerWallStats.totalPrayers}
                        </p>
                      </div>
                      <div className="w-12 h-12 bg-[#0791c4] rounded-xl flex items-center justify-center">
                        <Heart className="w-6 h-6 text-white" />
                      </div>
                    </div>
                    <div className="mt-4 flex items-center text-[#faaf36] text-sm font-medium">
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Total prayers offered
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                  {/* Campus Prayer Card */}
                  <Card className="border border-gray-100 shadow-sm">
                    <CardContent className="p-8 text-center">
                      <div className="space-y-8">
                        <div className="flex justify-center">
                          <div className="w-16 h-16 bg-[#faaf36]/10 rounded-2xl flex items-center justify-center">
                            <Sparkles className="w-8 h-8 text-[#faaf36]" />
                          </div>
                        </div>
                        <div className="space-y-6">
                          <h2 className="text-3xl font-bold text-gray-900">
                            Campus Prayer
                          </h2>
                          <div className="max-w-2xl mx-auto">
                            <p className="text-gray-600 leading-relaxed text-lg">
                              Oh Lord, Let the Campuses be filled with the Love
                              of the Father, Grace of Christ and the Anointing
                              of the Holy Spirit. Holy Mary, intercede for us.
                              <br />
                              <br />
                              Lord, Bless NCC, all the{" "}
                              <span className="font-semibold text-[#faaf36]">
                                {campusPrayerStep === 0
                                  ? "volunteers"
                                  : campusPrayerStep === 1
                                  ? "participants"
                                  : "volunteers and participants"}
                              </span>{" "}
                              and all campuses across India
                            </p>
                          </div>
                          <div className="flex items-center justify-center">
                            <div className="flex items-center gap-3 bg-gray-50 rounded-full px-6 py-3">
                              <Users className="w-5 h-5 text-[#0791c4]" />
                              {countLoading ? (
                                <Loader2 className="w-5 h-5 animate-spin text-[#0791c4]" />
                              ) : (
                                <span className="font-semibold text-gray-700">
                                  {dailyCampusPrayerCount} people prayed today
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Progress indicator */}
                        {campusPrayerStep > 0 && campusPrayerStep < 2 && (
                          <div className="flex items-center justify-center space-x-3">
                            <div className="w-3 h-3 bg-[#faaf36] rounded-full"></div>
                            <div className="w-3 h-3 bg-gray-200 rounded-full"></div>
                            <span className="text-sm text-[#faaf36] ml-3 font-medium">
                              Step {campusPrayerStep} of 2
                            </span>
                          </div>
                        )}

                        {campusPrayerStep < 2 ? (
                          <Button
                            onClick={handleAmenClick}
                            disabled={dailyPrayerSaving}
                            size="lg"
                            className="bg-[#0791c4] hover:bg-[#0791c4]/90 text-white px-12 py-4 h-auto rounded-2xl font-bold text-xl shadow-sm"
                          >
                            {dailyPrayerSaving ? (
                              <>
                                <Loader2 className="w-6 h-6 mr-3 animate-spin" />
                                Saving...
                              </>
                            ) : (
                              <div className="flex flex-col items-center">
                                <span>AMEN</span>
                                <span className="text-sm font-normal text-[#28bce7] mt-1">
                                  {campusPrayerStep === 0
                                    ? "for all volunteers"
                                    : "for all participants"}
                                </span>
                              </div>
                            )}
                          </Button>
                        ) : (
                          <div className="space-y-6">
                            <div className="text-center">
                              <span className="text-2xl font-bold text-gray-900">
                                Prayers Completed!
                              </span>
                            </div>
                            <div className="space-y-3 flex flex-wrap w-full m-auto justify-center items-center gap-1">
                              <Badge className="bg-blue-50 text-blue-700 border-blue-200 px-6 py-2 mb-0 h-10 w-40">
                                ✨ Well done! ✨
                              </Badge>
                              <Button
                                onClick={() => {
                                  setActiveTab("prayers");
                                  setSidebarOpen(false);
                                }}
                                variant="outline"
                                className="border-blue-200 text-blue-600 hover:bg-blue-50 hover:text-blue-700 h-10 w-40"
                              >
                                Visit Prayer Wall
                              </Button>
                            </div>
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
                          <div className="p-2 bg-[#0791c4] rounded-lg">
                            <Check className="w-5 h-5 text-blue-600" />
                          </div>
                          Daily Spiritual Practice
                        </CardTitle>
                        <Badge
                          variant="outline"
                          className="px-6 py-2 bg-[#faaf36]/10 border-[#faaf36] text-[#0791c4] font-semibold self-start sm:self-center"
                        >
                          {checklistCompletedCount}/{checklistTotalCount}{" "}
                          Complete
                        </Badge>
                      </div>
                      <div className="space-y-3 mt-6">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium text-gray-600">
                            Progress
                          </span>
                          <span className="font-bold text-[#faaf36]">
                            {Math.round(checklistProgressPercentage)}%
                          </span>
                        </div>
                        <Progress
                          value={checklistProgressPercentage}
                          className="h-2 bg-gray-100"
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
                          icon: Minus,
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
                          icon: Shield,
                          label: "Protection Prayer",
                          description:
                            "Recite Psalms 91 or Prayer to St. Michael the Archangel",
                        },
                        {
                          key: "our_father_done",
                          icon: Heart,
                          label: "Our Father",
                          description: "Pray the Lord's Prayer",
                        },
                        {
                          key: "rosary_prayed",
                          icon: Circle,
                          label: "3 Hail Mary",
                          description: "Let's be with mama Mary",
                        },
                        {
                          key: "glory_be_to",
                          icon: Crown,
                          label: "5 Glory be to",
                          description: "Let's adore the Holy Trinity",
                        },
                      ].map(({ key, icon: Icon, label, description }) => (
                        <div
                          key={key}
                          className={`group p-5 rounded-xl border cursor-pointer transition-all duration-200 ${
                            spiritualChecklist[key as ChecklistItemKey]
                              ? "border-[#faaf36] bg-[#faaf36]/5"
                              : "border-gray-100 hover:border-[#faaf36] hover:bg-gray-50"
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
                                  ? "bg-[#0791c4] text-white"
                                  : "bg-gray-100 text-gray-500 group-hover:bg-[#0791c4] group-hover:text-white"
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
                                <div className="p-1 bg-[#faaf36] rounded-full">
                                  <Check className="w-3 h-3 text-white" />
                                </div>
                              ) : (
                                <div className="w-5 h-5 border-2 border-gray-300 rounded-full group-hover:border-[#faaf36]" />
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
                  <Card className="border border-gray-100">
                    <CardHeader className="pb-4">
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-3 text-xl font-bold">
                          <MessageCircle className="w-6 h-6 text-[#faaf36]" />
                          Prayer Wall
                        </CardTitle>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handlePrayerWallRefresh}
                          disabled={
                            prayerWallRefreshing || prayerWallLoadingMore
                          }
                          className="hover:bg-gray-100"
                        >
                          <RefreshCw
                            className={`w-5 h-5 text-[#faaf36] ${
                              prayerWallRefreshing ? "animate-spin" : ""
                            }`}
                          />
                        </Button>
                      </div>
                      <div className="flex items-center gap-6 text-sm font-medium pt-3">
                        <div className="flex items-center gap-2 text-[#faaf36]">
                          <Users className="w-4 h-4" />
                          {prayerWallStats.totalRequests} requests
                        </div>
                        <div className="flex items-center gap-2 text-[#faaf36]">
                          <Heart className="w-4 h-4" />
                          {prayerWallStats.totalPrayers} prayers
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-6 max-h-[600px] overflow-y-auto">
                      {prayerWallLoading &&
                      prayerRequests.length === 0 &&
                      !prayerWallRefreshing ? (
                        <div className="flex items-center justify-center p-12">
                          <Loader2 className="w-8 h-8 animate-spin text-[#0791c4]" />
                        </div>
                      ) : prayerRequests.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                          <MessageCircle className="w-12 h-12 mx-auto mb-4 text-[#faaf36] opacity-50" />
                          <p className="font-medium">No prayer requests yet.</p>
                        </div>
                      ) : (
                        renderPrayerWallContent(false)
                      )}

                      <Dialog
                        open={newPrayerRequestDialogOpen}
                        onOpenChange={setNewPrayerRequestDialogOpen}
                      >
                        <DialogTrigger asChild>
                          <Button className="w-full mt-6 bg-[#0791c4] hover:bg-[#0791c4]/90 text-white py-3 rounded-xl font-semibold">
                            <Plus className="w-5 h-5 mr-2" />
                            Share Prayer
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md border border-gray-100 rounded-2xl">
                          <DialogHeader>
                            <DialogTitle className="flex items-center gap-3 text-xl font-bold">
                              <MessageCircle className="w-6 h-6 text-[#faaf36]" />
                              Share Prayer
                            </DialogTitle>
                            <DialogDescription className="text-[#0791c4] font-medium">
                              Share with community. Be mindful.
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-6 py-4">
                            <div className="space-y-3">
                              <Label
                                htmlFor="newPrayerMessage"
                                className="text-[#faaf36] font-semibold"
                              >
                                Your Prayer
                              </Label>
                              <Textarea
                                id="newPrayerMessage"
                                value={newPrayerMessage}
                                onChange={(e) =>
                                  setNewPrayerMessage(e.target.value)
                                }
                                maxLength={500}
                                rows={4}
                                className="resize-none border border-gray-200 focus:border-[#faaf36] rounded-xl"
                              />
                              <div className="flex justify-end text-xs text-[#faaf36] font-medium">
                                <span>{newPrayerMessage.length}/500</span>
                              </div>
                            </div>
                            <div className="flex items-center space-x-3">
                              <Switch
                                id="newPrayerIsAnonymous"
                                checked={newPrayerIsAnonymous}
                                onCheckedChange={setNewPrayerIsAnonymous}
                              />
                              <Label
                                htmlFor="newPrayerIsAnonymous"
                                className="cursor-pointer text-[#0791c4] font-medium"
                              >
                                Post anonymously
                              </Label>
                            </div>
                          </div>
                          <DialogFooter className="gap-3">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() =>
                                setNewPrayerRequestDialogOpen(false)
                              }
                              disabled={prayerRequestSubmitting}
                              className="border-gray-200 text-gray-600 hover:bg-gray-50"
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
                              className="bg-[#0791c4] hover:bg-[#0791c4]/90 text-white"
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
              <Card className="border border-gray-100 w-full">
                <CardHeader className="pb-6">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-3 text-2xl font-bold">
                      <MessageSquare className="w-7 h-7 text-[#faaf36]" />
                      Community Prayer Wall
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handlePrayerWallRefresh}
                      disabled={prayerWallRefreshing || prayerWallLoadingMore}
                      className="hover:bg-gray-100"
                    >
                      <RefreshCw
                        className={`w-5 h-5 text-[#faaf36] ${
                          prayerWallRefreshing ? "animate-spin" : ""
                        }`}
                      />
                    </Button>
                  </div>
                  <div className="flex items-center gap-6 text-sm font-medium pt-3">
                    <div className="flex items-center gap-2 text-[#faaf36]">
                      <Users className="w-4 h-4" />
                      {prayerWallStats.totalRequests} requests
                    </div>
                    <div className="flex items-center gap-2 text-[#faaf36]">
                      <Heart className="w-4 h-4" />
                      {prayerWallStats.totalPrayers} prayers
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6 max-h-[calc(100vh-250px)] overflow-y-auto">
                  {prayerWallLoading &&
                  prayerRequests.length === 0 &&
                  !prayerWallRefreshing ? (
                    <div className="flex items-center justify-center p-16">
                      <Loader2 className="w-10 h-10 animate-spin text-[#0791c4]" />
                    </div>
                  ) : prayerRequests.length === 0 ? (
                    <div className="text-center py-16 text-gray-500">
                      <MessageCircle className="w-16 h-16 mx-auto mb-6 text-[#faaf36] opacity-50" />
                      <p className="text-lg font-medium">
                        Prayer wall is empty.
                      </p>
                      <p className="text-sm mt-2">Share a request!</p>
                    </div>
                  ) : (
                    renderPrayerWallContent(true)
                  )}

                  <Dialog
                    open={newPrayerRequestDialogOpen}
                    onOpenChange={setNewPrayerRequestDialogOpen}
                  >
                    <DialogTrigger asChild>
                      <Button className="w-full mt-8 bg-[#0791c4] hover:bg-[#0791c4]/90 text-white sticky bottom-6 shadow-lg z-10 py-4 rounded-xl font-semibold text-lg">
                        <Plus className="w-5 h-5 mr-2" />
                        Share Prayer
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md border border-gray-100 rounded-2xl">
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-3 text-xl font-bold">
                          <MessageCircle className="w-6 h-6 text-[#faaf36]" />
                          Share Prayer
                        </DialogTitle>
                        <DialogDescription className="text-[#0791c4] font-medium">
                          Share with community.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-6 py-4">
                        <div className="space-y-3">
                          <Label
                            htmlFor="newPrayerMessageFull"
                            className="text-[#faaf36] font-semibold"
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
                            rows={4}
                            className="resize-none border border-gray-200 focus:border-[#faaf36] rounded-xl"
                          />
                          <div className="flex justify-end text-xs text-[#faaf36] font-medium">
                            <span>{newPrayerMessage.length}/500</span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <Switch
                            id="newPrayerIsAnonymousFull"
                            checked={newPrayerIsAnonymous}
                            onCheckedChange={setNewPrayerIsAnonymous}
                          />
                          <Label
                            htmlFor="newPrayerIsAnonymousFull"
                            className="cursor-pointer text-[#0791c4] font-medium"
                          >
                            Post anonymously
                          </Label>
                        </div>
                      </div>
                      <DialogFooter className="gap-3">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setNewPrayerRequestDialogOpen(false)}
                          disabled={prayerRequestSubmitting}
                          className="border-gray-200 text-gray-600 hover:bg-gray-50"
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
                          className="bg-[#0791c4] hover:bg-[#0791c4]/90 text-white"
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
              <Card className="inline-block p-12 border border-gray-100 rounded-2xl hover:border-[#faaf36] hover:shadow-sm transition-all duration-200">
                <CardHeader>
                  <CardTitle className="text-2xl font-bold text-gray-800">
                    Coming Soon!
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 text-lg">
                    Content for{" "}
                    <span className="font-bold text-[#faaf36]">
                      {
                        sidebarItems.find((item) => item.id === activeTab)
                          ?.label
                      }
                    </span>{" "}
                    is under development.
                  </p>
                  <div className="mt-8">
                    {React.createElement(
                      sidebarItems.find((item) => item.id === activeTab)
                        ?.icon || Home,
                      {
                        className:
                          "w-20 h-20 mx-auto text-[#faaf36] p-4 bg-[#faaf36]/10 rounded-2xl",
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
