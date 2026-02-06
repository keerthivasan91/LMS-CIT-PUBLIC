/**
 * Integration Test: Apply Leave
 * - With substitute
 * - Without substitute
 * - Real Express app
 * - Real MySQL test DB
 * - Session-based authentication
 */

const request = require("supertest");
const bcrypt = require("bcryptjs");
const app = require("../../../app");
const pool = require("../../../config/db");

let facultyAgent;

describe("Integration: Apply Leave (with & without substitute)", () => {
    beforeAll(async () => {
        /* =====================================================
           CLEANUP (IDEMPOTENT)
        ===================================================== */
        await pool.query(
            "DELETE FROM leave_requests WHERE user_id = 'FAC301'"
        );
        await pool.query(
            "DELETE FROM users WHERE user_id IN ('FAC301','HOD301')"
        );

        const hash = await bcrypt.hash("password", 10);

        /* =====================================================
           SEED FACULTY (FAC301)
        ===================================================== */
        await pool.query(
            `INSERT INTO users
     (user_id, name, email, password, role, department_code, designation, is_active)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                "FAC301",
                "Faculty User",
                "fac301@test.com",
                hash,
                "faculty",
                "CSE",
                "Assistant Professor",
                1
            ]
        );

        /* =====================================================
           SEED SUBSTITUTE / HOD (HOD301)
        ===================================================== */
        await pool.query(
            `INSERT INTO users
     (user_id, name, email, password, role, department_code, designation, is_active)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                "HOD301",
                "HOD User",
                "hod301@test.com",
                hash,
                "hod",
                "CSE",
                "Head of Department",
                1
            ]
        );

        const academicYear = 2026;

        await pool.query(
            `INSERT INTO leave_balance
            (user_id, academic_year, casual_total, earned_total)
            VALUES (?, ?, ?, ?)`,
            [
                "FAC301",
                academicYear,
                10, // casual_total
                10  // earned_total
            ]
        );


        /* =====================================================
           LOGIN FACULTY (SESSION)
        ===================================================== */
        facultyAgent = request.agent(app);

        const loginRes = await facultyAgent.post("/api/auth/login").send({
            user_id: "FAC301",
            password: "password",
        });

        expect(loginRes.statusCode).toBe(200);
    });


    afterAll(async () => {
        /* =====================================================
           FINAL CLEANUP
        ===================================================== */
        await pool.query(
            "DELETE FROM leave_requests WHERE user_id = 'FAC301'"
        );
        await pool.query(
            "DELETE FROM users WHERE user_id IN ('FAC301','HOD301')"
        );
        await pool.end();
    });

    /* =====================================================
       TESTS
    ===================================================== */

    test("Faculty can apply leave WITH substitute", async () => {
        const res = await facultyAgent.post("/api/apply").send({
            leave_type: "Earned Leave",
            start_date: "2026-02-15",
            start_session: "forenoon",
            end_date: "2026-02-15",
            end_session: "afternoon",
            reason: "Medical",
            arr1_dept: "CSE",
            arr1_faculty: "HOD301",
            arr1_details: "1st DEC - AI lectures"
        });

        // ADD THIS DEBUG BLOCK
        if (res.statusCode !== 200) {
            console.log('Status:', res.statusCode);
            console.log('Body:', res.body);
            console.log('Text:', res.text);
        }

        expect(res.statusCode).toBe(200);
        // ... rest of test
    });

    test("Faculty can apply leave WITHOUT substitute", async () => {
        const res = await facultyAgent.post("/api/apply").send({
            leave_type: "Earned Leave",
            start_date: "2026-02-18",
            start_session: "Forenoon",
            end_date: "2026-02-18",
            end_session: "Afternoon",
            reason: "Personal",
        });

        expect(res.statusCode).toBe(200);
        expect(res.body.ok).toBe(true);

        const [[row]] = await pool.query(
            `SELECT * FROM leave_requests
             WHERE user_id = ?
             ORDER BY created_at DESC
             LIMIT 1`,
            ["FAC301"]
        );

        expect(row).toBeDefined();
        expect(row.final_status).toBe("pending");

    });

    test("Leave application fails if unauthenticated", async () => {
        const res = await request(app).post("/api/apply").send({
            leave_type: "Earned Leave",
            start_date: "2026-02-25",
            end_date: "2026-02-25",
            reason: "Unauthorized",
        });

        expect(res.statusCode).toBe(401);
    });
});
