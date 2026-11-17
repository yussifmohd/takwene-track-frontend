export const artistKeys = {
  all: ["artists"] as const,
  lists: () => [...artistKeys.all, "list"] as const,
  list: (params: { page: number; pageSize: number }) => [...artistKeys.lists(), params] as const,
};
