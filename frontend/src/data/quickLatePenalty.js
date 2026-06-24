import { getLastWeekRange } from "../utils/getLastWeekRange";

export const quickLatePenaltyFilter = [
  {
    id: 1,
    label: "Last week",
    getFilter: () => {
      const { mondayLastWeek, saturdayLastWeek } = getLastWeekRange();

      return {
        startDate: mondayLastWeek,
        endDate: saturdayLastWeek,
      };
    },
  },
  {
    id: 2,
    label: "This week",
    getFilter: () => {
      const today = new Date();
      const day = today.getDay();

      const mondayThisWeek = new Date(today);
      mondayThisWeek.setDate(today.getDate() - (day === 0 ? 6 : day - 1));

      const saturdayThisWeek = new Date(mondayThisWeek);
      saturdayThisWeek.setDate(mondayThisWeek.getDate() + 5);
      return {
        startDate: mondayThisWeek,
        endDate: saturdayThisWeek,
      };
    },
  },
  {
    id: 3,
    label: "This month",
    getFilter: () => {
      const today = new Date();

      return {
        startDate: new Date(today.getFullYear(), today.getMonth(), 1),
        endDate: new Date(today.getFullYear(), today.getMonth() + 1, 0),
      };
    },
  },
];
