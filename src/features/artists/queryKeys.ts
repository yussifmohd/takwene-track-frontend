export const artistKeys = {
  all: ["artists"] as const,
  lists: () => [...artistKeys.all, "list"] as const,
  list: (params: { page: number; pageSize: number }) => [...artistKeys.lists(), params] as const,
  search: (term: string) => [...artistKeys.all, "search", term] as const,
  detail: (id: string) => [...artistKeys.all, "detail", id] as const,
};
