import React, { CSSProperties, useId, useMemo, useState } from "react";
import { useToast } from "../../context/ToastContext";
import { useNow } from "../../hooks/useNow";
import { COURTS, CourtId } from "../../types/courts";
import { Reservation, UpdateReservationPayload } from "../../types/reservation";
import {
  addMinutesToLocalDateTime,
  localDateTimeToISOString,
  toLocalDateTimeValue,
} from "../../utils/date";
import {
  MAX_EMAIL_LENGTH,
  MAX_FIRST_NAME_LENGTH,
  MAX_LAST_NAME_LENGTH,
  MAX_NOTES_LENGTH,
  MIN_RESERVATION_MINUTES,
  normalizeReservationData,
  validateReservationData,
} from "../../utils/reservationValidation";
import { useModalAccessibility } from "../../hooks/useModalAccessibility";
import styles from "./AdminEditModal.module.scss";

interface AdminEditModalProps {
  reservation: Reservation;
  onClose: () => void;
  onSave: (payload: UpdateReservationPayload) => void;
}

export const AdminEditModal: React.FC<AdminEditModalProps> = ({
  reservation,
  onClose,
  onSave,
}) => {
  const { showToast } = useToast();

  const now = useNow();

  const dialogRef = useModalAccessibility(onClose);

  const generatedId = useId();

  const titleId = `${generatedId}-title`;

  const descriptionId = `${generatedId}-description`;

  const courtIdField = `${generatedId}-court`;

  const startId = `${generatedId}-start`;

  const endId = `${generatedId}-end`;

  const firstNameId = `${generatedId}-first-name`;

  const lastNameId = `${generatedId}-last-name`;

  const emailId = `${generatedId}-email`;

  const notesId = `${generatedId}-notes`;

  const [selectedCourtId, setSelectedCourtId] = useState<CourtId>(
    reservation.courtId,
  );

  const [start, setStart] = useState(toLocalDateTimeValue(reservation.start));

  const [end, setEnd] = useState(toLocalDateTimeValue(reservation.end));

  const [firstName, setFirstName] = useState(reservation.firstName);

  const [lastName, setLastName] = useState(reservation.lastName);

  const [email, setEmail] = useState(reservation.email);

  const [notes, setNotes] = useState(reservation.notes ?? "");

  const [isSubmitting, setIsSubmitting] = useState(false);

  const minimumStart = useMemo(
    () => toLocalDateTimeValue(new Date(now).toISOString()),
    [now],
  );

  const minimumEnd = useMemo(
    () => addMinutesToLocalDateTime(start, MIN_RESERVATION_MINUTES),
    [start],
  );

  const selectedCourt = COURTS[selectedCourtId];

  const dialogStyles = {
    "--admin-court-color": selectedCourt.color,
  } as CSSProperties;

  const handleStartChange = (nextStart: string) => {
    setStart(nextStart);

    const nextMinimumEnd = addMinutesToLocalDateTime(
      nextStart,
      MIN_RESERVATION_MINUTES,
    );

    const startTime = new Date(nextStart).getTime();

    const endTime = new Date(end).getTime();

    const minimumEndTime = new Date(nextMinimumEnd).getTime();

    if (
      Number.isFinite(startTime) &&
      Number.isFinite(endTime) &&
      Number.isFinite(minimumEndTime) &&
      endTime < minimumEndTime
    ) {
      setEnd(nextMinimumEnd);
    }
  };

  const handleEndChange = (nextEnd: string) => {
    const minimumEndTime = new Date(minimumEnd).getTime();

    const nextEndTime = new Date(nextEnd).getTime();

    if (
      Number.isFinite(minimumEndTime) &&
      Number.isFinite(nextEndTime) &&
      nextEndTime < minimumEndTime
    ) {
      setEnd(minimumEnd);

      showToast(
        `Rezerwacja musi trwać co najmniej ${MIN_RESERVATION_MINUTES} minut.`,
        "error",
      );

      return;
    }

    setEnd(nextEnd);
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    const startIso = localDateTimeToISOString(start);

    const endIso = localDateTimeToISOString(end);

    if (!startIso || !endIso) {
      showToast("Podano nieprawidłową datę rezerwacji.", "error");

      return;
    }

    const normalizedData = normalizeReservationData({
      courtId: selectedCourtId,
      start: startIso,
      end: endIso,
      firstName,
      lastName,
      email,
      notes,
    });

    const validationResult = validateReservationData(normalizedData);

    if (!validationResult.ok) {
      showToast(
        validationResult.error ?? "Nieprawidłowe dane rezerwacji.",
        "error",
      );

      return;
    }

    setIsSubmitting(true);

    onSave({
      id: reservation.id,
      ...normalizedData,
    });

    setIsSubmitting(false);
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
        style={dialogStyles}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        aria-busy={isSubmitting}
        tabIndex={-1}
      >
        <header className={styles.header}>
          <div>
            <p className={styles.eyebrow}>Panel administratora</p>

            <h2 id={titleId} className={styles.title}>
              Edycja rezerwacji
            </h2>
          </div>

          <button
            type="button"
            className={["btn-close", styles.closeButton].join(" ")}
            aria-label="Zamknij okno edycji"
            disabled={isSubmitting}
            onClick={onClose}
          />
        </header>

        <p id={descriptionId} className={styles.description}>
          Zmień dane rezerwacji. System ponownie sprawdzi dostępność wybranego
          kortu i terminu.
        </p>

        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          <div className="row g-3">
            <div className="col-12">
              <label className="form-label fw-semibold" htmlFor={courtIdField}>
                Kort
              </label>

              <select
                id={courtIdField}
                data-autofocus="true"
                className="form-select"
                value={selectedCourtId}
                disabled={isSubmitting}
                onChange={(event) =>
                  setSelectedCourtId(event.target.value as CourtId)
                }
              >
                {Object.values(COURTS).map((court) => (
                  <option key={court.id} value={court.id}>
                    {court.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-12 col-md-6">
              <label className="form-label fw-semibold" htmlFor={startId}>
                Początek
              </label>

              <input
                id={startId}
                className="form-control"
                type="datetime-local"
                value={start}
                min={minimumStart}
                required
                disabled={isSubmitting}
                onChange={(event) => handleStartChange(event.target.value)}
              />
            </div>

            <div className="col-12 col-md-6">
              <label className="form-label fw-semibold" htmlFor={endId}>
                Koniec
              </label>

              <input
                id={endId}
                className="form-control"
                type="datetime-local"
                value={end}
                min={minimumEnd}
                required
                disabled={isSubmitting}
                onChange={(event) => handleEndChange(event.target.value)}
              />
            </div>

            <div className="col-12 col-md-6">
              <label className="form-label fw-semibold" htmlFor={firstNameId}>
                Imię{" "}
                <span className={styles.requiredIndicator} aria-hidden="true">
                  *
                </span>
              </label>

              <input
                id={firstNameId}
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
              Zamknij
            </button>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Zapisywanie..." : "Zapisz zmiany"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
