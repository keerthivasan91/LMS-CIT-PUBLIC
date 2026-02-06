import React from "react";
import { useNavigate } from "react-router-dom";
import "../App.css";

const Support = () => {
  const navigate = useNavigate();

  return (
    <div className="history-container support-container">
      <div>
        <div className="support-header">
          <h2>Support & Contact</h2>
        </div>

        <div className="support-card">
          <p>
            If you are facing any issues with login, leave application,
            or system errors, please contact us using the details below.
          </p>

          <div className="support-section">
            <p>
              <span className="support-label">Email:</span>{" "}
              <a href="mailto:lms.cit@cambridge.edu.in">
                lms.cit@cambridge.edu.in
              </a>
            </p>
          </div>
          <button
            className="back-btn"
            onClick={() => navigate(-1)}
          >
            ← Back
          </button>
        </div>
      </div>
    </div>
  );
};

export default Support;
