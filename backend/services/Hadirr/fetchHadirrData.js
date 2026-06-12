import { formatLocalDate } from "../../utils/date.js";
import axios from "axios";
import { clearHadirrTokenCache, getValidHadirrToken } from "./authHadirr.js";
import { HADIRR_GROUPS } from "../../config/hadirrConfig.js";
import { fetchSalesAttendance } from "./fetchSalesAttendance.js";
import { fetchCollectorAttendance } from "./fetchCollectorAttendance.js";

export async function fetchHadirrData(date, group) {
  try {
    if (HADIRR_GROUPS[group] === "SALES") {
      return await fetchSalesAttendance(date, group);
    } else if (HADIRR_GROUPS[group] === "COLLECTOR") {
      return await fetchCollectorAttendance(date, group);
    }
  } catch (error) {
    if (error.response?.status === 401) {
      clearHadirrTokenCache(group);
      if (HADIRR_GROUPS[group] === "SALES") {
        return await fetchSalesAttendance(date, group);
      } else if (HADIRR_GROUPS[group] === "COLLECTOR") {
        return await fetchCollectorAttendance(date, group);
      }
    }
    throw error;
  }
}
