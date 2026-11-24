"use client";

import { useEffect } from "react";
import { AppErrorState } from "@/components/ui/app-error-state";
import "./globals.css";
import "./theme.css";

export default function GlobalError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error("SubTrack root rendering failed", error.digest ?? "unavailable");
  }, [error]);

  return (
    <html lang="en">
      <body>
        <title>SubTrack — temporarily unavailable</title>
        <AppErrorState error={error} retry={retry}/>
      </body>
    </html>
  );
}
