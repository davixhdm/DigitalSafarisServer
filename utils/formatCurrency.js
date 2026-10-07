const formatCurrency = (amount, currency = "KES", locale = "en-KE") => {
  const value = Number(amount);
  if (Number.isNaN(value)) return "";
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

export default formatCurrency;