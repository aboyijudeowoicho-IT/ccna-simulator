import Navbar from "@/components/ui/Navbar";
import Sidebar from "@/components/ui/Sidebar";

// Exam layout: sidebar hidden during active exam (handled in page)
export default function ExamLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 overflow-hidden max-w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
