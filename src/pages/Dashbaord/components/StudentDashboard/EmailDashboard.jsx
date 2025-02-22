import React, { useState } from "react";
import {
  Mail,
  Inbox,
  Send,
  Archive,
  Trash2,
  Search,
  Paperclip,
  Users,
  MoreVertical,
  Reply,
} from "lucide-react";

const EmailDashboard = ({
  isDark = false,
  currentTheme = "default",
  colorSchemes = {},
}) => {
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState("Inbox");

  // Default color if colorSchemes is not provided
  const defaultActiveColor = "bg-blue-500";

  const getActiveColor = () => {
    try {
      return colorSchemes[currentTheme]?.primary || defaultActiveColor;
    } catch (error) {
      return defaultActiveColor;
    }
  };

  const emailCategories = [
    { label: "Inbox", icon: Inbox, count: 12 },
    { label: "Sent", icon: Send, count: 5 },
    { label: "Archived", icon: Archive, count: 3 },
  ];

  const emails = [
    {
      id: 1,
      sender: "Mathematics Department",
      subject: "Upcoming Math Olympiad",
      preview: "Details for the upcoming Math Olympiad competition...",
      fullContent: `Dear Students,

We are excited to announce the details for the upcoming Math Olympiad competition. This year's event promises to be an exceptional opportunity for mathematical excellence.

Key Details:
- Date: March 15, 2025
- Registration Deadline: February 28, 2025
- Venue: School Main Auditorium

Please ensure you complete your registration and prepare thoroughly.

Best regards,
Mathematics Department`,
      time: "10:45 AM",
      isRead: false,
      attachments: 2,
      category: "Inbox",
    },
    {
      id: 2,
      sender: "School Administration",
      subject: "Parent-Teacher Meeting Schedule",
      preview: "Please find the schedule for the upcoming PTM...",
      fullContent: `Dear Parents and Students,

The upcoming Parent-Teacher Meeting is scheduled for February 20, 2025. 

Meeting Timings:
- Batch A: 9:00 AM - 11:00 AM
- Batch B: 11:30 AM - 1:30 PM
- Batch C: 2:00 PM - 4:00 PM

Please check your assigned batch and arrive on time.

Regards,
School Administration`,
      time: "Yesterday",
      isRead: true,
      attachments: 1,
      category: "Inbox",
    },
    {
      id: 3,
      sender: "Science Club",
      subject: "Science Fair Registration Reminder",
      preview: "Registration for the annual Science Fair is open...",
      fullContent: `Attention Students,

The annual Science Fair registration is now open! This is your chance to showcase innovative scientific projects and demonstrate your research skills.

Important Dates:
- Registration Starts: February 5, 2025
- Registration Closes: February 25, 2025
- Fair Date: March 10, 2025

Submit your project proposals early!

Best wishes,
Science Club`,
      time: "Feb 1",
      isRead: false,
      attachments: 0,
      category: "Inbox",
    },
  ];

  const filteredEmails = emails.filter(
    (email) =>
      email.category === activeCategory &&
      (email.sender.toLowerCase().includes(searchTerm.toLowerCase()) ||
        email.subject.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const renderEmailList = () => {
    return filteredEmails.map((email) => (
      <div
        key={email.id}
        onClick={() => setSelectedEmail(email)}
        className={`p-4 flex items-center justify-between cursor-pointer ${
          isDark ? "hover:bg-gray-800" : "hover:bg-gray-100"
        } ${!email.isRead ? "font-bold" : ""} ${
          selectedEmail?.id === email.id
            ? isDark
              ? "bg-gray-800"
              : "bg-blue-50"
            : ""
        }`}
      >
        <div className="flex items-center space-x-4">
          <div
            className={`w-2 h-2 rounded-full ${
              !email.isRead ? "bg-blue-500" : "bg-transparent"
            }`}
          ></div>
          <div>
            <p>{email.sender}</p>
            <p
              className={`text-sm ${
                isDark ? "text-gray-400" : "text-gray-500"
              }`}
            >
              {email.subject}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {email.attachments > 0 && (
            <Paperclip
              className={`w-4 h-4 ${
                isDark ? "text-gray-400" : "text-gray-500"
              }`}
            />
          )}
          <span
            className={`text-sm ${isDark ? "text-gray-400" : "text-gray-500"}`}
          >
            {email.time}
          </span>
        </div>
      </div>
    ));
  };

  const renderEmailContent = () => {
    if (!selectedEmail)
      return (
        <div
          className={`flex items-center justify-center h-full ${
            isDark ? "text-gray-400" : "text-gray-500"
          }`}
        >
          Select an email to view its contents
        </div>
      );

    return (
      <div className="p-6 space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold">{selectedEmail.subject}</h2>
          <div className="flex space-x-2">
            <button
              className={`${
                isDark ? "hover:bg-gray-800" : "hover:bg-gray-200"
              } p-2 rounded-full`}
            >
              <Reply className="w-5 h-5" />
            </button>
            <button
              className={`${
                isDark ? "hover:bg-gray-800" : "hover:bg-gray-200"
              } p-2 rounded-full`}
            >
              <Trash2 className="w-5 h-5 text-red-500" />
            </button>
            <button
              className={`${
                isDark ? "hover:bg-gray-800" : "hover:bg-gray-200"
              } p-2 rounded-full`}
            >
              <MoreVertical className="w-5 h-5" />
            </button>
          </div>
        </div>
        <div className="flex items-center space-x-4 mb-4">
          <img
            src="/api/placeholder/50/50"
            alt="Sender"
            className="rounded-full w-12 h-12"
          />
          <div>
            <p className="font-semibold">{selectedEmail.sender}</p>
            <p
              className={`text-sm ${
                isDark ? "text-gray-400" : "text-gray-500"
              }`}
            >
              to me
            </p>
          </div>
        </div>
        <div className="whitespace-pre-wrap">{selectedEmail.fullContent}</div>
      </div>
    );
  };

  return (
    <div
      className={`grid grid-cols-12 h-screen ${
        isDark ? "bg-gray-900 text-white" : "bg-white text-gray-900"
      }`}
    >
      {/* Sidebar */}
      <div
        className={`col-span-3 border-r ${
          isDark ? "bg-gray-800 border-gray-700" : "bg-gray-100 border-gray-200"
        }`}
      >
        <div className="p-6">
          <div className="relative mb-6">
            <Search
              className={`absolute left-3 top-1/2 -translate-y-1/2 ${
                isDark ? "text-gray-400" : "text-gray-500"
              }`}
            />
            <input
              type="text"
              placeholder="Search emails"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full pl-10 pr-4 py-2 rounded-full ${
                isDark ? "bg-gray-700 text-white" : "bg-white text-gray-900"
              }`}
            />
          </div>

          <div className="space-y-2">
            {emailCategories.map((category) => (
              <div
                key={category.label}
                onClick={() => setActiveCategory(category.label)}
                className={`flex items-center justify-between px-4 py-2 rounded-lg cursor-pointer ${
                  activeCategory === category.label
                    ? `${getActiveColor()} bg-opacity-20`
                    : isDark
                    ? "hover:bg-gray-700"
                    : "hover:bg-gray-200"
                }`}
              >
                <div className="flex items-center space-x-3">
                  <category.icon className="w-5 h-5" />
                  <span>{category.label}</span>
                </div>
                <span
                  className={`${
                    isDark
                      ? "bg-gray-700 text-blue-400"
                      : "bg-blue-100 text-blue-800"
                  } text-xs px-2 py-1 rounded-full`}
                >
                  {category.count}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Email List */}
      <div
        className={`col-span-3 border-r ${
          isDark ? "border-gray-700" : "border-gray-200"
        }`}
      >
        <div className="h-full overflow-y-auto">{renderEmailList()}</div>
      </div>

      {/* Email Content */}
      <div className="col-span-6">{renderEmailContent()}</div>
    </div>
  );
};

export default EmailDashboard;
