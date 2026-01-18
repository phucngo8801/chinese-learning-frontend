export const getXP = () => {
  return Number(localStorage.getItem("xp") || 0);
};

export const addXP = (amount: number) => {
  const current = getXP();
  const next = current + amount;
  localStorage.setItem("xp", String(next));
  return next;
};

export const getLevel = (xp: number) => {
  return Math.floor(xp / 100) + 1;
};
