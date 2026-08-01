export type ToastType = "success" | "error";

export interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
}
