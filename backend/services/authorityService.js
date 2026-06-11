import { BusinessError } from "../errors/BusinessError.js";

export async function authorityChecking(conn, targetRegnum, regnum) {
  const [[authority]] = await conn.query(
    `SELECT 1 FROM reg_person 
        WHERE regnum = ? AND approver = ?`,
    [targetRegnum, regnum],
  );

  if (!authority) {
    throw new BusinessError("FORBIDDEN", "Forbidden");
  }
}
