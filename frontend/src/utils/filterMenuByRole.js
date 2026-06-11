export function filterMenuByRole(menu, role) {
  return menu
    .map((item) => {
      // cek parent
      if (item.roles && !item.roles.includes(role)) {
        return null;
      }

      // kalau ada children → filter juga
      if (item.children) {
        const filteredChildren = item.children.filter(
          (child) => !child.roles || child.roles.includes(role),
        );

        // kalau semua child hilang → parent ikut hilang
        if (filteredChildren.length === 0) return null;

        return {
          ...item,
          children: filteredChildren,
        };
      }

      return item;
    })
    .filter(Boolean);
}
