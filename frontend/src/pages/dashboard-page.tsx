import { Link } from 'react-router-dom';
import { BookOpen, Swords, Users } from 'lucide-react';
import { listRulesets } from '../api/rulesets';
import { listCampaigns } from '../api/campaigns';
import { useApiCache } from '../hooks/use-api-cache';

export default function DashboardPage() {
  const { data: rulesets, loading: loadingRulesets } = useApiCache(listRulesets);
  const { data: campaigns, loading: loadingCampaigns } = useApiCache(listCampaigns);

  if (loadingRulesets || loadingCampaigns) {
    return <div className="p-8 text-label">Loading...</div>;
  }

  return (
    <div className="p-4 sm:p-8 max-w-4xl">
      <h1 className="text-2xl font-bold text-heading mb-8">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <StatCard
          icon={<BookOpen className="text-accent" />}
          label="Rulesets"
          value={(rulesets ?? []).length}
          to="/rulesets"
        />
        <StatCard
          icon={<Swords className="text-accent" />}
          label="Campaigns"
          value={(campaigns ?? []).length}
          to="/campaigns"
        />
        <StatCard
          icon={<Users className="text-accent" />}
          label="Total Entities"
          value={(rulesets ?? []).reduce((sum, r) => sum + r.entity_count, 0)}
          to="/rulesets"
        />
      </div>

      {(campaigns ?? []).length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-content mb-3">Recent Campaigns</h2>
          <div className="space-y-2">
            {(campaigns ?? []).slice(0, 5).map((c) => (
              <Link
                key={c.id}
                to={`/campaigns/${c.id}`}
                className="block p-4 bg-surface border border-edge rounded-lg hover:border-edge-hover transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-heading">{c.name}</span>
                  <span className="text-xs text-muted capitalize">{c.status}</span>
                </div>
                {c.description && (
                  <p className="text-sm text-label mt-1">{c.description}</p>
                )}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  to,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  to: string;
}) {
  return (
    <Link
      to={to}
      className="p-4 bg-surface border border-edge rounded-lg hover:border-edge-hover transition-colors"
    >
      <div className="flex items-center gap-3">
        {icon}
        <div>
          <div className="text-2xl font-bold text-heading">{value.toLocaleString()}</div>
          <div className="text-sm text-label">{label}</div>
        </div>
      </div>
    </Link>
  );
}
