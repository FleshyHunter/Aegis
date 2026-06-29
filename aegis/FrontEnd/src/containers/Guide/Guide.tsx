import Navbar from "../../components/Layout/Navbar";
import Footer from "../../components/Layout/Footer";
import FeatureCard from "../../components/Description/FeatureCard";
import "./Guide.css";

const STEPS = [
  {
    title: "Project Context",
    to: "/guide/project-contexts",
    description:
      "Optional but recommended. Store reusable domain vocabulary, naming conventions, and interpretation rules that apply across multiple pipeline runs. A good Project Context explains what your system does, what terminology is used, and how the evaluator should interpret ambiguous wording — without overriding BA or Building Block truth.",
    schema: {
      type: "fields",
      rows: [
        ["name", "A short label for this context (e.g. 'SR4 Identity Platform')"],
        ["description", "One-paragraph summary of the project domain"],
        ["context_text", "Full context body — vocabulary, synonyms, domain rules"],
      ],
    },
    tip: "Do not put pass/fail expectations or answer keys in the context. It is shared across runs and should remain evaluation-neutral.",
  },
  {
    title: "BA Rules",
    to: "/guide/ba",
    description:
      "Optional, but authoritative for currency checks when provided. Upload a CSV where each row describes one version of a business rule keyed by result_code. The pipeline selects the latest release row per result_code and checks the test case against it. If no BA is uploaded, currency is not evaluated.",
    schema: {
      type: "table",
      columns: ["result_code", "release", "action_labels", "is_valid_in_current_project", "is_deprecated_or_obsolete"],
      example: ["RC01", "SR4", "Approve Request | Reject Request | Escalate Review", "true", "false"],
    },
    tip: "Keep result_code naming consistent across BA Rules and your Ticket Set. Mismatched codes cause currency to be marked not found.",
  },
  {
    title: "Building Blocks",
    to: "/guide/building-blocks",
    description:
      "Required. Upload a DOCX file for each canonical workflow. A Building Block defines the routing rule (which test cases belong to it), preconditions, and the ordered canonical test steps the pipeline checks for frame conformance. One DOCX = one workflow. Do not mix unrelated workflows in a single file.",
    schema: {
      type: "fields",
      rows: [
        ["Title", "BB## — Workflow Name (e.g. BB02 - Identity Verification Workflow)"],
        ["Routing Rule", "When to use this block — describes the test case purpose it covers"],
        ["Preconditions", "Bullet list of system state assumptions"],
        ["Canonical Test Steps", "Numbered steps, each with Action and Expected Result"],
      ],
    },
    tip: "The routing rule is how the AI decides which Building Block a ticket belongs to. Write it clearly — it is the single most important field.",
  },
  {
    title: "Ticket Set",
    to: "/guide/ticket-sets",
    description:
      "Required. Upload a CSV where each row is one test case. The backend derives a normalised DerivedTestCase from each row before evaluation. The key fields the pipeline relies on are result_code (from the title), description, and steps.",
    schema: {
      type: "table",
      columns: ["jira_ticket_id", "test_case_id", "title_raw", "description_raw", "steps_raw", "components", "labels", "fix_versions"],
      example: ["JT-0001", "TC-0001", "[SYS][RC01][Identity Verification][Mismatch Handling]", "Summary: Verify that identity mismatch raises RC01...", "[[\"1. Start verification\", \"System displays instructions\"]]", "Verification", "identity, mismatch", "SR4"],
    },
    tip: "Test steps must be stored as action/expected-result pairs — not unstructured paragraphs. Missing or malformed steps reduce frame evaluation accuracy.",
  },
  {
    title: "User Prompt",
    to: "/tickets",
    description:
      "Optional, run-specific only. Use this to help the evaluator interpret wording, synonyms, or project quirks for this particular run. It supplements the evaluator — it does not override BA Rules or Building Block canonical steps.",
    schema: {
      type: "fields",
      rows: [
        ["Purpose", "Short, run-specific clarification for the evaluator"],
        ["Good use", "Treat 'reviewer console' and 'operator interface' as equivalent terms"],
        ["Bad use", "Override the BA rule if the test case conflicts with it"],
      ],
    },
    tip: "Keep it short and factual. If you find yourself writing more than 3–4 sentences, that content belongs in Project Context instead.",
  },
  {
    title: "Run the Pipeline",
    to: "/tickets",
    description:
      "Once your inputs are in place, select your BA Rules, Building Blocks, and optionally a Project Context on the Tickets page. Hit Run. The pipeline processes each ticket in two Dify phases: Phase 1 routes it to the best Building Block, Phase 2 evaluates frame conformance and BA currency.",
    schema: {
      type: "fields",
      rows: [
        ["Phase 1 — Routing", "AI selects the top Building Block candidates for each ticket"],
        ["Phase 2 — Evaluation", "AI checks frame (canonical steps) and currency (BA rule)"],
        ["Guards", "Backend enforces logical consistency on the AI response"],
        ["Verdict", "Deterministic backend rule combines frame + currency into final result"],
      ],
    },
    tip: null,
  },
  {
    title: "View Results",
    to: "/ticket-sets",
    description:
      "Results are stored under Ticket Sets after each run. Every ticket receives a final classification. The verdict is determined by the backend — not the AI — based on the two evaluation axes.",
    schema: {
      type: "verdict",
      rows: [
        ["Pass", "Building Block confirmed, frame passed, currency passed (or no BA provided)"],
        ["Failed", "Confirmed but frame failed — or BA provided and currency failed"],
        ["Skipped", "No Building Block could be confirmed for this ticket"],
      ],
    },
    tip: "If all tickets are Skipped, check that your Building Block routing rules match the language used in your ticket titles and descriptions.",
  },
];

export default function Guide() {
  return (
    <div className="page">
      <Navbar />

      <main className="guide-main">
        <div className="guide-header">
          <h1 className="guide-title">How to use AEGIS</h1>
          <div className="guide-divider" />
          <p className="guide-subtitle">
            Prepare your inputs correctly and the pipeline will do the rest.
          </p>
        </div>

        <div className="guide-cards">
          {STEPS.map((step, i) => (
            <FeatureCard
              key={step.title}
              index={i}
              title={step.title}
              to={step.to}
              description={step.description}
            >
              <SchemaBlock schema={step.schema} />
              {step.tip && (
                <div className="guide-tip">
                  <span className="guide-tip-label">Note</span>
                  {step.tip}
                </div>
              )}
            </FeatureCard>
          ))}
        </div>

        <div className="guide-mistakes">
          <h2 className="guide-mistakes-title">Common Mistakes</h2>
          <div className="guide-divider" />
          <ul className="guide-mistakes-list">
            <li>Uploading a Building Block that describes multiple unrelated workflows in one DOCX</li>
            <li>Missing or inconsistent <code>result_code</code> between your BA Rules and Ticket Set</li>
            <li>Test steps stored as unstructured paragraphs instead of action / expected-result pairs</li>
            <li>Using the User Prompt to override BA or Building Block rules</li>
            <li>Putting expected pass/fail labels in fields visible to the evaluator</li>
            <li>Treating BA Rules as mandatory — they are optional, but authoritative when provided</li>
          </ul>
        </div>
      </main>

      <Footer />
    </div>
  );
}

type SchemaRow = [string, string] | [string, string, string, string, string, string, string, string];

interface Schema {
  type: string;
  columns?: string[];
  example?: string[];
  rows?: string[][];
}

function SchemaBlock({ schema }: { schema: Schema | null }) {
  if (!schema) return null;

  if (schema.type === "fields") {
    return (
      <div className="guide-schema">
        <table className="guide-schema-table">
          <thead>
            <tr>
              <th>Field</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            {schema.rows!.map(([field, desc]) => (
              <tr key={field}>
                <td className="guide-schema-key">{field}</td>
                <td>{desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (schema.type === "table") {
    return (
      <div className="guide-schema guide-schema--scroll">
        <table className="guide-schema-table">
          <thead>
            <tr>
              {schema.columns!.map((col) => (
                <th key={col}>{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              {schema.example!.map((cell, i) => (
                <td key={i}>{cell}</td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    );
  }

  if (schema.type === "verdict") {
    return (
      <div className="guide-schema">
        <table className="guide-schema-table">
          <thead>
            <tr>
              <th>Result</th>
              <th>Meaning</th>
            </tr>
          </thead>
          <tbody>
            {schema.rows!.map(([result, meaning]) => (
              <tr key={result}>
                <td className={`guide-verdict guide-verdict--${result.toLowerCase()}`}>{result}</td>
                <td>{meaning}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return null;
}
