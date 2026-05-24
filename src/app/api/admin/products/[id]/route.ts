include: {
  category: { select: { id: true, slug: true, nameAr: true, nameEn: true } },
  orderBy: { sortOrder: "asc" },
  orderItems: { take: 5, orderBy: { order: { createdAt: "desc" } }, include: ...
}