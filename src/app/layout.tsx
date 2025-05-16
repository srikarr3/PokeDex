import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Comic_Neue } from "next/font/google";
import "./globals.css";
import ClientLayout from "@/components/ClientLayout";

const inter = Inter({ 
  subsets: ["latin"],
  display: 'swap',
});

const comicNeue = Comic_Neue({ 
  weight: ['300', '400', '700'],
  subsets: ["latin"],
  variable: '--font-comic-neue',
  display: 'swap',
});

export const metadata: Metadata = {
  title: "Pokédex App",
  description: "A modern Pokédex application built with Next.js, Tailwind CSS, and TypeScript",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
      </head>
      <body className={`${inter.className} ${comicNeue.variable} antialiased bg-white text-gray-900`}>
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}

