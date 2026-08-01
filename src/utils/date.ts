const padNumber = (value: number): string => String(value).padStart(2, "0");

export const isValidDate = (date: Date): boolean =>
  Number.isFinite(date.getTime());

export const parseDate = (value: string): Date | null => {
  const date = new Date(value);
  return isValidDate(date) ? date : null;
};

export const startOfDay = (date: Date): Date => {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
};

export const isSameDay = (first: Date, second: Date): boolean =>
  first.getFullYear() === second.getFullYear() &&
  first.getMonth() === second.getMonth() &&
  first.getDate() === second.getDate();

export const toLocalDateTimeValue = (isoDate: string): string => {
  const date = new Date(isoDate);

  if (!isValidDate(date)) {
    return "";
  }

  return [
    date.getFullYear(),
    "-",
    padNumber(date.getMonth() + 1),
    "-",
    padNumber(date.getDate()),
    "T",
    padNumber(date.getHours()),
    ":",
    padNumber(date.getMinutes()),
  ].join("");
};

export const localDateTimeToISOString = (
  localDateTime: string,
): string | null => {
  const date = new Date(localDateTime);

  if (!isValidDate(date)) {
    return null;
  }

  return date.toISOString();
};

export const addMinutesToLocalDateTime = (
  localDateTime: string,
  minutes: number,
): string => {
  const date = new Date(localDateTime);

  if (!isValidDate(date)) {
    return localDateTime;
  }

  date.setMinutes(date.getMinutes() + minutes);

  return [
    date.getFullYear(),
    "-",
    padNumber(date.getMonth() + 1),
    "-",
    padNumber(date.getDate()),
    "T",
    padNumber(date.getHours()),
    ":",
    padNumber(date.getMinutes()),
  ].join("");
};

export const minutesBetween = (start: Date, end: Date): number =>
  (end.getTime() - start.getTime()) / (1000 * 60);

export const formatReservationDate = (
  startIso: string,
  endIso: string,
): string => {
  const start = new Date(startIso);
  const end = new Date(endIso);

  if (!isValidDate(start) || !isValidDate(end)) {
    return "Nieprawidłowa data";
  }

  const datePart = start.toLocaleDateString("pl-PL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  const startTime = start.toLocaleTimeString("pl-PL", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const endTime = end.toLocaleTimeString("pl-PL", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return `${datePart}, ${startTime}–${endTime}`;
};
