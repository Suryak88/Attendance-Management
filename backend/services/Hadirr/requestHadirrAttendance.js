import axios from "axios";
import { getValidHadirrToken } from "./authHadirr.js";

export async function requestHadirrAttendance(date, group) {
  const token = await getValidHadirrToken(group);

  const response = await axios.get(
    "https://developer.hadirr.com/v0/attendances",
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      params: {
        date,
      },
    },
  );
  return response.data;
}
