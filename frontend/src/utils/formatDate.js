export const formatDate = (value) => {
  if (!value) return "Date a venir";

  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(value));
};
