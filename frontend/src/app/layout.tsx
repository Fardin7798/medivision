import type { Metadata, Viewport } from "next";
import { Outfit, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#FEF9E1",
};

export const metadata: Metadata = {
  title: "MediVision | Stereotactic Image-Guided Surgery & Neural Navigation",
  description: "Next-generation Stereotactic Image-Guided Surgery platform featuring sub-millimeter optical navigation, neural organ segmentation, 2D/3D Multi-Planar Reconstruction (MPR & CMPR), and dual-solver OR registration.",
  keywords: [
    "Stereotactic Surgery",
    "Image-Guided Surgery",
    "DICOM MPR",
    "Curved Multiplanar Reconstruction",
    "Neural Segmentation",
    "Surgical Navigation",
    "MediVision"
  ],
  authors: [{ name: "MediVision Clinical Systems" }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${outfit.variable} ${inter.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#FEF9E1] text-[#2e2417] font-sans">
        {children}
      </body>
    </html>
  );
}
