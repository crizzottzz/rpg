import { useParams, Link } from 'react-router-dom';
import { getEntity } from '../api/rulesets';
import { useApiCache } from '../hooks/use-api-cache';
import EntityRenderer from '../features/entities/entity-renderer';

export default function EntityDetailPage() {
  const { id: rulesetId, entityId } = useParams<{ id: string; entityId: string }>();
  const { data: entity, loading } = useApiCache(
    getEntity,
    [rulesetId!, entityId!],
    { enabled: !!rulesetId && !!entityId },
  );

  if (loading) return <div className="p-8 text-gray-400">Loading...</div>;
  if (!entity) return <div className="p-8 text-red-400">Entity not found</div>;

  return (
    <div className="p-4 sm:p-8 max-w-4xl">
      <Link
        to={`/rulesets/${rulesetId}`}
        className="text-sm text-gray-500 hover:text-gray-300"
      >
        &larr; Back to entities
      </Link>
      <h1 className="text-2xl font-bold text-gray-100 mt-1 mb-1">
        {entity.name}
      </h1>
      <span className="text-xs text-gray-500 bg-gray-800 px-2 py-1 rounded capitalize">
        {entity.entity_type}
      </span>

      <div className="mt-6">
        <EntityRenderer type={entity.entity_type} data={entity.entity_data || {}} />
      </div>
    </div>
  );
}
