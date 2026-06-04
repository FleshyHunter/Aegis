import React from "react";
import "./Button.css";

interface ButtonProps {
  label: string;
  onClick?: () => void;
  variant?: "default" | "primary";
  disabled?: boolean;
}

export default function Button({ label, onClick, variant = "default", disabled = false }: ButtonProps) {
  return (
    <button className={`btn btn-${variant}`} onClick={onClick} disabled={disabled}>
      {label}
    </button>
  );
}
