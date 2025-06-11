export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'director' | 'assistant' | 'user'; // Example roles
  // Add other fields as per your API schema (AdminUserCreateRequest, AdminUserUpdateRequest)
  createdAt?: string;
  updatedAt?: string;
}
