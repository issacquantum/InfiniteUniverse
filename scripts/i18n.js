export function pick(value, language) {
  if (value == null) {
    return "";
  }

  if (typeof value === "string") {
    return value;
  }

  return value[language] ?? value.en ?? "";
}
