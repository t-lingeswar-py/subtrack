"use client";

import type { ReactNode } from "react";
import { AlertTriangle } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";

export function ConfirmSubmitButton({
  children,
  message,
  className,
  ariaLabel,
  confirmLabel = "Confirm action",
}: {
  children: ReactNode;
  message: string;
  className?: string;
  ariaLabel?: string;
  confirmLabel?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const messageId = useId();

  useEffect(() => {
    if (isOpen && dialogRef.current && !dialogRef.current.open) {
      dialogRef.current.showModal();
    }
  }, [isOpen]);

  function closeDialog() {
    if (dialogRef.current?.open) dialogRef.current.close();
    setIsOpen(false);
  }

  function confirmAction() {
    const form = triggerRef.current?.form;
    closeDialog();
    form?.requestSubmit();
  }

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className={className}
        aria-label={ariaLabel}
        onClick={() => setIsOpen(true)}
      >
        {children}
      </button>
      <dialog
        ref={dialogRef}
        className="confirm-dialog"
        aria-labelledby={titleId}
        aria-describedby={messageId}
        onCancel={(event) => {
          event.preventDefault();
          closeDialog();
        }}
        onClose={() => setIsOpen(false)}
      >
        <div className="confirm-dialog-content">
          <span className="confirm-dialog-icon"><AlertTriangle size={18} aria-hidden="true"/></span>
          <h2 id={titleId}>Please confirm</h2>
          <p id={messageId}>{message}</p>
          <div className="confirm-dialog-actions">
            <button type="button" className="button button-quiet" onClick={closeDialog}>Go back</button>
            <button type="button" className="button button-danger" onClick={confirmAction}>{confirmLabel}</button>
          </div>
        </div>
      </dialog>
    </>
  );
}
