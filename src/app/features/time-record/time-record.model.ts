export type TimeRecordType =
  | 'CLOCK_IN'
  | 'LUNCH_OUT'
  | 'LUNCH_IN'
  | 'CLOCK_OUT';

export interface CreateTimeRecordRequest {
  recordType: TimeRecordType;
}

export interface CorrectTimeRecordRequest {
  workDate: string;
  recordedAt: string;
  reason: string;
}

export interface TimeRecordResponse {
  id: string;
  workDate: string;
  recordType: TimeRecordType;
  recordedAt: string;
  source: string;
  createdAt: string;
}

export interface AdminTimeRecordResponse extends TimeRecordResponse {
  userId: string;
  userFullName: string;
  userEmail: string;
}

export interface AdminTimeRecordCorrectionResponse {
  id: string;
  timeRecordId: string;
  analystId: string;
  analystFullName: string;
  analystEmail: string;
  recordType: TimeRecordType;
  previousWorkDate: string;
  newWorkDate: string;
  previousRecordedAt: string;
  newRecordedAt: string;
  correctedByUserId: string;
  correctedByUserFullName: string;
  correctedByUserEmail: string;
  reason: string;
  createdAt: string;
}