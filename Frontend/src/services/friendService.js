import api from './api';

const friendService = {
  async getContacts() {
    const response = await api.get('/chatapp/mycontacts');
    return response.data;
  },

  async sendFriendRequest(email) {
    const response = await api.post('/chatapp/request', { approver: email });
    return response.data;
  },

  async getPendingRequests() {
    const response = await api.get('/chatapp/requests');
    return response.data;
  },

  async acceptRequest(requestId) {
    const response = await api.post('/chatapp/accept', { id: requestId });
    return response.data;
  },

  async declineRequest(requestId) {
    const response = await api.post('/chatapp/decline', { id: requestId });
    return response.data;
  },

  async deleteFriend(friendEmail) {
    const response = await api.post('/chatapp/delete-contact', { friend: friendEmail });
    return response.data;
  },
};

export default friendService;