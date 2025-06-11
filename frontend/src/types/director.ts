export interface Director {
  id: string; // or directorId as per API path
  name: string;
  // Add other fields from DirectorProfile schema
  // e.g., bio, photoUrl, contactInfo etc.
  // For now, keeping it simple
  email?: string; // Example field
  createdAt?: string;
  updatedAt?: string;
}
