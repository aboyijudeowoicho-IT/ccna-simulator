import type { Metadata } from "next";
import { Sora, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";

const sora = Sora({
  subsets: ["latin"],
  variable: "--font-sora",
  weight: ["300", "400", "500", "600", "700"],
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "CCNA Exam Simulator | 200-301",
  description: "AI-powered CCNA exam preparation — practice exams, flashcards, and AI tutoring",
  keywords: ["CCNA", "Cisco", "exam", "simulator", "200-301", "networking"],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${sora.variable} ${jetbrains.variable} font-sans bg-bg-primary text-gray-100 antialiased`}>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: "#161b22",
              color: "#e6edf3",
              border: "1px solid #30363d",
              fontSize: "13px",
            },
          }}
        />
        {children}
      </body>
    </html>
  );
}
