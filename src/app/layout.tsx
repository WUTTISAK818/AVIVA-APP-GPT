import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import BottomNav from "@/components/BottomNav";
import AuthProvider from "@/components/AuthProvider";
import { UserProvider } from "@/lib/user-context";
import { ThemeProvider } from "@/lib/theme-context";

const geist = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });

const TARGET = process.env.NEXT_PUBLIC_TARGET;
const BRAND = TARGET === "plus"
  ? { title: "AVIVA Plus", description: "ระบบบริการลูกบ้าน AVIVA Private" }
  : { title: "AVIVA ONE",  description: "ระบบบริหารจัดการ AVIVA ONE" };

export const metadata: Metadata = {
  title: BRAND.title,
  description: BRAND.description,
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: BRAND.title },
  icons: { apple: "/apple-touch-icon.png", icon: "/icon-192.png" },
  other: { "mobile-web-app-capable": "yes" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th" className={`${geist.variable} h-full antialiased`}>
      <body className="min-h-full bg-aviva-bg text-aviva-text pb-20">
        <ThemeProvider>
          <UserProvider>
            <AuthProvider>{children}</AuthProvider>
            <BottomNav />
          </UserProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
