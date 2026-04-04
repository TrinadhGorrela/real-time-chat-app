import api from "./api";
import { handleApiError } from "../utils/errorHandler";

const authService = {
  async register(name, email, password) {
    if (!name || !email || !password) {
      throw new Error("All fields are required");
    }

    try {
      const response = await api.post("/chatapp/adduser", {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password: password.trim(),
      });

      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error, "Registration failed"));
    }
  },

  async login(email, password) {
    if (!email || !password) {
      throw new Error("Email and password are required");
    }

    try {
      const response = await api.post("/chatapp/validateuser", {
        email: email.trim().toLowerCase(),
        password: password.trim(),
      });

      const data = response.data;
      if (!data || !data.token || !data.user) {
        throw new Error("Invalid response from server");
      }

      return data;
    } catch (error) {
      if (error.message === "Invalid response from server") throw error;
      throw new Error(handleApiError(error, "Login failed"));
    }
  },

  async checkStatus(email) {
    if (!email) {
      throw new Error("Email is required");
    }

    try {
      const response = await api.get(
        `/chatapp/status/check/${email.trim().toLowerCase()}`,
      );
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error, "Status check failed"));
    }
  },

  async updatePassword(currentPassword, newPassword) {
    if (!currentPassword || !newPassword) {
      throw new Error("Both current and new passwords are required");
    }

    if (newPassword.trim().length < 6) {
      throw new Error("New password must be at least 6 characters");
    }

    try {
      const response = await api.post("/chatapp/update-password", {
        currentPassword: currentPassword.trim(),
        newPassword: newPassword.trim(),
      });

      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error, "Password update failed"));
    }
  },

  async updateName(newName) {
    if (!newName || newName.trim().length === 0) {
      throw new Error("Name is required");
    }

    try {
      const response = await api.post("/chatapp/update-name", {
        newName: newName.trim(),
      });

      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error, "Name update failed"));
    }
  },
};

export default authService;
