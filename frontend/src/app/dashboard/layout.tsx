import Sidebar from "@/components/Sidebar";
import { LanguageProvider } from "@/components/LanguageProvider";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <LanguageProvider>
      <div className="flex min-h-screen bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </LanguageProvider>
  );
}