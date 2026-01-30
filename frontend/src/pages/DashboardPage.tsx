import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Swords, Users } from 'lucide-react';
import { listRulesets } from '../api/rulesets';
import { listCampaigns } from '../api/campaigns';
import type { Ruleset, Campaign } from '../types';

export default function DashboardPage() {
  const [rulesets, setRulesets] = useState<Ruleset[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([listRulesets(), listCampaigns()])
      .then(([r, c]) => {
        setRulesets(r);
        setCampaigns(c);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="p-8 text-gray-400">Loading...</div>;
  }

  return (
    <div className="p-8 max-w-4xl">
      <h1 className="text-2xl font-bold text-gray-100 mb-8">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <StatCard
          icon={<BookOpen className="text-amber-400" />}
          label="Rulesets"
          value={rulesets.length}
          to="/rulesets"
        />
        <StatCard
          icon={<Swords className="text-amber-400" />}
          label="Campaigns"
          value={campaigns.length}
          to="/campaigns"
        />
        <StatCard
          icon={<Users className="text-amber-400" />}
          label="Total Entities"
          value={rulesets.reduce((sum, r) => sum + r.entity_count, 0)}
          to="/rulesets"
        />
      </div>

      {campaigns.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-200 mb-3">Recent Campaigns</h2>
          <div className="space-y-2">
            {campaigns.slice(0, 5).map((c) => (
              <Link
                key={c.id}
                to={`/campaigns/${c.id}`}
                className="block p-4 bg-gray-900 border border-gray-800 rounded-lg hover:border-gray-700 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-100">{c.name}</span>
                  <span className="text-xs text-gray-500 capitalize">{c.status}</span>
                </div>
                {c.description && (
                  <p className="text-sm text-gray-400 mt-1">{c.description}</p>
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
      className="p-4 bg-gray-900 border border-gray-800 rounded-lg hover:border-gray-700 transition-colors"
    >
      <div className="flex items-center gap-3">
        {icon}
        <div>
          <div className="text-2xl font-bold text-gray-100">{value.toLocaleString()}</div>
          <div className="text-sm text-gray-400">{label}</div>
        </div>
      </div>
    </Link>
  );
}
