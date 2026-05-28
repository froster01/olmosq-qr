import { get } from "./client";
import type { LoyversePaginatedResponse, LoyverseShift } from "./types";

function buildShiftQuery(params: Record<string, string>): string {
  const searchParams = new URLSearchParams({
    limit: "250",
    ...params,
  });
  if (process.env.LOYVERSE_STORE_ID) {
    searchParams.set("store_ids", process.env.LOYVERSE_STORE_ID);
  }
  return searchParams.toString();
}

async function fetchLoyverseShifts(
  params: Record<string, string>
): Promise<LoyverseShift[]> {
  const shifts: LoyverseShift[] = [];
  let cursor: string | undefined;

  do {
    const query = buildShiftQuery({
      ...params,
      ...(cursor ? { cursor } : {}),
    });
    const response = await get<LoyversePaginatedResponse<LoyverseShift>>(
      `/shifts?${query}`
    );
    shifts.push(...(response.shifts ?? []));
    cursor = response.cursor || undefined;
  } while (cursor);

  return shifts;
}

export function findLatestOpenShift(
  shifts: LoyverseShift[]
): LoyverseShift | null {
  const openShifts = shifts.filter((shift) => !shift.closed_at);
  if (openShifts.length === 0) return null;

  return openShifts.sort(
    (a, b) =>
      new Date(b.opened_at).getTime() - new Date(a.opened_at).getTime()
  )[0];
}

export function findLatestClosedShift(
  shifts: LoyverseShift[]
): LoyverseShift | null {
  const closedShifts = shifts.filter((shift) => shift.closed_at);
  if (closedShifts.length === 0) return null;

  return closedShifts.sort(
    (a, b) =>
      new Date(b.closed_at as string).getTime() -
      new Date(a.closed_at as string).getTime()
  )[0];
}

export async function fetchLoyverseShiftsForRange({
  start,
  end,
}: {
  start: Date;
  end: Date;
}): Promise<LoyverseShift[]> {
  return fetchLoyverseShifts({
    created_at_min: start.toISOString(),
    created_at_max: end.toISOString(),
  });
}

export async function fetchLatestOpenLoyverseShift(): Promise<LoyverseShift | null> {
  const shifts = await fetchLoyverseShifts({});
  return findLatestOpenShift(shifts);
}

export async function fetchLatestLoyverseShiftSnapshot(): Promise<{
  openShift: LoyverseShift | null;
  latestClosedShift: LoyverseShift | null;
}> {
  const shifts = await fetchLoyverseShifts({});
  return {
    openShift: findLatestOpenShift(shifts),
    latestClosedShift: findLatestClosedShift(shifts),
  };
}
