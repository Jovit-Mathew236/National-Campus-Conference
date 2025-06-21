"use client";

import { useState, Suspense } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import Link from "next/link";
import Image from "next/image";
import { Lock } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

// Define Zod schema for form validation
const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

function LoginFormContent() {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<{
    email?: string;
    password?: string;
  }>({});

  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get("redirect") || "/dashboard";

  async function onSubmit(event: React.SyntheticEvent) {
    event.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);
    setFormErrors({});

    try {
      const formData = new FormData(event.target as HTMLFormElement);
      const email = formData.get("email") as string;
      const password = formData.get("password") as string;

      // Make sure email is trimmed to remove any whitespace
      const trimmedEmail = email.trim();

      // Validate form data with Zod
      const validationResult = loginSchema.safeParse({
        email: trimmedEmail,
        password,
      });

      if (!validationResult.success) {
        const errors = validationResult.error.flatten().fieldErrors;
        setFormErrors({
          email: errors.email?.[0],
          password: errors.password?.[0],
        });
        setIsLoading(false);
        return;
      }

      // Call the API route for login
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmedEmail, password }),
      });

      if (!res.ok) {
        const data = await res.json();
        setErrorMessage(
          data.error || "Invalid email or password. Please try again."
        );
        setIsLoading(false);
        return;
      }
      console.log("Login successful, redirecting...", res, redirectPath);

      // On success, redirect to dashboard or redirectPath
      router.push(redirectPath);
    } catch (error) {
      setErrorMessage("Invalid email or password. Please try again.");
      console.error("Login error:", error);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card className="w-fit border-none shadow-md p-0">
      <div className="bg-secondary rounded-t-md p-6 flex flex-col">
        <div className="mt-4 flex justify-between items-center">
          <div>
            <h2 className="text-primary text-3xl font-semibold">
              Welcome Back!
            </h2>
            <p className="text-primary mt-2 opacity-80">Sign in to continue</p>
          </div>
          <div className="flex flex-end">
            <Image
              src="/images/auth_illustration.png"
              alt="Person working"
              width={180}
              height={150}
            />
          </div>
        </div>
      </div>

      <form onSubmit={onSubmit}>
        <CardContent className="p-6 pt-8">
          {errorMessage && (
            <div className="bg-red-50 border border-red-200 text-red-800 rounded-md p-3 mb-4">
              {errorMessage}
            </div>
          )}
          <div className="grid gap-6">
            <div className="grid gap-2">
              <Label htmlFor="email" className="text-base font-medium">
                Email
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="Enter email"
                disabled={isLoading}
                className={`h-12 rounded-md ${
                  formErrors.email ? "border-red-500" : ""
                }`}
              />
              {formErrors.email && (
                <p className="text-red-500 text-sm mt-1">{formErrors.email}</p>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password" className="text-base font-medium">
                Password
              </Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="Enter password"
                disabled={isLoading}
                className={`h-12 rounded-md ${
                  formErrors.password ? "border-red-500" : ""
                }`}
              />
              {formErrors.password && (
                <p className="text-red-500 text-sm mt-1">
                  {formErrors.password}
                </p>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="remember"
                className="rounded border-border data-[state=checked]:bg-primary"
              />
              <label
                htmlFor="remember"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Remember me
              </label>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4 p-6 pt-0">
          <Button
            className="w-full h-12 rounded-md bg-primary text-primary-foreground"
            type="submit"
            disabled={isLoading}
          >
            {isLoading ? "Loading..." : "Log In"}
          </Button>
          <div className="flex justify-center items-center mt-2 text-muted-foreground">
            <Lock className="w-4 h-4 mr-2" />
            <Link
              href="/forgot-password"
              className="text-muted-foreground hover:text-foreground"
            >
              Forgot your password?
            </Link>
          </div>
          <div className="text-center text-sm mt-4">
            Don&apos;t have an account?{" "}
            <Link
              href="/signup"
              className="text-primary font-medium hover:text-primary/80"
            >
              Sign up
            </Link>
          </div>
          <div className="text-center text-xs text-muted-foreground mt-8">
            {/* © 2020 Crafted and designed Jesusyouthpala */}
          </div>
        </CardFooter>
      </form>
    </Card>
  );
}

function LoginFormSkeleton() {
  return (
    <Card className="w-fit border-none shadow-md p-0 animate-pulse">
      <div className="bg-secondary rounded-t-md p-6 flex flex-col">
        <div className="mt-4 flex justify-between items-center">
          <div>
            <div className="h-8 bg-gray-300 rounded w-48 mb-2"></div>
            <div className="h-4 bg-gray-300 rounded w-32"></div>
          </div>
          <div className="flex flex-end">
            <div className="w-[180px] h-[150px] bg-gray-300 rounded"></div>
          </div>
        </div>
      </div>
      <CardContent className="p-6 pt-8">
        <div className="grid gap-6">
          <div className="grid gap-2">
            <div className="h-4 bg-gray-300 rounded w-16"></div>
            <div className="h-12 bg-gray-300 rounded"></div>
          </div>
          <div className="grid gap-2">
            <div className="h-4 bg-gray-300 rounded w-20"></div>
            <div className="h-12 bg-gray-300 rounded"></div>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-gray-300 rounded"></div>
            <div className="h-4 bg-gray-300 rounded w-24"></div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col gap-4 p-6 pt-0">
        <div className="w-full h-12 bg-gray-300 rounded"></div>
      </CardFooter>
    </Card>
  );
}

export function LoginForm() {
  return (
    <Suspense fallback={<LoginFormSkeleton />}>
      <LoginFormContent />
    </Suspense>
  );
}
