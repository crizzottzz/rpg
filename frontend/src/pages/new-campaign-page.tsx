import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { listRulesets } from '../api/rulesets';
import { createCampaign } from '../api/campaigns';
import { useApiCache, invalidateCache } from '../hooks/use-api-cache';

const campaignSchema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  ruleset_id: z.string().min(1, 'Select a ruleset'),
  description: z.string().trim().default(''),
});

type CampaignForm = z.infer<typeof campaignSchema>;

export default function NewCampaignPage() {
  const { data: rulesets } = useApiCache(listRulesets);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CampaignForm>({
    resolver: zodResolver(campaignSchema),
    defaultValues: { name: '', ruleset_id: '', description: '' },
  });

  // Auto-select first ruleset once loaded
  useEffect(() => {
    if (rulesets && rulesets.length > 0) {
      setValue('ruleset_id', rulesets[0].id);
    }
  }, [rulesets, setValue]);

  const onSubmit = async (data: CampaignForm) => {
    const campaign = await createCampaign(data);
    invalidateCache('listCampaigns');
    navigate(`/campaigns/${campaign.id}`);
  };

  const inputClass =
    'w-full px-3 py-2 bg-surface border border-edge rounded-lg text-heading focus:outline-none focus:border-accent';

  return (
    <div className="p-4 sm:p-8 max-w-xl">
      <h1 className="text-2xl font-bold text-heading mb-6">New Campaign</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm text-label mb-1">Name</label>
          <input
            type="text"
            {...register('name')}
            className={inputClass}
            autoFocus
          />
          {errors.name && (
            <p className="text-sm text-danger mt-1">{errors.name.message}</p>
          )}
        </div>
        <div>
          <label className="block text-sm text-label mb-1">Ruleset</label>
          <select {...register('ruleset_id')} className={inputClass}>
            {(rulesets ?? []).map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm text-label mb-1">Description</label>
          <textarea
            {...register('description')}
            rows={3}
            className={inputClass}
          />
        </div>
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-2 bg-accent-bold hover:bg-accent text-accent-fg font-semibold rounded-lg transition-colors disabled:opacity-50"
        >
          {isSubmitting ? 'Creating...' : 'Create Campaign'}
        </button>
      </form>
    </div>
  );
}
