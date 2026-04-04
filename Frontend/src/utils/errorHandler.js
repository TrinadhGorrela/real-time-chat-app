export const handleApiError = (error, defaultMessage = "An error occurred") => {
  if (!error.response) {
    return "Unable to connect to server. Please check your internet connection.";
  }

  const status = error.response.status;
  const message = error.response.data?.message;

  if (status === 401) return message || "Unauthorized access";
  if (status === 404) return message || "Resource not found";
  if (status === 409) return message || "Conflict occurred";
  if (status === 500) return "Server error. Please try again later.";

  return message || defaultMessage;
};
