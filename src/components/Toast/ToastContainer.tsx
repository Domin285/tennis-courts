import React, { useRef } from "react";
import { ToastItem } from "../../types/toast";
import styles from "./ToastContainer.module.scss";

interface ToastContainerProps {
  toasts: readonly ToastItem[];
  onRemove: (id: string) => void;
  onPause: (id: string) => void;
  onResume: (id: string) => void;
}

interface ToastMessageProps {
  toast: ToastItem;
  onRemove: (id: string) => void;
  onPause: (id: string) => void;
  onResume: (id: string) => void;
}

const ToastMessage: React.FC<ToastMessageProps> = ({
  toast,
  onRemove,
  onPause,
  onResume,
}) => {
  const hoveredRef = useRef(false);
  const focusedRef = useRef(false);

  const resumeWhenInactive = () => {
    if (!hoveredRef.current && !focusedRef.current) {
      onResume(toast.id);
    }
  };

  const handleMouseEnter = () => {
    hoveredRef.current = true;
    onPause(toast.id);
  };

  const handleMouseLeave = () => {
    hoveredRef.current = false;
    resumeWhenInactive();
  };

  const handleFocus = () => {
    focusedRef.current = true;
    onPause(toast.id);
  };

  const handleBlur = (event: React.FocusEvent<HTMLDivElement>) => {
    const nextFocusedElement = event.relatedTarget;

    if (
      nextFocusedElement instanceof Node &&
      event.currentTarget.contains(nextFocusedElement)
    ) {
      return;
    }

    focusedRef.current = false;
    resumeWhenInactive();
  };

  const typeClass = toast.type === "success" ? styles.success : styles.error;

  const role = toast.type === "error" ? "alert" : "status";

  return (
    <div
      className={[
        "alert",
        "d-flex",
        "align-items-start",
        "gap-3",
        "mb-0",
        styles.toast,
        typeClass,
      ].join(" ")}
      role={role}
      aria-atomic="true"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocusCapture={handleFocus}
      onBlurCapture={handleBlur}
    >
      <span className={styles.icon} aria-hidden="true">
        {toast.type === "success" ? "✓" : "!"}
      </span>

      <p className={styles.message}>{toast.message}</p>

      <button
        type="button"
        className={["btn-close", styles.closeButton].join(" ")}
        aria-label="Zamknij powiadomienie"
        onClick={() => onRemove(toast.id)}
      />
    </div>
  );
};

export const ToastContainer: React.FC<ToastContainerProps> = ({
  toasts,
  onRemove,
  onPause,
  onResume,
}) => {
  if (toasts.length === 0) {
    return null;
  }

  return (
    <div className={styles.container} aria-label="Powiadomienia aplikacji">
      {toasts.map((toast) => (
        <ToastMessage
          key={toast.id}
          toast={toast}
          onRemove={onRemove}
          onPause={onPause}
          onResume={onResume}
        />
      ))}
    </div>
  );
};
