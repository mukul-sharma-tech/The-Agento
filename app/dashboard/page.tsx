"use client";

import { useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status]);

  if (status === "loading") return <p className="text-center mt-10">Loading...</p>;

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <h1 className="text-3xl font-bold mb-4">Welcome, {session?.user?.name}</h1>
      <p className="mb-6">Company: {session?.user?.companyName}</p>
      <Button onClick={() => signOut({ callbackUrl: "/" })} variant="destructive">
        Logout
      </Button>
    </main>
  );
}
