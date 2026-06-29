import { useNavigate } from "react-router-dom";
import { BsArrowLeft } from "react-icons/bs";
import Navbar from "../../components/Layout/Navbar";
import Footer from "../../components/Layout/Footer";
import FeatureCard from "../../components/Description/FeatureCard";
import Button from "../../components/Button/Button";
import "./Guide.css";

const GOLDEN_CONTEXT = [
  "This project evaluates QA test cases for an automated access-control gate system used to process users through a self-service checkpoint.",
  "The system includes document reading, identity verification, biometric capture, biometric matching, exception handling, and operator review workflows. Test cases should be interpreted in the context of automated checkpoint processing, where the system must verify identity, detect mismatches, raise result codes, and guide operators through the correct operational response.",
  "Core domain concepts: user or traveller means the person being processed through the gate; gate, kiosk, automated lane, and self-service checkpoint refer to the automated processing station; travel document means the passport or identity document presented by the user; chip data is electronic document data read from the travel document chip; MRZ is the machine-readable zone printed on the document.",
  "Document scan means reading document data. Biometric capture means capturing a biometric sample. Biometric verification means comparing a captured biometric sample against expected identity data. Liveness detection is an anti-spoofing check to confirm the sample is from a live person. Match means the captured identity or biometric data is consistent with the expected identity. Mismatch means it does not match.",
  "Result code means the coded outcome or exception raised by the system. Operator review means manual review triggered when the gate cannot fully clear the user automatically. Operator interface means the screen or device used to review exceptions and choose an action. Hold or hold-up means the user is prevented from proceeding until the exception is resolved. Abort transaction means the processing session is cancelled or stopped.",
  "Interpretation rules: treat officer, operator, reviewer, and supervisor as equivalent when they refer to the person reviewing an exception. Treat officer interface, reviewer console, operator tablet, and profiler as equivalent when they refer to the manual review UI. Treat traveller, passenger, and user as equivalent when they refer to the person being processed.",
  "Treat passport, document, and travel document as equivalent unless the test case specifically distinguishes chip, MRZ, or printed document data. Treat exception, result code, error code, and handling code as related concepts, but preserve the exact result_code when evaluating BA rule currency. Treat wording differences semantically; exact phrase matching is not required.",
  "Evaluation priorities: Building Blocks are the source of truth for frame conformance. BA Rules are the source of truth for requirement currency when provided. Project Context may clarify domain wording, synonyms, and operational meaning. User Prompt may clarify run-specific terminology. Project Context and User Prompt must never override Building Block or BA Rule truth.",
  "Frame conformance guidance: a test case should contain all required canonical Building Block steps, even if phrased differently. Extra steps are acceptable if they do not contradict the Building Block. Missing key operational checks, missing biometric verification steps, missing liveness checks where required, missing document cross-checks where required, or missing operator review actions where required should be treated as frame issues.",
  "Requirement currency guidance: when BA Rules are provided, compare the test case against the latest applicable rule for its result code. Pay attention to current release behaviour, action labels, exception colour, hold behaviour, operator notification, and permission flags such as whether the operator can abort the transaction. If BA Rules are not provided, requirement currency is not assessed. If BA Rules are provided but no matching result code is found, currency should fail.",
  "Do not use any label hint, expected classification, sample answer, or known pass/fail value as evidence. Evaluation must be based only on the test case content, selected Building Block, BA context, Project Context, and User Prompt.",
];

const STRUCTURE_ROWS = [
  ["Domain Background", "What kind of system, workflow, or product area the test cases belong to."],
  ["Result Code Meaning", "How result codes should influence routing and interpretation."],
  ["Naming Conventions", "How titles, labels, components, bracket tags, or release names are usually written."],
  ["Synonym Rules", "Equivalent terms the evaluator should treat semantically, such as operator, reviewer, or officer."],
  ["Building Block Rules", "How canonical steps should be treated during frame checking."],
  ["BA Rule Rules", "How latest requirements, releases, and stale behaviour should be judged."],
  ["Evidence Boundaries", "Fields that must not be used as evidence, such as label hints or expected classifications."],
  ["Reviewer Guidance Limits", "What user guidance can clarify, and what it must not override."],
];

const WEAK_EXAMPLE_REASONS = [
  "It gives no domain background.",
  "It does not explain result codes.",
  "It does not explain naming conventions.",
  "It does not tell the evaluator how to use BA Rules or Building Blocks.",
  "It is too vague to improve routing or evaluation quality.",
];

export default function ProjectContextGuide() {
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
          <h1 className="guide-title">Project Context Guide</h1>
          <div className="guide-divider" />
          <p className="guide-subtitle">
            Write reusable context that helps the evaluator understand your project without leaking private details.
          </p>
        </div>

        <div className="guide-cards">
          <FeatureCard
            index={0}
            title="Golden Example"
            to="/project-contexts"
            description="Use this as the shape of a strong Project Context entry. It is stable across runs, explains how to interpret the domain, and avoids telling the evaluator what final answer to produce."
          >
            <div className="guide-schema">
              <table className="guide-schema-table">
                <tbody>
                  <tr>
                    <td className="guide-schema-key">name</td>
                    <td>Automated Gate Exception Handling Context</td>
                  </tr>
                  <tr>
                    <td className="guide-schema-key">description</td>
                    <td>
                      Reusable context for evaluating QA test cases for an automated gate workflow involving document
                      checks, identity verification, exception handling, and operator review.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="guide-text-block">
              <span className="guide-tip-label">context_text</span>
              {GOLDEN_CONTEXT.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </FeatureCard>

          <FeatureCard
            index={1}
            title="Recommended Structure"
            to="/project-contexts"
            description="A good Project Context is not just a paragraph of background. It should explain the stable rules the evaluator needs before routing and evaluating test cases."
          >
            <div className="guide-schema">
              <table className="guide-schema-table">
                <thead>
                  <tr>
                    <th>Section</th>
                    <th>What to include</th>
                  </tr>
                </thead>
                <tbody>
                  {STRUCTURE_ROWS.map(([section, detail]) => (
                    <tr key={section}>
                      <td className="guide-schema-key">{section}</td>
                      <td>{detail}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </FeatureCard>

          <FeatureCard
            index={2}
            title="Weak Example"
            to="/project-contexts"
            description="Avoid context that is too vague, too run-specific, or secretly trying to force the final classification."
          >
            <div className="guide-text-block guide-text-block--muted">
              <span className="guide-tip-label">weak context_text</span>
              <p>Please check the test cases and pass the good ones.</p>
            </div>

            <ul className="guide-list">
              {WEAK_EXAMPLE_REASONS.map((reason) => (
                <li key={reason}>{reason}</li>
              ))}
            </ul>
          </FeatureCard>

          <FeatureCard
            index={3}
            title="Best Practice"
            to="/project-contexts"
            description="Keep Project Context reusable, domain-specific, and company-neutral. It should clarify how to interpret the project, not force a verdict."
          >
            <ul className="guide-list">
              <li>Use Project Context for stable domain vocabulary, naming rules, and release assumptions.</li>
              <li>Define important synonyms clearly so the evaluator can match wording semantically.</li>
              <li>Use the run prompt for temporary reviewer notes, synonym clarifications, or one-off instructions.</li>
              <li>State that Project Context and User Prompt must not override BA Rules or Building Blocks.</li>
              <li>Exclude label hints, expected classifications, answer keys, and sample verdicts from evaluation evidence.</li>
              <li>Do not include secrets, customer names, API keys, or private identifiers.</li>
            </ul>
          </FeatureCard>
        </div>
      </main>

      <Footer />
    </div>
  );
}
