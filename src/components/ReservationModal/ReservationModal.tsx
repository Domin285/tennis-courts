import React, { CSSProperties, useId, useState } from "react";
import { COURTS, CourtId } from "../../types/courts";
import { useReservations } from "../../context/ReservationContext";
import { useToast } from "../../context/ToastContext";
import { useModalAccessibility } from "../../hooks/useModalAccessibility";
import { formatReservationDate } from "../../utils/date";
import {
  MAX_EMAIL_LENGTH,
  MAX_FIRST_NAME_LENGTH,
  MAX_LAST_NAME_LENGTH,
  MAX_NOTES_LENGTH,
} from "../../utils/reservationValidation";
import styles from "./ReservationModal.module.scss";

interface ReservationModalProps {
  courtId: CourtId;
  start: string;
  end: string;
  onClose: () => void;
}

export const ReservationModal: React.FC<ReservationModalProps> = ({
  courtId,
  start,
  end,
  onClose,
}) => {
  const { createReservation } = useReservations();

  const { showToast } = useToast();

  const dialogRef = useModalAccessibility(onClose);

  const generatedId = useId();

  const titleId = `${generatedId}-title`;

  const descriptionId = `${generatedId}-description`;

  const firstNameId = `${generatedId}-first-name`;

  const lastNameId = `${generatedId}-last-name`;

  const emailId = `${generatedId}-email`;

  const notesId = `${generatedId}-notes`;

  const [firstName, setFirstName] = useState("");

  const [lastName, setLastName] = useState("");

  const [email, setEmail] = useState("");

  const [notes, setNotes] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);

  const court = COURTS[courtId];

  const modalCustomProperties = {
    "--reservation-court-color": court.color,
  } as CSSProperties;

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);

    const result = createReservation({
      courtId,
      start,
      end,
      firstName,
      lastName,
      email,
      notes,
    });

    if (!result.ok) {
      showToast(result.error ?? "Nie udało się utworzyć rezerwacji.", "error");

      setIsSubmitting(false);

      return;
    }

    showToast("Rezerwacja została zapisana.", "success");

    onClose();
  };

  const handleBackdropPointerDown = (
    event: React.PointerEvent<HTMLDivElement>,
  ) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  return (
    <div className={styles.backdrop} onPointerDown={handleBackdropPointerDown}>
      <div
        ref={dialogRef}
        className={styles.dialog}
        style={modalCustomProperties}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        aria-busy={isSubmitting}
        tabIndex={-1}
      >
        <header className={styles.header}>
          <div>
            <p className={styles.eyebrow}>Rezerwacja kortu</p>

            <h2 id={titleId} className={styles.title}>
              Nowa rezerwacja
            </h2>
          </div>

          <button
            type="button"
            className={["btn-close", styles.closeButton].join(" ")}
            aria-label="Zamknij okno rezerwacji"
            disabled={isSubmitting}
            onClick={onClose}
          />
        </header>

        <div id={descriptionId} className={styles.summary}>
          <span className={styles.courtIndicator} aria-hidden="true" />

          <div>
            <strong className={styles.courtName}>{court.label}</strong>

            <p className="mb-0">
              Termin: <strong>{formatReservationDate(start, end)}</strong>
            </p>
          </div>
        </div>

        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          <div className="row g-3">
            <div className="col-12 col-md-6">
              <label className="form-label fw-semibold" htmlFor={firstNameId}>
                Imię{" "}
                <span className={styles.requiredIndicator} aria-hidden="true">
                  *
                </span>
              </label>

              <input
                id={firstNameId}
                data-autofocus="true"
                className="form-control"
                type="text"
                value={firstName}
                maxLength={MAX_FIRST_NAME_LENGTH}
                autoComplete="given-name"
                required
                disabled={isSubmitting}
                onChange={(event) => setFirstName(event.target.value)}
              />
            </div>

            <div className="col-12 col-md-6">
              <label className="form-label fw-semibold" htmlFor={lastNameId}>
                Nazwisko{" "}
                <span className={styles.requiredIndicator} aria-hidden="true">
                  *
                </span>
              </label>

              <input
                id={lastNameId}
                className="form-control"
                type="text"
                value={lastName}
                maxLength={MAX_LAST_NAME_LENGTH}
                autoComplete="family-name"
                required
                disabled={isSubmitting}
                onChange={(event) => setLastName(event.target.value)}
              />
            </div>

            <div className="col-12">
              <label className="form-label fw-semibold" htmlFor={emailId}>
                Adres e-mail{" "}
                <span className={styles.requiredIndicator} aria-hidden="true">
                  *
                </span>
              </label>

              <input
                id={emailId}
                className="form-control"
                type="email"
                value={email}
                maxLength={MAX_EMAIL_LENGTH}
                autoComplete="email"
                inputMode="email"
                required
                disabled={isSubmitting}
                onChange={(event) => setEmail(event.target.value)}
              />
            </div>

            <div className="col-12">
              <div className="d-flex align-items-center justify-content-between gap-2">
                <label
                  className="form-label fw-semibold mb-0"
                  htmlFor={notesId}
                >
                  Notatki
                </label>

                <span className={styles.characterCounter} aria-live="polite">
                  {notes.length}/{MAX_NOTES_LENGTH}
                </span>
              </div>

              <textarea
                id={notesId}
                className={["form-control", styles.notes].join(" ")}
                value={notes}
                maxLength={MAX_NOTES_LENGTH}
                rows={4}
                disabled={isSubmitting}
                placeholder="Opcjonalne informacje dotyczące rezerwacji"
                onChange={(event) => setNotes(event.target.value)}
              />
            </div>
          </div>

          <p className={styles.requiredNote}>
            Pola oznaczone symbolem <span aria-hidden="true">*</span> są
            wymagane.
          </p>

          <div className={styles.actions}>
            <button
              type="button"
              className="btn btn-outline-secondary"
              disabled={isSubmitting}
              onClick={onClose}
            >
              Anuluj
            </button>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Zapisywanie..." : "Zarezerwuj"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
