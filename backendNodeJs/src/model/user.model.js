import { db } from "../db/index.js";

const createUser = async (name, email, password, phoneNumber) => {
  try {
    const query = `
            INSERT INTO users
            (name, email, password_hash, phone_number)
            VALUES(?, ?, ?, ?) 
        `;
    const [result] = await db.execute(query, [
      name,
      email,
      password,
      phoneNumber,
    ]);
    return result;
  } catch (error) {
    console.log("creation of user failed");
    throw error;
  }
};

const findUserByEmail = async (email) => {
  try {
    const query = `
            SELECT * 
            FROM users
            WHERE email = ? 
        `;
    const [result] = await db.execute(query, [email]);
    return result[0] || null;
  } catch (error) {
    console.log("NO user with such email found");
    throw error;
  }
};

const findUserById = async (userId) => {
  try {
    const query = `
            SELECT *
            FROM users
            where id = ?
        `;
    const [result] = await db.execute(query, [userId]);
    return result[0] || null;
  } catch (error) {
    console.log("NO user with such id found");
    throw error;
  }
};

const updateUser = async (id, name, phoneNumber) => {
  const query = `
        UPDATE users 
        SET 
            name = ?,
            phone_number = ?
        Where id = ? 
    `;
  const [res] = await db.execute(query, [name, phoneNumber, id]);

  return res;
};

const deleteUser = async (id) => {
  const query = `
        DELETE FROM users
        WHERE id = ?
    `;

  const [res] = await db.execute(query, [id]);

  return res;
};

const updateProfileImage = async (profileImageUrl, email) => {
  const query = `
        UPDATE users
        SET
            profileImage = ?
        WHERE email = ?
    `;

  const [res] = await db.execute(query, [profileImageUrl, email]);

  return res;
};

const updatePassword = async (password, userId) => {
  const query = `
        UPDATE users
            SET password_hash = ?
        where id = ?
    `;

  const [result] = await db.execute(query, [password, userId]);

  return result;
};

const createPasswordReset = async (userId, otpHash, expiresAt) => {
  const query = `
        INSERT INTO password_reset_otps
            (user_id, otp_hash, expiresAt)
            VALUES(?, ? , ?)
    `;
  const [result] = await db.execute(query, [userId, otpHash, expiresAt]);

  return result;
};

const findLatestPasswordResetOtp = async (userId) => {
  const query = `
        SELECT * 
        FROM password_reset_otps
        WHERE user_id = ? 
            AND isUsed = FALSE
            AND attempts < 3
        ORDER BY sentAt DESC
        LIMIT 1
    `;

  const [result] = await db.execute(query, [userId]);

  return result[0] || null;
};

const incrementOtpAttempts = async (otpId) => {
  const query = `
        UPDATE password_reset_otps
            SET attempts = attempts + 1
        WHERE id = ?
    `;

  const [result] = await db.execute(query, [otpId]);

  return result;
};

const resetOtpAttempts = async (otpId) => {
  const query = `
        UPDATE password_reset_otps
            SET attempts = 0
        WHERE id = ?
    `;
  const [result] = await db.execute(query, [otpId]);
  return result;
};
const markOTPused = async (otpId) => {
  const query = `
        UPDATE password_reset_otps
            SET isUsed = ?
        WHERE id = ?
    `;
  const [result] = await db.execute(query, [true, otpId]);
  return result;
};

export {
  createUser,
  findUserByEmail,
  findUserById,
  updateProfileImage,
  updatePassword,
  updateUser,
  deleteUser,
  createPasswordReset,
  findLatestPasswordResetOtp,
  incrementOtpAttempts,
  resetOtpAttempts,
  markOTPused,
};
