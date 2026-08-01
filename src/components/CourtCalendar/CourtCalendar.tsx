import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { COURTS, CourtId } from "../../types/courts";
import { useReservations } from "../../context/ReservationContext";
import { useToast } from "../../context/ToastContext";
import { useNow } from "../../hooks/useNow";
import { ReservationModal } from "../ReservationModal/ReservationModal";
import styles from "./CourtCalendar.module.scss";

export type CalendarViewMode = "day" | "week" | "month";

interface CourtCalendarProps {
  courtId: CourtId;
  view: CalendarViewMode;
  activeDate: Date;
  onActiveDateChange: (date: Date) => void;
  onRequestViewChange: (view: CalendarViewMode) => void;
}

interface DragSelection {
  active: boolean;
  pointerId: number | null;
  dayIndex: number | null;
  startHour: number | null;
  endHour: number | null;
}

const HOURS = Array.from({ length: 14 }, (_, index) => 7 + index);

const WEEKDAY_LABELS = ["Pon", "Wt", "Śr", "Czw", "Pt", "Sob", "Nd"];

const EMPTY_DRAG_SELECTION: DragSelection = {
  active: false,
  pointerId: null,
  dayIndex: null,
  startHour: null,
  endHour: null,
};

const startOfWeekMonday = (date: Date): Date => {
  const result = new Date(date);

  result.setHours(0, 0, 0, 0);

  const dayOfWeek = result.getDay();
  const daysFromMonday = (dayOfWeek + 6) % 7;

  result.setDate(result.getDate() - daysFromMonday);

  return result;
};

const startOfDay = (date: Date): Date => {
  const result = new Date(date);

  result.setHours(0, 0, 0, 0);

  return result;
};

const isSameDay = (first: Date, second: Date): boolean =>
  first.getFullYear() === second.getFullYear() &&
  first.getMonth() === second.getMonth() &&
  first.getDate() === second.getDate();

const isPastDay = (date: Date, now: number): boolean =>
  startOfDay(date).getTime() < startOfDay(new Date(now)).getTime();

const formatDayHeader = (date: Date): string =>
  date.toLocaleDateString("pl-PL", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
  });

const formatAccessibleDate = (date: Date): string =>
  date.toLocaleDateString("pl-PL", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

export const CourtCalendar: React.FC<CourtCalendarProps> = ({
  courtId,
  view,
  activeDate,
  onActiveDateChange,
  onRequestViewChange,
}) => {
  const { reservations } = useReservations();
  const { showToast } = useToast();

  const now = useNow();

  const calendarScrollRef = useRef<HTMLDivElement>(null);

  const [dragSelection, setDragSelectionState] =
    useState<DragSelection>(EMPTY_DRAG_SELECTION);

  const dragSelectionRef = useRef<DragSelection>(EMPTY_DRAG_SELECTION);

  const [selectedRange, setSelectedRange] = useState<{
    start: string;
    end: string;
  } | null>(null);

  const setDragSelection = useCallback((next: DragSelection) => {
    dragSelectionRef.current = next;
    setDragSelectionState(next);
  }, []);

  const resetDragSelection = useCallback(() => {
    setDragSelection(EMPTY_DRAG_SELECTION);
  }, [setDragSelection]);

  const events = useMemo(
    () =>
      reservations
        .filter((reservation) => reservation.courtId === courtId)
        .map((reservation) => ({
          ...reservation,
          color: COURTS[reservation.courtId].color,
          textColor: COURTS[reservation.courtId].textColor,
        })),
    [reservations, courtId],
  );

  const weekStart = useMemo(() => startOfWeekMonday(activeDate), [activeDate]);

  const weekDays = useMemo(
    () =>
      Array.from({ length: 7 }, (_, index) => {
        const date = new Date(weekStart);

        date.setDate(weekStart.getDate() + index);

        return date;
      }),
    [weekStart],
  );

  const daysToRender = useMemo(
    () => (view === "day" ? [new Date(activeDate)] : weekDays),
    [activeDate, view, weekDays],
  );

  const isPastSlot = useCallback(
    (day: Date, hour: number): boolean => {
      const slotStart = new Date(day);

      slotStart.setHours(hour, 0, 0, 0);

      return slotStart.getTime() < now;
    },
    [now],
  );

  const findEventForCell = useCallback(
    (day: Date, hour: number) => {
      const cellStart = new Date(day);

      cellStart.setHours(hour, 0, 0, 0);

      return events.find((event) => {
        const eventStart = new Date(event.start);

        const eventEnd = new Date(event.end);

        return eventStart <= cellStart && eventEnd > cellStart;
      });
    },
    [events],
  );

  const isBusySlot = useCallback(
    (day: Date, hour: number): boolean => Boolean(findEventForCell(day, hour)),
    [findEventForCell],
  );

  const isRangeAvailable = useCallback(
    (day: Date, firstHour: number, lastHour: number): boolean => {
      const startHour = Math.min(firstHour, lastHour);

      const endHour = Math.max(firstHour, lastHour);

      for (let hour = startHour; hour <= endHour; hour += 1) {
        if (isPastSlot(day, hour) || isBusySlot(day, hour)) {
          return false;
        }
      }

      return true;
    },
    [isBusySlot, isPastSlot],
  );

  const openReservationModal = useCallback(
    (day: Date, firstHour: number, lastHour: number) => {
      const startHour = Math.min(firstHour, lastHour);

      const endHour = Math.max(firstHour, lastHour) + 1;

      if (!isRangeAvailable(day, startHour, endHour - 1)) {
        showToast(
          "Wybrany zakres zawiera zajęty lub niedostępny termin.",
          "error",
        );

        return;
      }

      const start = new Date(day);

      start.setHours(startHour, 0, 0, 0);

      const end = new Date(day);

      end.setHours(endHour, 0, 0, 0);

      setSelectedRange({
        start: start.toISOString(),
        end: end.toISOString(),
      });
    },
    [isRangeAvailable, showToast],
  );

  const startPointerSelection = (
    event: React.PointerEvent<HTMLButtonElement>,
    day: Date,
    dayIndex: number,
    hour: number,
  ) => {
    if (event.pointerType === "mouse" && event.button !== 0) {
      return;
    }

    if (event.pointerType !== "touch") {
      event.preventDefault();
    }

    if (isBusySlot(day, hour)) {
      showToast("Ten termin jest już zajęty.", "error");

      return;
    }

    if (isPastSlot(day, hour)) {
      showToast("Nie można rezerwować w przeszłości.", "error");

      return;
    }

    setDragSelection({
      active: true,
      pointerId: event.pointerId,
      dayIndex,
      startHour: hour,
      endHour: hour,
    });
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const currentSelection = dragSelectionRef.current;

    if (
      !currentSelection.active ||
      currentSelection.pointerId !== event.pointerId ||
      currentSelection.dayIndex === null ||
      currentSelection.startHour === null
    ) {
      return;
    }

    const elementAtPointer = document.elementFromPoint(
      event.clientX,
      event.clientY,
    );

    const slotButton = elementAtPointer?.closest(
      'button[data-calendar-slot="true"]',
    ) as HTMLButtonElement | null;

    if (!slotButton || !calendarScrollRef.current?.contains(slotButton)) {
      return;
    }

    const dayIndex = Number(slotButton.dataset.dayIndex);

    const hour = Number(slotButton.dataset.hour);

    if (!Number.isInteger(dayIndex) || !Number.isInteger(hour)) {
      return;
    }

    if (dayIndex !== currentSelection.dayIndex) {
      return;
    }

    const day = daysToRender[dayIndex];

    if (!day) {
      return;
    }

    if (!isRangeAvailable(day, currentSelection.startHour, hour)) {
      return;
    }

    if (currentSelection.endHour === hour) {
      return;
    }

    setDragSelection({
      ...currentSelection,
      endHour: hour,
    });
  };

  const finishPointerSelection = useCallback(
    (pointerId?: number) => {
      const currentSelection = dragSelectionRef.current;

      if (!currentSelection.active) {
        return;
      }

      if (pointerId !== undefined && currentSelection.pointerId !== pointerId) {
        return;
      }

      const { dayIndex, startHour, endHour } = currentSelection;

      resetDragSelection();

      if (dayIndex === null || startHour === null || endHour === null) {
        return;
      }

      const selectedDay = daysToRender[dayIndex];

      if (!selectedDay) {
        return;
      }

      openReservationModal(selectedDay, startHour, endHour);
    },
    [daysToRender, openReservationModal, resetDragSelection],
  );

  useEffect(() => {
    const handleWindowPointerUp = (event: PointerEvent) => {
      finishPointerSelection(event.pointerId);
    };

    const handleWindowPointerCancel = () => {
      resetDragSelection();
    };

    window.addEventListener("pointerup", handleWindowPointerUp);

    window.addEventListener("pointercancel", handleWindowPointerCancel);

    return () => {
      window.removeEventListener("pointerup", handleWindowPointerUp);

      window.removeEventListener("pointercancel", handleWindowPointerCancel);
    };
  }, [finishPointerSelection, resetDragSelection]);

  useEffect(() => {
    resetDragSelection();
    setSelectedRange(null);
  }, [courtId, view, activeDate, resetDragSelection]);

  const handleKeyboardActivation = (day: Date, hour: number) => {
    if (isBusySlot(day, hour)) {
      showToast("Ten termin jest już zajęty.", "error");

      return;
    }

    if (isPastSlot(day, hour)) {
      showToast("Nie można rezerwować w przeszłości.", "error");

      return;
    }

    openReservationModal(day, hour, hour);
  };

  const isSelected = (dayIndex: number, hour: number): boolean => {
    if (
      !dragSelection.active ||
      dragSelection.dayIndex !== dayIndex ||
      dragSelection.startHour === null ||
      dragSelection.endHour === null
    ) {
      return false;
    }

    const minimumHour = Math.min(
      dragSelection.startHour,
      dragSelection.endHour,
    );

    const maximumHour = Math.max(
      dragSelection.startHour,
      dragSelection.endHour,
    );

    return hour >= minimumHour && hour <= maximumHour;
  };

  const monthGrid = useMemo(() => {
    const firstDayOfMonth = new Date(activeDate);

    firstDayOfMonth.setDate(1);

    firstDayOfMonth.setHours(0, 0, 0, 0);

    const gridStart = startOfWeekMonday(firstDayOfMonth);

    return Array.from({ length: 42 }, (_, index) => {
      const date = new Date(gridStart);

      date.setDate(gridStart.getDate() + index);

      return date;
    });
  }, [activeDate]);

  const countEventsInDay = (day: Date): number => {
    const dayStart = new Date(day);

    dayStart.setHours(0, 0, 0, 0);

    const dayEnd = new Date(day);

    dayEnd.setHours(23, 59, 59, 999);

    return events.filter((event) => {
      const eventStart = new Date(event.start);

      const eventEnd = new Date(event.end);

      return eventStart < dayEnd && eventEnd > dayStart;
    }).length;
  };

  const legend = (
    <div
      className={[
        "d-flex",
        "flex-wrap",
        "align-items-center",
        "gap-3",
        styles.legend,
      ].join(" ")}
      role="group"
      aria-label="Legenda kalendarza"
    >
      <span className={styles.legendItem}>
        <span
          className={[styles.legendMarker, styles.markerFree].join(" ")}
          aria-hidden="true"
        />
        Wolne
      </span>

      <span className={styles.legendItem}>
        <span
          className={[styles.legendMarker, styles.markerBusy].join(" ")}
          aria-hidden="true"
        />
        Zajęte
      </span>

      <span className={styles.legendItem}>
        <span
          className={[styles.legendMarker, styles.markerPast].join(" ")}
          aria-hidden="true"
        />
        Niedostępne
      </span>
    </div>
  );

  if (view === "month") {
    return (
      <div
        className={[
          "card",
          "border-0",
          "shadow-sm",
          styles.wrapper,
          styles.monthWrapper,
        ].join(" ")}
      >
        {legend}

        <div className={["table-responsive", styles.scroll].join(" ")}>
          <table
            className={[
              "table",
              "table-bordered",
              "align-middle",
              "mb-0",
              styles.monthTable,
            ].join(" ")}
          >
            <caption className="visually-hidden">
              Miesięczny kalendarz rezerwacji kortu
            </caption>

            <thead>
              <tr>
                {WEEKDAY_LABELS.map((weekday) => (
                  <th key={weekday} scope="col">
                    {weekday}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {Array.from({ length: 6 }, (_, rowIndex) => (
                <tr key={rowIndex}>
                  {Array.from({ length: 7 }, (_, columnIndex) => {
                    const day = monthGrid[rowIndex * 7 + columnIndex];

                    const isInCurrentMonth =
                      day.getMonth() === activeDate.getMonth() &&
                      day.getFullYear() === activeDate.getFullYear();

                    const eventCount = countEventsInDay(day);

                    const past = isPastDay(day, now);

                    const today = isSameDay(day, new Date(now));

                    const accessibleLabel = [
                      formatAccessibleDate(day),
                      eventCount > 0
                        ? `${eventCount} rezerwacji`
                        : "brak rezerwacji",
                      past ? "termin niedostępny" : "przejdź do widoku dnia",
                    ].join(", ");

                    return (
                      <td
                        key={day.toISOString()}
                        className={[
                          styles.monthCell,
                          !isInCurrentMonth ? styles.monthCellMuted : "",
                          today ? styles.monthCellToday : "",
                          eventCount > 0
                            ? styles.monthCellBusy
                            : styles.monthCellFree,
                          past ? styles.monthCellPast : "",
                        ]
                          .filter(Boolean)
                          .join(" ")}
                      >
                        <button
                          type="button"
                          className={styles.monthButton}
                          aria-label={accessibleLabel}
                          aria-disabled={past}
                          onClick={() => {
                            if (past) {
                              showToast(
                                "Nie można rezerwować w przeszłości.",
                                "error",
                              );

                              return;
                            }

                            onActiveDateChange(new Date(day));

                            onRequestViewChange("day");
                          }}
                        >
                          <span className={styles.monthTop}>
                            <span className={styles.monthDay}>
                              {day.getDate()}
                            </span>

                            {eventCount > 0 && (
                              <span className={styles.monthBadge}>
                                {eventCount}
                              </span>
                            )}
                          </span>

                          <span className={styles.monthHint}>
                            {eventCount > 0
                              ? "Zajęte rezerwacje"
                              : "Wolne terminy"}
                          </span>
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  const tableViewClass = view === "day" ? styles.dayTable : styles.weekTable;

  const wrapperViewClass =
    view === "day" ? styles.dayWrapper : styles.weekWrapper;

  return (
    <div
      className={[
        "card",
        "border-0",
        "shadow-sm",
        styles.wrapper,
        wrapperViewClass,
      ].join(" ")}
    >
      {legend}

      <div
        ref={calendarScrollRef}
        className={["table-responsive", styles.scroll].join(" ")}
        onPointerMove={handlePointerMove}
        onPointerUp={(event) => finishPointerSelection(event.pointerId)}
        onPointerCancel={resetDragSelection}
      >
        <table
          className={[
            "table",
            "table-bordered",
            "align-middle",
            "mb-0",
            styles.calendarTable,
            tableViewClass,
          ].join(" ")}
        >
          <caption className="visually-hidden">
            {view === "day"
              ? "Dzienny kalendarz rezerwacji kortu"
              : "Tygodniowy kalendarz rezerwacji kortu"}
          </caption>

          <thead>
            <tr>
              <th className={styles.hourColumn} scope="col">
                Godz.
              </th>

              {daysToRender.map((day) => (
                <th key={day.toISOString()} scope="col">
                  {formatDayHeader(day)}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {HOURS.map((hour) => (
              <tr key={hour}>
                <th className={styles.hourColumn} scope="row">
                  {hour}:00
                </th>

                {daysToRender.map((day, dayIndex) => {
                  const past = isPastSlot(day, hour);

                  const event = findEventForCell(day, hour);

                  const busy = Boolean(event);

                  const selected = isSelected(dayIndex, hour);

                  const slotClasses = [
                    styles.slot,
                    past ? styles.slotDisabled : styles.slotFree,
                    busy ? styles.slotBusy : "",
                    selected ? styles.slotSelected : "",
                  ]
                    .filter(Boolean)
                    .join(" ");

                  const accessibleDate = formatAccessibleDate(day);

                  const accessibleLabel = busy
                    ? `${accessibleDate}, ${hour}:00–${
                        hour + 1
                      }:00, termin zajęty`
                    : past
                      ? `${accessibleDate}, ${hour}:00–${
                          hour + 1
                        }:00, termin niedostępny`
                      : `${accessibleDate}, ${hour}:00–${
                          hour + 1
                        }:00, zarezerwuj termin`;

                  return (
                    <td
                      key={`${day.toISOString()}-${hour}`}
                      className={slotClasses}
                    >
                      <button
                        type="button"
                        className={styles.slotButton}
                        data-calendar-slot="true"
                        data-day-index={dayIndex}
                        data-hour={hour}
                        aria-label={accessibleLabel}
                        aria-disabled={past || busy}
                        aria-pressed={selected}
                        onPointerDown={(pointerEvent) =>
                          startPointerSelection(
                            pointerEvent,
                            day,
                            dayIndex,
                            hour,
                          )
                        }
                        onClick={(clickEvent) => {
                          if (clickEvent.detail !== 0) {
                            return;
                          }

                          handleKeyboardActivation(day, hour);
                        }}
                      >
                        {event && (
                          <span
                            className={styles.event}
                            style={{
                              backgroundColor: event.color,
                              color: event.textColor,
                            }}
                            aria-hidden="true"
                            title={`${event.firstName} ${event.lastName}`}
                          >
                            {event.firstName} {event.lastName}
                          </span>
                        )}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedRange && (
        <ReservationModal
          courtId={courtId}
          start={selectedRange.start}
          end={selectedRange.end}
          onClose={() => setSelectedRange(null)}
        />
      )}
    </div>
  );
};
