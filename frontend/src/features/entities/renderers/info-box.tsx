interface InfoBoxProps {
  label: string;
  value: string;
}

export default function InfoBox({ label, value }: InfoBoxProps) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-3">
      <div className="text-xs text-gray-500">{label}</div>
      <div className="text-gray-100 font-medium">{value}</div>
    </div>
  );
}
