import api from "./api";

const authService = {
  async register(name, email, password) {
    try {
      if (!name || !email || !password) {
        throw new Error("All fields are required");
      }

      const response = await api.post("/chatapp/adduser", {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password: password.trim(),
      });

      return response.data;
    } catch (error) {
      console.error("Registration error:", error);
      throw error;
    }
  },

  async login(email, password) {
    try {
      if (!email || !password) {
        throw new Error("Email and password are required");
      }

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
      console.error("Login error:", error);
      throw error;
    }
  },

  async checkStatus(email) {
    try {
      if (!email) {
        throw new Error("Email is required");
      }

      const response = await api.get(
        `/chatapp/status/check/${email.trim().toLowerCase()}`,
      );
      return response.data;
    } catch (error) {
      console.error("Status check error:", error);
      throw error;
    }
  },

  async updatePassword(currentPassword, newPassword) {
    try {
      if (!currentPassword || !newPassword) {
        throw new Error("Both current and new passwords are required");
      }

      if (newPassword.trim().length < 6) {
        throw new Error("New password must be at least 6 characters");
      }

      const response = await api.post("/chatapp/update-password", {
        currentPassword: currentPassword.trim(),
        newPassword: newPassword.trim(),
      });

      return response.data;
    } catch (error) {
      console.error("Password update error:", error);
      throw error;
    }
  },

  async updateName(newName) {
    try {
      if (!newName || newName.trim().length === 0) {
        throw new Error("Name is required");
      }

      const response = await api.post("/chatapp/update-name", {
        newName: newName.trim(),
      });

      return response.data;
    } catch (error) {
      console.error("Name update error:", error);
      throw error;
    }
  },
};

export default authService;
