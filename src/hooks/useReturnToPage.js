import { useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export const useReturnToPage = () => {
  const location = useLocation();
  const navigate = useNavigate();



  // Store current page before logout
  const storeCurrentPage = useCallback(() => {
    const currentPath = location.pathname;
    if (currentPath.toLowerCase().includes('/schoolchat/principal')) {
      localStorage.setItem('returnToPage', currentPath);
    }
  }, [location.pathname]);

  // Navigate to stored page after login
  const navigateToStoredPage = useCallback((userRole, defaultPath) => {
    const returnToPage = localStorage.getItem('returnToPage');
    
    if (returnToPage && returnToPage.toLowerCase().includes('/schoolchat/principal')) {
      // Extract dashboard type from default path
      const expectedDashboardType = defaultPath.split('/')[3];
      
      // Check if stored page matches user's role
      if (returnToPage.includes(expectedDashboardType)) {
        localStorage.removeItem('returnToPage');
        navigate(returnToPage, { replace: true });
        return true; // Indicates we navigated to stored page
      }
    }
    
    // Clear invalid stored page and use default
    localStorage.removeItem('returnToPage');
    navigate(defaultPath, { replace: true });
    return false; // Indicates we used default path
  }, [navigate]);

  // Clear stored page
  const clearStoredPage = useCallback(() => {
    localStorage.removeItem('returnToPage');
  }, []);

  // Check if there's a stored page
  const hasStoredPage = useCallback(() => {
    return !!localStorage.getItem('returnToPage');
  }, []);

  return {
    storeCurrentPage,
    navigateToStoredPage,
    clearStoredPage,
    hasStoredPage
  };
};