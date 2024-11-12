import React, { useState } from "react";
import "../CSS/Signup.css"; // Import CSS for additional styling

export const SignUp = () => {
  const [currentStep, setCurrentStep] = useState(1); // Step tracking
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phoneNumber: "",
    password: "",
    userType: "",
    idCard: "",
    photo: null,
    className: "",
    classId: "",
  });

  const [showProfesseurModal, setShowProfesseurModal] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleFileChange = (e) => {
    setFormData({
      ...formData,
      photo: e.target.files[0],
    });
  };

  const handleNextStep = () => {
    if (currentStep === 1) {
      // Validate Step 1
      if (
        formData.fullName &&
        formData.email &&
        formData.phoneNumber &&
        formData.password
      ) {
        setCurrentStep(2);
      } else {
        alert("Please fill in all fields.");
      }
    } else if (currentStep === 2) {
      // Validate Step 2
      if (formData.userType === "Professeur" && !formData.idCard) {
        alert("Please fill in all professional details.");
      } else {
        alert("Sign Up Complete!");
      }
    }
  };

  const handleUserTypeChange = (e) => {
    const selectedUserType = e.target.value;
    setFormData({
      ...formData,
      userType: selectedUserType,
    });
    if (selectedUserType === "Professeur") {
      setShowProfesseurModal(true);
    } else {
      setShowProfesseurModal(false);
    }
  };

  return (
    <div className="signup-page">
      <div className="signup-container">
        <div className="progress-bar">
          <div className={`progress-step ${currentStep === 1 ? "active" : ""}`}>
            Step 1
          </div>
          <div className={`progress-step ${currentStep === 2 ? "active" : ""}`}>
            Step 2
          </div>
        </div>

        {/* Step 1: Personal Information */}
        {currentStep === 1 && (
          <div className="signup-form">
            <form>
              <div className="form-group">
                <label htmlFor="fullName" className="signup-label">
                  Full Name:
                </label>
                <input
                  type="text"
                  id="fullName"
                  name="fullName"
                  placeholder="Enter your full name"
                  className="signup-input"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="email" className="signup-label">
                  Email:
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  placeholder="Enter your email"
                  className="signup-input"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="phoneNumber" className="signup-label">
                  Phone Number:
                </label>
                <input
                  type="text"
                  id="phoneNumber"
                  name="phoneNumber"
                  placeholder="Enter your phone number"
                  className="signup-input"
                  value={formData.phoneNumber}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="password" className="signup-label">
                  Password:
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  placeholder="Enter your password"
                  className="signup-input"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <button
                type="button"
                className="signup-button"
                onClick={handleNextStep}
              >
                Next Step
              </button>
            </form>
          </div>
        )}

        {/* Step 2: User Type Information */}
        {currentStep === 2 && (
          <div className="signup-form">
            <div className="form-group">
              <label htmlFor="userType" className="signup-label">
                User Type:
              </label>
              <select
                id="userType"
                name="userType"
                value={formData.userType}
                onChange={handleUserTypeChange}
                className="signup-input"
                required
              >
                <option value="">Select User Type</option>
                <option value="Parent">Parent</option>
                <option value="Professeur">Professeur</option>
                <option value="Eleve">Eleve</option>
              </select>
            </div>

            {showProfesseurModal && (
              <div className="professeur-modal">
                <div className="form-group">
                  <label htmlFor="idCard" className="signup-label">
                    ID Card:
                  </label>
                  <input
                    type="text"
                    id="idCard"
                    name="idCard"
                    placeholder="Enter ID card number"
                    className="signup-input"
                    value={formData.idCard}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="photo" className="signup-label">
                    Upload Photo:
                  </label>
                  <input
                    type="file"
                    id="photo"
                    name="photo"
                    className="signup-input"
                    onChange={handleFileChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="className" className="signup-label">
                    Class Name:
                  </label>
                  <input
                    type="text"
                    id="className"
                    name="className"
                    placeholder="Enter class name"
                    className="signup-input"
                    value={formData.className}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="classId" className="signup-label">
                    Class ID:
                  </label>
                  <input
                    type="text"
                    id="classId"
                    name="classId"
                    placeholder="Enter class ID"
                    className="signup-input"
                    value={formData.classId}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
            )}

            <button
              type="button"
              className="signup-button"
              onClick={handleNextStep}
            >
              Complete Sign Up
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SignUp;
