interface HeaderProps {
  activeTab?: string;
}

export default function Header({ activeTab = "Overview" }: HeaderProps) {
  const getTabTitle = (tab: string) => {
    switch (tab) {
      case "Analytics":
        return "Analytics & Sensitivity";
      case "Settings":
        return "Engine Specifications";
      case "Overview":
      default:
        return "Link Telemetry";
    }
  };

  return (
    <header className="h-16 px-6 lg:px-8 border-b border-white/14 flex items-center justify-between bg-[#030303]/60 backdrop-blur-xl sticky top-0 z-20 shadow-[inset_0_-1px_0_rgba(255,255,255,0.05)]">
      <div className="flex items-center gap-4">
        <h1 className="text-base lg:text-lg font-bold text-white tracking-tight">
          {getTabTitle(activeTab)}
        </h1>
      </div>
    </header>
  );
}
