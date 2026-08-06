'use client';

import React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import './globals.css';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { AccountProvider, useAccounts } from '@/context/AccountContext';
import { Header } from '@/components/Header';
import { Sidebar } from '@/components/Sidebar';
import { ComposeModal } from '@/components/ComposeModal';

function MainShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { searchQuery, setSearchQuery, triggerRefresh, loading } = useAccounts();
  const [isComposeOpen, setIsComposeOpen] = React.useState(false);
  const [isCollapsed, setIsCollapsed] = React.useState(false);

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
        onToggleSidebar={() => setIsCollapsed(!isCollapsed)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onRefresh={triggerRefresh}
        loading={loading}
      />

      <div className="flex-1 flex overflow-hidden">
        <Sidebar isCollapsed={isCollapsed} onOpenCompose={() => setIsComposeOpen(true)} />

        {/* Main Canvas Container */}
        <main className="flex-1 bg-white rounded-3xl shadow-sm border border-slate-200/80 overflow-hidden mr-6 mb-6 ml-2 flex flex-col transition-all">
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
      </head>
      <body>
        <AuthProvider>
          <AccountProvider>
            <MainShell>{children}</MainShell>
          </AccountProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
