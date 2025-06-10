import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import authService, { AuthUserCreationData } from '../services/authService';
import adminService, {
    DirectorProfileData, ListUsersOptions, PaginatedUsersResult, DetailedUserProfile,
    PaginatedDirectorProfilesResult, PaginatedAssistantProfilesResult, UserProfileBasic,
    ListAllAppointmentsOptions, PaginatedAppointmentsResult, AdminAppointmentUpdateData // Import new types
} from '../services/adminService';
import { Role, AppointmentStatus, Appointment } from '@prisma/client'; // Added AppointmentStatus, Appointment

export const adminController = {
  // ... existing methods ...
  async createUser(req: Request, res: Response) { /* ... */ const errors = validationResult(req); if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() }); const { name, email, phone, password, role } = req.body as { name: string; email: string; phone?: string | null; password: string; role: Role; }; try { const newUser = await authService.createUser({ name, email, phone, password, role }); let message = 'User created successfully.'; if (role === Role.DIRECTOR) message = \`User (ID: \${newUser.id}) created with DIRECTOR role. Next, POST to /api/admin/directors.\`; else if (role === Role.ASSISTANT) message = \`User (ID: \${newUser.id}) created with ASSISTANT role. Next, POST to /api/admin/assistants.\`; return res.status(201).json({ message, user: newUser }); } catch (error: any) { console.error('Admin createUser error:', error.message); if (error.message.includes('already exists') || error.message.includes('User with this email already exists')) { return res.status(409).json({ message: error.message }); } return res.status(500).json({ message: error.message || 'Failed to create user.' }); } },
  async createDirector(req: Request, res: Response) { /* ... */ const errors = validationResult(req); if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() }); const { userId, department, officeLocation } = req.body; try { const newDirector = await adminService.createDirectorProfile(userId, { department, officeLocation }); return res.status(201).json({ message: 'Director profile created.', director: newDirector }); } catch (error: any) { console.error('Admin createDirector error:', error.message); if (error.message.startsWith('Validation Error:') || error.message.startsWith('Conflict Error:')) { return res.status(error.message.startsWith('Conflict Error:') ? 409 : 400).json({ message: error.message }); } return res.status(500).json({ message: error.message || 'Failed to create director profile.' }); } },
  async createAssistant(req: Request, res: Response) { /* ... */ const errors = validationResult(req); if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() }); const { userId, directorId } = req.body; try { const newAssistant = await adminService.createAssistantProfile(userId, directorId); return res.status(201).json({ message: 'Assistant profile created.', assistant: newAssistant }); } catch (error: any) { console.error('Admin createAssistant error:', error.message); if (error.message.startsWith('Validation Error:') || error.message.startsWith('Conflict Error:')) { return res.status(error.message.startsWith('Conflict Error:') ? 409 : 400).json({ message: error.message }); } return res.status(500).json({ message: error.message || 'Failed to create assistant profile.' }); } },
  async listUsers(req: Request, res: Response) { /* ... */ const errors = validationResult(req); if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() }); const page = (req.query.page ? parseInt(req.query.page as string) : 1) || 1; const limit = (req.query.limit ? parseInt(req.query.limit as string) : 10) || 10; const role = req.query.role as Role | undefined; try { const result = await adminService.listUsers({ page, limit, role }); return res.status(200).json(result); } catch (error: any) { console.error('Admin listUsers error:', error.message); return res.status(500).json({ message: 'Failed to retrieve users.' }); } },
  async getUserById(req: Request, res: Response) { /* ... */ const errors = validationResult(req); if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() }); const userId = req.params.id; try { const user = await adminService.getUserById(userId); if (!user) return res.status(404).json({ message: 'User not found.' }); return res.status(200).json(user); } catch (error: any) { console.error(\`Admin getUserById for \${userId} error:\`, error.message); return res.status(500).json({ message: 'Failed to retrieve user details.' }); } },
  async listDirectorProfiles(req: Request, res: Response) { /* ... */ const errors = validationResult(req); if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() }); const page = (req.query.page ? parseInt(req.query.page as string) : 1) || 1; const limit = (req.query.limit ? parseInt(req.query.limit as string) : 10) || 10; try { const result = await adminService.listDirectorProfiles({ page, limit }); return res.status(200).json(result); } catch (error: any) { console.error('Admin listDirectorProfiles error:', error.message); return res.status(500).json({ message: 'Failed to retrieve director profiles.' }); } },
  async listAssistantProfiles(req: Request, res: Response) { /* ... */ const errors = validationResult(req); if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() }); const page = (req.query.page ? parseInt(req.query.page as string) : 1) || 1; const limit = (req.query.limit ? parseInt(req.query.limit as string) : 10) || 10; try { const result = await adminService.listAssistantProfiles({ page, limit }); return res.status(200).json(result); } catch (error: any) { console.error('Admin listAssistantProfiles error:', error.message); return res.status(500).json({ message: 'Failed to retrieve assistant profiles.' }); } },
  async updateUserRole(req: Request, res: Response) { /* ... */ const errors = validationResult(req); if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() }); const userId = req.params.id; const newRole = req.body.role as Role; try { const updatedUser: UserProfileBasic = await adminService.updateUserRole(userId, newRole); let message = 'User role updated successfully.'; if (newRole === Role.DIRECTOR) { message = \`User (ID: \${updatedUser.id}) role updated to DIRECTOR. Ensure a director profile is created/exists via POST /api/admin/directors.\`; } else if (newRole === Role.ASSISTANT) { message = \`User (ID: \${updatedUser.id}) role updated to ASSISTANT. Ensure an assistant profile is created/exists via POST /api/admin/assistants.\`; } return res.status(200).json({ message, user: updatedUser }); } catch (error: any) { console.error(\`Admin updateUserRole for \${userId} to \${newRole} error:\`, error.message); if (error.message.startsWith('Validation Error:')) { return res.status(404).json({ message: error.message }); } if (error.message.startsWith('Conflict Error:')) { return res.status(409).json({ message: error.message }); } return res.status(500).json({ message: 'Failed to update user role.' }); } },
  async listAllAppointments(req: Request, res: Response) { /* ... */ const errors = validationResult(req); if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() }); const page = (req.query.page ? parseInt(req.query.page as string) : 1) || 1; const limit = (req.query.limit ? parseInt(req.query.limit as string) : 10) || 10; const status = req.query.status as AppointmentStatus | undefined; const directorId = req.query.directorId as string | undefined; try { const options: ListAllAppointmentsOptions = { page, limit, status, directorId }; const result: PaginatedAppointmentsResult = await adminService.listAllAppointments(options); return res.status(200).json(result); } catch (error: any) { console.error('Admin listAllAppointments error:', error.message); return res.status(500).json({ message: 'Failed to retrieve appointments.' }); } },

  async adminUpdateAppointment(req: Request, res: Response) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const appointmentId = req.params.id;
    // Types from AdminAppointmentUpdateData are optional, so req.body might not have them.
    const { status, adminNotes } = req.body as AdminAppointmentUpdateData;
    const adminUserId = req.user!.id; // req.user is guaranteed by authenticateToken middleware

    // The custom validator in adminRoutes.ts already ensures at least one field is present.
    // if (typeof status === 'undefined' && typeof adminNotes === 'undefined') {
    //   return res.status(400).json({ message: 'No update data provided. Please provide status or adminNotes.' });
    // }

    try {
      const updatedAppointment = await adminService.adminUpdateAppointment(
        appointmentId,
        { status, adminNotes }, // Pass as AdminAppointmentUpdateData
        adminUserId
      );
      if (!updatedAppointment) { // Should be caught by service if appointment not found
          return res.status(404).json({ message: "Appointment not found or no changes made."});
      }
      return res.status(200).json({ message: 'Appointment updated successfully by admin.', appointment: updatedAppointment });
    } catch (error: any) {
      console.error(\`Admin updateAppointment for \${appointmentId} error:\`, error.message);
      if (error.message.startsWith('Validation Error:')) { // From service if appointment not found
        return res.status(404).json({ message: error.message });
      }
      return res.status(500).json({ message: 'Failed to update appointment.' });
    }
  }
};
export default adminController;
