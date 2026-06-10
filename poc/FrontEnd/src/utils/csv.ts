import Papa from "papaparse";

export type CsvRow = Record<string, string>;

export function parseCSV(text: string): CsvRow[] {
  const result = Papa.parse<CsvRow>(text, {
    header: true,
    skipEmptyLines: "greedy",
    transformHeader: (header) => header.trim(),
    transform: (value) => value.trim(),
  });

  if (result.errors.length) {
    const firstError = result.errors[0];
    throw new Error(`CSV parse error on row ${firstError.row ?? "unknown"}: ${firstError.message}`);
  }

  return result.data;
}
