import type { Metadata } from "next";
import "./globals.css";
import { ToastProvider } from "./components/ui/Toast";
import { ThemeProvider } from "./components/shared/ThemeProvider";
import { UserProvider } from "./context/UserContext";

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
      <body className="font-sans antialiased bg-background text-foreground min-h-screen">
        <ThemeProvider>
          <UserProvider>
            <ToastProvider>
              {children}
            </ToastProvider>
          </UserProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
