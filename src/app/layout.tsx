import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SubTrack — all your subscriptions, one smart dashboard",
  description: "Track recurring payments, renewal dates and subscription spending in one private dashboard.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
