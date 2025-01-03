import React, { useState } from "react";
import { Plus } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../components/ui/Card";

export const ClassesPage = () => {
  const [classes, setClasses] = useState([
    {
      id: 1,
      name: "Advanced Mathematics 101",
      students: 32,
      schedule: "Mon, Wed, Fri - 10:00 AM",
      nextAssignment: "Linear Algebra Quiz",
      progress: 75,
    },
    {
      id: 2,
      name: "Computer Science Fundamentals",
      students: 28,
      schedule: "Tue, Thu - 2:00 PM",
      nextAssignment: "Algorithm Analysis",
      progress: 60,
    },
  ]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">My Classes</h1>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-blue-700">
          <Plus className="w-4 h-4" />
          <span>Create New Class</span>
        </button>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {classes.map((classItem) => (
          <Card
            key={classItem.id}
            className="hover:shadow-md transition-shadow"
          >
            <CardHeader>
              <CardTitle>{classItem.name}</CardTitle>
              <CardDescription>{classItem.schedule}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Students</span>
                  <span className="font-medium">{classItem.students}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Next Assignment</span>
                  <span className="font-medium">
                    {classItem.nextAssignment}
                  </span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Progress</span>
                    <span className="font-medium">{classItem.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 rounded-full h-2"
                      style={{ width: `${classItem.progress}%` }}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
