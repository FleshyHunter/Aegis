import { useNavigate } from "react-router-dom";
import { BsArrowRight } from "react-icons/bs";
import { useScrollReveal } from "../../hooks/useScrollReveal";
import "./FeatureCard.css";

interface Props {
  title: string;
  description: string;
  index: number;
  to: string;
}

export default function FeatureCard({ title, description, index, to }: Props) {
  const navigate = useNavigate();
  const { ref, state } = useScrollReveal(0.15);
  const num = String(index + 1).padStart(2, "0");

  return (
    <div ref={ref as React.RefObject<HTMLDivElement>} className={`feature-card ${state}`}>
      <div className="feature-card-header">
        <span className="feature-card-number">{num}</span>
        <h3 className="feature-card-title">{title}</h3>
        <button className="feature-card-arrow" onClick={() => navigate(to)} aria-label={`Go to ${title}`}>
          <BsArrowRight />
        </button>
      </div>
      <div className="feature-card-divider" />
      <p className="feature-card-description">{description}</p>
    </div>
  );
}
