export type CourtId = "trawiasty" | "ceglany" | "twardy";

export interface CourtDefinition {
  id: CourtId;
  label: string;
  color: string;
  textColor: string;
}

export const COURTS: Record<CourtId, CourtDefinition> = {
  trawiasty: {
    id: "trawiasty",
    label: "Kort trawiasty",
    color: "#15803d",
    textColor: "#ffffff",
  },
  ceglany: {
    id: "ceglany",
    label: "Kort ceglany",
    color: "#2563eb",
    textColor: "#ffffff",
  },
  twardy: {
    id: "twardy",
    label: "Kort twardy",
    color: "#eab308",
    textColor: "#1f2937",
  },
};
