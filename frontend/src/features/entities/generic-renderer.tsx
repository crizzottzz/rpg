import { useState } from 'react';
import {
  detectFieldShape,
  type ClassifiedField,
  type FieldShape,
} from './utils/field-detection';
import {
  shouldSkip,
  isEmptyValue,
  formatLabel,
  sortFields,
} from './utils/field-formatting';
import { renderMarkdown } from './utils/markdown';
import InfoBox from './renderers/info-box';
import { resolveDisplayValue } from './renderers/field-value';
import KeyValueGrid from './renderers/key-value-grid';
import SectionList from './renderers/section-list';

interface GenericRendererProps {
  data: Record<string, unknown>;
}

const HEADER_SHAPES = new Set<FieldShape>([
  'scalar',
  'boolean',
  'reference',
  'display_string_map',
  'reference_list',
]);

export default function GenericRenderer({ data }: GenericRendererProps) {
  const fields = classifyFields(data);

  const headerFields = fields.filter((f) => HEADER_SHAPES.has(f.shape));
  const richTextFields = fields.filter((f) => f.shape === 'rich_text');
  const gridFields = fields.filter((f) => f.shape === 'key_value_map');
  const namedSectionFields = fields.filter(
    (f) => f.shape === 'named_section_list'
  );
  const descOnlyFields = fields.filter((f) => f.shape === 'desc_only_list');
  const detailFields = fields.filter((f) => f.shape === 'detail_object');
  const unknownFields = fields.filter(
    (f) => f.shape === 'unknown_array' || f.shape === 'unknown_object'
  );

  return (
    <div className="space-y-4">
      {headerFields.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {headerFields.map((f) => (
            <InfoBox
              key={f.key}
              label={formatLabel(f.key)}
              value={resolveDisplayValue(f.value, f.shape)}
            />
          ))}
        </div>
      )}

      {richTextFields.map((f) => (
        <div
          key={f.key}
          className="bg-gray-900 border border-gray-800 rounded-lg p-4"
        >
          <h3 className="text-sm font-semibold text-gray-400 mb-2">
            {formatLabel(f.key)}
          </h3>
          <div className="text-gray-200 text-sm">
            {renderMarkdown(String(f.value))}
          </div>
        </div>
      ))}

      {gridFields.map((f) => (
        <KeyValueGrid
          key={f.key}
          label={formatLabel(f.key)}
          data={f.value as Record<string, unknown>}
        />
      ))}

      {namedSectionFields.map((f) => (
        <SectionList
          key={f.key}
          label={formatLabel(f.key)}
          items={f.value as Array<Record<string, unknown>>}
          variant="named"
        />
      ))}

      {descOnlyFields.map((f) => (
        <SectionList
          key={f.key}
          label={formatLabel(f.key)}
          items={f.value as Array<Record<string, unknown>>}
          variant="desc_only"
        />
      ))}

      {detailFields.map((f) => (
        <DetailSection
          key={f.key}
          label={formatLabel(f.key)}
          data={f.value as Record<string, unknown>}
        />
      ))}

      {unknownFields.map((f) => (
        <CollapsibleRaw key={f.key} label={formatLabel(f.key)} value={f.value} />
      ))}
    </div>
  );
}

function DetailSection({
  label,
  data,
}: {
  label: string;
  data: Record<string, unknown>;
}) {
  const inner = classifyFields(data);

  if (inner.length === 0) return null;

  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-400 mb-2">{label}</h3>
      <div className="border border-gray-800 rounded-lg p-4 space-y-3">
        {inner.map((f) => {
          if (HEADER_SHAPES.has(f.shape)) {
            return (
              <div key={f.key} className="flex gap-2">
                <span className="text-xs text-gray-500 min-w-[100px]">
                  {formatLabel(f.key)}
                </span>
                <span className="text-gray-200 text-sm">
                  {resolveDisplayValue(f.value, f.shape)}
                </span>
              </div>
            );
          }
          if (f.shape === 'rich_text') {
            return (
              <div key={f.key}>
                <span className="text-xs text-gray-500">
                  {formatLabel(f.key)}
                </span>
                <div className="text-gray-200 text-sm mt-1">
                  {renderMarkdown(String(f.value))}
                </div>
              </div>
            );
          }
          return (
            <CollapsibleRaw
              key={f.key}
              label={formatLabel(f.key)}
              value={f.value}
            />
          );
        })}
      </div>
    </div>
  );
}

function CollapsibleRaw({
  label,
  value,
}: {
  label: string;
  value: unknown;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-3">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="text-xs text-gray-500 hover:text-gray-300 cursor-pointer"
      >
        {label} {open ? '▾' : '▸'}
      </button>
      {open && (
        <pre className="text-gray-400 text-xs mt-2 overflow-x-auto whitespace-pre-wrap">
          {JSON.stringify(value, null, 2)}
        </pre>
      )}
    </div>
  );
}

function classifyFields(data: Record<string, unknown>): ClassifiedField[] {
  const filtered = Object.entries(data).filter(
    ([k, v]) => !shouldSkip(k) && !isEmptyValue(v)
  );
  const sorted = sortFields(filtered);
  return sorted.map(([key, value]) => ({
    key,
    value,
    shape: detectFieldShape(key, value),
  }));
}
