import { Sidebar } from '@/components/Sidebar';
import { TopBar } from '@/components/TopBar';

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0f0f1a]">
      <Sidebar />
      <div className="lg:ml-64 transition-all duration-300">
        <TopBar />
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
