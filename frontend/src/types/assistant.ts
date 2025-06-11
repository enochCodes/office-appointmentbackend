export interface Assistant {
  id: string; // or assistantId as per API path
  name: string;
  // Add other fields from AssistantProfile schema
  email?: string; // Example field
  directorId?: string; // Example: if assistant is linked to a director
  createdAt?: string;
  updatedAt?: string;
}
