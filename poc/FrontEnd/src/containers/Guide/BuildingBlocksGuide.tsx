import { useNavigate } from "react-router-dom";
import { BsArrowLeft } from "react-icons/bs";
import Navbar from "../../components/Layout/Navbar";
import Footer from "../../components/Layout/Footer";
import FeatureCard from "../../components/Description/FeatureCard";
import Button from "../../components/Button/Button";
import "./Guide.css";

const STRUCTURE_ROWS = [
  ["Block Metadata", "Title, block ID, and release version for identifying the canonical workflow."],
  ["Routing Rule", "Clear criteria for which test cases belong to this Building Block."],
  ["Description", "AI-facing context describing scope, current release behaviour, and important historical differences."],
  ["Preconditions", "System state and external dependencies that must be true before the test starts."],
  ["Canonical Test Steps", "Ordered action and expected-result pairs that every matching test case should cover."],
];

const GOLDEN_BB_EXAMPLE = `BB01 — Passport Scanning - Standard

Block Metadata
Title:  Passport Scanning - Standard
Block ID:  BB01
Version (Release):  SR4

Routing Rule
All test cases that involve passport scanning and document reading at the border gantry. Applies to ICS and IB2.0 product lines. Matched when the test case title or description references passport scanning, MRZ reading, chip reading, or document validation.

Description (AI Context)
This building block covers the full passport scanning and document validation flow. SR4 is the current release. SR3 did not mandate chip cryptographic signature verification as a standalone step. All test cases in this block must test the full document lifecycle: MRZ → chip read → chip cross-check → document validity → screening. Action labels on the officer iPad for document-related exceptions in SR4 include "Retain Document" (PP01) which was not present in SR3.

Preconditions
Gantry is powered on and operational
Passport scanning unit is online and calibrated
Traveller has a valid travel document (passport)
Watchlist and visa screening services are reachable
Officer iPad is connected and active

Test Steps (Canonical Frame)
Step definitions below are the canonical core steps. Test cases must contain all steps below. Additional steps are permitted.
test_steps:
[
  {
    "step": 1,
    "action": "Traveller presents travel document to passport scanner",
    "expected": [
      "1.1 Document detected by scanner",
      "1.2 Scanning process initiated",
      "1.3 Document type identified as passport"
    ]
  },
  {
    "step": 2,
    "action": "System reads Machine Readable Zone (MRZ) from document",
    "expected": [
      "2.1 MRZ data extracted successfully",
      "2.2 Biographic data (name, DOB, nationality, document number) populated",
      "2.3 MRZ checksum validation passed"
    ]
  },
  {
    "step": 3,
    "action": "System reads RFID/NFC chip from passport",
    "expected": [
      "3.1 Chip detected and communication established",
      "3.2 Chip data groups (DG1, DG2) read successfully",
      "3.3 Chip cryptographic signature verified against issuing authority"
    ]
  },
  {
    "step": 4,
    "action": "System cross-checks chip data against MRZ data",
    "expected": [
      "4.1 Biographic data from chip matches MRZ",
      "4.2 No data mismatch detected",
      "4.3 If mismatch: PP03 exception raised on officer iPad"
    ]
  },
  {
    "step": 5,
    "action": "System validates document expiry and visa status",
    "expected": [
      "5.1 Passport expiry date validated against today",
      "5.2 If expired: PP01 exception raised",
      "5.3 Visa type and validity checked against entry requirements",
      "5.4 If visa invalid: VZ01 or VZ02 exception raised"
    ]
  },
  {
    "step": 6,
    "action": "System initiates watchlist and risk screening",
    "expected": [
      "6.1 Traveller identity submitted to watchlist screening service",
      "6.2 Risk profiling model executed",
      "6.3 Screening results returned within timeout window",
      "6.4 If watchlist hit: WL01 or WL02 raised accordingly"
    ]
  }
]`;

const BEST_PRACTICES = [
  "Put all sections in one DOCX file. One Building Block upload should contain metadata, routing rule, description, preconditions, and canonical steps together.",
  "Write the DOCX as plain document text with headings and numbered lists. Do not use tables inside the document.",
  "Use one Building Block for one canonical workflow. Do not mix unrelated flows into one document.",
  "Write the routing rule clearly because Phase 1 uses it to select the correct block.",
  "Keep canonical steps complete but not overly implementation-specific.",
  "Use ordered action and expected-result pairs so frame checking has a stable reference.",
  "Include release-specific differences only when they affect evaluation.",
  "Avoid expected pass/fail answers, label hints, or sample verdicts inside the Building Block.",
];

export default function BuildingBlocksGuide() {
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
          <h1 className="guide-title">Building Blocks Guide</h1>
          <div className="guide-divider" />
          <p className="guide-subtitle">
            Build one plain-text DOCX per canonical workflow for routing and frame conformance checks.
          </p>
        </div>

        <div className="guide-cards">
          <FeatureCard
            index={0}
            title="Required Structure"
            to="/building-blocks"
            description="A strong Building Block is one DOCX file containing all of these sections together. Use headings, paragraphs, bullets, and numbered steps inside the document. Do not split the sections across files and do not use tables in the DOCX."
          >
            <div className="guide-schema">
              <table className="guide-schema-table">
                <thead>
                  <tr>
                    <th>Section</th>
                    <th>Purpose</th>
                  </tr>
                </thead>
                <tbody>
                  {STRUCTURE_ROWS.map(([section, purpose]) => (
                    <tr key={section}>
                      <td className="guide-schema-key">{section}</td>
                      <td>{purpose}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </FeatureCard>

          <FeatureCard
            index={1}
            title="Golden Example"
            to="/building-blocks"
            description="This is the shape of the actual DOCX content. Keep it as one document with plain headings, paragraphs, and numbered step definitions."
          >
            <pre className="guide-example-doc">{GOLDEN_BB_EXAMPLE}</pre>
          </FeatureCard>

          <FeatureCard
            index={2}
            title="Best Practice"
            to="/building-blocks"
            description="Treat Building Blocks as reusable frame definitions. They should tell the evaluator what a complete test case must cover, not what final classification to return."
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
