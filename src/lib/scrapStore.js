const KEY = "scrapRecipeIds";

export function getScrapSet() {
  try {
    const raw = localStorage.getItem(KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
}

export function isScrapped(recipeId) {
  return getScrapSet().has(Number(recipeId));
}

export function toggleScrapLocal(recipeId) {
  const id = Number(recipeId);
  const set = getScrapSet();
  if (set.has(id)) set.delete(id);
  else set.add(id);
  localStorage.setItem(KEY, JSON.stringify(Array.from(set)));
  return set.has(id);
}