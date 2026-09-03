import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";

export const metadata: Metadata = {
  title: "MediVision — 3D Medical AI & Surgical Navigation",
  description: "AI-Powered Volumetric Segmentation, Registration, and 3D Interactive Surgical Visualization",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <Header />
        <div style={{ display: "flex" }}>
          <Sidebar />
          <main style={{ flex: 1, padding: "2rem", minHeight: "calc(100vh - 73px)" }}>
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
