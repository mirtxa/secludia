/**
 * Get initials from a name string.
 * @param name - The name to extract initials from
 * @param maxLength - Maximum number of initials to return (default: 2)
 * @returns Uppercase initials
 */
export function getInitials(name: string): string {
  return name.trim().slice(0, 2).trim().toUpperCase();
}
