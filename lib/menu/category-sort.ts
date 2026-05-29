export function moveCategoryInOrder<T extends { id: string }>(
  categories: T[],
  categoryId: string,
  direction: "up" | "down"
) {
  const currentIndex = categories.findIndex((category) => category.id === categoryId);
  if (currentIndex === -1) return categories;

  const nextIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
  if (nextIndex < 0 || nextIndex >= categories.length) return categories;

  const nextCategories = [...categories];
  [nextCategories[currentIndex], nextCategories[nextIndex]] = [
    nextCategories[nextIndex],
    nextCategories[currentIndex],
  ];

  return nextCategories;
}
