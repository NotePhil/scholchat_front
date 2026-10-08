import React from "react";
import StudentClassList from "./StudentClassList";
// tabData (classId from a notification) is forwarded so the class opens directly
const ParentClassManagement = ({ tabData }) => (
  <StudentClassList isParentView={false} tabData={tabData} />
);
export default ParentClassManagement;
