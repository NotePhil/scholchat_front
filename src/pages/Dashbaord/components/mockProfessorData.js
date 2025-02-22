// mockProfessorData.js

export const mockProfessorData = {
  students: [
    { id: 1, name: "John Doe", email: "john@example.com" },
    { id: 2, name: "Jane Smith", email: "jane@example.com" },
    { id: 3, name: "Alice Johnson", email: "alice@example.com" },
    { id: 4, name: "Bob Wilson", email: "bob@example.com" },
  ],

  classes: [
    {
      id: 1,
      name: "Mathematics 101",
      scheduledDate: new Date(Date.now() + 86400000).toISOString(), // tomorrow
      assignments: [
        {
          id: 1,
          title: "Linear Algebra Quiz",
          dueDate: new Date(Date.now() + 7 * 86400000).toISOString(), // 7 days from now
        },
        {
          id: 2,
          title: "Calculus Homework",
          dueDate: new Date(Date.now() + 3 * 86400000).toISOString(), // 3 days from now
        },
      ],
    },
    {
      id: 2,
      name: "Physics 201",
      scheduledDate: new Date(Date.now() + 2 * 86400000).toISOString(), // day after tomorrow
      assignments: [
        {
          id: 3,
          title: "Mechanics Project",
          dueDate: new Date(Date.now() + 14 * 86400000).toISOString(), // 14 days from now
        },
      ],
    },
  ],

  activities: [
    {
      id: 1,
      type: "submission",
      studentName: "John Doe",
      assignmentTitle: "Linear Algebra Quiz",
      timestamp: new Date(Date.now() - 86400000).toISOString(), // yesterday
    },
    {
      id: 2,
      type: "submission",
      studentName: "Jane Smith",
      assignmentTitle: "Calculus Homework",
      timestamp: new Date(Date.now() - 2 * 86400000).toISOString(),
    },
    {
      id: 3,
      type: "attendance",
      studentName: "Alice Johnson",
      description: "Joined Mathematics 101",
      timestamp: new Date(Date.now() - 3 * 86400000).toISOString(),
    },
    {
      id: 4,
      type: "grade",
      studentName: "Bob Wilson",
      description: "Received 95% on Physics Quiz",
      timestamp: new Date(Date.now() - 4 * 86400000).toISOString(),
    },
  ],
};
