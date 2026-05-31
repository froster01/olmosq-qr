import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding tables...");

  for (let i = 1; i <= 10; i++) {
    const code = `T${i}`;
    await prisma.table.upsert({
      where: { code },
      update: {},
      create: {
        code,
        number: i,
        name: i <= 5 ? `Table ${i}` : `Table ${i} (Outdoor)`,
        isActive: true,
      },
    });
  }

  console.log("Seeded 10 tables (T1-T10)");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
