"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  const { data: session } = useSession(); // now works
  const router = useRouter();

  // Redirect logged-in users to dashboard
  if (session) {
    router.push("/dashboard");
    return null;
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <h1 className="text-4xl font-bold mb-8">Welcome to SynopseeAI</h1>
      <div className="flex gap-4">
        <Button onClick={() => router.push("/login")} variant="default">
          Login
        </Button>
        <Button onClick={() => router.push("/signup")} variant="secondary">
          Signup
        </Button>
      </div>
    </main>
  );
}
