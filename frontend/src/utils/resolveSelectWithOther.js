export const OTHER_VALUE = "other";

export const parseSelectWithOtherDefault = (
  defaultValue,
  options
) => {
  if (!defaultValue?.trim()) {
    return { choice: "", custom: "" };
  }

  const matched = options.find(
    (option) =>
      option.toLowerCase() ===
      defaultValue.trim().toLowerCase()
  );

  if (matched) {
    return { choice: matched, custom: "" };
  }

  return {
    choice: OTHER_VALUE,
    custom: defaultValue,
  };
};

export const resolveSelectWithOther = (
  choice,
  custom
) => {
  if (!choice) {
    return "";
  }

  if (choice === OTHER_VALUE) {
    return custom?.trim() ?? "";
  }

  return choice;
};

export const validateSelectWithOther = (
  choice,
  custom
) => {
  if (!choice) {
    return "Please select an option.";
  }

  if (
    choice === OTHER_VALUE &&
    !custom?.trim()
  ) {
    return "Please provide a description.";
  }

  return "";
};
