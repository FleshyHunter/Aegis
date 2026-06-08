import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../../components/Layout/Navbar";
import Button from "../../components/Button/Button";
import Footer from "../../components/Layout/Footer";
import FeatureCard from "../../components/Description/FeatureCard";
import "./Home.css";

const SUBTITLE = "Clean tickets, zero friction. Aegis uses advanced AI to guard your workflow, instantly flagging ticket anomalies and keeping your pipeline spotless.";
const TITLE_DURATION_MS = 700;
const TYPE_INTERVAL_MS = 28;

export default function Home() {
  const navigate = useNavigate();
  const [displayed, setDisplayed] = useState("");
  const [typing, setTyping] = useState(false);
  const indexRef = useRef(0);

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
        <img src="/AEGIS.png" alt="Aegis logo" className="hero-logo" />
        <h1 className="hero-title">AEGIS</h1>
        <p className="hero-subtitle">
          {displayed}
          {typing && <span className="hero-cursor" />}
        </p>
        <Button label="Get Started" variant="primary" onClick={() => navigate("/tickets")} />

        <div className="home-nav-buttons">
          <Button label="BA Rules" variant="secondary" onClick={() => navigate("/ba")} />
          <Button label="Building Blocks" variant="secondary" onClick={() => navigate("/building-blocks")} />
          <Button label="Ticket Sets" variant="secondary" onClick={() => navigate("/ticket-sets")} />
        </div>

        <div className="home-feature-cards">
          <FeatureCard
            title="BA Rules"
            description="Import and manage BA rule sets. Each entry is a CSV that defines the source-of-truth actions and reasons used to validate Jira test steps."
          />
          <FeatureCard
            title="Building Blocks"
            description="Upload and organise building block sets. These define the reusable test components that feed into the validation pipeline."
          />
          <FeatureCard
            title="Ticket Sets"
            description="View the output of each pipeline run. Results are saved here automatically after Run completes, showing MATCH and MISMATCH classifications."
          />
          <FeatureCard
            title="Tickets"
            description="Import Jira test step CSVs, select your BA and Building Block inputs, and run the AI pipeline to flag ticket anomalies."
          />
        </div>
      </main>

      <Footer />
    </div>
  );
}
