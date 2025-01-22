import "./globals.css";
import Header from "./components/Header";
import { AuthProvider } from "@/lib/contexts/AuthContext";
import { Metadata } from "next";
import Script from 'next/script';

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
        url: '/ceylonstay_social_graph.png',
        width: 500,
        height: 200,
        alt: "CeylonStay - Trusted Sri Lankan rentals",
        type: 'image/png',
        secureUrl: 'https://ceylonstay.com/ceylonstay_social_graph.png'
      }
    ],
    type: "website",
    locale: 'en_US',
  },
  other: {
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'default',
    'format-detection': 'telephone=no',
    'apple-mobile-web-app-title': 'CeylonStay',
    'og:image': 'https://ceylonstay.com/ceylonstay_social_graph.png',
    'og:image:secure_url': 'https://ceylonstay.com/ceylonstay_social_graph.png',
    'og:image:type': 'image/png',
    'og:image:width': '500',
    'og:image:height': '200',
  },
  twitter: {
    card: "summary_large_image",
    title: "CeylonStay",
    description: "Trusted Sri Lankan rentals for 👩‍💻 digital nomads & ✈️ travelers",
    site: "@ceylonstay",
    creator: "@ceylonstay",
    images: [{
      url: '/ceylonstay_social_graph.png',
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
      <head>
        <Script
          defer
          data-domain="ceylonstay.com"
          src="https://plausible.io/js/script.file-downloads.hash.outbound-links.pageview-props.revenue.tagged-events.js"
          strategy="afterInteractive"
        />
        <Script id="plausible-events" strategy="afterInteractive">
          {`window.plausible = window.plausible || function() { (window.plausible.q = window.plausible.q || []).push(arguments) }`}
        </Script>
      </head>
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
