export type TimeRecordType =
  | 'CLOCK_IN'
  | 'LUNCH_OUT'
  | 'LUNCH_IN'
  | 'CLOCK_OUT';

export interface CreateTimeRecordRequest {
  recordType: TimeRecordType;
}

export interface TimeRecordResponse {
  id: string;
  workDate: string;
  recordType: TimeRecordType;
  recordedAt: string;
  source: string;
  createdAt: string;
}