import { CourtId } from "./courts";

export interface Reservation {
  id: string;
  courtId: CourtId;
  start: string;
  end: string;
  firstName: string;
  lastName: string;
  email: string;
  notes?: string;
  createdAt: string;
}

export interface CreateReservationPayload {
  courtId: CourtId;
  start: string;
  end: string;
  firstName: string;
  lastName: string;
  email: string;
  notes?: string;
}

export interface UpdateReservationPayload {
  id: string;
  courtId?: CourtId;
  start?: string;
  end?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  notes?: string;
}

export interface ReservationActionResult {
  ok: boolean;
  error?: string;
}
