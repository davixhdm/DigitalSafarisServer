import bcrypt from "bcryptjs";

const comparePassword = async (plain, hashed) => bcrypt.compare(plain, hashed);

export default comparePassword;