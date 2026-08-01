import React, { useId, useMemo, useState } from "react";
import { useReservations } from "../../context/ReservationContext";
import { useToast } from "../../context/ToastContext";
import { COURTS, CourtId } from "../../types/courts";
import { Reservation } from "../../types/reservation";
import { formatReservationDate } from "../../utils/date";
import { AdminEditModal } from "../AdminEditModal/AdminEditModal";
import { ConfirmModal } from "../ConfirmModal/ConfirmModal";
import styles from "./AdminPanel.module.scss";

type SortOption = "date" | "createdAt";

const formatCreatedAt = (createdAt: string): string => {
  const date = new Date(createdAt);

  if (Number.isNaN(date.getTime())) {
    return "Nieprawidłowa data";
  }

  return date.toLocaleString("pl-PL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getResultsText = (count: number): string => {
  if (count === 0) {
    return "Brak rezerwacji spełniających wybrane kryteria.";
  }

  if (count === 1) {
    return "Znaleziono 1 rezerwację.";
  }

  return `Liczba znalezionych rezerwacji: ${count}.`;
};

export const AdminPanel: React.FC = () => {
  const { reservations, deleteReservation, updateReservation } =
    useReservations();

  const { showToast } = useToast();

  const generatedId = useId();

  const titleId = `${generatedId}-title`;
  const searchId = `${generatedId}-search`;
  const courtFilterId = `${generatedId}-court-filter`;
  const sortId = `${generatedId}-sort`;
  const resultsStatusId = `${generatedId}-results-status`;

  const [searchText, setSearchText] = useState("");

  const [courtFilter, setCourtFilter] = useState<CourtId | "ALL">("ALL");

  const [sortBy, setSortBy] = useState<SortOption>("date");

  const [editId, setEditId] = useState<string | null>(null);

  const [reservationToDelete, setReservationToDelete] =
    useState<Reservation | null>(null);

  const filteredReservations = useMemo(() => {
    const query = searchText.trim().toLocaleLowerCase("pl-PL");

    return reservations
      .filter((reservation) => {
        if (courtFilter !== "ALL" && reservation.courtId !== courtFilter) {
          return false;
        }

        if (!query) {
          return true;
        }

        const searchableValues = [
          reservation.firstName,
          reservation.lastName,
          reservation.email,
          reservation.notes ?? "",
        ];

        return searchableValues.some((value) =>
          value.toLocaleLowerCase("pl-PL").includes(query),
        );
      })
      .sort((firstReservation, secondReservation) => {
        const firstDate =
          sortBy === "date"
            ? firstReservation.start
            : firstReservation.createdAt;

        const secondDate =
          sortBy === "date"
            ? secondReservation.start
            : secondReservation.createdAt;

        return new Date(firstDate).getTime() - new Date(secondDate).getTime();
      });
  }, [reservations, searchText, courtFilter, sortBy]);

  const editingReservation: Reservation | null = useMemo(() => {
    if (!editId) {
      return null;
    }

    return (
      reservations.find((reservation) => reservation.id === editId) ?? null
    );
  }, [editId, reservations]);

  const hasActiveFilters =
    searchText.trim().length > 0 || courtFilter !== "ALL" || sortBy !== "date";

  const clearFilters = () => {
    setSearchText("");
    setCourtFilter("ALL");
    setSortBy("date");
  };

  const handleConfirmDelete = () => {
    if (!reservationToDelete) {
      return;
    }

    const deleted = deleteReservation(reservationToDelete.id);

    if (editId === reservationToDelete.id) {
      setEditId(null);
    }

    setReservationToDelete(null);

    if (!deleted) {
      showToast(
        "Nie znaleziono rezerwacji przeznaczonej do usunięcia.",
        "error",
      );

      return;
    }

    showToast("Rezerwacja została anulowana.", "success");
  };

  return (
    <section className={styles.section} aria-labelledby={titleId}>
      <header className={styles.header}>
        <div>
          <h1 id={titleId} className="display-6 fw-bold mb-2">
            Panel administratora
          </h1>

          <p className="text-secondary mb-0">
            Zarządzaj wszystkimi rezerwacjami kortów, edytuj dane klientów lub
            anuluj wybrane terminy.
          </p>
        </div>

        <div
          className={styles.totalBadge}
          aria-label={`Wszystkie rezerwacje: ${reservations.length}`}
        >
          <span className={styles.totalBadgeNumber}>{reservations.length}</span>

          <span>rezerwacji</span>
        </div>
      </header>

      <div
        className={["card", "border-0", "shadow-sm", styles.filtersCard].join(
          " ",
        )}
      >
        <div className="card-body">
          <div
            className="row g-3 align-items-end"
            aria-label="Filtrowanie rezerwacji"
          >
            <div className="col-12 col-xl-4">
              <label className="form-label fw-semibold" htmlFor={searchId}>
                Szukaj rezerwacji
              </label>

              <input
                id={searchId}
                className="form-control"
                type="search"
                placeholder="Imię, nazwisko, e-mail lub notatki..."
                value={searchText}
                autoComplete="off"
                onChange={(event) => setSearchText(event.target.value)}
              />
            </div>

            <div className="col-12 col-md-6 col-xl-3">
              <label className="form-label fw-semibold" htmlFor={courtFilterId}>
                Kort
              </label>

              <select
                id={courtFilterId}
                className="form-select"
                value={courtFilter}
                onChange={(event) =>
                  setCourtFilter(event.target.value as CourtId | "ALL")
                }
              >
                <option value="ALL">Wszystkie korty</option>

                {Object.values(COURTS).map((court) => (
                  <option key={court.id} value={court.id}>
                    {court.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-12 col-md-6 col-xl-3">
              <label className="form-label fw-semibold" htmlFor={sortId}>
                Sortowanie
              </label>

              <select
                id={sortId}
                className="form-select"
                value={sortBy}
                onChange={(event) =>
                  setSortBy(event.target.value as SortOption)
                }
              >
                <option value="date">Data rezerwacji</option>

                <option value="createdAt">Data utworzenia</option>
              </select>
            </div>

            <div className="col-12 col-xl-2">
              <button
                type="button"
                className={[
                  "btn",
                  "btn-outline-secondary",
                  styles.clearButton,
                ].join(" ")}
                disabled={!hasActiveFilters}
                onClick={clearFilters}
              >
                Wyczyść
              </button>
            </div>
          </div>

          <p
            id={resultsStatusId}
            className={styles.resultsStatus}
            role="status"
            aria-live="polite"
            aria-atomic="true"
          >
            {getResultsText(filteredReservations.length)}
          </p>
        </div>
      </div>

      <div
        className={["card", "border-0", "shadow-sm", styles.tableCard].join(
          " ",
        )}
      >
        <div className={["table-responsive", styles.tableWrapper].join(" ")}>
          <table
            className={[
              "table",
              "table-hover",
              "align-middle",
              "mb-0",
              styles.table,
            ].join(" ")}
          >
            <caption className="visually-hidden">
              Lista wszystkich rezerwacji kortów
            </caption>

            <thead>
              <tr>
                <th scope="col">Data</th>
                <th scope="col">Kort</th>
                <th scope="col">Klient</th>
                <th scope="col">E-mail</th>
                <th scope="col">Notatki</th>
                <th scope="col">Utworzono</th>
                <th scope="col">Akcje</th>
              </tr>
            </thead>

            <tbody>
              {filteredReservations.length === 0 ? (
                <tr>
                  <td className={styles.emptyCell} colSpan={7}>
                    Brak rezerwacji dla wybranych filtrów.
                  </td>
                </tr>
              ) : (
                filteredReservations.map((reservation) => {
                  const court = COURTS[reservation.courtId];

                  return (
                    <tr key={reservation.id}>
                      <td data-label="Data">
                        <time dateTime={reservation.start}>
                          {formatReservationDate(
                            reservation.start,
                            reservation.end,
                          )}
                        </time>
                      </td>

                      <td data-label="Kort">
                        <span
                          className={styles.courtBadge}
                          style={{
                            backgroundColor: court.color,
                            color: court.textColor,
                          }}
                        >
                          {court.label}
                        </span>
                      </td>

                      <td data-label="Klient">
                        <strong>
                          {reservation.firstName} {reservation.lastName}
                        </strong>
                      </td>

                      <td data-label="E-mail">
                        <a
                          className={styles.email}
                          href={`mailto:${reservation.email}`}
                        >
                          {reservation.email}
                        </a>
                      </td>

                      <td className={styles.notesCell} data-label="Notatki">
                        {reservation.notes || "—"}
                      </td>

                      <td data-label="Utworzono">
                        <time dateTime={reservation.createdAt}>
                          {formatCreatedAt(reservation.createdAt)}
                        </time>
                      </td>

                      <td className={styles.actionsCell} data-label="Akcje">
                        <div className={styles.actions}>
                          <button
                            type="button"
                            className="btn btn-outline-primary btn-sm"
                            aria-label={`Edytuj rezerwację użytkownika ${reservation.firstName} ${reservation.lastName}`}
                            onClick={() => setEditId(reservation.id)}
                          >
                            Edytuj
                          </button>

                          <button
                            type="button"
                            className="btn btn-outline-danger btn-sm"
                            aria-label={`Anuluj rezerwację użytkownika ${reservation.firstName} ${reservation.lastName}`}
                            onClick={() => setReservationToDelete(reservation)}
                          >
                            Anuluj
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {editingReservation && (
        <AdminEditModal
          reservation={editingReservation}
          onClose={() => setEditId(null)}
          onSave={(payload) => {
            const result = updateReservation(payload);

            if (!result.ok) {
              showToast(
                result.error ?? "Nie udało się zapisać zmian.",
                "error",
              );

              return;
            }

            showToast("Zmiany rezerwacji zostały zapisane.", "success");

            setEditId(null);
          }}
        />
      )}

      {reservationToDelete && (
        <ConfirmModal
          title="Anulowanie rezerwacji"
          confirmLabel="Anuluj rezerwację"
          cancelLabel="Wróć"
          variant="danger"
          description={
            <>
              Czy na pewno chcesz anulować rezerwację użytkownika{" "}
              <strong>
                {reservationToDelete.firstName} {reservationToDelete.lastName}
              </strong>
              ?
              <br />
              <br />
              Termin:{" "}
              <strong>
                {formatReservationDate(
                  reservationToDelete.start,
                  reservationToDelete.end,
                )}
              </strong>
            </>
          }
          onClose={() => setReservationToDelete(null)}
          onConfirm={handleConfirmDelete}
        />
      )}
    </section>
  );
};
