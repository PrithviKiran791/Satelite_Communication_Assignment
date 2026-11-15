import type { LucideIcon } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string;
  unit: string;
  description: string;
  icon: LucideIcon;
}

export default function MetricCard({
  title,
  value,
  unit,
  description,
  icon: Icon,
}: MetricCardProps) {
  return (
    <div className="glass-card p-5 lg:p-6 transition-all duration-200 hover:border-white/30 hover:bg-white/[0.05] group relative overflow-hidden">
      {/* Subtle top corner tick indicator */}
      <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-white/40" />

      <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
        <span className="text-[11px] font-bold uppercase tracking-[0.15em] text-[#B8B8B8] group-hover:text-white transition-colors">
          {title}
        </span>

        <div className="w-7 h-7 bg-white/[0.06] border border-white/14 flex items-center justify-center text-white/80 group-hover:text-white group-hover:border-white/30 transition-all">
          <Icon size={14} />
        </div>
      </div>

      {/* Oversized Brutalist Numerical Metric */}
      <div className="flex items-baseline gap-2 mt-4">
        <span className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight tabular-nums">
          {value}
        </span>
        <span className="text-xs font-semibold text-[#777777] uppercase tracking-wider">
          {unit}
        </span>
      </div>

      <p className="text-xs text-[#777777] group-hover:text-[#B8B8B8] mt-3 leading-relaxed transition-colors">
        {description}
      </p>
    </div>
  );
}
