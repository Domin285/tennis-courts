import { COURTS, CourtId } from "../types/courts";
import { Reservation } from "../types/reservation";

const STORAGE_KEY = "tennis-courts-reservations-v1";

const isString = (value: unknown): value is string => typeof value === "string";

const isCourtId = (value: unknown): value is CourtId =>
  isString(value) && Object.prototype.hasOwnProperty.call(COURTS, value);

const isValidReservation = (value: unknown): value is Reservation => {
  if (!value || typeof value !== "object") {
    return false;
  }

  const reservation = value as Partial<Reservation>;

  return (
    isString(reservation.id) &&
    isCourtId(reservation.courtId) &&
    isString(reservation.start) &&
    isString(reservation.end) &&
    isString(reservation.firstName) &&
    isString(reservation.lastName) &&
    isString(reservation.email) &&
    isString(reservation.createdAt) &&
    (reservation.notes === undefined || isString(reservation.notes))
  );
};

export const loadReservations = (): Reservation[] => {
  try {
    const storedValue = localStorage.getItem(STORAGE_KEY);

    if (!storedValue) {
      return [];
    }

    const parsedValue: unknown = JSON.parse(storedValue);

    if (!Array.isArray(parsedValue)) {
      return [];
    }

    return parsedValue.filter(isValidReservation);
  } catch (error) {
    console.warn("Nie udało się odczytać zapisanych rezerwacji.", error);
    return [];
  }
};

export const saveReservations = (reservations: Reservation[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(reservations));
  } catch (error) {
    console.warn("Nie udało się zapisać rezerwacji.", error);
  }
};
