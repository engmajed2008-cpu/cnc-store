const { PrismaClient } = require("@prisma/client");
const p = new PrismaClient();
p.$queryRawUnsafe(
  "select table_name from information_schema.tables where table_schema='public' order by 1"
)
  .then((r) => {
    console.log(r.map((x) => x.table_name).join("\n"));
    return p.$disconnect();
  })
  .catch((e) => {
    console.error(e.message);
    process.exit(1);
  });
