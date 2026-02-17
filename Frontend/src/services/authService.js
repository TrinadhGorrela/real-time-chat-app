import api from './api';

const authService = {
  async register(name, email, password) {
    const response = await api.post('/chatapp/adduser', { name, email, password });
    return response.data;
  },

  async login(email, password) {
    const response = await api.post('/chatapp/validateuser', { email, password });
    return response.data;
  },

  async setOnline() {
    const response = await api.post('/chatapp/status/online');
    return response.data;
  },

  async setOffline() {
    const response = await api.post('/chatapp/status/offline');
    return response.data;
  },

  async checkStatus(email) {
    const response = await api.get(`/chatapp/status/check/${email}`);
    return response.data;
  },
};

export default authService;