import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#FEF9E1",
};

export const metadata: Metadata = {
  title: "MediVision | 4K Image-Guided Surgery & 3D WebGPU AI",
  description: "Next-generation Image-Guided Surgery platform featuring sub-millimeter optical navigation, WebGPU AI organ segmentation, 2D/3D Multi-Planar Reconstruction (MPR & CMPR), and dual-solver OR registration.",
  keywords: [
    "Image-Guided Surgery",
    "DICOM MPR",
    "Curved Multiplanar Reconstruction",
    "WebGPU AI Segmentation",
    "Three.js Medical Atlas",
    "Surgical Navigation",
    "MediVision"
  ],
  authors: [{ name: "MediVision Team" }],
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
    >
      <body className="min-h-full flex flex-col bg-[#FEF9E1] text-[#2e2417]">
        {children}
      </body>
    </html>
  );
}
