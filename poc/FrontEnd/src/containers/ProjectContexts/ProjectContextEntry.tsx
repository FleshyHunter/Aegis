import { useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import Navbar from "../../components/Layout/Navbar";
import Button from "../../components/Button/Button";
import type { ProjectContextSummary } from "./ProjectContexts";
import "./ProjectContexts.css";

export default function ProjectContextEntry() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { state } = useLocation() as { state?: ProjectContextSummary };
  const [contextText, setContextText] = useState(state?.context_text ?? "");

  return (
    <div>
      <Navbar />

      <div className="pc-entry-header">
        <Button label="Back" onClick={() => navigate("/project-contexts")} />
        <span className="pc-entry-name">{state?.name ?? "Project Context"}</span>
        <span className="pc-entry-info">
          {state ? `Updated ${new Date(state.updated_at).toLocaleString()}` : `Context ID ${id ?? "unknown"}`}
        </span>
      </div>

      {!state && (
        <p className="pc-error">
          Project context loading will be wired after the backend endpoint is added.
        </p>
      )}

      <div className="pc-editor-view">
        <dl className="pc-editor-metadata">
          <div>
            <dt>Name</dt>
            <dd>{state?.name ?? "Not loaded"}</dd>
          </div>
          <div>
            <dt>Default Context</dt>
            <dd>{state?.is_default ? "Yes" : "No"}</dd>
          </div>
          <div>
            <dt>Date Added</dt>
            <dd>{state ? new Date(state.created_at).toLocaleString() : "Not loaded"}</dd>
          </div>
          <div>
            <dt>Description</dt>
            <dd>{state?.description || "None"}</dd>
          </div>
        </dl>

        <textarea
          className="pc-textarea"
          value={contextText}
          onChange={(e) => setContextText(e.target.value)}
          placeholder="Project-level context will be edited here once the backend is wired."
        />
      </div>
    </div>
  );
}
