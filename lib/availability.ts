/**
 * The availability line under the Contact heading: "<dates> · <location>".
 * With no dates it is just the location ("Boston or remote"); with neither it is empty (hidden).
 */
export function formatAvailability({ dates, location }: { dates: string; location: string }): string {
  return [dates, location]
    .map((part) => part.trim())
    .filter(Boolean)
    .join(" · ");
}
