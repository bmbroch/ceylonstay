import "./globals.css";
import Header from "./components/Header";
import { AuthProvider } from "@/lib/contexts/AuthContext";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "CeylonStay",
  description: "Trusted Sri Lankan rentals for 👩‍💻 digital nomads & ✈️ travelers",
  icons: {
    icon: [{ rel: "icon", url: "/ceylon_stay_favicon.png" }],
    shortcut: [{ url: "/ceylon_stay_favicon.png" }],
    apple: [{ url: "/ceylon_stay_favicon.png" }],
    other: [
      {
        rel: "apple-touch-icon-precomposed",
        url: "/ceylon_stay_favicon.png",
      },
    ],
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "CeylonStay",
  },
  openGraph: {
    title: "CeylonStay",
    description: "Trusted Sri Lankan rentals for 👩‍💻 digital nomads & ✈️ travelers",
    images: [{
      url: "/CeylonStay (500 x 200 px) (500 x 120 px) (300 x 120 px).png",
      width: 500,
      height: 200,
      alt: "CeylonStay"
    }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "CeylonStay",
    description: "Trusted Sri Lankan rentals for 👩‍💻 digital nomads & ✈️ travelers",
    images: ["/CeylonStay (500 x 200 px) (500 x 120 px) (300 x 120 px).png"],
    creator: "@ceylonstay",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-white">
        <AuthProvider>
          <Header />
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {children}
          </main>
        </AuthProvider>
      </body>
    </html>
  );
}
