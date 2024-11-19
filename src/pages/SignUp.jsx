import React, { useState } from "react";
import "../CSS/Signup.css";

export const SignUp = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phoneNumber: "",
    password: "",
    userType: "",
    idCard: "",
    photo: null,
  });

  const [showProfesseurModal, setShowProfesseurModal] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleFileChange = (e) => {
    setFormData({ ...formData, photo: e.target.files[0] });
  };

  const handleNextStep = () => {
    if (currentStep === 1) {
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
      if (formData.userType === "Professeur" && !formData.idCard) {
        alert("Please fill in all professional details.");
      } else {
        alert("Sign Up Complete!");
      }
    }
  };

  const handleUserTypeChange = (e) => {
    const userType = e.target.value;
    setFormData({ ...formData, userType });
    setShowProfesseurModal(userType === "Professeur");
  };

  return (
    <div className="signup-page">
      <div className="signup-container">
        <div className="progress-bar">
          <div
            className={`progress-step ${currentStep === 1 ? "active" : ""}`}
            onClick={() => setCurrentStep(1)}
          >
            Step 1
          </div>
          <div
            className={`progress-step ${currentStep === 2 ? "active" : ""}`}
            onClick={() => setCurrentStep(2)}
          >
            Step 2
          </div>
        </div>

        {currentStep === 1 && (
          <form className="signup-form">
            <div className="form-group">
              <label className="signup-label" htmlFor="fullName">
                Full Name:
              </label>
              <input
                type="text"
                id="fullName"
                name="fullName"
                className="signup-input"
                placeholder="Enter your full name"
                value={formData.fullName}
                onChange={handleInputChange}
              />
            </div>

            <div className="form-group">
              <label className="signup-label" htmlFor="email">
                Email:
              </label>
              <input
                type="email"
                id="email"
                name="email"
                className="signup-input"
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleInputChange}
              />
            </div>

            <div className="form-group">
              <label className="signup-label" htmlFor="phoneNumber">
                Phone Number:
              </label>
              <input
                type="text"
                id="phoneNumber"
                name="phoneNumber"
                className="signup-input"
                placeholder="Enter your phone number"
                value={formData.phoneNumber}
                onChange={handleInputChange}
              />
            </div>

            <div className="form-group">
              <label className="signup-label" htmlFor="password">
                Password:
              </label>
              <input
                type="password"
                id="password"
                name="password"
                className="signup-input"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleInputChange}
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
        )}

        {currentStep === 2 && (
          <form className="signup-form">
            <div className="form-group">
              <label className="signup-label" htmlFor="userType">
                User Type:
              </label>
              <select
                id="userType"
                name="userType"
                className="signup-input"
                value={formData.userType}
                onChange={handleUserTypeChange}
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
                  <label className="signup-label" htmlFor="idCard">
                    ID Card:
                  </label>
                  <input
                    type="text"
                    id="idCard"
                    name="idCard"
                    className="signup-input"
                    placeholder="Enter your ID card number"
                    value={formData.idCard}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="form-group">
                  <label className="signup-label" htmlFor="photo">
                    Upload Photo:
                  </label>
                  <input
                    type="file"
                    id="photo"
                    name="photo"
                    className="signup-input"
                    onChange={handleFileChange}
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
          </form>
        )}
      </div>
    </div>
  );
};

export default SignUp;
