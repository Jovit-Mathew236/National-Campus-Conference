// src/components/auth/signup-form.tsx (or similar path)
"use client";

import { useState, Suspense } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import Image from "next/image";
// Assuming you might have a Google icon, or you can use a text button
// import { Chrome } from "lucide-react"; // If using lucide for Google icon
import { useRouter } from "next/navigation";

// Define Zod schema for form validation
const signupSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Please enter a valid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"], // Point error to confirmPassword field
  });

function SignupFormContent() {
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});

  const router = useRouter();
  // const searchParams = useSearchParams();
  // const redirectPath = searchParams.get("redirect") || "/admin"; // Or maybe "/login" after signup

  async function onSubmit(event: React.SyntheticEvent) {
    event.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    setFormErrors({});

    try {
      const formData = new FormData(event.target as HTMLFormElement);
      const name = formData.get("name") as string;
      const email = formData.get("email") as string;
      const password = formData.get("password") as string;
      const confirmPassword = formData.get("confirmPassword") as string;

      const trimmedEmail = email.trim();
      const trimmedName = name.trim();

      const validationResult = signupSchema.safeParse({
        name: trimmedName,
        email: trimmedEmail,
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

      // Call the API route for signup
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: trimmedName,
          email: trimmedEmail,
          password,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setErrorMessage(
          data.error || "Failed to create account. Please try again."
        );
        setIsLoading(false);
        return;
      }

      setSuccessMessage(
        "Account created successfully! You may now be able to log in, or check your email for verification if configured."
      );
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch (error) {
      setErrorMessage(
        (error as Error).message ||
          "Failed to create account. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  }

  async function handleGoogleSignup() {
    setIsGoogleLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      // Redirect to Appwrite OAuth2 Google endpoint
      const appwriteEndpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
      const appwriteProject = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
      if (!appwriteEndpoint || !appwriteProject) {
        setErrorMessage("Google signup is not configured.");
        setIsGoogleLoading(false);
        return;
      }
      const redirectUrl = `${window.location.origin}/dashboard`;
      window.location.href = `${appwriteEndpoint}/account/sessions/oauth2/google?project=${appwriteProject}&success=${encodeURIComponent(
        redirectUrl
      )}&failure=${encodeURIComponent(window.location.origin + "/signup")}`;
    } catch (error) {
      setErrorMessage(
        (error as Error).message ||
          "Failed to sign up with Google. Please try again."
      );
      setIsGoogleLoading(false);
    }
  }

  return (
    <Card className="w-fit border-none shadow-md p-0">
      <div className="bg-secondary rounded-t-md p-6 flex flex-col">
        <div className="mt-4 flex justify-between items-center">
          <div>
            <h2 className="text-primary text-3xl font-semibold">
              Create Account
            </h2>
            <p className="text-primary mt-2 opacity-80">
              Get started by creating your account.
            </p>
          </div>
          <div className="flex flex-end">
            <Image
              src="/images/auth_illustration.png" // Replace with a relevant illustration
              alt="Signup illustration"
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
          {successMessage && (
            <div className="bg-green-50 border border-green-200 text-green-800 rounded-md p-3 mb-4">
              {successMessage}
            </div>
          )}
          <div className="grid gap-4">
            {" "}
            {/* Reduced gap from 6 to 4 for more fields */}
            <div className="grid gap-2">
              <Label htmlFor="name" className="text-base font-medium">
                Full Name
              </Label>
              <Input
                id="name"
                name="name"
                placeholder="Enter your full name"
                disabled={isLoading || isGoogleLoading}
                className={`h-12 rounded-md ${
                  formErrors.name ? "border-red-500" : ""
                }`}
              />
              {formErrors.name && (
                <p className="text-red-500 text-sm mt-1">{formErrors.name}</p>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email" className="text-base font-medium">
                Email
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="Enter email"
                disabled={isLoading || isGoogleLoading}
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
                placeholder="Enter password (min. 8 characters)"
                disabled={isLoading || isGoogleLoading}
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
            <div className="grid gap-2">
              <Label
                htmlFor="confirmPassword"
                className="text-base font-medium"
              >
                Confirm Password
              </Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                placeholder="Confirm your password"
                disabled={isLoading || isGoogleLoading}
                className={`h-12 rounded-md ${
                  formErrors.confirmPassword ? "border-red-500" : ""
                }`}
              />
              {formErrors.confirmPassword && (
                <p className="text-red-500 text-sm mt-1">
                  {formErrors.confirmPassword}
                </p>
              )}
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4 p-6 pt-0">
          <Button
            className="w-full h-12 rounded-md bg-primary text-primary-foreground"
            type="submit"
            disabled={isLoading || isGoogleLoading}
          >
            {isLoading ? "Creating Account..." : "Create Account"}
          </Button>

          <div className="relative my-2">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or continue with
              </span>
            </div>
          </div>

          <Button
            variant="outline"
            className="w-full h-12 rounded-md"
            onClick={handleGoogleSignup}
            disabled={isLoading || isGoogleLoading}
            type="button"
          >
            {/* Replace with actual Google Icon if available */}
            {isGoogleLoading ? (
              "Redirecting..."
            ) : (
              <>
                {/* <Chrome className="mr-2 h-4 w-4" />  Example with lucide */}
                <Image
                  src="/images/google-logo.svg"
                  alt="Google"
                  width={20}
                  height={20}
                  className="mr-2"
                />
                Sign Up with Google
              </>
            )}
          </Button>

          <div className="text-center text-sm mt-4">
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-primary font-medium hover:text-primary/80"
            >
              Log In
            </Link>
          </div>
          <div className="text-center text-xs text-muted-foreground mt-8">
            © 2024 Your Company Name
          </div>
        </CardFooter>
      </form>
    </Card>
  );
}

function SignupFormSkeleton() {
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
        <div className="grid gap-4">
          {[...Array(4)].map(
            (
              _,
              i // For 4 input fields
            ) => (
              <div key={i} className="grid gap-2">
                <div className="h-4 bg-gray-300 rounded w-20"></div>
                <div className="h-12 bg-gray-300 rounded"></div>
              </div>
            )
          )}
        </div>
      </CardContent>
      <CardFooter className="flex flex-col gap-4 p-6 pt-0">
        <div className="w-full h-12 bg-gray-300 rounded"></div>
        <div className="w-full h-12 bg-gray-300 rounded mt-2"></div>
      </CardFooter>
    </Card>
  );
}

export function SignupForm() {
  return (
    <Suspense fallback={<SignupFormSkeleton />}>
      <SignupFormContent />
    </Suspense>
  );
}
