import { useNavigate } from "react-router-dom";
import { BsArrowLeft } from "react-icons/bs";
import Navbar from "../../components/Layout/Navbar";
import Footer from "../../components/Layout/Footer";
import FeatureCard from "../../components/Description/FeatureCard";
import Button from "../../components/Button/Button";
import "./Guide.css";

const CORE_FIELDS = [
  ["result_code", "The key used to match a test case to the correct BA rule."],
  ["release", "The release or version used to decide which rule is latest."],
  ["action_labels", "The expected operator action options for the result code."],
  ["is_valid_in_current_project", "Whether this rule applies to the current project scope."],
  ["is_deprecated_or_obsolete", "Whether this rule is stale and should not be treated as current."],
];

const CSV_COLUMNS = [
  "result_code",
  "release",
  "action_labels",
  "is_valid_in_current_project",
  "is_deprecated_or_obsolete",
];

const CSV_EXAMPLE = [
  "RC01",
  "SR4",
  "Approve Request | Reject Request | Escalate Review",
  "true",
  "false",
];

const BEST_PRACTICES = [
  "Use one row per result-code and release combination.",
  "Keep result_code values consistent with the result codes extracted from Ticket Sets.",
  "Use release values that can be compared clearly, such as SR1, SR2, SR3, and SR4.",
  "Place all current operator actions inside action_labels, separated consistently.",
  "Mark old rows as deprecated or not valid instead of deleting history from the CSV.",
  "Do not include expected pass/fail answers or test-case label hints in BA Rules.",
];

const WEAK_REASONS = [
  "It does not clearly identify the result code.",
  "It does not tell the pipeline which release is current.",
  "It hides the expected operator actions inside vague prose.",
  "It gives no validity or deprecation signal.",
];

export default function BARulesGuide() {
  const navigate = useNavigate();

  return (
    <div className="page">
      <Navbar />

      <main className="guide-main">
        <div className="guide-header">
          <Button
            label="Back to Guide"
            variant="secondary"
            icon={<BsArrowLeft />}
            onClick={() => navigate("/guide")}
            style={{ marginBottom: "20px" }}
          />
          <h1 className="guide-title">BA Rules Guide</h1>
          <div className="guide-divider" />
          <p className="guide-subtitle">
            Structure BA Rules so the pipeline can identify the latest requirement for each result code.
          </p>
        </div>

        <div className="guide-cards">
          <FeatureCard
            index={0}
            title="Core Fields"
            to="/ba"
            description="These are the minimum fields the pipeline needs for requirement-currency checks. Extra BA columns can exist, but these fields should be clean and consistent."
          >
            <div className="guide-schema">
              <table className="guide-schema-table">
                <thead>
                  <tr>
                    <th>Field</th>
                    <th>Purpose</th>
                  </tr>
                </thead>
                <tbody>
                  {CORE_FIELDS.map(([field, purpose]) => (
                    <tr key={field}>
                      <td className="guide-schema-key">{field}</td>
                      <td>{purpose}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </FeatureCard>

          <FeatureCard
            index={1}
            title="Golden CSV Row"
            to="/ba"
            description="A strong BA row gives the evaluator a clear result-code mapping, a comparable release, current action labels, and explicit validity flags."
          >
            <div className="guide-schema guide-schema--scroll">
              <table className="guide-schema-table">
                <thead>
                  <tr>
                    {CSV_COLUMNS.map((column) => (
                      <th key={column}>{column}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    {CSV_EXAMPLE.map((cell, index) => (
                      <td key={index}>{cell}</td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </FeatureCard>

          <FeatureCard
            index={2}
            title="Weak Example"
            to="/ba"
            description="Avoid BA rows that rely on prose alone or make the latest requirement difficult to identify."
          >
            <div className="guide-text-block guide-text-block--muted">
              <span className="guide-tip-label">weak ba row</span>
              <p>When this exception happens, the operator should handle it using the latest process.</p>
            </div>

            <ul className="guide-list">
              {WEAK_REASONS.map((reason) => (
                <li key={reason}>{reason}</li>
              ))}
            </ul>
          </FeatureCard>

          <FeatureCard
            index={3}
            title="Best Practice"
            to="/ba"
            description="Treat BA Rules as the currency source of truth. They should describe the current requirement state, not how a particular test case should be classified."
          >
            <ul className="guide-list">
              {BEST_PRACTICES.map((practice) => (
                <li key={practice}>{practice}</li>
              ))}
            </ul>
          </FeatureCard>
        </div>
      </main>

      <Footer />
    </div>
  );
}
