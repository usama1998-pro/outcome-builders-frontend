
export function formatDateTime(dateString: string | null | undefined): string {
  // Handle null, undefined, or empty date strings
  if (!dateString || (typeof dateString === "string" && dateString.trim() === "")) {
    return "Date not available";
  }

  // Normalize the date string - handle Python datetime format with microseconds
  // Python sends: "2025-02-22T21:32:08.561000Z" (6 digits for microseconds)
  // JavaScript Date can handle: "2025-02-22T21:32:08.561Z" (3 digits for milliseconds)
  let normalizedDateString = dateString.trim();
  
  // Replace microseconds (6 digits) with milliseconds (3 digits)
  // Pattern: YYYY-MM-DDTHH:mm:ss.######Z or YYYY-MM-DDTHH:mm:ss.######+HH:MM
  if (normalizedDateString.includes(".") && normalizedDateString.includes("T")) {
    // Match: YYYY-MM-DDTHH:mm:ss.######[timezone]
    const dateTimeMatch = normalizedDateString.match(/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})\.(\d+)(.*)$/);
    if (dateTimeMatch) {
      const [, dateTimePart, fractionalSeconds, timezone] = dateTimeMatch;
      // Keep only first 3 digits for milliseconds, or remove if all zeros
      const milliseconds = fractionalSeconds.length > 3 ? fractionalSeconds.substring(0, 3) : fractionalSeconds;
      normalizedDateString = milliseconds === "000" 
        ? `${dateTimePart}${timezone || "Z"}`
        : `${dateTimePart}.${milliseconds}${timezone || "Z"}`;
    }
  }

  // Try to parse the date
  let date = new Date(normalizedDateString);

  // If parsing failed, try the original string
  if (isNaN(date.getTime())) {
    date = new Date(dateString);
  }

  // Check if date is valid
  if (isNaN(date.getTime())) {
    return "Date not available";
  }

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
