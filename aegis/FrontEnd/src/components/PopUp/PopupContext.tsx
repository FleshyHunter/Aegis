import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";
import Popup, { PopupOptions } from "./Popup";

type ConfirmInput = string | Omit<PopupOptions, "showCancel" | "input">;
type PromptInput = Omit<PopupOptions, "showCancel" | "input">;

interface PopupResult {
  confirmed: boolean;
  value: string;
}

interface PopupContextValue {
  confirm: (input: ConfirmInput) => Promise<boolean>;
  alert: (input: ConfirmInput) => Promise<void>;
  prompt: (input: PromptInput) => Promise<string | null>;
}

const PopupContext = createContext<PopupContextValue | null>(null);

export function usePopup(): PopupContextValue {
  const ctx = useContext(PopupContext);
  if (!ctx) throw new Error("usePopup must be used within a PopupProvider");
  return ctx;
}

interface ActivePopup {
  options: PopupOptions;
  resolve: (result: PopupResult) => void;
}

export function PopupProvider({ children }: { children: ReactNode }) {
  const [active, setActive] = useState<ActivePopup | null>(null);

  const open = useCallback((options: PopupOptions): Promise<PopupResult> => {
    return new Promise<PopupResult>((resolve) => {
      setActive({ options, resolve });
    });
  }, []);

  const confirm = useCallback(
    async (input: ConfirmInput) => {
      const options = typeof input === "string" ? { message: input } : input;
      const result = await open({ ...options, showCancel: true });
      return result.confirmed;
    },
    [open]
  );

  const alert = useCallback(
    async (input: ConfirmInput) => {
      const options = typeof input === "string" ? { message: input } : input;
      await open({ ...options, showCancel: false, confirmText: options.confirmText ?? "OK" });
    },
    [open]
  );

  const prompt = useCallback(
    async (input: PromptInput) => {
      const result = await open({ ...input, input: true, showCancel: true });
      return result.confirmed ? result.value : null;
    },
    [open]
  );

  function handleConfirm(value: string) {
    active?.resolve({ confirmed: true, value });
    setActive(null);
  }

  function handleCancel() {
    active?.resolve({ confirmed: false, value: "" });
    setActive(null);
  }

  return (
    <PopupContext.Provider value={{ confirm, alert, prompt }}>
      {children}
      {active && (
        <Popup options={active.options} onConfirm={handleConfirm} onCancel={handleCancel} />
      )}
    </PopupContext.Provider>
  );
}
