
export function formatDateTime(dateString: string): string {
  const date = new Date(dateString);

  const options: Intl.DateTimeFormatOptions = {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  };

  // Example: "9 Sep 2025, 9:00 PM"
  const formatted = date.toLocaleString("en-GB", options);

  // Replace first comma with " at "
  return formatted.replace(",", ",").replace(",", " at");
}


export function formatDate(dateString: string): string {
  const date = new Date(dateString);

  const options: Intl.DateTimeFormatOptions = {
    day: "numeric",
    month: "short",
    year: "numeric",
  };

  // Example: "5 Sep 2025"
  const formatted = date.toLocaleDateString("en-GB", options);

  // Add a comma after the month
  return formatted.replace(/(\d{1,2}) (\w{3}) (\d{4})/, "$1 $2, $3");
}

// Example usage:
// console.log(formatDateTime("2025-09-23T17:01:31.050753Z"));
// Output: "9 Sep, 2025 at 9:00 PM"
