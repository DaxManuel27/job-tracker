interface StatsCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: string;
}

export function StatsCard({ title, value, icon, color }: StatsCardProps) {
  return (
    <div className="relative overflow-hidden rounded-xl bg-zinc-900/50 border border-zinc-800 p-5 backdrop-blur">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-zinc-400">{title}</p>
          <p className="mt-1 text-3xl font-bold text-zinc-100">{value}</p>
        </div>
        <div className={`p-3 rounded-lg ${color}`}>{icon}</div>
      </div>
      <div
        className={`absolute -right-4 -bottom-4 w-24 h-24 rounded-full opacity-10 ${color}`}
      />
    </div>
  );
}


