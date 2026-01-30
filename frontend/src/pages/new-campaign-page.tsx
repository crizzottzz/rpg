import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { listRulesets } from '../api/rulesets';
import { createCampaign } from '../api/campaigns';
import { useApiCache, invalidateCache } from '../hooks/use-api-cache';

export default function NewCampaignPage() {
  const { data: rulesets } = useApiCache(listRulesets);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [rulesetId, setRulesetId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  // Auto-select first ruleset once loaded
  if (rulesets && rulesets.length > 0 && !rulesetId) {
    setRulesetId(rulesets[0].id);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !rulesetId) return;
    setSubmitting(true);
    try {
      const campaign = await createCampaign({
        ruleset_id: rulesetId,
        name: name.trim(),
        description: description.trim(),
      });
      invalidateCache('listCampaigns');
      navigate(`/campaigns/${campaign.id}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-8 max-w-xl">
      <h1 className="text-2xl font-bold text-gray-100 mb-6">New Campaign</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm text-gray-400 mb-1">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 bg-gray-900 border border-gray-800 rounded-lg text-gray-100 focus:outline-none focus:border-amber-400"
            autoFocus
            required
          />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Ruleset</label>
          <select
            value={rulesetId}
            onChange={(e) => setRulesetId(e.target.value)}
            className="w-full px-3 py-2 bg-gray-900 border border-gray-800 rounded-lg text-gray-100 focus:outline-none focus:border-amber-400"
          >
            {(rulesets ?? []).map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 bg-gray-900 border border-gray-800 rounded-lg text-gray-100 focus:outline-none focus:border-amber-400"
          />
        </div>
        <button
          type="submit"
          disabled={submitting || !name.trim()}
          className="w-full py-2 bg-amber-500 hover:bg-amber-400 text-gray-950 font-semibold rounded-lg transition-colors disabled:opacity-50"
        >
          {submitting ? 'Creating...' : 'Create Campaign'}
        </button>
      </form>
    </div>
  );
}
