import React from "react";
import "../App.css";

const Footer = () => {
  return (
    <footer className="app-footer">
      <p>
        © {new Date().getFullYear()} Cambridge Institute of Technology — All Rights Reserved.
      </p>

      <p className="footer-sub">
        Developed by{" "}
        <a
          href="https://www.linkedin.com/in/keerthi-vasan05/"
          target="_blank"
          rel="noopener noreferrer"
          className="footer-link"
        >
          Keerthi Vasan
        </a>{" "}
        · CSE (IoT) Department
      </p>

      <p>
        Need help?{" "}
        <a href="/support" className="footer-support">
          Contact Support
        </a>
      </p>
    </footer>

  );
};

export default Footer;
