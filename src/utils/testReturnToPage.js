// Test function to debug return to page functionality
export const testReturnToPage = () => {
  console.log('=== Testing Return To Page ===');
  
  // Test storing a page
  const testPath = '/schoolchat/Principal/AdminDashboard/matieres';
  localStorage.setItem('returnToPage', testPath);
  console.log('Stored test path:', testPath);
  
  // Test retrieving the page
  const retrieved = localStorage.getItem('returnToPage');
  console.log('Retrieved path:', retrieved);
  
  // Test role matching
  const defaultPath = '/schoolchat/Principal/AdminDashboard/dashboard';
  const expectedDashboardType = defaultPath.split('/')[3];
  console.log('Expected dashboard type:', expectedDashboardType);
  console.log('Does stored path include dashboard type?', retrieved?.includes(expectedDashboardType));
  
  // Clean up
  localStorage.removeItem('returnToPage');
  console.log('=== Test Complete ===');
};