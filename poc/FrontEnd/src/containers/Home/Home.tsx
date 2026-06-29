import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../../components/Layout/Navbar";
import Button from "../../components/Button/Button";
import Footer from "../../components/Layout/Footer";
import FeatureCard from "../../components/Description/FeatureCard";
import { useScrollReveal } from "../../hooks/useScrollReveal";
import "./Home.css";

const SUBTITLE = "Clean tickets, zero friction. Aegis uses advanced AI to guard your workflow, instantly flagging ticket anomalies and keeping your pipeline spotless.";
const TITLE_DURATION_MS = 700;
const TYPE_INTERVAL_MS = 28;

export default function Home() {
  const navigate = useNavigate();
  const [displayed, setDisplayed] = useState("");
  const [typing, setTyping] = useState(false);
  const indexRef = useRef(0);

  const logo = useScrollReveal(0.1);
  const title = useScrollReveal(0.1);
  const subtitle = useScrollReveal(0.1);

  useEffect(() => {
    const startDelay = setTimeout(() => {
      setTyping(true);
      const interval = setInterval(() => {
        indexRef.current += 1;
        setDisplayed(SUBTITLE.slice(0, indexRef.current));
        if (indexRef.current >= SUBTITLE.length) {
          clearInterval(interval);
          setTyping(false);
        }
      }, TYPE_INTERVAL_MS);

      return () => clearInterval(interval);
    }, TITLE_DURATION_MS);

    return () => clearTimeout(startDelay);
  }, []);

  return (
    <div className="page">
      <Navbar />

      <main className="hero">
        <img
          ref={logo.ref as React.RefObject<HTMLImageElement>}
          src="/AEGIS.png"
          alt="Aegis logo"
          className={`hero-logo reveal-el ${logo.state}`}
        />
        <h1
          ref={title.ref as React.RefObject<HTMLHeadingElement>}
          className={`hero-title reveal-el ${title.state}`}
        >
          AEGIS
        </h1>
        <p
          ref={subtitle.ref as React.RefObject<HTMLParagraphElement>}
          className={`hero-subtitle reveal-el ${subtitle.state}`}
        >
          {displayed}
          {typing && <span className="hero-cursor" />}
        </p>
        <Button
          label="Get Started"
          variant="primary"
          onClick={() => navigate("/tickets")}
          style={{ padding: "10px 24px", fontSize: "16px" }}
        />

        <div className="home-nav-buttons">
          <Button label="Project Context" variant="secondary" onClick={() => navigate("/project-contexts")} />
          <Button label="BA Rules" variant="secondary" onClick={() => navigate("/ba")} />
          <Button label="Building Blocks" variant="secondary" onClick={() => navigate("/building-blocks")} />
          <Button label="Ticket Sets" variant="secondary" onClick={() => navigate("/ticket-sets")} />
        </div>

        <div className="home-section-header">
          <h2 className="home-section-title">What's inside</h2>
          <div className="home-section-divider" />
          <p className="home-section-subtitle">Explore the tools that power your workflow.</p>
        </div>

        <div className="home-feature-cards">
          <FeatureCard
            index={0}
            to="/project-contexts"
            title="Project Context"
            description="Maintain reusable project background for pipeline runs. Store domain notes, naming
             conventions, release assumptions, and reviewer guidance separately from one-off run prompts so each
              evaluation can later snapshot the exact context it used."
          />
          <FeatureCard
            index={1}
            to="/ba"
            title="BA Rules"
            description="Import and manage BA rule sets used for requirement-currency checks. Each CSV maps result
             codes to expected behaviour by release, helping the pipeline identify whether a test case still reflects
              the latest known rule when BA context is provided."
          />
          <FeatureCard
            index={2}
            to="/building-blocks"
            title="Building Blocks"
            description="Import and organise canonical test flows. Building Blocks are the required frame reference
             for evaluation: the pipeline routes each derived test case to the most relevant block, then checks whether
              its steps cover the expected structure while allowing harmless extra detail."
          />
          <FeatureCard
            index={3}
            to="/ticket-sets"
            title="Ticket Sets"
            description="View imported test-case batches and their related pipeline views. Each Ticket Set keeps the
             original raw upload, the derived normalized table, recorded pipeline runs, detailed results, and a summary
              view so you can inspect how each test case moved through the evaluation flow."
          />
          <FeatureCard
            index={4}
            to="/tickets"
            title="Tickets"
            description="Import Jira test case exports, select your BA rule set and Building Block inputs, and run
             the AI pipeline to flag test cases that don't conform to their expected structure or are outdated
              against the latest BA rules."
          />
        </div>
      </main>

      <Footer />
    </div>
  );
}
