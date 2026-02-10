interface InfoBoxProps {
  label: string;
  value: string;
}

export default function InfoBox({ label, value }: InfoBoxProps) {
  return (
    <div className="bg-surface border border-edge rounded-lg p-3">
      <div className="text-xs text-muted">{label}</div>
      <div className="text-heading font-medium">{value}</div>
    </div>
  );
}
