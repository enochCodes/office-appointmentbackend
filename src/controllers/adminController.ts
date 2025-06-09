import { Request, Response } from "express";
import { validationResult } from "express-validator";
import authService, { AuthUserCreationData } from '../services/authService';
import { adminService, DirectorProfileData } from '../services/adminService';
import { Role } from '@prisma/client';

export const adminController = {
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
};

export default adminController;
