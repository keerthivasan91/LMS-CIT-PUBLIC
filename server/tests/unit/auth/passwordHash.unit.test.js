/**
 * Unit Tests: Password Hashing
 * - NO DB
 * - NO HTTP
 * - Uses bcryptjs directly
 */

const bcrypt = require("bcryptjs");

describe("Unit: Password Hashing", () => {
  const plainPassword = "test_password";

  test("should hash password successfully", async () => {
    const hash = await bcrypt.hash(plainPassword, 10);

    expect(hash).toBeDefined();
    expect(hash).not.toBe(plainPassword);
    expect(typeof hash).toBe("string");
  });

  test("should verify correct password against hash", async () => {
    const hash = await bcrypt.hash(plainPassword, 10);

    const isMatch = await bcrypt.compare(plainPassword, hash);

    expect(isMatch).toBe(true);
  });

  test("should reject incorrect password", async () => {
    const hash = await bcrypt.hash(plainPassword, 10);

    const isMatch = await bcrypt.compare("wrong_password", hash);

    expect(isMatch).toBe(false);
  });

  test("hashes of same password should be different (salted)", async () => {
    const hash1 = await bcrypt.hash(plainPassword, 10);
    const hash2 = await bcrypt.hash(plainPassword, 10);

    expect(hash1).not.toBe(hash2);
  });
});
