import { Request, Response, NextFunction } from "express"; // Added NextFunction
import { validationResult } from "express-validator";
import authService, { AuthUserCreationData } from '../services/authService';
import {
  adminService,
  DirectorProfileData,
  UserUpdateAdminData,
  UserListFilters,
  DirectorUpdateData,  // Import new type
  AssistantUpdateData  // Import new type
} from '../services/adminService';
import { Role } from '@prisma/client';

export const adminController = {
  // Existing createUser, createDirector, createAssistant methods...
  // (These will be kept as they are, new methods will be added below them)

  async createUser(req: Request, res: Response) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Explicitly cast to ensure `role` aligns with the `Role` enum expected by `AuthUserCreationData`
    const { name, email, phone, password, role } = req.body as {
      name: string;
      email: string;
      phone?: string | null;
      password: string;
      role: Role; // Ensure role is of type Role
    };

    try {
      const userCreationPayload: AuthUserCreationData = {
        name,
        email,
        phone,
        password,
        role,
      };
      const newUser = await authService.createUser(userCreationPayload);
      return res
        .status(201)
        .json({ message: "User created successfully.", user: newUser });
    } catch (error: any) {
      console.error("Admin createUser error:", error.message);
      if (error.message.includes("already exists")) {
        return res.status(409).json({ message: error.message }); // Conflict
      }
      return res
        .status(500)
        .json({ message: error.message || "Failed to create user." });
    }
  },

  async createDirector(req: Request, res: Response) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { userId, department, officeLocation } = req.body;
    const directorData: DirectorProfileData = { department, officeLocation };

    try {
      const newDirector = await adminService.createDirectorProfile(
        userId,
        directorData,
      );
      return res
        .status(201)
        .json({
          message: "Director profile created successfully.",
          director: newDirector,
        });
    } catch (error: any) {
      console.error("Admin createDirector error:", error.message);
      if (
        error.message.startsWith("Validation Error:") ||
        error.message.startsWith("Conflict Error:")
      ) {
        return res
          .status(error.message.startsWith("Conflict Error:") ? 409 : 400)
          .json({ message: error.message });
      }
      return res
        .status(500)
        .json({
          message: error.message || "Failed to create director profile.",
        });
    }
  },

  async createAssistant(req: Request, res: Response) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { userId, directorId } = req.body;
    // const assistantData = {}; // If AssistantProfileData had fields

    try {
      const newAssistant = await adminService.createAssistantProfile(
        userId,
        directorId /*, assistantData */,
      );
      return res
        .status(201)
        .json({
          message: "Assistant profile created successfully.",
          assistant: newAssistant,
        });
    } catch (error: any) {
      console.error("Admin createAssistant error:", error.message);
      if (
        error.message.startsWith("Validation Error:") ||
        error.message.startsWith("Conflict Error:")
      ) {
        return res
          .status(error.message.startsWith("Conflict Error:") ? 409 : 400)
          .json({ message: error.message });
      }
      return res
        .status(500)
        .json({
          message: error.message || "Failed to create assistant profile.",
        });
    }
  },

  // New User Management Handlers
  async listUsersHandler(req: Request, res: Response, next: NextFunction) {
    try {
      // Basic filter by role from query string, e.g., /users?role=ASSISTANT
      const filters: UserListFilters = {};
      if (req.query.role && typeof req.query.role === 'string' && Role[req.query.role.toUpperCase() as keyof typeof Role]) {
        filters.role = Role[req.query.role.toUpperCase() as keyof typeof Role];
      }

      const users = await adminService.listUsers(filters);
      res.status(200).json(users);
    } catch (error: any) {
      console.error("Admin listUsersHandler error:", error.message);
      res.status(500).json({ message: error.message || "Failed to retrieve users." });
    }
  },

  async getUserByIdHandler(req: Request, res: Response, next: NextFunction) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { userId } = req.params;
    try {
      const user = await adminService.getUserByIdAdmin(userId);
      if (!user) {
        return res.status(404).json({ message: `User with ID '${userId}' not found.` });
      }
      res.status(200).json(user);
    } catch (error: any) {
      console.error(`Admin getUserByIdHandler error for ID ${userId}:`, error.message);
      res.status(500).json({ message: error.message || "Failed to retrieve user." });
    }
  },

  async updateUserHandler(req: Request, res: Response, next: NextFunction) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { userId: targetUserId } = req.params;
    const adminUserId = req.user?.id; // Assuming auth middleware populates req.user

    if (!adminUserId) {
        // This should ideally be caught by auth middleware, but as a safeguard
        return res.status(401).json({ message: "Unauthorized: Admin user ID not found." });
    }

    const { name, email, phone, role } = req.body;
    const updateData: UserUpdateAdminData = {};
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (role !== undefined) updateData.role = role as Role;


    if (Object.keys(updateData).length === 0) {
        return res.status(400).json({ message: "No update data provided." });
    }

    try {
      const updatedUser = await adminService.updateUserAsAdmin(adminUserId, targetUserId, updateData);
      res.status(200).json({ message: "User updated successfully.", user: updatedUser });
    } catch (error: any) {
      console.error(`Admin updateUserHandler error for ID ${targetUserId}:`, error.message);
      if (error.message.startsWith("Validation Error:")) {
        return res.status(400).json({ message: error.message });
      }
      if (error.message.startsWith("Conflict Error:")) {
        return res.status(409).json({ message: error.message });
      }
      if (error.message.startsWith("Operation Forbidden:")) {
        return res.status(403).json({ message: error.message });
      }
      res.status(500).json({ message: error.message || "Failed to update user." });
    }
  },

  async deleteUserHandler(req: Request, res: Response, next: NextFunction) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { userId: targetUserId } = req.params;
    const adminUserId = req.user?.id; // Assuming auth middleware populates req.user

     if (!adminUserId) {
        return res.status(401).json({ message: "Unauthorized: Admin user ID not found." });
    }

    try {
      const deletedUser = await adminService.deleteUserAsAdmin(adminUserId, targetUserId);
      res.status(200).json({ message: `User with ID '${targetUserId}' deleted successfully.`, user: deletedUser });
    } catch (error: any) {
      console.error(`Admin deleteUserHandler error for ID ${targetUserId}:`, error.message);
      if (error.message.startsWith("Validation Error:")) {
        return res.status(404).json({ message: error.message }); // Not found for delete
      }
      if (error.message.startsWith("Operation Forbidden:")) {
        return res.status(403).json({ message: error.message });
      }
      res.status(500).json({ message: error.message || "Failed to delete user." });
    }
  },

  // --- Director Profile Management Handlers ---
  async listDirectorsHandler(req: Request, res: Response, next: NextFunction) {
    try {
      const directors = await adminService.listDirectors();
      res.status(200).json(directors);
    } catch (error: any) {
      console.error("Admin listDirectorsHandler error:", error.message);
      res.status(500).json({ message: error.message || "Failed to retrieve director profiles." });
    }
  },

  async getDirectorByIdHandler(req: Request, res: Response, next: NextFunction) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const { directorId } = req.params;
    try {
      const director = await adminService.getDirectorByDirectorId(directorId);
      if (!director) {
        return res.status(404).json({ message: `Director profile with ID '${directorId}' not found.` });
      }
      res.status(200).json(director);
    } catch (error: any) {
      console.error(`Admin getDirectorByIdHandler error for ID ${directorId}:`, error.message);
      res.status(500).json({ message: error.message || "Failed to retrieve director profile." });
    }
  },

  async updateDirectorHandler(req: Request, res: Response, next: NextFunction) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const { directorId } = req.params;
    const { department, officeLocation } = req.body;
    const updateData: DirectorUpdateData = {};

    if (department !== undefined) updateData.department = department;
    if (officeLocation !== undefined) updateData.officeLocation = officeLocation;

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ message: "No update data provided for director profile." });
    }

    try {
      const updatedDirector = await adminService.updateDirectorProfile(directorId, updateData);
      res.status(200).json({ message: "Director profile updated successfully.", director: updatedDirector });
    } catch (error: any) {
      console.error(`Admin updateDirectorHandler error for ID ${directorId}:`, error.message);
      if (error.message.startsWith("Validation Error:")) {
        return res.status(400).json({ message: error.message }); // Or 404 if not found
      }
      res.status(500).json({ message: error.message || "Failed to update director profile." });
    }
  },

  async deleteDirectorHandler(req: Request, res: Response, next: NextFunction) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const { directorId } = req.params;
    try {
      const deletedDirector = await adminService.deleteDirectorProfile(directorId);
      res.status(200).json({ message: `Director profile with ID '${directorId}' deleted successfully.`, director: deletedDirector });
    } catch (error: any) {
      console.error(`Admin deleteDirectorHandler error for ID ${directorId}:`, error.message);
      if (error.message.startsWith("Validation Error:")) { // Typically "not found"
        return res.status(404).json({ message: error.message });
      }
      res.status(500).json({ message: error.message || "Failed to delete director profile." });
    }
  },

  // --- Assistant Profile Management Handlers ---
  async listAssistantsHandler(req: Request, res: Response, next: NextFunction) {
    try {
      const assistants = await adminService.listAssistants();
      res.status(200).json(assistants);
    } catch (error: any) {
      console.error("Admin listAssistantsHandler error:", error.message);
      res.status(500).json({ message: error.message || "Failed to retrieve assistant profiles." });
    }
  },

  async getAssistantByIdHandler(req: Request, res: Response, next: NextFunction) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const { assistantId } = req.params;
    try {
      const assistant = await adminService.getAssistantByAssistantId(assistantId);
      if (!assistant) {
        return res.status(404).json({ message: `Assistant profile with ID '${assistantId}' not found.` });
      }
      res.status(200).json(assistant);
    } catch (error: any) {
      console.error(`Admin getAssistantByIdHandler error for ID ${assistantId}:`, error.message);
      res.status(500).json({ message: error.message || "Failed to retrieve assistant profile." });
    }
  },

  async updateAssistantHandler(req: Request, res: Response, next: NextFunction) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const { assistantId } = req.params;
    const { directorId } = req.body; // Only directorId is updatable for now as per AssistantUpdateData
    const updateData: AssistantUpdateData = {};

    if (directorId !== undefined) updateData.directorId = directorId;

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ message: "No update data provided for assistant profile." });
    }

    try {
      const updatedAssistant = await adminService.updateAssistantProfile(assistantId, updateData);
      res.status(200).json({ message: "Assistant profile updated successfully.", assistant: updatedAssistant });
    } catch (error: any) {
      console.error(`Admin updateAssistantHandler error for ID ${assistantId}:`, error.message);
      if (error.message.startsWith("Validation Error:")) {
        return res.status(400).json({ message: error.message }); // Or 404 if assistant/new director not found
      }
      res.status(500).json({ message: error.message || "Failed to update assistant profile." });
    }
  },

  async deleteAssistantHandler(req: Request, res: Response, next: NextFunction) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const { assistantId } = req.params;
    try {
      const deletedAssistant = await adminService.deleteAssistantProfile(assistantId);
      res.status(200).json({ message: `Assistant profile with ID '${assistantId}' deleted successfully.`, assistant: deletedAssistant });
    } catch (error: any) {
      console.error(`Admin deleteAssistantHandler error for ID ${assistantId}:`, error.message);
       if (error.message.startsWith("Validation Error:")) { // Typically "not found"
        return res.status(404).json({ message: error.message });
      }
      res.status(500).json({ message: error.message || "Failed to delete assistant profile." });
    }
  }
};

export default adminController;
