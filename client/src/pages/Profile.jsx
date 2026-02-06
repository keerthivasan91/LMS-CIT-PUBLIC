import React, { useContext, useEffect, useState } from "react";
import AuthContext from "../context/AuthContext";
import api from "@/api/axiosConfig";
import "../App.css";

const EMPTY_BALANCE = {
  casual_total: 0,
  casual_used: 0,
  earned_total: 0,
  earned_used: 0,
  rh_total: 0,
  rh_used: 0,
};

const Profile = () => {
  const { user } = useContext(AuthContext);

  const [profile, setProfile] = useState({
    name: "",
    user_id: "",
    department: "",
    email: "",
    phone: "",
    role: "",
  });

  const [leaveBalance, setLeaveBalance] = useState(EMPTY_BALANCE);

  // Load profile from context
  const loadProfile = () => {
    if (!user) return;

    setProfile({
      name: user.name || "",
      user_id: user.user_id || "",
      department: user.department_code || "",
      email: user.email || "",
      phone: user.phone || "",
      role: user.designation || "",
    });
  };

  // Fetch leave balance from backend
  const loadLeaveBalance = async () => {
    try {
      const res = await api.get("/leave-balance");

      // ✅ Normalize backend response
      const balance = res?.data?.balance ?? EMPTY_BALANCE;

      setLeaveBalance({
        ...EMPTY_BALANCE,
        ...balance,
      });
    } catch (err) {
      console.error("Error fetching leave balance", err);
      setLeaveBalance(EMPTY_BALANCE); // fail-safe
    }
  };

  useEffect(() => {
    loadProfile();
    loadLeaveBalance();
  }, [user]);

  return (
    <div className="history-container" style={{ maxWidth: "1000px" }}>
      <h2>Profile</h2>

      <div className="profile-card">
        <p><strong>Name:</strong> {profile.name}</p>
        <p><strong>User ID:</strong> {profile.user_id}</p>
        <p><strong>Department:</strong> {profile.department}</p>
        <p><strong>Email:</strong> {profile.email}</p>
        <p><strong>Phone:</strong> {profile.phone}</p>
        <p><strong>Designation:</strong> {String(profile.role).toUpperCase()}</p>

        <br />

        <a href="/change-password" className="change-btn">
          <strong>Change Password</strong>
        </a>
      </div>

      <br />

      <div className="leave-balance-card">
        <h3>Leave Balance</h3>

        <p>
          <strong>CL Remaining:</strong>{" "}
          {leaveBalance.casual_total - leaveBalance.casual_used}
        </p>

        <p>
          <strong>EL Remaining:</strong>{" "}
          {leaveBalance.earned_total - leaveBalance.earned_used}
        </p>

        <p>
          <strong>RH Remaining:</strong>{" "}
          {leaveBalance.rh_total - leaveBalance.rh_used}
        </p>
      </div>
    </div>
  );
};

export default Profile;
