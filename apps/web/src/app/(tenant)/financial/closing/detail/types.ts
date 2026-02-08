export interface ClosingData {
  id: string | null;
  name: string | null;
  dateOpen: Date | null;
  hourOpen: string | null;
  dateClosed?: Date | null;
  hourClosed?: string | null;
}
