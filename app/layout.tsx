import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { DesktopNav, MobileTopBar } from "@/components/shared/nav";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Golf Clubhouse",
  description: "Track rounds, handicap, players, and tournaments.",
  icons: {
    icon: [
      {
        url: "/tournaments/tits-open/icons/tits-open-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        url: "/tournaments/tits-open/icons/tits-open-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
    apple: {
      url: "/tournaments/tits-open/icons/tits-open-180.png",
      sizes: "180x180",
      type: "image/png",
    },
  },
  appleWebApp: {
    capable: true,
    title: "Golf Clubhouse",
    statusBarStyle: "black-translucent",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`dark ${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <TooltipProvider delay={200}>
          <div className="flex min-h-screen flex-col lg:flex-row">
            <DesktopNav />
            <div className="flex min-h-screen flex-1 flex-col">
              <MobileTopBar />
              <main className="flex-1 overflow-x-hidden">
                <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
                  {children}
                </div>
              </main>
            </div>
          </div>
          <Toaster richColors position="top-right" theme="dark" />
        </TooltipProvider>
      </body>
    </html>
  );
}
