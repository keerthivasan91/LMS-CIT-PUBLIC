import http from "k6/http";
import { sleep, check } from "k6";

export const options = {
  vus: 20,
  duration: "1m",
};

const users = [
  { user_id: "FAC001", password: "password" },
  { user_id: "FAC002", password: "password" },
  { user_id: "FAC003", password: "password" },
  { user_id: "FAC004", password: "password" },
  { user_id: "FAC005", password: "password" },
  { user_id: "FAC006", password: "password" },
  { user_id: "FAC007", password: "password" },
  { user_id: "FAC008", password: "password" },
  { user_id: "FAC009", password: "password" },
];

export default function () {
  const user = users[__VU % users.length];

  const payload = JSON.stringify({
    user_id: user.user_id,
    password: user.password,
  });

  const res = http.post(
    "http://localhost:8080/api/auth/login",
    payload,
    {
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  check(res, {
    "login success (200/201)": (r) =>
      r.status === 200 || r.status === 201,
    "not rate limited": (r) => r.status !== 429,
  });

  sleep(1); // real user think time
}
