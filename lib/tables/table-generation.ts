export interface ExistingTable {
  code: string;
  number: number;
}

export interface TableCreateInput {
  code: string;
  number: number;
  name: string;
  isActive: boolean;
}

export function getMissingTableCreateInputs(
  existingTables: ExistingTable[],
  desiredTotal: number
): TableCreateInput[] {
  if (!Number.isInteger(desiredTotal) || desiredTotal < 1) {
    throw new Error("Enter at least 1 table.");
  }

  const existingNumbers = new Set(existingTables.map((table) => table.number));
  const existingCodes = new Set(existingTables.map((table) => table.code));
  const creates: TableCreateInput[] = [];

  for (let number = 1; number <= desiredTotal; number++) {
    const code = `T${number}`;
    if (existingNumbers.has(number) || existingCodes.has(code)) {
      continue;
    }

    creates.push({
      code,
      number,
      name: `Table ${number}`,
      isActive: true,
    });
  }

  return creates;
}
