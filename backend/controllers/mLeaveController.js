import dbAbsensi from "../config/dbAbsensi.js";

export async function getLeaveType(req, res) {
  try {
    const [rows] = await dbAbsensi.query(
      "SELECT * FROM m_leave WHERE fl_hapus = 0"
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

export async function addLeaveType(req, res) {
  try {
    const { name, category } = req.body;
    const regnum = req.user.regnum;

    const [rows] = await dbAbsensi.query(
      "SELECT nama, fl_hapus FROM m_leave WHERE nama = ?",
      [name]
    );

    if (rows.length > 0) {
      if (rows[0].fl_hapus === 1) {
        await dbAbsensi.query(
          "UPDATE m_leave SET fl_hapus = 0 WHERE nama = ?",
          [name]
        );
      } else {
        return res.status(409).json({ message: "Leave type already exists" });
      }
    } else {
      await dbAbsensi.query(
        "INSERT INTO m_leave (nama, kategori, entry_by) VALUES (?, ?, ?)",
        [name, category, regnum]
      );
    }
    res.status(201).json({
      message: "Leave type added successfully",
      data: { name, category },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

export async function editLeaveType(req, res) {
  try {
    const { id } = req.params;
    const { name, category } = req.body;
    const regnum = req.user.regnum;

    const [rows] = await dbAbsensi.query(
      "SELECT nama FROM m_leave WHERE id != ? AND nama = ?",
      [id, name]
    );

    if (rows.length > 0)
      return res.status(409).json({ message: "Leave type already exists" });

    const [result] = await dbAbsensi.query(
      "UPDATE m_leave SET nama = ?, kategori = ? WHERE id = ?",
      [name, category, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Leave type not found" });
    }

    return res.status(200).json({ message: "Leave type updated!" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

export async function deleteLeaveType(req, res) {
  try {
    const { id } = req.params;
    const regnum = req.user.regnum;

    const [rows] = await dbAbsensi.query(
      "UPDATE m_leave SET fl_hapus = 1 WHERE id = ?",
      [id]
    );

    if (rows.affectedRows === 0) {
      return res.status(404).json({ message: "Leave type not found" });
    }

    return res.status(200).json({ message: "Leave type deleted!" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}
