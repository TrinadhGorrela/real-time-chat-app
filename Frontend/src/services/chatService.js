import api from './api';

const chatService = {
  async getChatHistory(user1, user2) {
    const response = await api.get(
      `/chatapp/messages/${user1.toLowerCase()}/${user2.toLowerCase()}`
    );
    return response.data;
  },

  async deleteMessage(messageId) {
    const response = await api.delete(`/chatapp/message/${messageId}`);
    return response.data;
  },
};

export default chatService;