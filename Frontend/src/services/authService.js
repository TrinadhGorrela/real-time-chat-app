import api from "./api";

const authService = {
  async register(name, email, password) {
    const response = await api.post("/chatapp/adduser", {
      name,
      email,
      password,
    });
    return response.data;
  },

  async login(email, password) {
    const response = await api.post("/chatapp/validateuser", {
      email,
      password,
    });
    return response.data;
  },

  async checkStatus(email) {
    const response = await api.get(`/chatapp/status/check/${email}`);
    return response.data;
  },

  async updatePassword(currentPassword, newPassword) {
    const response = await api.post("/chatapp/update-password", {
      currentPassword,
      newPassword,
    });
    return response.data;
  },

  async updateName(newName) {
    const response = await api.post("/chatapp/update-name", {
      newName,
    });
    return response.data;
  },
};

export default authService;
