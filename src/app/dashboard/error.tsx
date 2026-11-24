"use client";

import { useEffect } from "react";
import { AppErrorState } from "@/components/ui/app-error-state";

export default function DashboardError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error("SubTrack dashboard rendering failed", error.digest ?? "unavailable");
  }, [error]);

  return <AppErrorState error={error} retry={retry}/>;
}
