"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCurrentUser } from "@/lib/user-context";

export default function AdminPage() {
  const user = useCurrentUser();
  const router = useRouter();
  useEffect(() => {
    if (user !== null && !user.isAdmin) router.replace("/dashboard");
    else if (user?.isAdmin) router.replace("/approvals");
  }, [user, router]);
  return null;
}
