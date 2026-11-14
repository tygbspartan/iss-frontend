const dateFormat = new Intl.DateTimeFormat(undefined, {
  year: "numeric",
  month: "short",
  day: "numeric",
});

export const formatDate = (iso: string | null | undefined): string =>
  iso ? dateFormat.format(new Date(iso)) : "—";

export const truncate = (text: string | null | undefined, max = 80): string => {
  if (!text) return "";
  return text.length > max ? `${text.slice(0, max).trimEnd()}…` : text;
};

const dateTimeFormat = new Intl.DateTimeFormat(undefined, {
  year: "numeric",
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

export const formatDateTime = (iso: string | null | undefined): string =>
  iso ? dateTimeFormat.format(new Date(iso)) : "—";
