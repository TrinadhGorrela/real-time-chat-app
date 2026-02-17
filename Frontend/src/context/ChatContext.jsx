import { createContext, useState, useContext } from 'react';

const ChatContext = createContext(null);

export const ChatProvider = ({ children }) => {
  const [messages, setMessages] = useState([]);
  const [activeContact, setActiveContact] = useState(null);
  const [contacts, setContacts] = useState([]);
  const [unreadCounts, setUnreadCounts] = useState({});

  const addMessage = (message) => {
    setMessages(prev => [...prev, message]);
  };

  const setMessageList = (messageList) => {
    setMessages(messageList);
  };

  const clearMessages = () => {
    setMessages([]);
  };

  const removeMessage = (messageId) => {
    setMessages(prev => prev.filter(msg => msg.id !== messageId));
  };

  const updateMessageStatus = (messageId, status) => {
    setMessages(prev =>
      prev.map(msg => msg.id === messageId ? { ...msg, status } : msg)
    );
  };

  const incrementUnread = (email) => {
    setUnreadCounts(prev => ({
      ...prev,
      [email]: (prev[email] || 0) + 1,
    }));
  };

  const clearUnread = (email) => {
    setUnreadCounts(prev => ({ ...prev, [email]: 0 }));
  };

  const value = {
    messages,
    activeContact,
    setActiveContact,
    contacts,
    setContacts,
    unreadCounts,
    addMessage,
    setMessageList,
    clearMessages,
    removeMessage,
    updateMessageStatus,
    incrementUnread,
    clearUnread,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) throw new Error('useChat must be used within ChatProvider');
  return context;
};
