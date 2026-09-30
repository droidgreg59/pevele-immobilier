export default function RiskLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col">
      <span className="text-[12px] font-semibold text-muted">{label}</span>
      <span className="text-[13.5px] text-ink">{value}</span>
    </div>
  );
}
