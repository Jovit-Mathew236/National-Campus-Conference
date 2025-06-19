"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

// Define the User type
interface User {
  $id: string;
  name: string;
  email: string;
  emailVerification: boolean;
  registration: string;
}

export default function Dashboard() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Check if user is authenticated
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/auth/me");
        if (!response.ok) {
          router.push("/login");
          return;
        }
        const data = await response.json();
        setUser(data.user);
      } catch (error) {
        console.error("Auth check failed:", error);
        router.push("/login");
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  const handleLogout = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/auth/logout", { method: "POST" });
      if (response.ok) {
        router.push("/login");
      } else {
        console.error("Logout failed");
        // Even if logout fails, redirect to login
        router.push("/login");
      }
    } catch (error) {
      console.error("Logout error:", error);
      router.push("/login");
    }
  };

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <Button variant="outline" onClick={handleLogout} disabled={isLoading}>
            {isLoading ? "Logging out..." : "Logout"}
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6">
            <h3 className="font-semibold mb-2">Profile</h3>
            <p className="text-gray-600">Welcome, {user?.name}</p>
            <p className="text-sm text-gray-500">{user?.email}</p>
            <p className="text-xs text-gray-400 mt-2">
              Email {user?.emailVerification ? "verified" : "not verified"}
            </p>
          </Card>

          <Card className="p-6">
            <h3 className="font-semibold mb-2">Statistics</h3>
            <div className="space-y-2">
              <p className="text-gray-600">Total Prayers: 0</p>
              <p className="text-gray-600">Active Groups: 0</p>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="font-semibold mb-2">Recent Activity</h3>
            <p className="text-gray-500">No recent activity</p>
            <p className="text-xs text-gray-400 mt-2">
              Member since:{" "}
              {user?.registration
                ? new Date(user.registration).toLocaleDateString()
                : "Unknown"}
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div className="h-8 w-40 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-10 w-24 bg-gray-200 rounded animate-pulse"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="p-6">
              <div className="h-5 w-24 bg-gray-200 rounded animate-pulse mb-4"></div>
              <div className="space-y-2">
                <div className="h-4 w-full bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
