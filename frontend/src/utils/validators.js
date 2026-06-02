export const isEmail = (value) => /\S+@\S+\.\S+/.test(value);

export const isRequired = (value) => String(value || "").trim().length > 0;
