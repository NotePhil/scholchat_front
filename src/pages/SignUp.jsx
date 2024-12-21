import React, { useState, useCallback } from "react";
import { PlusCircle, X, Save, ArrowRight, ArrowLeft } from "lucide-react";
import "../CSS/Signup.css";

const SignUp = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [showClassForm, setShowClassForm] = useState(false);
  const [classes, setClasses] = useState([]);
  const [errors, setErrors] = useState({});

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phoneNumber: "",
    password: "",
    userType: "",
    cniUrlFront: null,
    cniUrlBack: null,
    nomEtablissement: "",
    matriculeProfesseur: "",
    photo: null,
  });

  const validateStep1 = useCallback(() => {
    const newErrors = {};
    if (!formData.fullName) newErrors.fullName = true;
    if (!formData.email) newErrors.email = true;
    if (!formData.phoneNumber) newErrors.phoneNumber = true;
    if (!formData.password) newErrors.password = true;
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [
    formData.fullName,
    formData.email,
    formData.phoneNumber,
    formData.password,
  ]);

  const validateStep2 = useCallback(() => {
    const newErrors = {};
    if (!formData.userType) newErrors.userType = true;
    if (formData.userType === "Professeur") {
      if (!formData.cniUrlFront) newErrors.cniUrlFront = true;
      if (!formData.cniUrlBack) newErrors.cniUrlBack = true;
      if (!formData.nomEtablissement) newErrors.nomEtablissement = true;
      if (!formData.matriculeProfesseur) newErrors.matriculeProfesseur = true;
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [
    formData.userType,
    formData.cniUrlFront,
    formData.cniUrlBack,
    formData.nomEtablissement,
    formData.matriculeProfesseur,
  ]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: false }));
    }
  };

  const handleFileChange = (e, fieldName) => {
    setFormData((prev) => ({ ...prev, [fieldName]: e.target.files[0] }));
    if (errors[fieldName]) {
      setErrors((prev) => ({ ...prev, [fieldName]: false }));
    }
  };

  const handleNextStep = () => {
    if (currentStep === 1 && validateStep1()) {
      setCurrentStep(2);
    } else if (currentStep === 2 && validateStep2()) {
      if (
        formData.userType === "Professeur" &&
        classes.length === 0 &&
        !showClassForm
      ) {
        alert(
          "Please create at least one class or continue with class creation."
        );
        return;
      }
      console.log("Form Data:", formData);
      console.log("Classes:", classes);
      alert("Sign Up Complete!");
    }
  };

  const handlePrevStep = () => {
    setCurrentStep(1);
    setErrors({});
  };

  const handleAddClass = useCallback((classData) => {
    setClasses((prev) => [...prev, { ...classData, dateCreation: new Date() }]);
    setShowClassForm(false);
  }, []);

  const removeClass = useCallback((index) => {
    setClasses((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleStepClick = (step) => {
    if (step === 2 && currentStep === 1) {
      validateStep1() && setCurrentStep(2);
    } else if (step === 1 && currentStep === 2) {
      handlePrevStep();
    }
  };

  const ClassForm = () => {
    const [classData, setClassData] = useState({
      nom: "",
      niveau: "",
      codeActivation: "",
    });

    const handleSubmit = (e) => {
      e.preventDefault();
      handleAddClass(classData);
    };

    return (
      <div className="class-form-container">
        <div className="class-form-header">
          <h3>Create New Class</h3>
          <button
            onClick={() => setShowClassForm(false)}
            className="icon-button"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="class-form">
          <div className="form-group">
            <label>Class Name</label>
            <input
              type="text"
              required
              value={classData.nom}
              onChange={(e) =>
                setClassData((prev) => ({ ...prev, nom: e.target.value }))
              }
            />
          </div>

          <div className="form-group">
            <label>Level</label>
            <select
              required
              value={classData.niveau}
              onChange={(e) =>
                setClassData((prev) => ({ ...prev, niveau: e.target.value }))
              }
            >
              <option value="">Select Level</option>
              <option value="PRIMARY">Primary</option>
              <option value="SECONDARY">Secondary</option>
              <option value="HIGH_SCHOOL">High School</option>
            </select>
          </div>

          <div className="form-group">
            <label>Activation Code</label>
            <input
              type="text"
              required
              value={classData.codeActivation}
              onChange={(e) =>
                setClassData((prev) => ({
                  ...prev,
                  codeActivation: e.target.value,
                }))
              }
            />
          </div>

          <button type="submit" className="submit-button">
            <Save size={16} />
            Save Class
          </button>
        </form>
      </div>
    );
  };

  return (
    <div className="signup-page">
      <div className="signup-container">
        <div className="progress-bar">
          <div className="progress-step">
            <div
              className={`step-circle ${currentStep >= 1 ? "active" : ""} ${
                currentStep === 2 ? "clickable" : ""
              }`}
              onClick={() => handleStepClick(1)}
            >
              1
            </div>
            <div
              className={`step-line ${currentStep >= 2 ? "active" : ""}`}
            ></div>
            <div
              className={`step-circle ${currentStep >= 2 ? "active" : ""} ${
                currentStep === 1 ? "clickable" : ""
              }`}
              onClick={() => handleStepClick(2)}
            >
              2
            </div>
          </div>
        </div>

        {currentStep === 1 && (
          <form className="signup-form">
            <div className="form-group">
              <label>Full Name</label>
              <input
                type="text"
                name="fullName"
                placeholder="Enter your full name"
                value={formData.fullName}
                onChange={handleInputChange}
                className={errors.fullName ? "error" : ""}
              />
            </div>

            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                name="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleInputChange}
                className={errors.email ? "error" : ""}
              />
            </div>

            <div className="form-group">
              <label>Phone Number</label>
              <input
                type="text"
                name="phoneNumber"
                placeholder="Enter your phone number"
                value={formData.phoneNumber}
                onChange={handleInputChange}
                className={errors.phoneNumber ? "error" : ""}
              />
            </div>

            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                name="password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleInputChange}
                className={errors.password ? "error" : ""}
              />
            </div>

            <button
              type="button"
              className="next-button"
              onClick={handleNextStep}
            >
              Next Step
              <ArrowRight size={16} />
            </button>
          </form>
        )}

        {currentStep === 2 && (
          <div className="signup-form">
            <div className="form-group">
              <label>User Type</label>
              <select
                name="userType"
                value={formData.userType}
                onChange={handleInputChange}
                className={errors.userType ? "error" : ""}
              >
                <option value="">Select User Type</option>
                <option value="Parent">Parent</option>
                <option value="Professeur">Professor</option>
                <option value="Eleve">Student</option>
              </select>
            </div>

            {formData.userType === "Professeur" && (
              <div className="professor-details">
                <div className="form-grid">
                  <div className="form-group">
                    <label>ID Card Front</label>
                    <input
                      type="file"
                      onChange={(e) => handleFileChange(e, "cniUrlFront")}
                      className={errors.cniUrlFront ? "error" : ""}
                    />
                  </div>
                  <div className="form-group">
                    <label>ID Card Back</label>
                    <input
                      type="file"
                      onChange={(e) => handleFileChange(e, "cniUrlBack")}
                      className={errors.cniUrlBack ? "error" : ""}
                    />
                  </div>
                </div>

                <div className="form-grid">
                  <div className="form-group">
                    <label>School Name</label>
                    <input
                      type="text"
                      name="nomEtablissement"
                      placeholder="Enter school name"
                      value={formData.nomEtablissement}
                      onChange={handleInputChange}
                      className={errors.nomEtablissement ? "error" : ""}
                    />
                  </div>
                  <div className="form-group">
                    <label>Professor ID</label>
                    <input
                      type="text"
                      name="matriculeProfesseur"
                      placeholder="Enter professor ID"
                      value={formData.matriculeProfesseur}
                      onChange={handleInputChange}
                      className={errors.matriculeProfesseur ? "error" : ""}
                    />
                  </div>
                </div>

                <div className="classes-section">
                  <div className="classes-header">
                    <h3>Classes</h3>
                    <button
                      onClick={() => setShowClassForm(true)}
                      className="add-class-button"
                    >
                      <PlusCircle size={16} />
                      Add Class
                    </button>
                  </div>

                  {classes.length > 0 && (
                    <div className="classes-list">
                      {classes.map((cls, index) => (
                        <div key={index} className="class-card">
                          <div className="class-info">
                            <h4>{cls.nom}</h4>
                            <p>Level: {cls.niveau}</p>
                            <p>Code: {cls.codeActivation}</p>
                          </div>
                          <button
                            onClick={() => removeClass(index)}
                            className="remove-button"
                          >
                            <X size={20} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {classes.length === 0 && !showClassForm && (
                    <div className="empty-classes">
                      No classes added yet. Click the "Add Class" button to
                      create your first class.
                    </div>
                  )}

                  {showClassForm && <ClassForm />}
                </div>
              </div>
            )}

            <div className="button-group">
              <button
                type="button"
                className="prev-button"
                onClick={handlePrevStep}
              >
                <ArrowLeft size={16} />
                Previous Step
              </button>
              <button
                type="button"
                className="submit-button"
                onClick={handleNextStep}
              >
                Complete Sign Up
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SignUp;
