import { useEffect, useState } from "react";
import { BsCheckCircleFill } from "react-icons/bs";
import "./CheckCompletedToast.css";

export default function CheckCompletedToast({ show }: { show: boolean }) {
  const [phase, setPhase] = useState<"hidden" | "visible" | "fading">("hidden");

  useEffect(() => {
    if (!show) return;
    setPhase("visible");
    const fadeTimer = setTimeout(() => setPhase("fading"), 2700);
    const hideTimer = setTimeout(() => setPhase("hidden"), 3000);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(hideTimer);
    };
  }, [show]);

  if (phase === "hidden") return null;

  return (
    <span className={`check-toast check-toast--${phase}`}>
      <BsCheckCircleFill className="check-toast-icon" />
      Check Completed.
    </span>
  );
}
