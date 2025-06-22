"use client";

import { useState, Suspense } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import Link from "next/link";
import Image from "next/image";
import { Lock, Mail, Eye, EyeOff, Loader2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Account, Client, OAuthProvider } from "appwrite";

// Define Zod schema for form validation
const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address."),
  password: z.string().min(8, "Password must be at least 8 characters."),
});

function LoginFormContent() {
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [formErrors, setFormErrors] = useState<{
    email?: string;
    password?: string;
  }>({});

  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get("redirect") || "/dashboard";

  // Check for OAuth error in URL params
  const oauthError = searchParams.get("oauth_error");
  if (oauthError && !errorMessage) {
    switch (oauthError) {
      case "missing_params":
        setErrorMessage(
          "OAuth authentication failed. Missing required parameters."
        );
        break;
      case "callback_failed":
        setErrorMessage("OAuth authentication failed. Please try again.");
        break;
      default:
        setErrorMessage("Google Sign-In failed. Please try again.");
    }
  }

  async function onSubmit(event: React.SyntheticEvent) {
    event.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);
    setFormErrors({});

    try {
      const formData = new FormData(event.target as HTMLFormElement);
      const email = (formData.get("email") as string)?.trim();
      const password = formData.get("password") as string;

      const validationResult = loginSchema.safeParse({ email, password });

      if (!validationResult.success) {
        const errors = validationResult.error.flatten().fieldErrors;
        setFormErrors({
          email: errors.email?.[0],
          password: errors.password?.[0],
        });
        setIsLoading(false);
        return;
      }

      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const data = await res.json();
        setErrorMessage(
          data.error || "Login failed. Please check your credentials."
        );
        setIsLoading(false);
        return;
      }
      // On success, redirect
      router.push(redirectPath);
    } catch (error) {
      setErrorMessage("An unexpected error occurred. Please try again.");
      console.error("Login error:", error);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleGoogleSignIn() {
    setIsGoogleLoading(true);
    setErrorMessage(null);

    try {
      const client = new Client()
        .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT as string)
        .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID as string);

      const account = new Account(client);

      // Updated OAuth URLs to use the callback route
      const successUrl = `${window.location.origin}/api/auth/oauth/callback`;
      const failureUrl = `${window.location.origin}/login?oauth_error=true`;

      // Create OAuth2 session - this will redirect the user
      account.createOAuth2Session(OAuthProvider.Google, successUrl, failureUrl);

      // Note: The code after this won't execute because the user will be redirected
      // The actual session handling happens in the callback route
    } catch (error) {
      setErrorMessage("Failed to initiate Google Sign-In. Please try again.");
      console.error("Google Sign-In Error:", error);
      setIsGoogleLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-secondary/30 to-background p-4 sm:p-6 md:p-8">
      <div className="relative w-full max-w-4xl bg-card shadow-2xl rounded-xl overflow-hidden md:grid md:grid-cols-2">
        {/* Left Side - Illustration/Branding */}
        <div className="hidden md:flex flex-col items-center justify-center p-12 bg-primary text-primary-foreground">
          <Image
            src="/images/auth_illustration.png"
            alt="Prayer and Community"
            width={300}
            height={300}
            className="mb-8"
          />
          <h1 className="text-3xl font-bold text-center mb-4">
            Join Our Prayer Community
          </h1>
          <p className="text-center text-primary-foreground/80">
            Connect, share, and grow in faith together. Your spiritual journey
            awaits.
          </p>
        </div>

        {/* Right Side - Form */}
        <div className="p-6 sm:p-8 md:p-12">
          <div className="mb-8 text-center md:text-left">
            <Link href="/" className="inline-block mb-6">
              <Image
                src="/images/logo.png"
                alt="App Logo"
                width={40}
                height={40}
              />
            </Link>
            <h2 className="text-3xl font-bold text-foreground">
              Welcome Back!
            </h2>
            <p className="text-muted-foreground mt-1">
              Sign in to continue your prayer journey.
            </p>
          </div>

          {errorMessage && (
            <div
              className="bg-destructive/10 border border-destructive/30 text-destructive rounded-md p-3 mb-6 text-sm flex items-center gap-2"
              role="alert"
            >
              <Lock size={16} />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={onSubmit} className="space-y-6">
            <div>
              <Label
                htmlFor="email"
                className="text-sm font-medium text-foreground/90"
              >
                Email Address
              </Label>
              <div className="relative mt-1">
                <Mail
                  className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground"
                  aria-hidden="true"
                />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  disabled={isLoading || isGoogleLoading}
                  className={`pl-10 h-12 rounded-md ${
                    formErrors.email
                      ? "border-destructive focus-visible:ring-destructive/50"
                      : "border-border"
                  }`}
                  aria-invalid={!!formErrors.email}
                  aria-describedby="email-error"
                />
              </div>
              {formErrors.email && (
                <p id="email-error" className="text-destructive text-xs mt-1.5">
                  {formErrors.email}
                </p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between">
                <Label
                  htmlFor="password"
                  className="text-sm font-medium text-foreground/90"
                >
                  Password
                </Label>
                <Link
                  href="/forgot-password"
                  className="text-xs text-primary hover:text-primary/80 font-medium"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative mt-1">
                <Lock
                  className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground"
                  aria-hidden="true"
                />
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  disabled={isLoading || isGoogleLoading}
                  className={`pl-10 pr-10 h-12 rounded-md ${
                    formErrors.password
                      ? "border-destructive focus-visible:ring-destructive/50"
                      : "border-border"
                  }`}
                  aria-invalid={!!formErrors.password}
                  aria-describedby="password-error"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
              {formErrors.password && (
                <p
                  id="password-error"
                  className="text-destructive text-xs mt-1.5"
                >
                  {formErrors.password}
                </p>
              )}
            </div>

            <div className="flex items-center">
              <Checkbox
                id="remember"
                name="remember"
                disabled={isLoading || isGoogleLoading}
                className="rounded border-border data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
              />
              <Label
                htmlFor="remember"
                className="ml-2 block text-sm text-foreground/90 cursor-pointer"
              >
                Remember me
              </Label>
            </div>

            <Button
              type="submit"
              className="w-full h-12 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:ring-ring focus-visible:ring-offset-2"
              disabled={isLoading || isGoogleLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing In...
                </>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>

          {/* OR Separator and Google Sign In Button */}
          <div className="relative my-6">
            <div
              className="absolute inset-0 flex items-center"
              aria-hidden="true"
            >
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">
                Or sign in with
              </span>
            </div>
          </div>

          <Button
            variant="outline"
            className="w-full h-12 rounded-md border-border hover:bg-accent hover:text-accent-foreground"
            onClick={handleGoogleSignIn}
            disabled={isLoading || isGoogleLoading}
            type="button"
          >
            {isGoogleLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Redirecting to Google...
              </>
            ) : (
              <>
                <Image
                  src="/images/google-logo.png"
                  alt="Google"
                  width={20}
                  height={20}
                  className="mr-2"
                />
                Sign In with Google
              </>
            )}
          </Button>

          <p className="mt-8 text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link
              href="/signup"
              className="font-semibold text-primary hover:text-primary/80"
            >
              Create an account
            </Link>
          </p>

          <div className="mt-10 text-center text-xs text-muted-foreground/70">
            © {new Date().getFullYear()} National Campus Conference&apos;25. All
            rights reserved.
          </div>
        </div>
      </div>
    </div>
  );
}

function LoginFormSkeleton() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-secondary/30 to-background p-4 sm:p-6 md:p-8">
      <div className="w-full max-w-4xl bg-card shadow-2xl rounded-xl overflow-hidden md:grid md:grid-cols-2 animate-pulse">
        {/* Left Side Skeleton */}
        <div className="hidden md:flex flex-col items-center justify-center p-12 bg-primary/80">
          <div className="w-48 h-48 bg-primary-foreground/20 rounded-full mb-8"></div>
          <div className="h-8 bg-primary-foreground/20 rounded w-3/4 mb-4"></div>
          <div className="h-4 bg-primary-foreground/20 rounded w-full mb-2"></div>
          <div className="h-4 bg-primary-foreground/20 rounded w-5/6"></div>
        </div>

        {/* Right Side Skeleton */}
        <div className="p-6 sm:p-8 md:p-12">
          <div className="mb-8">
            <div className="w-10 h-10 bg-muted rounded mb-6"></div>
            <div className="h-8 bg-muted rounded w-3/5 mb-2"></div>
            <div className="h-4 bg-muted rounded w-4/5"></div>
          </div>
          <div className="space-y-6">
            <div>
              <div className="h-4 bg-muted rounded w-1/4 mb-1.5"></div>
              <div className="h-12 bg-muted rounded-md"></div>
            </div>
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <div className="h-4 bg-muted rounded w-1/4"></div>
                <div className="h-3 bg-muted rounded w-1/5"></div>
              </div>
              <div className="h-12 bg-muted rounded-md"></div>
            </div>
            <div className="flex items-center">
              <div className="w-5 h-5 bg-muted rounded"></div>
              <div className="h-4 bg-muted rounded w-1/3 ml-2"></div>
            </div>
            <div className="h-12 bg-primary/80 rounded-md"></div>
          </div>
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border/50" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-card px-2 h-3 w-1/4 bg-muted rounded"></span>
            </div>
          </div>
          <div className="h-12 bg-muted/80 rounded-md border border-border/50"></div>
          <div className="h-4 bg-muted rounded w-1/2 mx-auto mt-8"></div>
          <div className="h-3 bg-muted rounded w-2/3 mx-auto mt-10"></div>
        </div>
      </div>
    </div>
  );
}

export function LoginForm() {
  return (
    <Suspense fallback={<LoginFormSkeleton />}>
      <LoginFormContent />
    </Suspense>
  );
}
