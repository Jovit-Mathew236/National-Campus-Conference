"use client";
import React, { useState } from "react"; // Removed unused useEffect
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
  // User, // User icon was imported but not used directly
  MessageCircle,
  Church,
  BookOpen,
  Cross,
  Sparkles,
  Plus,
  Clock,
  Users,
} from "lucide-react";

// Define a type for the checklist keys for better type safety
type ChecklistItemKey = "holyMass" | "rosary" | "wordOfGod" | "ourFather";

const initialChecklist: Record<ChecklistItemKey, boolean> = {
  holyMass: false,
  rosary: false,
  wordOfGod: false,
  ourFather: false,
};

interface PrayerRequest {
  id: number;
  user: string;
  message: string;
  isAnonymous: boolean;
  prayerCount: number;
  userPrayed: boolean;
  createdAt: string;
  avatar?: string; // Optional avatar
}

export default function PrayerDashboard() {
  const [dailyPrayerDone, setDailyPrayerDone] = useState(false);
  const [checklist, setChecklist] = useState(initialChecklist);
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
      avatar: "/api/placeholder/40/40", // Make sure this endpoint works or use actual image paths
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
      avatar: "/api/placeholder/40/40", // Make sure this endpoint works or use actual image paths
    },
  ]);
  const [showCelebration, setShowCelebration] = useState(false);

  const handleAmenClick = () => {
    setDailyPrayerDone(true);
    setShowCelebration(true);
    setTimeout(() => setShowCelebration(false), 3000);
  };

  const toggleChecklistItem = (item: ChecklistItemKey) => {
    setChecklist((prev) => ({
      ...prev,
      [item]: !prev[item],
    }));
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {showCelebration && (
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
      )}

      <div className="container mx-auto px-4 py-8 max-w-6xl">
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
                      size="lg"
                      className="bg-white text-indigo-600 hover:bg-white/90 text-xl px-12 py-6 h-auto rounded-full font-bold shadow-lg transform hover:scale-105 transition-all duration-300"
                    >
                      🙏 AMEN
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
                    key: "holyMass",
                    icon: Church,
                    label: "Holy Mass",
                    description: "Attend or watch Mass",
                  },
                  {
                    key: "rosary",
                    icon: Star,
                    label: "Rosary",
                    description: "Pray the Holy Rosary",
                  },
                  {
                    key: "wordOfGod",
                    icon: BookOpen,
                    label: "Word of God",
                    description: "Read Scripture",
                  },
                  {
                    key: "ourFather",
                    icon: Cross,
                    label: "Our Father",
                    description: "Pray the Lord's Prayer",
                  },
                ].map(({ key, icon: Icon, label, description }) => (
                  <div key={key}>
                    <div
                      className={`group p-4 rounded-lg border-2 cursor-pointer transition-all duration-300 hover:shadow-md ${
                        checklist[key as ChecklistItemKey] // Use type assertion here
                          ? "border-emerald-200 bg-emerald-50 shadow-sm"
                          : "border-border hover:border-indigo-200 hover:bg-accent/50"
                      }`}
                      onClick={() =>
                        toggleChecklistItem(key as ChecklistItemKey)
                      } // And here
                    >
                      <div className="flex items-center space-x-4">
                        <div
                          className={`p-2 rounded-full transition-colors ${
                            checklist[key as ChecklistItemKey] // And here
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
                          {checklist[key as ChecklistItemKey] ? ( // And here
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
                  // onClick={() => { /* Implement add prayer request functionality */ }}
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
