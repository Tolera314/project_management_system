import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "./components/ui/Toast";
import { ThemeProvider } from "./components/shared/ThemeProvider";
import { UserProvider } from "./context/UserContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ProjectOS - Project Management System",
  description: "Organize projects, manage tasks, and collaborate with your team",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                // Default to dark mode on first visit
                if (!('theme' in localStorage)) {
                  localStorage.setItem('theme', 'dark');
                  document.documentElement.classList.add('dark');
                } else if (localStorage.theme === 'dark' || window.matchMedia('(prefers-color-scheme: dark)').matches) {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
              } catch (_) {}
            `,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <ToastProvider>
            <UserProvider>
              {children}
            </UserProvider>
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
