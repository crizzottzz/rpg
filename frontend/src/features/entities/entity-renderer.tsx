import SpellRenderer from './spell-renderer';
import CreatureRenderer from './creature-renderer';
import GenericRenderer from './generic-renderer';

interface EntityRendererProps {
  type: string;
  data: Record<string, unknown>;
}

export default function EntityRenderer({ type, data }: EntityRendererProps) {
  switch (type) {
    case 'spell':
      return <SpellRenderer data={data} />;
    case 'creature':
      return <CreatureRenderer data={data} />;
    default:
      return <GenericRenderer data={data} />;
  }
}
