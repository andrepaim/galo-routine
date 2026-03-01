export const setItem = async (key: string, value: string): Promise<void> => {
  localStorage.setItem(key, value);
};

export const getItem = async (key: string): Promise<string | null> => {
  return localStorage.getItem(key);
};

export const deleteItem = async (key: string): Promise<void> => {
  localStorage.removeItem(key);
};
