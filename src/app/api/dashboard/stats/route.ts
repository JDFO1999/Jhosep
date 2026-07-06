import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const [
      totalPeople,
      activePeople,
      deletedPeople,
      totalDepartments,
      totalComputers,
      departmentsWithCount,
      recentPeople,
    ] = await Promise.all([
      prisma.person.count(),
      prisma.person.count({ where: { isDeleted: false } }),
      prisma.person.count({ where: { isDeleted: true } }),
      prisma.department.count(),
      prisma.person.count({
        where: { isDeleted: false },
      }),
      prisma.department.findMany({
        select: {
          id: true,
          name: true,
          _count: { select: { people: true } },
        },
        orderBy: { people: { _count: "desc" } },
        take: 10,
      }),
      prisma.person.findMany({
        where: { isDeleted: false },
        include: {
          department: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
    ]);

    return NextResponse.json({
      totalPeople,
      activePeople,
      deletedPeople,
      totalDepartments,
      totalComputers,
      departmentsWithCount: departmentsWithCount.map((d) => ({
        id: d.id,
        name: d.name,
        count: d._count.people,
      })),
      recentPeople,
    });
  } catch (error) {
    console.error("Dashboard stats error:", error);
    return NextResponse.json(
      { error: "Error al obtener estadísticas" },
      { status: 500 }
    );
  }
}
