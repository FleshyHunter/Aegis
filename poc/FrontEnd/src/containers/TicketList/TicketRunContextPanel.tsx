interface TicketRunContextPanelProps {
  value: string;
  onChange: (value: string) => void;
}

export default function TicketRunContextPanel({
  value,
  onChange,
}: TicketRunContextPanelProps) {
  return (
    <section className="run-context-panel">
      <label className="run-context-label" htmlFor="ticket-run-context">
        Additional Evaluation Context
      </label>
      <textarea
        id="ticket-run-context"
        className="run-context-textarea"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Optional context for this run. This supports the evaluator but does not override the core validation rules."
      />
    </section>
  );
}
