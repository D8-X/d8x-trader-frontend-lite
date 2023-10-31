export function getTimezoneOffset() {
  const today = new Date();
  today.setMonth(1);
  return -today.getTimezoneOffset();
}
