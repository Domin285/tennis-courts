import React, { ReactNode, useId } from "react";
import { useModalAccessibility } from "../../hooks/useModalAccessibility";
import styles from "./ConfirmModal.module.scss";

type ConfirmModalVariant = "primary" | "danger";

interface ConfirmModalProps {
  title: string;
  description: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: ConfirmModalVariant;
  onConfirm: () => void;
  onClose: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  title,
  description,
  confirmLabel = "Potwierdź",
  cancelLabel = "Anuluj",
  variant = "danger",
  onConfirm,
  onClose,
}) => {
  const dialogRef = useModalAccessibility(onClose);

  const generatedId = useId();
  const titleId = `${generatedId}-title`;
  const descriptionId = `${generatedId}-description`;

  const handleBackdropPointerDown = (
    event: React.PointerEvent<HTMLDivElement>,
  ) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  const confirmButtonClass =
    variant === "danger" ? "btn-danger" : "btn-primary";

  return (
    <div className={styles.backdrop} onPointerDown={handleBackdropPointerDown}>
      <div
        ref={dialogRef}
        className={styles.dialog}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        tabIndex={-1}
      >
        <header className={styles.header}>
          <div className={styles.icon} aria-hidden="true">
            {variant === "danger" ? "!" : "?"}
          </div>

          <div className={styles.headerContent}>
            <h2 id={titleId} className={styles.title}>
              {title}
            </h2>

            <div id={descriptionId} className={styles.description}>
              {description}
            </div>
          </div>

          <button
            type="button"
            className={["btn-close", styles.closeButton].join(" ")}
            aria-label="Zamknij okno potwierdzenia"
            onClick={onClose}
          />
        </header>

        <div className={styles.actions}>
          <button
            type="button"
            data-autofocus="true"
            className="btn btn-outline-secondary"
            onClick={onClose}
          >
            {cancelLabel}
          </button>

          <button
            type="button"
            className={["btn", confirmButtonClass].join(" ")}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
