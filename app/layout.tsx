import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Navbar from "./components/Navbar";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Zomato Lite",
  description: "Ludhiana Burrito — reviews",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        {/* Apply the saved theme before first paint (reads the cookie; dark is the default). */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "try{if(/(?:^|; )ztheme=light(?:;|$)/.test(document.cookie)){document.documentElement.classList.add('theme-light')}}catch(e){}",
          }}
        />
        <Navbar />
        {children}
      </body>
    </html>
  );
}
