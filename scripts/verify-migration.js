const { PrismaClient } = require("@prisma/client");
const p = new PrismaClient();

async function main() {
  const tables = await p.$queryRawUnsafe(
    "select table_name from information_schema.tables where table_schema='public' order by 1"
  );
  console.log("Tables:", tables.map((x) => x.table_name).join(", "));

  const [products, categories, orders, materials, amanat, profiles, requests] =
    await Promise.all([
      p.product.count(),
      p.category.count(),
      p.order.count(),
      p.material.count(),
      p.amana.count(),
      p.profile.count(),
      p.request.count(),
    ]);
  console.log({ products, categories, orders, materials, amanat, profiles, requests });
}

main()
  .catch((e) => {
    console.error(e.message);
    process.exit(1);
  })
  .finally(() => p.$disconnect());
