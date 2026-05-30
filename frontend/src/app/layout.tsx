import type { Metadata } from "next";
import "./globals.css";
import ClientInitializer from "../components/ClientInitializer";

const geistSans = {
  variable: "font-sans",
};

const geistMono = {
  variable: "font-mono",
};

export const metadata: Metadata = {
  title: "Grocery Expiry Tracker — Smart Waste Reduction",
  description: "Track expiry dates, reduce organic waste, and keep your groceries fresh with automated email alerts and web-push notifications.",
  manifest: "/manifest.json"
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-50 transition-colors duration-200">
        <ClientInitializer />
        {children}
      </body>
    </html>
  );
}

