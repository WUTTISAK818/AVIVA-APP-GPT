"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCurrentUser } from "@/lib/user-context";

export default function AdminPage() {
  const user = useCurrentUser();
  const router = useRouter();
  useEffect(() => {
    if (!user) return;
    router.replace(user.isAdmin ? "/approvals" : "/dashboard");
  }, [user, router]);
  return null;
}
