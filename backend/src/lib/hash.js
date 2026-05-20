import bcrypt from "bcryptjs";

const COST = 12;

export async function hashPassword(password) {
  return bcrypt.hash(password, COST);
}

export async function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash);
}
