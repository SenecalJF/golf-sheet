import type { Metadata } from "next";

const titsOpenIconBase = "/tournaments/tits-open/icons";

export const metadata: Metadata = {
  title: "Tits Open | Golf Clubhouse",
  description: "The yearly Tits Open tournament inside Golf Clubhouse.",
  manifest: "/tournaments/tits-open/manifest.webmanifest",
  icons: {
    icon: [
      {
        url: `${titsOpenIconBase}/tits-open-192.png`,
        sizes: "192x192",
        type: "image/png",
      },
      {
        url: `${titsOpenIconBase}/tits-open-512.png`,
        sizes: "512x512",
        type: "image/png",
      },
    ],
    apple: {
      url: `${titsOpenIconBase}/tits-open-180.png`,
      sizes: "180x180",
      type: "image/png",
    },
  },
  appleWebApp: {
    capable: true,
    title: "Tits Open",
    statusBarStyle: "black-translucent",
  },
};

export default function TitsOpenLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
