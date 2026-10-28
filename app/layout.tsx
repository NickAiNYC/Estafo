import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const jakarta = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-jakarta",
});

const jetbrains = localFont({
  src: "./fonts/GeistMonoVF.woff",
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
        className={`${jakarta.variable} ${jetbrains.variable} antialiased font-jakarta text-primary bg-canvas h-screen w-screen overflow-hidden flex flex-col`}
      >
        {children}
      </body>
    </html>
  );
}
