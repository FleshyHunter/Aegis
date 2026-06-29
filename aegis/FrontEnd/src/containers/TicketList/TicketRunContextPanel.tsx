import CheckCompletedToast from "../../components/CheckCompletedToast/CheckCompletedToast";

interface TicketRunContextPanelProps {
  value: string;
  onChange: (value: string) => void;
  showCompleted: boolean;
}

export default function TicketRunContextPanel({
  value,
  onChange,
  showCompleted,
}: TicketRunContextPanelProps) {
  return (
    <section className="run-context-panel">
      <div className="run-context-header">
        <label className="run-context-label" htmlFor="ticket-run-context">
          Additional Evaluation Context
        </label>
        <CheckCompletedToast show={showCompleted} />
      </div>
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
