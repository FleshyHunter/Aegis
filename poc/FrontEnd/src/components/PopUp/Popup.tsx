import React, { useState } from "react";
import "./Popup.css";

export interface PopupOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "default" | "danger";
  showCancel?: boolean;
  input?: boolean;
  defaultValue?: string;
  placeholder?: string;
}

interface PopupProps {
  options: PopupOptions;
  onConfirm: (value: string) => void;
  onCancel: () => void;
}

export default function Popup({ options, onConfirm, onCancel }: PopupProps) {
  const {
    title,
    message,
    confirmText = "Confirm",
    cancelText = "Cancel",
    variant = "default",
    showCancel = true,
    input = false,
    defaultValue = "",
    placeholder = "",
  } = options;

  const [value, setValue] = useState(defaultValue);

  function handleConfirm() {
    onConfirm(value);
  }

  return (
    <div className="popup-overlay" onClick={onCancel}>
      <div className="popup-box" onClick={(e) => e.stopPropagation()}>
        {title && <div className="popup-title">{title}</div>}
        <div className="popup-message">{message}</div>

        {input && (
          <input
            className="popup-input"
            type="text"
            value={value}
            placeholder={placeholder}
            autoFocus
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleConfirm()}
          />
        )}

        <div className="popup-actions">
          {showCancel && (
            <button className="btn" onClick={onCancel}>
              {cancelText}
            </button>
          )}
          <button
            className={`btn ${variant === "danger" ? "btn-danger" : "btn-primary"}`}
            onClick={handleConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
