import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { UnifiedNavbar } from '../components/UnifiedNavbar';
import { GitHubStyleDrawer } from '../components/GitHubStyleDrawer';

export function AdminView() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  return (
    <div className="flex flex-col min-h-screen w-full bg-surface font-sans text-on-surface">
      {/* Unified GitHub-Style Top Navbar */}
      <UnifiedNavbar 
        onOpenDrawer={() => setIsDrawerOpen(true)}
        title="PANEL DE ADMINISTRACIÓN"
        badgeText="GERENCIA"
      />

      {/* GitHub-Style Navigation Drawer */}
      <GitHubStyleDrawer 
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
      />

      {/* Main Admin Content */}
      <main className="flex-1 w-full overflow-y-auto bg-surface">
        <Outlet />
      </main>
    </div>
  );
}
