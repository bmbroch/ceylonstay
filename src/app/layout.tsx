import "./globals.css";
import Header from "./components/Header";
import { AuthProvider } from "@/lib/contexts/AuthContext";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "CeylonStay",
  description: "Trusted Sri Lankan rentals for 👩‍💻 digital nomads & ✈️ travelers",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/ceylon_stay_favicon.png", sizes: "32x32", type: "image/png" },
      { url: "/ceylon_stay_favicon.png", sizes: "16x16", type: "image/png" }
    ],
    shortcut: [{ url: "/favicon.ico" }],
    apple: [
      { url: "/ceylon_stay_favicon.png", sizes: "180x180", type: "image/png" }
    ],
  },
  manifest: "/manifest.json",
  metadataBase: new URL('https://ceylonstay.com'),
  openGraph: {
    title: "CeylonStay",
    description: "Trusted Sri Lankan rentals for 👩‍💻 digital nomads & ✈️ travelers",
    url: 'https://ceylonstay.com',
    siteName: 'CeylonStay',
    images: [
      {
        url: '/CeylonStay (500 x 200 px) (500 x 120 px) (300 x 120 px).png',
        width: 500,
        height: 200,
        alt: "CeylonStay - Trusted Sri Lankan rentals"
      }
    ],
    type: "website",
    locale: 'en_US',
  },
  twitter: {
    card: "summary_large_image",
    title: "CeylonStay",
    description: "Trusted Sri Lankan rentals for 👩‍💻 digital nomads & ✈️ travelers",
    site: "@ceylonstay",
    creator: "@ceylonstay",
    images: [{
      url: '/CeylonStay (500 x 200 px) (500 x 120 px) (300 x 120 px).png',
      width: 500,
      height: 200,
      alt: "CeylonStay - Trusted Sri Lankan rentals"
    }],
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
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
