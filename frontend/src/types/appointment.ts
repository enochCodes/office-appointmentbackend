export interface PublicAppointmentRequest {
  // Define fields based on your API's PublicAppointmentRequest schema
  // Example:
  directorId: string;
  name: string;
  email: string;
  phone?: string;
  requestedDate: string; // Or Date object, handle conversion
  reason: string;
}

export interface Appointment {
  id: string;
  directorId: string;
  name: string;
  email: string;
  phone?: string;
  requestedDate: string;
  reason: string;
  status: 'unverified' | 'verified' | 'rejected' | 'completed'; // Example statuses
  // Add other fields from your Appointment schema
  createdAt?: string;
  updatedAt?: string;
}
