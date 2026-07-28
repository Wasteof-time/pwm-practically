import type { Metadata } from "next";
import { Bricolage_Grotesque, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
  axes: ["opsz"],
});

const jetbrains = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PWM Playground — Robotics Club VITC",
  description:
    "A hands-on PWM playground by Robotics Club VITC: duty cycle, square wave, LED, motor and servo demos.",
  icons: {
    icon: [{ url: "/rclogo.webp", type: "image/webp" }],
    apple: [{ url: "/rclogo.webp", type: "image/webp" }],
    shortcut: "/rclogo.webp",
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
      className={`${bricolage.variable} ${jetbrains.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-dvh bg-background font-sans text-foreground lg:h-full lg:overflow-hidden">
        {children}
      </body>
    </html>
  );
}
