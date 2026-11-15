import { Globe2 } from "lucide-react";

interface HeaderProps {
  activeTab?: string;
  onNavigateLanding?: () => void;
}

export default function Header({ activeTab = "Analytics", onNavigateLanding }: HeaderProps) {
  const getTabTitle = (tab: string) => {
    switch (tab) {
      case "Analytics":
        return "Analytics & Sensitivity";
      case "Settings":
        return "Engine Specifications";
      default:
        return "Satellite Link Simulator";
    }
  };

  return (
    <header className="h-16 px-6 lg:px-8 border-b border-white/14 flex items-center justify-between bg-[#030303]/60 backdrop-blur-xl sticky top-0 z-20 shadow-[inset_0_-1px_0_rgba(255,255,255,0.05)]">
      <div className="flex items-center gap-4">
        <h1 className="text-base lg:text-lg font-bold text-white tracking-tight">
          {getTabTitle(activeTab)}
        </h1>
      </div>

      {onNavigateLanding && (
        <button
          type="button"
          onClick={onNavigateLanding}
          className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#B8B8B8] hover:text-white border border-white/14 glass-surface px-3 py-1.5 hover:border-white/40 transition cursor-pointer"
          title="Return to Space Landing Page"
        >
          <Globe2 size={13} className="text-white" />
          <span className="hidden sm:inline">Landing Page</span>
        </button>
      )}
    </header>
  );
}
