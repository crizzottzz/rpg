import { useParams, Link } from 'react-router-dom';
import Spinner from '../components/spinner';
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

  if (loading) return <Spinner />;
  if (!entity) return <div className="p-8 text-danger">Entity not found</div>;

  return (
    <div className="p-4 sm:p-8 max-w-4xl">
      <Link
        to={`/rulesets/${rulesetId}`}
        className="text-sm text-muted hover:text-content"
      >
        &larr; Back to entities
      </Link>
      <h1 className="text-2xl font-bold text-heading mt-1 mb-1">
        {entity.name}
      </h1>
      <span className="text-xs text-muted bg-subtle px-2 py-1 rounded capitalize">
        {entity.entity_type}
      </span>

      <div className="mt-6">
        <EntityRenderer type={entity.entity_type} data={entity.entity_data || {}} />
      </div>
    </div>
  );
}
