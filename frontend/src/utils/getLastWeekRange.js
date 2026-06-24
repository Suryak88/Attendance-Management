export function getLastWeekRange() {
  const today = new Date();

  const day = today.getDay(); // Minggu=0, Senin=1, dst

  const mondayThisWeek = new Date(today);
  mondayThisWeek.setDate(today.getDate() - (day === 0 ? 6 : day - 1));

  const mondayLastWeek = new Date(mondayThisWeek);
  mondayLastWeek.setDate(mondayThisWeek.getDate() - 7);

  const saturdayLastWeek = new Date(mondayLastWeek);
  saturdayLastWeek.setDate(mondayLastWeek.getDate() + 5);

  return {
    mondayLastWeek,
    saturdayLastWeek,
  };
}
