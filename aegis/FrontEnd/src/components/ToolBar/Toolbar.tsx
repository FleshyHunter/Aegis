import React, { ReactNode } from "react";
import "./Toolbar.css";

interface ToolbarProps {
  left?: ReactNode;
  right?: ReactNode;
}

export default function Toolbar({ left, right }: ToolbarProps) {
  return (
    <div className="toolbar">
      <div className="toolbar-section toolbar-left">{left}</div>
      <div className="toolbar-section toolbar-right">{right}</div>
    </div>
  );
}
