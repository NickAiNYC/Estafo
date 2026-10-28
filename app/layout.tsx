import type { Metadata } from "next";
import { Outfit, Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "ESTAFOTIR — Municipal Enforcement & Healthcare Compliance",
  description: "Citizen municipal enforcement and institutional healthcare compliance platform at estafotir.vercel.app",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${outfit.variable} ${jakarta.variable} ${jetbrains.variable} antialiased font-jakarta text-primary bg-canvas h-screen w-screen overflow-hidden flex flex-col`}
      >
        {children}
      </body>
    </html>
  );
}
