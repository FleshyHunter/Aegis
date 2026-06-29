import { useNavigate } from "react-router-dom";
import { BsArrowLeft } from "react-icons/bs";
import Navbar from "../../components/Layout/Navbar";
import Footer from "../../components/Layout/Footer";
import FeatureCard from "../../components/Description/FeatureCard";
import Button from "../../components/Button/Button";
import "./Guide.css";

const CORE_FIELDS = [
  ["Jira Ticket Id", "The Jira issue identifier for traceability back to the source ticket."],
  ["Test Case Id", "The test case identifier used to track the case across raw, derived, and result views."],
  ["Title Raw", "The original title. The pipeline derives result code and test-case purpose from this field."],
  ["Description Raw", "The original description, including summary, context, and preconditions."],
  ["Steps Raw", "Action and expected-result pairs. This is the most important field for frame evaluation."],
  ["Fix Versions", "Release information that can support requirement-currency checks."],
  ["Label Hint", "Optional human label for later comparison. It must not be used as evaluation evidence."],
];

const GOLDEN_COLUMNS = [
  "Jira Ticket Id",
  "Test Case Id",
  "Title Raw",
  "Type",
  "Components",
  "Labels",
  "Execution Type",
  "Test Repo Path",
  "Status",
  "Resolution",
  "Fix Versions",
  "Description Raw",
  "Steps Raw",
  "Label Hint",
];

const GOLDEN_EXAMPLE = [
  "JT-0001",
  "TC-0001",
  "[XX][IR01][Iris][Mismatch] Iris mismatch raises IR01 with SR4 three-action workflow",
  "Test",
  "Iris Scanner, Biometric Verification",
  "XX, IR01, Iris, Mismatch",
  "Manual",
  "/XX/Biometrics/Iris/Mismatch",
  "Active",
  "Unresolved",
  "XX SR4",
  "Summary plus preconditions. Include system mode, traveller profile, scanner readiness, and officer device availability.",
  "[[\"Launch iris verification\", \"Interface is displayed and camera is Ready\"], [\"Capture iris and match against profile\", \"Liveness passes, match fails, IR01 is raised\"]]",
  "Pass",
];

const BEST_PRACTICES = [
  "Use one CSV row per test case.",
  "Keep the raw upload faithful to the source export. Raw data should not be manually pre-normalized.",
  "Keep result-code naming consistent with BA Rules and Building Block routing language.",
  "Store steps as action and expected-result pairs, not as one unstructured paragraph.",
  "Use escaped line breaks inside long text cells when needed.",
  "Preserve Label Hint only for later comparison. Do not treat it as evidence during evaluation.",
];

const WEAK_REASONS = [
  "The title does not expose a clear result code or scenario purpose.",
  "The description does not include useful context or preconditions.",
  "The steps are not structured as action and expected-result pairs.",
  "The row gives the evaluator too little evidence to check frame conformance.",
];

export default function TicketSetsGuide() {
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
          <h1 className="guide-title">Ticket Sets Guide</h1>
          <div className="guide-divider" />
          <p className="guide-subtitle">
            Prepare raw test-case CSV uploads that can be derived cleanly and evaluated reliably.
          </p>
        </div>

        <div className="guide-cards">
          <FeatureCard
            index={0}
            title="Core Fields"
            to="/tickets"
            description="A Ticket Set CSV can contain many source columns, but these fields matter most for derivation, routing, frame checking, and later result comparison."
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
            to="/tickets"
            description="This mirrors the table style from the main guide. Keep the real CSV faithful to the source export, but make sure these fields contain enough evidence for derivation and evaluation."
          >
            <div className="guide-schema guide-schema--scroll">
              <table className="guide-schema-table">
                <thead>
                  <tr>
                    {GOLDEN_COLUMNS.map((column) => (
                      <th key={column}>{column}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    {GOLDEN_EXAMPLE.map((cell, index) => (
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
            to="/tickets"
            description="Avoid rows that hide the scenario purpose or collapse all test steps into unstructured prose."
          >
            <div className="guide-text-block guide-text-block--muted">
              <span className="guide-tip-label">weak row</span>
              <p>JT-0001, TC-0001, Check mismatch, Do the test and verify the system handles it, Pass</p>
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
            to="/tickets"
            description="Treat Ticket Sets as source data. The backend will create raw and derived views from the upload, so the CSV should be clear, consistent, and traceable."
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
