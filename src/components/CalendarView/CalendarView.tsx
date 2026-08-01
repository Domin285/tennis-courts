import React, { CSSProperties, useMemo, useState } from "react";
import { COURTS, CourtId } from "../../types/courts";
import {
  CalendarViewMode,
  CourtCalendar,
} from "../CourtCalendar/CourtCalendar";
import styles from "./CalendarView.module.scss";

const POLISH_LOCALE = "pl-PL";

interface ViewOption {
  value: CalendarViewMode;
  label: string;
}

const VIEW_OPTIONS: ViewOption[] = [
  {
    value: "day",
    label: "Dzień",
  },
  {
    value: "week",
    label: "Tydzień",
  },
  {
    value: "month",
    label: "Miesiąc",
  },
];

const VIEW_LABELS: Record<CalendarViewMode, string> = {
  day: "Dzień",
  week: "Tydzień",
  month: "Miesiąc",
};

const startOfWeekMonday = (date: Date): Date => {
  const result = new Date(date);

  result.setHours(0, 0, 0, 0);

  const dayOfWeek = result.getDay();
  const daysFromMonday = (dayOfWeek + 6) % 7;

  result.setDate(result.getDate() - daysFromMonday);

  return result;
};

const endOfWeekSunday = (date: Date): Date => {
  const result = startOfWeekMonday(date);

  result.setDate(result.getDate() + 6);

  return result;
};

const startOfMonth = (date: Date): Date => {
  const result = new Date(date);

  result.setDate(1);
  result.setHours(0, 0, 0, 0);

  return result;
};

export const CalendarView: React.FC = () => {
  const [courtId, setCourtId] = useState<CourtId>("trawiasty");

  const [view, setView] = useState<CalendarViewMode>("week");

  const [activeDate, setActiveDate] = useState<Date>(() => new Date());

  const headerText = useMemo(() => {
    if (view === "day") {
      return activeDate.toLocaleDateString(POLISH_LOCALE, {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    }

    if (view === "week") {
      const weekStart = startOfWeekMonday(activeDate);

      const weekEnd = endOfWeekSunday(activeDate);

      const formattedStart = weekStart.toLocaleDateString(POLISH_LOCALE, {
        day: "2-digit",
        month: "long",
        year: "numeric",
      });

      const formattedEnd = weekEnd.toLocaleDateString(POLISH_LOCALE, {
        day: "2-digit",
        month: "long",
        year: "numeric",
      });

      return `${formattedStart} – ${formattedEnd}`;
    }

    return activeDate.toLocaleDateString(POLISH_LOCALE, {
      month: "long",
      year: "numeric",
    });
  }, [activeDate, view]);

  const moveCalendar = (direction: -1 | 1) => {
    setActiveDate((currentDate) => {
      const nextDate = new Date(currentDate);

      switch (view) {
        case "day":
          nextDate.setDate(nextDate.getDate() + direction);
          break;

        case "week":
          nextDate.setDate(nextDate.getDate() + direction * 7);
          break;

        case "month":
          nextDate.setMonth(nextDate.getMonth() + direction);
          break;
      }

      return nextDate;
    });
  };

  const goToday = () => {
    const today = new Date();

    setActiveDate(view === "month" ? startOfMonth(today) : today);
  };

  const selectView = (nextView: CalendarViewMode) => {
    setView(nextView);

    if (nextView === "month") {
      setActiveDate((currentDate) => startOfMonth(currentDate));
    }
  };

  return (
    <section
      className={styles.calendarView}
      aria-labelledby="calendar-view-title"
    >
      <header className="mb-4">
        <h1 id="calendar-view-title" className="display-6 fw-bold mb-2">
          Rezerwacja kortów tenisowych
        </h1>

        <p className="text-secondary mb-0">
          Wybierz kort, widok kalendarza i dogodny termin rezerwacji.
        </p>
      </header>

      <div className="row g-3">
        <div className="col-12 col-xl-5">
          <fieldset
            className={[
              "card",
              "h-100",
              "border-0",
              "shadow-sm",
              styles.controlCard,
            ].join(" ")}
          >
            <div className="card-body">
              <legend className={styles.controlLegend}>Wybierz kort</legend>

              <div className={styles.courtButtons}>
                {Object.values(COURTS).map((court) => {
                  const active = courtId === court.id;

                  const courtStyles = {
                    "--court-color": court.color,

                    "--court-text-color": court.textColor,
                  } as CSSProperties;

                  return (
                    <button
                      key={court.id}
                      type="button"
                      className={[
                        "btn",
                        styles.courtButton,
                        active
                          ? styles.courtButtonActive
                          : styles.courtButtonInactive,
                      ].join(" ")}
                      style={courtStyles}
                      aria-pressed={active}
                      onClick={() => setCourtId(court.id)}
                    >
                      {court.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </fieldset>
        </div>

        <div className="col-12 col-xl-7">
          <fieldset
            className={[
              "card",
              "h-100",
              "border-0",
              "shadow-sm",
              styles.controlCard,
            ].join(" ")}
          >
            <div className="card-body">
              <legend className={styles.controlLegend}>Widok kalendarza</legend>

              <div className="d-flex flex-column flex-lg-row align-items-stretch align-items-lg-center justify-content-between gap-3">
                <div className={styles.viewButtons}>
                  {VIEW_OPTIONS.map((option) => {
                    const active = view === option.value;

                    return (
                      <button
                        key={option.value}
                        type="button"
                        className={[
                          "btn",
                          active ? "btn-primary" : "btn-outline-primary",
                          styles.viewButton,
                        ].join(" ")}
                        aria-pressed={active}
                        onClick={() => selectView(option.value)}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>

                <nav
                  className={styles.navigation}
                  aria-label="Nawigacja kalendarza"
                >
                  <button
                    type="button"
                    className={[
                      "btn",
                      "btn-outline-primary",
                      styles.navigationButton,
                    ].join(" ")}
                    onClick={() => moveCalendar(-1)}
                    aria-label="Poprzedni okres"
                    title="Poprzedni okres"
                  >
                    <span aria-hidden="true">←</span>

                    <span className={styles.navigationText}>Poprzedni</span>
                  </button>

                  <button
                    type="button"
                    className={[
                      "btn",
                      "btn-primary",
                      styles.navigationButton,
                    ].join(" ")}
                    onClick={goToday}
                  >
                    Dzisiaj
                  </button>

                  <button
                    type="button"
                    className={[
                      "btn",
                      "btn-outline-primary",
                      styles.navigationButton,
                    ].join(" ")}
                    onClick={() => moveCalendar(1)}
                    aria-label="Następny okres"
                    title="Następny okres"
                  >
                    <span className={styles.navigationText}>Następny</span>

                    <span aria-hidden="true">→</span>
                  </button>
                </nav>
              </div>
            </div>
          </fieldset>
        </div>
      </div>

      <div className={styles.dateHeader} aria-live="polite" aria-atomic="true">
        <span className={styles.dateHeaderLabel}>{VIEW_LABELS[view]}:</span>

        <span>{headerText}</span>
      </div>

      <CourtCalendar
        courtId={courtId}
        view={view}
        activeDate={activeDate}
        onActiveDateChange={setActiveDate}
        onRequestViewChange={selectView}
      />
    </section>
  );
};
