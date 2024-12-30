import React, { useState, useCallback } from "react";
import { PlusCircle, X, Save, ArrowRight, ArrowLeft } from "lucide-react";
import { useScholchat } from "../hooks/useScholchat";

const SignUp = () => {
  const {
    createProfessor,
    createParent,
    createStudent,
    createClass,
    loading,
    error,
  } = useScholchat();

  const [currentStep, setCurrentStep] = useState(1);
  const [showClassForm, setShowClassForm] = useState(false);
  const [classes, setClasses] = useState([]);
  const [errors, setErrors] = useState({});
  const [alertMessage, setAlertMessage] = useState("");
  const [alertType, setAlertType] = useState("");

  const [formData, setFormData] = useState({
    nom: "",
    prenom: "",
    email: "",
    telephone: "",
    password: "",
    adresse: "",
    userType: "",
    cniUrlFront: null,
    cniUrlBack: null,
    nomEtablissement: "",
    matriculeProfesseur: "",
    niveau: "",
  });

  const showAlert = (message, type = "error") => {
    setAlertMessage(message);
    setAlertType(type);
    setTimeout(() => {
      setAlertMessage("");
      setAlertType("");
    }, 3000);
  };

  const validateStep1 = useCallback(() => {
    const newErrors = {};

    if (!formData.nom.trim()) {
      showAlert("Last name (Nom) is required");
      newErrors.nom = true;
    }
    if (!formData.prenom.trim()) {
      showAlert("First name (Prénom) is required");
      newErrors.prenom = true;
    }
    if (!formData.email.trim()) {
      showAlert("Email is required");
      newErrors.email = true;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      showAlert("Please enter a valid email address");
      newErrors.email = true;
    }
    if (!formData.telephone.trim()) {
      showAlert("Phone number is required");
      newErrors.telephone = true;
    }
    if (!formData.password.trim()) {
      showAlert("Password is required");
      newErrors.password = true;
    } else if (formData.password.length < 6) {
      showAlert("Password must be at least 6 characters long");
      newErrors.password = true;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const validateStep2 = useCallback(() => {
    const newErrors = {};

    if (!formData.userType) {
      showAlert("Please select a user type");
      newErrors.userType = true;
    }

    if (formData.userType === "Professeur") {
      if (!formData.cniUrlFront) {
        showAlert("Front ID card image is required");
        newErrors.cniUrlFront = true;
      }
      if (!formData.cniUrlBack) {
        showAlert("Back ID card image is required");
        newErrors.cniUrlBack = true;
      }
      if (!formData.nomEtablissement.trim()) {
        showAlert("School name is required");
        newErrors.nomEtablissement = true;
      }
      if (!formData.matriculeProfesseur.trim()) {
        showAlert("Professor ID is required");
        newErrors.matriculeProfesseur = true;
      }
      if (classes.length === 0) {
        showAlert("Please create at least one class");
        newErrors.classes = true;
      }
    }

    if (formData.userType === "Eleve" && !formData.niveau) {
      showAlert("Please select a level");
      newErrors.niveau = true;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, classes]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: false }));
    }
  };

  const handleFileChange = (e, fieldName) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        showAlert("Please upload an image file");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        showAlert("File size should not exceed 5MB");
        return;
      }
      setFormData((prev) => ({ ...prev, [fieldName]: file }));
      if (errors[fieldName]) {
        setErrors((prev) => ({ ...prev, [fieldName]: false }));
      }
    }
  };

  const handleAddClass = useCallback(
    (classData) => {
      const newClass = {
        nom: classData.nom,
        niveau: classData.niveau,
        dateCreation: new Date().toISOString(),
        codeActivation: classData.codeActivation,
        etat: "ACTIF",
        etablissement: {
          nom: formData.nomEtablissement,
        },
        parents: [],
        eleves: [],
      };

      setClasses((prev) => [...prev, newClass]);
      setShowClassForm(false);
    },
    [formData.nomEtablissement]
  );

  const removeClass = useCallback((index) => {
    setClasses((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleSubmit = async () => {
    try {
      if (!validateStep2()) {
        return;
      }

      let response;
      const baseUserData = {
        nom: formData.nom.trim(),
        prenom: formData.prenom.trim(),
        email: formData.email.trim(),
        telephone: formData.telephone.trim(),
        passeAccess: formData.password,
        adresse: formData.adresse.trim(),
        etat: "active",
      };

      switch (formData.userType) {
        case "Professeur": {
          const professorData = new FormData();

          Object.entries(baseUserData).forEach(([key, value]) => {
            professorData.append(key, value);
          });

          professorData.append("cniUrlRecto", formData.cniUrlFront);
          professorData.append("cniUrlVerso", formData.cniUrlBack);
          professorData.append("nomEtablissement", formData.nomEtablissement);
          professorData.append(
            "matriculeProfesseur",
            formData.matriculeProfesseur
          );
          professorData.append(
            "nomClasse",
            classes.map((c) => c.nom).join(",")
          );

          response = await createProfessor(professorData);

          for (const classData of classes) {
            const classPayload = {
              nom: classData.nom,
              niveau: classData.niveau,
              dateCreation: classData.dateCreation,
              codeActivation: classData.codeActivation,
              etat: "ACTIF",
              etablissement: {
                nom: formData.nomEtablissement,
              },
              parents: [],
              eleves: [],
            };
            await createClass(classPayload);
          }
          break;
        }

        case "Parent":
          response = await createParent({
            ...baseUserData,
            classes: [],
          });
          break;

        case "Eleve":
          response = await createStudent({
            ...baseUserData,
            niveau: formData.niveau,
            classes: [],
          });
          break;

        default:
          throw new Error("Invalid user type");
      }

      showAlert("Registration successful! You can now login.", "success");
      setTimeout(() => {
        window.location.href = "/login";
      }, 2000);
    } catch (err) {
      const errorMessage =
        err.response?.data?.message || "Registration failed. Please try again.";
      showAlert(errorMessage);
    }
  };

  const handleNextStep = () => {
    if (currentStep === 1 && validateStep1()) {
      setCurrentStep(2);
    } else if (currentStep === 2) {
      handleSubmit();
    }
  };

  const handlePrevStep = () => {
    setCurrentStep(1);
    setErrors({});
  };

  const ClassForm = () => {
    const [classData, setClassData] = useState({
      nom: "",
      niveau: "",
      codeActivation: "",
    });

    const handleClassSubmit = (e) => {
      e.preventDefault();
      if (!classData.nom.trim()) {
        showAlert("Class name is required");
        return;
      }
      if (!classData.niveau) {
        showAlert("Class level is required");
        return;
      }
      if (!classData.codeActivation.trim()) {
        showAlert("Activation code is required");
        return;
      }
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

        <form onSubmit={handleClassSubmit} className="class-form">
          <div className="form-group">
            <label>Class Name</label>
            <input
              type="text"
              value={classData.nom}
              onChange={(e) =>
                setClassData((prev) => ({ ...prev, nom: e.target.value }))
              }
              placeholder="Enter class name"
            />
          </div>

          <div className="form-group">
            <label>Level</label>
            <select
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
              value={classData.codeActivation}
              onChange={(e) =>
                setClassData((prev) => ({
                  ...prev,
                  codeActivation: e.target.value,
                }))
              }
              placeholder="Enter activation code"
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
      {loading && <div className="loading-overlay">Loading...</div>}

      {alertMessage && (
        <div className={`alert-message ${alertType}`}>{alertMessage}</div>
      )}

      <div className="signup-container">
        <div className="progress-bar">
          <div className="step-circles">
            <div className={`step-circle ${currentStep >= 1 ? "active" : ""}`}>
              1
            </div>
            <div className="step-line"></div>
            <div className={`step-circle ${currentStep >= 2 ? "active" : ""}`}>
              2
            </div>
          </div>
          <div className="step-labels">
            <span>Personal Information</span>
            <span>Account Details</span>
          </div>
        </div>

        {currentStep === 1 && (
          <form className="signup-form" onSubmit={(e) => e.preventDefault()}>
            <div className="form-grid">
              <div className="form-group">
                <label>First Name (Prénom)</label>
                <input
                  type="text"
                  name="prenom"
                  value={formData.prenom}
                  onChange={handleInputChange}
                  className={errors.prenom ? "error" : ""}
                  placeholder="Enter your first name"
                />
              </div>

              <div className="form-group">
                <label>Last Name (Nom)</label>
                <input
                  type="text"
                  name="nom"
                  value={formData.nom}
                  onChange={handleInputChange}
                  className={errors.nom ? "error" : ""}
                  placeholder="Enter your last name"
                />
              </div>
            </div>

            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className={errors.email ? "error" : ""}
                placeholder="Enter your email"
              />
            </div>

            <div className="form-group">
              <label>Phone Number</label>
              <input
                type="tel"
                name="telephone"
                value={formData.telephone}
                onChange={handleInputChange}
                className={errors.telephone ? "error" : ""}
                placeholder="Enter your phone number"
              />
            </div>

            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className={errors.password ? "error" : ""}
                placeholder="Enter your password"
              />
            </div>

            <div className="form-group">
              <label>Address (Optional)</label>
              <textarea
                name="adresse"
                value={formData.adresse}
                onChange={handleInputChange}
                placeholder="Enter your address"
                rows="3"
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
                      accept="image/*"
                    />
                  </div>

                  <div className="form-group">
                    <label>ID Card Back</label>
                    <input
                      type="file"
                      onChange={(e) => handleFileChange(e, "cniUrlBack")}
                      className={errors.cniUrlBack ? "error" : ""}
                      accept="image/*"
                    />
                  </div>
                </div>

                <div className="form-grid">
                  <div className="form-group">
                    <label>School Name</label>
                    <input
                      type="text"
                      name="nomEtablissement"
                      value={formData.nomEtablissement}
                      onChange={handleInputChange}
                      className={errors.nomEtablissement ? "error" : ""}
                      placeholder="Enter school name"
                    />
                  </div>
                  <div className="form-group">
                    <label>Professor ID</label>
                    <input
                      type="text"
                      name="matriculeProfesseur"
                      value={formData.matriculeProfesseur}
                      onChange={handleInputChange}
                      className={errors.matriculeProfesseur ? "error" : ""}
                      placeholder="Enter professor ID"
                    />
                  </div>
                </div>

                <div className="classes-section">
                  <div className="classes-header">
                    <h3>Classes</h3>
                    <button
                      type="button"
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
                            type="button"
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

            {formData.userType === "Eleve" && (
              <div className="form-group">
                <label>Level</label>
                <select
                  name="niveau"
                  value={formData.niveau}
                  onChange={handleInputChange}
                  className={errors.niveau ? "error" : ""}
                >
                  <option value="">Select Level</option>
                  <option value="PRIMARY">Primary</option>
                  <option value="SECONDARY">Secondary</option>
                  <option value="HIGH_SCHOOL">High School</option>
                </select>
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

      <style jsx>{`
        .signup-page {
          min-height: 100vh;
          padding: 2rem;
          background: linear-gradient(135deg, #1a365d, #2d3748);
        }

        .signup-container {
          max-width: 800px;
          margin: 0 auto;
          background: white;
          padding: 2rem;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .progress-bar {
          margin-bottom: 2rem;
        }

        .step-circles {
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 1rem;
        }

        .step-circle {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: #e0e0e0;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #666;
          font-weight: bold;
        }

        .step-circle.active {
          background: #4caf50;
          color: white;
        }

        .step-line {
          height: 2px;
          flex-grow: 1;
          background: #e0e0e0;
          margin: 0 1rem;
        }

        .step-labels {
          display: flex;
          justify-content: space-between;
          color: #666;
        }

        .signup-form {
          margin-top: 2rem;
        }

        .form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }

        .form-group {
          margin-bottom: 1.5rem;
        }

        label {
          display: block;
          margin-bottom: 0.5rem;
          color: #333;
          font-weight: 500;
        }

        input,
        select,
        textarea {
          width: 100%;
          padding: 0.75rem;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 1rem;
        }

        input.error,
        select.error {
          border-color: #dc3545;
        }

        .button-group {
          display: flex;
          justify-content: space-between;
          margin-top: 2rem;
        }

        button {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1.5rem;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-weight: 500;
          transition: all 0.2s;
        }

        .prev-button {
          background: #f5f5f5;
          color: #666;
        }

        .next-button,
        .submit-button {
          background: #4caf50;
          color: white;
        }

        .add-class-button {
          background: #2196f3;
          color: white;
        }

        .remove-button {
          background: #dc3545;
          color: white;
          padding: 0.5rem;
        }

        .class-form-container {
          background: #f9f9f9;
          padding: 1.5rem;
          border-radius: 4px;
          margin-top: 1rem;
        }

        .class-form-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }

        .classes-list {
          display: grid;
          gap: 1rem;
          margin-top: 1rem;
        }

        .class-card {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: #f5f5f5;
          padding: 1rem;
          border-radius: 4px;
        }

        .empty-classes {
          text-align: center;
          color: #666;
          padding: 2rem;
          background: #f9f9f9;
          border-radius: 4px;
        }

        .loading-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(255, 255, 255, 0.9);
          display: flex;
          justify-content: center;
          align-items: center;
          font-size: 1.2rem;
          z-index: 1000;
        }

        .alert-message {
          position: fixed;
          top: 20px;
          right: 20px;
          padding: 1rem 1.5rem;
          border-radius: 4px;
          z-index: 1001;
          animation: slideIn 0.3s ease-out;
        }

        .alert-message.error {
          background: #fee;
          color: #dc3545;
        }

        .alert-message.success {
          background: #efe;
          color: #4caf50;
        }

        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        @media (max-width: 768px) {
          .form-grid {
            grid-template-columns: 1fr;
          }

          .signup-container {
            padding: 1rem;
          }

          .button-group {
            flex-direction: column;
            gap: 1rem;
          }

          .prev-button,
          .next-button,
          .submit-button {
            width: 100%;
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );
};

export default SignUp;
