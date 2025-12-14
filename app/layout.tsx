import "./globals.css";
import Link from "next/link";

import { AuthProvider } from "./providers";
import AuthButtons from "./components/AuthButtons";
import { ui } from "@/lib/ui";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-white text-zinc-900 antialiased">
        <AuthProvider>
          <header className="sticky top-0 z-10 border-b border-zinc-200 bg-white/80 backdrop-blur">
            <div className="mx-auto flex max-w-5xl items-center gap-4 px-6 py-4">
              <nav className="flex items-center gap-4 text-sm">
                <Link className={ui.link} href="/">
                  Home
                </Link>
                <Link className={ui.link} href="/me">
                  Me
                </Link>
                <Link className={ui.link} href="/admin">
                  Admin
                </Link>
              </nav>

              <div className="flex-1" />

              <AuthButtons />
            </div>
          </header>

          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
