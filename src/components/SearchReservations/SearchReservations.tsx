import React, { useId, useMemo, useState } from "react";
import { useReservations } from "../../context/ReservationContext";
import { useToast } from "../../context/ToastContext";
import { useNow } from "../../hooks/useNow";
import { COURTS } from "../../types/courts";
import { Reservation } from "../../types/reservation";
import { formatReservationDate } from "../../utils/date";
import { ConfirmModal } from "../ConfirmModal/ConfirmModal";
import styles from "./SearchReservations.module.scss";

const CANCELLATION_LIMIT_MS = 2 * 60 * 60 * 1000;

const normalizeSearchValue = (value: string): string =>
  value.trim().toLocaleLowerCase("pl-PL");

export const SearchReservations: React.FC = () => {
  const { reservations, deleteReservation } = useReservations();

  const { showToast } = useToast();

  const now = useNow();

  const generatedId = useId();

  const titleId = `${generatedId}-title`;
  const searchInputId = `${generatedId}-search`;
  const resultsStatusId = `${generatedId}-results-status`;

  const [lastNameQuery, setLastNameQuery] = useState("");

  const [reservationToCancel, setReservationToCancel] =
    useState<Reservation | null>(null);

  const normalizedQuery = normalizeSearchValue(lastNameQuery);

  const results = useMemo(() => {
    if (!normalizedQuery) {
      return [];
    }

    return reservations
      .filter((reservation) =>
        reservation.lastName
          .toLocaleLowerCase("pl-PL")
          .includes(normalizedQuery),
      )
      .sort(
        (firstReservation, secondReservation) =>
          new Date(firstReservation.start).getTime() -
          new Date(secondReservation.start).getTime(),
      );
  }, [reservations, normalizedQuery]);

  const canCancel = (startIso: string): boolean => {
    const startTime = new Date(startIso).getTime();

    if (Number.isNaN(startTime)) {
      return false;
    }

    return startTime - now >= CANCELLATION_LIMIT_MS;
  };

  const handleCancelRequest = (reservation: Reservation) => {
    if (!canCancel(reservation.start)) {
      showToast(
        "Rezerwację można anulować najpóźniej 2 godziny przed terminem.",
        "error",
      );

      return;
    }

    setReservationToCancel(reservation);
  };

  const handleConfirmCancellation = () => {
    if (!reservationToCancel) {
      return;
    }

    if (!canCancel(reservationToCancel.start)) {
      setReservationToCancel(null);

      showToast("Minął czas umożliwiający anulowanie tej rezerwacji.", "error");

      return;
    }

    const deleted = deleteReservation(reservationToCancel.id);

    setReservationToCancel(null);

    if (!deleted) {
      showToast(
        "Nie znaleziono rezerwacji przeznaczonej do anulowania.",
        "error",
      );

      return;
    }

    showToast("Rezerwacja została anulowana.", "success");
  };

  const getResultsStatus = (): string => {
    if (!normalizedQuery) {
      return "Wpisz nazwisko, aby rozpocząć wyszukiwanie.";
    }

    if (results.length === 0) {
      return "Nie znaleziono rezerwacji dla podanego nazwiska.";
    }

    return `Liczba znalezionych rezerwacji: ${results.length}.`;
  };

  return (
    <section className={styles.section} aria-labelledby={titleId}>
      <header className={styles.header}>
        <h1 id={titleId} className="display-6 fw-bold mb-2">
          Wyszukaj rezerwację
        </h1>

        <p className="text-secondary mb-0">
          Wpisz nazwisko osoby, na którą została utworzona rezerwacja.
        </p>
      </header>

      <div
        className={["card", "border-0", "shadow-sm", styles.searchCard].join(
          " ",
        )}
      >
        <div className="card-body">
          <form role="search" onSubmit={(event) => event.preventDefault()}>
            <label className="form-label fw-semibold" htmlFor={searchInputId}>
              Nazwisko
            </label>

            <div className={styles.searchRow}>
              <input
                id={searchInputId}
                className="form-control form-control-lg"
                type="search"
                value={lastNameQuery}
                placeholder="Wpisz nazwisko..."
                autoComplete="family-name"
                aria-describedby={resultsStatusId}
                onChange={(event) => setLastNameQuery(event.target.value)}
              />

              {lastNameQuery.length > 0 && (
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  aria-label="Wyczyść wyszukiwanie"
                  onClick={() => setLastNameQuery("")}
                >
                  Wyczyść
                </button>
              )}
            </div>
          </form>

          <p
            id={resultsStatusId}
            className={styles.resultsStatus}
            role="status"
            aria-live="polite"
            aria-atomic="true"
          >
            {getResultsStatus()}
          </p>
        </div>
      </div>

      {!normalizedQuery && (
        <div
          className={["alert", "alert-light", "border", styles.emptyState].join(
            " ",
          )}
        >
          Wpisz nazwisko, aby rozpocząć wyszukiwanie.
        </div>
      )}

      {normalizedQuery && results.length === 0 && (
        <div
          className={["alert", "alert-warning", styles.emptyState].join(" ")}
        >
          Brak rezerwacji dla podanego nazwiska.
        </div>
      )}

      {results.length > 0 && (
        <div className={styles.resultsList} aria-label="Znalezione rezerwacje">
          {results.map((reservation) => {
            const court = COURTS[reservation.courtId];

            const endTime = new Date(reservation.end).getTime();

            const isPast = Number.isNaN(endTime) || endTime <= now;

            const cancellationAllowed = !isPast && canCancel(reservation.start);

            const cancellationMessage = isPast
              ? "Zakończonej rezerwacji nie można anulować."
              : cancellationAllowed
                ? "Rezerwację można anulować."
                : "Rezerwację można anulować najpóźniej 2 godziny przed rozpoczęciem.";

            const reservationTitleId = `${generatedId}-${reservation.id}-title`;

            const cancellationInfoId = `${generatedId}-${reservation.id}-cancel-info`;

            return (
              <article
                key={reservation.id}
                className={[
                  "card",
                  "border-0",
                  "shadow-sm",
                  styles.reservationCard,
                ].join(" ")}
                aria-labelledby={reservationTitleId}
              >
                <div className="card-body">
                  <div className={styles.reservationLayout}>
                    <div className={styles.reservationContent}>
                      <h2
                        id={reservationTitleId}
                        className={styles.reservationTitle}
                      >
                        {reservation.firstName} {reservation.lastName}
                      </h2>

                      <time
                        className={styles.reservationDate}
                        dateTime={reservation.start}
                      >
                        {formatReservationDate(
                          reservation.start,
                          reservation.end,
                        )}
                      </time>

                      <div className={styles.metadata}>
                        <span
                          className={[
                            "badge",
                            "rounded-pill",
                            styles.courtBadge,
                          ].join(" ")}
                          style={{
                            backgroundColor: court.color,
                            color: court.textColor,
                          }}
                          title={court.label}
                        >
                          {court.label}
                        </span>

                        <span
                          className={[
                            styles.notes,
                            reservation.notes ? "" : styles.notesMuted,
                          ]
                            .filter(Boolean)
                            .join(" ")}
                        >
                          {reservation.notes
                            ? `Notatki: ${reservation.notes}`
                            : "Notatki: —"}
                        </span>
                      </div>
                    </div>

                    <div className={styles.actions}>
                      <button
                        type="button"
                        className={[
                          "btn",
                          "btn-danger",
                          styles.cancelButton,
                        ].join(" ")}
                        disabled={!cancellationAllowed}
                        aria-describedby={cancellationInfoId}
                        onClick={() => handleCancelRequest(reservation)}
                      >
                        Anuluj
                      </button>

                      <p
                        id={cancellationInfoId}
                        className={styles.cancellationInfo}
                      >
                        {cancellationMessage}
                      </p>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {reservationToCancel && (
        <ConfirmModal
          title="Anulowanie rezerwacji"
          confirmLabel="Anuluj rezerwację"
          cancelLabel="Wróć"
          variant="danger"
          description={
            <>
              Czy na pewno chcesz anulować rezerwację użytkownika{" "}
              <strong>
                {reservationToCancel.firstName} {reservationToCancel.lastName}
              </strong>
              ?
              <br />
              <br />
              Termin:{" "}
              <strong>
                {formatReservationDate(
                  reservationToCancel.start,
                  reservationToCancel.end,
                )}
              </strong>
            </>
          }
          onClose={() => setReservationToCancel(null)}
          onConfirm={handleConfirmCancellation}
        />
      )}
    </section>
  );
};
