// This utility class handles all user data operations with localStorage
class UserDatasLocalStorage {
  // Get user data from localStorage
  getUserDatas() {
    const userData = localStorage.getItem("userData");
    return userData ? JSON.parse(userData) : null;
  }

  // Save user data to localStorage
  setUserDatas(userData) {
    localStorage.setItem("userData", JSON.stringify(userData));
  }

  // Remove user data from localStorage
  removeUserDatas() {
    localStorage.removeItem("userData");
  }

  // Get user province setting
  getProvince() {
    return localStorage.getItem("userProvince") || "";
  }

  // Set user province setting
  setProvince(province) {
    localStorage.setItem("userProvince", province);
  }

  // Check if user is authenticated
  isAuthenticated() {
    return !!localStorage.getItem("token");
  }

  // Get user role
  getUserRole() {
    return localStorage.getItem("userRole") || "student";
  }
}

// Export as singleton
export default new UserDatasLocalStorage();
