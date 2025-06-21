// src/components/auth/signup-form.tsx (or similar path)
"use client";

import { useState, Suspense } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import Image from "next/image";
import { User, Mail, Lock, Eye, EyeOff, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

// Define Zod schema for form validation
const signupSchema = z
  .object({
    name: z
      .string()
      .min(2, "Name must be at least 2 characters.")
      .max(50, "Name must be 50 characters or less."),
    email: z.string().email("Please enter a valid email address."),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters.")
      .max(100, "Password is too long."),
    // regex for at least one uppercase, one lowercase, one number, one special character
    // .regex(
    //   /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
    //   "Password must include uppercase, lowercase, number, and special character."
    // ),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

function SignupFormContent() {
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formErrors, setFormErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});

  const router = useRouter();

  async function onSubmit(event: React.SyntheticEvent) {
    event.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    setFormErrors({});

    try {
      const formData = new FormData(event.target as HTMLFormElement);
      const name = (formData.get("name") as string)?.trim();
      const email = (formData.get("email") as string)?.trim();
      const password = formData.get("password") as string;
      const confirmPassword = formData.get("confirmPassword") as string;

      const validationResult = signupSchema.safeParse({
        name,
        email,
        password,
        confirmPassword,
      });

      if (!validationResult.success) {
        const errors = validationResult.error.flatten().fieldErrors;
        setFormErrors({
          name: errors.name?.[0],
          email: errors.email?.[0],
          password: errors.password?.[0],
          confirmPassword: errors.confirmPassword?.[0],
        });
        setIsLoading(false);
        return;
      }

      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(
          data.error || "Failed to create account. Please try again."
        );
        setIsLoading(false);
        return;
      }

      setSuccessMessage(
        data.message || "Account created! Redirecting to login..."
      );
      // Optionally, clear form or redirect after a delay
      setTimeout(() => {
        router.push("/login?signupSuccess=true"); // Can add a query param if login page handles it
      }, 3000);
    } catch (error) {
      setErrorMessage("An unexpected error occurred. Please try again.");
      console.error("Signup error:", error);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleGoogleSignup() {
    setIsGoogleLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      const appwriteEndpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
      const appwriteProject = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;

      if (!appwriteEndpoint || !appwriteProject) {
        setErrorMessage(
          "Google Sign-Up is currently unavailable. Please try again later or use email/password."
        );
        setIsGoogleLoading(false);
        return;
      }
      // Success URL should ideally be a page that handles the OAuth completion,
      // then redirects to dashboard. For simplicity, redirecting to dashboard.
      const successUrl = `${window.location.origin}/dashboard`;
      // Failure URL should bring them back to signup, perhaps with an error message.
      const failureUrl = `${window.location.origin}/signup?oauth_error=true`;

      window.location.href = `${appwriteEndpoint}/account/sessions/oauth2/google?project=${appwriteProject}&success=${encodeURIComponent(
        successUrl
      )}&failure=${encodeURIComponent(failureUrl)}`;
    } catch (error) {
      setErrorMessage("Failed to initiate Google Sign-Up. Please try again.");
      console.error("Google Signup Error:", error);
      setIsGoogleLoading(false);
    }
  }

  return (
    <div className="w-dvw min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-secondary/30 to-background p-0 sm:p-6 md:p-8">
      <div className="h-dvh sm:h-auto relative w-full max-w-4xl bg-card shadow-2xl rounded-xl overflow-hidden md:grid md:grid-cols-2">
        {/* Left Side - Illustration/Branding */}
        <div className="hidden md:flex flex-col items-center justify-center p-12 bg-primary text-primary-foreground">
          <Image
            src="/images/auth_illustration.png" // Replace with a relevant illustration for signup
            alt="Community and Faith"
            width={300}
            height={300}
            className="mb-8"
          />
          <h1 className="text-3xl font-bold text-center mb-4">
            Begin Your Journey With Us
          </h1>
          <p className="text-center text-primary-foreground/80">
            Create an account to join a vibrant community of faith, share
            prayers, and grow spiritually.
          </p>
        </div>

        {/* Right Side - Form */}
        <div className="p-6 sm:p-8 md:p-12 flex sm:block flex-col h-dvh sm:h-auto justify-between">
          <div className="mb-8 text-center md:text-left">
            <Link href="/" className="inline-block mb-6">
              <Image
                src="/images/logo.png" // Replace with your logo
                alt="App Logo"
                width={40}
                height={40}
              />
            </Link>
            <h2 className="text-3xl font-bold text-foreground">
              Create Account
            </h2>
            <p className="text-muted-foreground mt-1">
              Let&apos;s get you started!
            </p>
          </div>

          {errorMessage && (
            <div
              className="bg-destructive/10 border border-destructive/30 text-destructive rounded-md p-3 mb-6 text-sm flex items-center gap-2"
              role="alert"
            >
              <User size={16} /> {/* Or a more suitable error icon */}
              <span>{errorMessage}</span>
            </div>
          )}
          {successMessage && (
            <div
              className="bg-green-600/10 border border-green-600/30 text-green-700 dark:text-green-400 rounded-md p-3 mb-6 text-sm flex items-center gap-2"
              role="status"
            >
              <User size={16} /> {/* Or a more suitable success icon */}
              <span>{successMessage}</span>
            </div>
          )}

          <form onSubmit={onSubmit} className="space-y-5">
            {" "}
            {/* Slightly reduced space */}
            <div>
              <Label
                htmlFor="name"
                className="text-sm font-medium text-foreground/90"
              >
                Full Name
              </Label>
              <div className="relative mt-1">
                <User
                  className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground"
                  aria-hidden="true"
                />
                <Input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="John Doe"
                  disabled={isLoading || isGoogleLoading}
                  className={`pl-10 h-11 rounded-md ${
                    // h-11 for slightly smaller inputs
                    formErrors.name
                      ? "border-destructive focus-visible:ring-destructive/50"
                      : "border-border"
                  }`}
                  aria-invalid={!!formErrors.name}
                  aria-describedby="name-error"
                />
              </div>
              {formErrors.name && (
                <p id="name-error" className="text-destructive text-xs mt-1.5">
                  {formErrors.name}
                </p>
              )}
            </div>
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
                  className={`pl-10 h-11 rounded-md ${
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
              <Label
                htmlFor="password"
                className="text-sm font-medium text-foreground/90"
              >
                Password
              </Label>
              <div className="relative mt-1">
                <Lock
                  className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground"
                  aria-hidden="true"
                />
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Min. 8 characters"
                  disabled={isLoading || isGoogleLoading}
                  className={`pl-10 pr-10 h-11 rounded-md ${
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
            <div>
              <Label
                htmlFor="confirmPassword"
                className="text-sm font-medium text-foreground/90"
              >
                Confirm Password
              </Label>
              <div className="relative mt-1">
                <Lock
                  className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground"
                  aria-hidden="true"
                />
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Re-enter your password"
                  disabled={isLoading || isGoogleLoading}
                  className={`pl-10 pr-10 h-11 rounded-md ${
                    formErrors.confirmPassword
                      ? "border-destructive focus-visible:ring-destructive/50"
                      : "border-border"
                  }`}
                  aria-invalid={!!formErrors.confirmPassword}
                  aria-describedby="confirmPassword-error"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground"
                  aria-label={
                    showConfirmPassword ? "Hide password" : "Show password"
                  }
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
              {formErrors.confirmPassword && (
                <p
                  id="confirmPassword-error"
                  className="text-destructive text-xs mt-1.5"
                >
                  {formErrors.confirmPassword}
                </p>
              )}
            </div>
            <Button
              type="submit"
              className="w-full h-11 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:ring-ring focus-visible:ring-offset-2"
              disabled={isLoading || isGoogleLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Account...
                </>
              ) : (
                "Create Account"
              )}
            </Button>
          </form>

          <div className="relative my-6">
            {" "}
            {/* Increased margin for separator */}
            <div
              className="absolute inset-0 flex items-center"
              aria-hidden="true"
            >
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">
                Or sign up with
              </span>
            </div>
          </div>

          <Button
            variant="outline"
            className="w-full h-11 rounded-md border-border hover:bg-accent hover:text-accent-foreground"
            onClick={handleGoogleSignup}
            disabled={isLoading || isGoogleLoading}
            type="button"
          >
            {isGoogleLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Redirecting...
              </>
            ) : (
              <>
                <Image
                  src="/images/google-logo.png" // Ensure you have this image
                  alt="Google"
                  width={18}
                  height={18}
                  className="mr-2"
                />
                Sign Up with Google
              </>
            )}
          </Button>

          <p className="mt-8 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-semibold text-primary hover:text-primary/80"
            >
              Log In
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

function SignupFormSkeleton() {
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
          <div className="space-y-5">
            {[...Array(4)].map(
              (
                _,
                i // For 4 input fields (Name, Email, Pass, Confirm Pass)
              ) => (
                <div key={i}>
                  <div className="h-4 bg-muted rounded w-1/4 mb-1.5"></div>
                  <div className="h-11 bg-muted rounded-md"></div>
                </div>
              )
            )}
            <div className="h-11 bg-primary/80 rounded-md"></div>{" "}
            {/* Create Account Button */}
          </div>
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border/50" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-card px-2 h-3 w-1/4 bg-muted rounded"></span>
            </div>
          </div>
          <div className="h-11 bg-muted/80 rounded-md border border-border/50"></div>{" "}
          {/* Google Button */}
          <div className="h-4 bg-muted rounded w-1/2 mx-auto mt-8"></div>
          <div className="h-3 bg-muted rounded w-1/3 mx-auto mt-10"></div>
        </div>
      </div>
    </div>
  );
}

export function SignupForm() {
  return (
    <Suspense fallback={<SignupFormSkeleton />}>
      <SignupFormContent />
    </Suspense>
  );
}
