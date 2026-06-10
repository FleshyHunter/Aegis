import React from "react";
import "./Button.css";

interface ButtonProps {
  label: string;
  onClick?: () => void;
  variant?: "default" | "primary" | "secondary";
  disabled?: boolean;
  style?: React.CSSProperties;
  icon?: React.ReactNode;
}

export default function Button({
  label,
  onClick,
  variant = "default",
  disabled = false,
  style,
  icon,
}: ButtonProps) {
  return (
    <button className={`btn btn-${variant}`} onClick={onClick} disabled={disabled} style={style}>
      {icon && <span className="btn-icon">{icon}</span>}
      {label}
    </button>
  );
}
