export const filterCloseStatus = [
  {
    id: 1,
    label: "All",
    filter: () => true,
  },
  {
    id: 2,
    label: "Closed Data",
    filter: (item) => item.status === "SUCCESS",
  },
  {
    id: 3,
    label: "Open",
    filter: (item) => item.status !== "SUCCESS",
  },
];
