export function Stepper({
  current,
  total,
  label,
}: {
  current: number;
  total: number;
  label: string;
}) {
  return (
    <div className="stepper">
      <div className="stepper__track">
        <span style={{ width: `${(current / total) * 100}%` }} />
      </div>
      <p>
        {current} / {total} · {label}
      </p>
    </div>
  );
}
