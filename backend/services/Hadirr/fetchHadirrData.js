import { formatLocalDate } from "../../utils/date.js";
import axios from "axios";
import { clearHadirrTokenCache, getValidHadirrToken } from "./authHadirr.js";
import { requestHadirrAttendance } from "./requestHadirrAttendance.js";

export async function fetchHadirrData(date, group) {
  try {
    return await requestHadirrAttendance(date, group);
  } catch (error) {
    if (error.response?.status === 401) {
      clearHadirrTokenCache(group);
      return await requestHadirrAttendance(date, group);
    }
    throw error;
  }
}
