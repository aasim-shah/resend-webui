'use client';

import React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import './globals.css';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { AccountProvider, useAccounts } from '@/context/AccountContext';
import { NotificationProvider } from '@/context/NotificationContext';
import { Header } from '@/components/Header';
import { Sidebar } from '@/components/Sidebar';
import { ComposeModal } from '@/components/ComposeModal';
import { NotificationPermissionBanner } from '@/components/NotificationPermissionBanner';
import { EmailToasts } from '@/components/EmailToasts';

function MainShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { searchQuery, setSearchQuery, triggerRefresh, loading } = useAccounts();
  const [isComposeOpen, setIsComposeOpen] = React.useState(false);
  const [isCollapsed, setIsCollapsed] = React.useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = React.useState(false);

  React.useEffect(() => {
    // Closing the drawer on route change keeps a stale mobile nav from
    // staying open over the newly navigated page.
    setIsMobileNavOpen(false);
  }, [pathname]);

  const handleToggleSidebar = () => {
    if (typeof window !== 'undefined' && window.matchMedia('(min-width: 1024px)').matches) {
      setIsCollapsed((c) => !c);
    } else {
      setIsMobileNavOpen((o) => !o);
    }
  };

  React.useEffect(() => {
    if (!authLoading && !user && pathname !== '/login') {
      router.push('/login');
    }
  }, [user, authLoading, pathname, router]);

  if (pathname === '/login') {
    return <>{children}</>;
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#f6f8fc] flex items-center justify-center text-xs font-semibold text-slate-500">
        Authenticating session...
      </div>
    );
  }

  return (
    <div className="bg-[#f6f8fc] text-[#1f1f1f] min-h-screen flex flex-col antialiased">
      <Header
        onToggleSidebar={handleToggleSidebar}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onRefresh={triggerRefresh}
        loading={loading}
      />

      <NotificationPermissionBanner />
      <EmailToasts />

      <div className="flex-1 flex overflow-hidden">
        <Sidebar
          isCollapsed={isCollapsed}
          isMobileNavOpen={isMobileNavOpen}
          onCloseMobileNav={() => setIsMobileNavOpen(false)}
          onOpenCompose={() => setIsComposeOpen(true)}
        />

        {/* Main Canvas Container */}
        <main className="flex-1 min-w-0 bg-white rounded-2xl sm:rounded-3xl shadow-sm border border-slate-200/80 overflow-hidden m-2 sm:m-3 lg:mr-6 lg:mb-6 lg:ml-2 lg:mt-0 flex flex-col transition-all">
          {children}
        </main>
      </div>

      <ComposeModal isOpen={isComposeOpen} onClose={() => setIsComposeOpen(false)} />
    </div>
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <title>resend-webui — Multi-Account Resend Email Suite</title>
        <meta name="description" content="resend-webui: Modern multi-account webmail interface for managing Resend profiles" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />

        {/* Installable PWA: manifest.ts (App Router file convention) is served at /manifest.webmanifest; the
            rest (name, icons, display: standalone) lives there. Hand-authored here, not via the Metadata API,
            because this root layout is a Client Component and can't export `metadata`. */}
        <link rel="manifest" href="/manifest.webmanifest" />
        <meta name="theme-color" content="#0f172a" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="resend webui" />
      </head>
      <body>
        <AuthProvider>
          <AccountProvider>
            <NotificationProvider>
              <MainShell>{children}</MainShell>
            </NotificationProvider>
          </AccountProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
