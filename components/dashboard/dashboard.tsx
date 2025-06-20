"use client";
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
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
} from "lucide-react";
import confetti from "canvas-confetti";

// Define a type for the checklist keys for better type safety
type ChecklistItemKey =
  | "mass_attended"
  | "rosary_prayed"
  | "word_of_god_read"
  | "our_father_done";

const initialChecklist: Record<ChecklistItemKey, boolean> = {
  mass_attended: false,
  rosary_prayed: false,
  word_of_god_read: false,
  our_father_done: false,
};

interface PrayerRequest {
  id: number;
  user: string;
  message: string;
  isAnonymous: boolean;
  prayerCount: number;
  userPrayed: boolean;
  createdAt: string;
  avatar?: string;
}

interface DailyPrayerData {
  campus_prayer_done: boolean;
  mass_attended: boolean;
  rosary_prayed: boolean;
  word_of_god_read: boolean;
  our_father_done: boolean;
  date: string;
}

export default function PrayerDashboard() {
  const [dailyPrayerDone, setDailyPrayerDone] = useState(false);
  const [checklist, setChecklist] = useState(initialChecklist);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [prayerRequests, setPrayerRequests] = useState<PrayerRequest[]>([
    {
      id: 1,
      user: "Maria A.",
      message:
        "Please pray for my upcoming exams. I'm really nervous and need God's guidance.",
      isAnonymous: false,
      prayerCount: 12,
      userPrayed: false,
      createdAt: "2 hours ago",
      avatar: "/api/placeholder/40/40",
    },
    {
      id: 2,
      user: "Anonymous",
      message:
        "My family is going through a difficult time. Please keep us in your prayers.",
      isAnonymous: true,
      prayerCount: 8,
      userPrayed: true,
      createdAt: "4 hours ago",
    },
    {
      id: 3,
      user: "John M.",
      message: "Praying for healing for my grandmother who is in the hospital.",
      isAnonymous: false,
      prayerCount: 25,
      userPrayed: false,
      createdAt: "6 hours ago",
      avatar: "/api/placeholder/40/40",
    },
  ]);
  // const [showCelebration, setShowCelebration] = useState(false);

  // Load daily prayer data on component mount
  useEffect(() => {
    loadDailyPrayerData();
  }, []);

  const loadDailyPrayerData = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/prayers/daily", {
        method: "GET",
        credentials: "include",
      });

      if (response.ok) {
        const result = await response.json();
        const data: DailyPrayerData = result.data;

        setDailyPrayerDone(data.campus_prayer_done);
        setChecklist({
          mass_attended: data.mass_attended,
          rosary_prayed: data.rosary_prayed,
          word_of_god_read: data.word_of_god_read,
          our_father_done: data.our_father_done,
        });
      } else {
        console.error("Failed to load daily prayer data");
      }
    } catch (error) {
      console.error("Error loading daily prayer data:", error);
    } finally {
      setLoading(false);
    }
  };

  const updatePrayerData = async (updates: Partial<DailyPrayerData>) => {
    try {
      setSaving(true);
      const response = await fetch("/api/prayers/daily", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error("Failed to update prayer data");
      }

      const result = await response.json();
      return result.success;
    } catch (error) {
      console.error("Error updating prayer data:", error);
      return false;
    } finally {
      setSaving(false);
    }
  };

  const handleAmenClick = async () => {
    const success = await updatePrayerData({ campus_prayer_done: true });

    if (success) {
      setDailyPrayerDone(true);
      const duration = 5 * 1000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

      const randomInRange = (min: number, max: number) =>
        Math.random() * (max - min) + min;

      const interval = window.setInterval(() => {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

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
      // setShowCelebration(true);
      // setTimeout(() => setShowCelebration(false), 3000);
    } else {
      alert("Failed to update prayer status. Please try again.");
    }
  };

  const toggleChecklistItem = async (item: ChecklistItemKey) => {
    const newValue = !checklist[item];

    // Optimistically update UI
    setChecklist((prev) => ({
      ...prev,
      [item]: newValue,
    }));

    // Update database
    const success = await updatePrayerData({ [item]: newValue });

    if (!success) {
      // Revert on failure
      setChecklist((prev) => ({
        ...prev,
        [item]: !newValue,
      }));
      alert("Failed to update prayer status. Please try again.");
    }
  };

  const handlePrayerReaction = (requestId: number) => {
    setPrayerRequests((prev) =>
      prev.map((request) =>
        request.id === requestId
          ? {
              ...request,
              userPrayed: !request.userPrayed,
              prayerCount: request.userPrayed
                ? request.prayerCount - 1
                : request.prayerCount + 1,
            }
          : request
      )
    );
  };

  const completedCount = Object.values(checklist).filter(Boolean).length;
  const totalCount = Object.keys(checklist).length;
  const progressPercentage =
    totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
          <span className="text-lg text-indigo-600">
            Loading your prayer journey...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* {showCelebration && (
        <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
          <div className="animate-bounce">
            <div className="text-6xl">🎉</div>
          </div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <div className="text-2xl font-bold text-emerald-600 animate-pulse">
              Blessed! ✨
            </div>
          </div>
        </div>
      )} */}

      {saving && (
        <div className="fixed top-4 right-4 z-50">
          <div className="bg-white border border-indigo-200 rounded-lg shadow-lg px-4 py-2 flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
            <span className="text-sm text-indigo-600">Saving...</span>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Top Bar with Logout Button */}
        <div className="flex justify-end items-center mb-6">
          <Button
            variant="outline"
            className="flex items-center gap-2 border-indigo-500 text-indigo-700 hover:bg-indigo-50 hover:text-indigo-900 font-semibold shadow-sm px-5 py-2 rounded-full transition-all duration-200"
            onClick={async () => {
              try {
                await fetch("/api/auth/logout", { method: "POST" });
                window.location.href = "/login";
              } catch (e) {
                alert("Logout failed. Please try again.");
                console.error("Logout error:", e);
              }
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H7a2 2 0 01-2-2V7a2 2 0 012-2h4a2 2 0 012 2v1"
              />
            </svg>
            Logout
          </Button>
        </div>

        {/* Header Section */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 bg-clip-text text-transparent mb-4">
            Daily Prayer Journey
          </h1>
          <p className="text-xl text-muted-foreground">
            Connect with God and your community through prayer
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Daily Prayer & Checklist */}
          <div className="lg:col-span-2 space-y-8">
            {/* Daily Prayer Card */}
            <Card className="relative overflow-hidden border-0 shadow-xl">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 via-purple-500 to-blue-600" />
              <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%2523ffffff%22%20fill-opacity%3D%220.1%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-30" />

              <CardContent className="relative p-8 text-center text-white">
                <div className="space-y-6">
                  <div className="flex justify-center">
                    <div className="p-4 bg-white/20 rounded-full backdrop-blur-sm">
                      <Sparkles className="w-8 h-8 text-yellow-200" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h2 className="text-3xl font-bold">Campus Prayer</h2>
                    <p className="text-lg text-white/90">
                      Have you connected with God today?
                    </p>
                  </div>

                  {!dailyPrayerDone ? (
                    <Button
                      onClick={handleAmenClick}
                      disabled={saving}
                      size="lg"
                      className="bg-white text-indigo-600 hover:bg-white/90 text-xl px-12 py-6 h-auto rounded-full font-bold shadow-lg transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:transform-none"
                    >
                      {saving ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>🙏 AMEN</>
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
              </CardContent>
            </Card>

            {/* Daily Spiritual Checklist */}
            <Card className="shadow-lg">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-2xl font-bold flex items-center gap-2">
                    <Check className="w-6 h-6 text-emerald-600" />
                    Daily Spiritual Practice
                  </CardTitle>
                  <Badge variant="outline" className="text-sm">
                    {completedCount}/{totalCount} Complete
                  </Badge>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>Progress</span>
                    <span>{Math.round(progressPercentage)}%</span>
                  </div>
                  <Progress value={progressPercentage} className="h-2" />
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
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
                  <div key={key}>
                    <div
                      className={`group p-4 rounded-lg border-2 cursor-pointer transition-all duration-300 hover:shadow-md ${
                        checklist[key as ChecklistItemKey]
                          ? "border-emerald-200 bg-emerald-50 shadow-sm"
                          : "border-border hover:border-indigo-200 hover:bg-accent/50"
                      } ${saving ? "opacity-50 pointer-events-none" : ""}`}
                      onClick={() =>
                        !saving && toggleChecklistItem(key as ChecklistItemKey)
                      }
                    >
                      <div className="flex items-center space-x-4">
                        <div
                          className={`p-2 rounded-full transition-colors ${
                            checklist[key as ChecklistItemKey]
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
                          {checklist[key as ChecklistItemKey] ? (
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
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Prayer Wall */}
          <div className="space-y-6">
            <Card className="shadow-lg">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="w-5 h-5 text-indigo-600" />
                  Prayer Wall
                </CardTitle>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    {prayerRequests.length} requests
                  </div>
                  <div className="flex items-center gap-1">
                    <Heart className="w-4 h-4" />
                    {prayerRequests.reduce(
                      (sum, req) => sum + req.prayerCount,
                      0
                    )}{" "}
                    prayers
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {prayerRequests.map((request, index) => (
                  <div key={request.id}>
                    <div className="space-y-3">
                      <div className="flex items-start space-x-3">
                        <Avatar className="w-10 h-10 border-2 border-white shadow-sm">
                          {request.isAnonymous || !request.avatar ? (
                            <AvatarFallback className="bg-gradient-to-br from-slate-400 to-slate-500 text-white">
                              🙏
                            </AvatarFallback>
                          ) : (
                            <>
                              <AvatarImage
                                src={request.avatar}
                                alt={request.user}
                              />
                              <AvatarFallback className="bg-gradient-to-br from-indigo-400 to-purple-500 text-white font-semibold">
                                {request.user.charAt(0)}
                              </AvatarFallback>
                            </>
                          )}
                        </Avatar>

                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2 text-sm">
                            <span className="font-semibold">
                              {request.isAnonymous ? "Anonymous" : request.user}
                            </span>
                            <Badge variant="secondary" className="text-xs">
                              <Clock className="w-3 h-3 mr-1" />
                              {request.createdAt}
                            </Badge>
                          </div>

                          <p className="text-sm leading-relaxed text-foreground/90">
                            {request.message}
                          </p>

                          <div className="flex items-center justify-between pt-2">
                            <Button
                              variant={
                                request.userPrayed ? "default" : "outline"
                              }
                              size="sm"
                              onClick={() => handlePrayerReaction(request.id)}
                              className={`text-xs ${
                                request.userPrayed
                                  ? "bg-red-500 hover:bg-red-600 text-white border-red-500"
                                  : "hover:bg-red-50 hover:text-red-600 hover:border-red-300"
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
                      <Separator className="mt-4" />
                    )}
                  </div>
                ))}

                <Button
                  className="w-full mt-6 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
                  size="lg"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Share Prayer Request
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
