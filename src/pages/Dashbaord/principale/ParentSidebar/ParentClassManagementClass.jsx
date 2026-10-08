import React from "react";
import StudentClassList from "./StudentClassList";
// tabData (classId from a notification) is forwarded so the class opens directly
const ParentClassManagementClass = ({ tabData }) => (
  <StudentClassList isParentView={true} tabData={tabData} />
);
export default ParentClassManagementClass;
