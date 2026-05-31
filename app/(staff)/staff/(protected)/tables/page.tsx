import { getCachedStaffTablePageData } from "@/lib/tables/table-page-data";
import { TablesPageClient } from "./tables-client";

export const dynamic = "force-dynamic";

export default async function TablesPage() {
  return <TablesPageClient tables={await getCachedStaffTablePageData()} />;
}
