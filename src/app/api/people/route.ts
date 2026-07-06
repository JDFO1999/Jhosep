import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { personSchema } from "@/lib/validations";
import { getSession } from "@/lib/auth";
import type { Prisma } from "@prisma/client";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const departmentId = searchParams.get("department");
    const status = searchParams.get("status");
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") || "desc";

    const where: Prisma.PersonWhereInput = {};

    if (status === "deleted") {
      where.isDeleted = true;
    } else if (status === "active") {
      where.isDeleted = false;
    } else {
      where.isDeleted = false;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { ip: { contains: search, mode: "insensitive" } },
        { mac: { contains: search, mode: "insensitive" } },
        { computerName: { contains: search, mode: "insensitive" } },
        { department: { name: { contains: search, mode: "insensitive" } } },
      ];
    }

    if (departmentId) {
      where.departmentId = departmentId;
    }

    if (dateFrom) {
      where.createdAt = { ...(where.createdAt as object || {}), gte: new Date(dateFrom) };
    }

    if (dateTo) {
      const toDate = new Date(dateTo);
      toDate.setHours(23, 59, 59, 999);
      where.createdAt = { ...(where.createdAt as object || {}), lte: toDate };
    }

    const [people, total] = await Promise.all([
      prisma.person.findMany({
        where,
        include: {
          department: { select: { id: true, name: true } },
        },
        orderBy: { [sortBy]: sortOrder as Prisma.SortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.person.count({ where }),
    ]);

    return NextResponse.json({
      people,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("GET people error:", error);
    return NextResponse.json(
      { error: "Error al obtener registros" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = personSchema.safeParse(body);

    if (!parsed.success) {
      const errors = parsed.error.flatten().fieldErrors;
      return NextResponse.json(
        { error: Object.values(errors).flat().join(", ") },
        { status: 400 }
      );
    }

    const person = await prisma.person.create({
      data: {
        name: parsed.data.name,
        ip: parsed.data.ip || null,
        mac: parsed.data.mac || null,
        computerName: parsed.data.computerName,
        departmentId: parsed.data.departmentId,
      },
      include: {
        department: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({ person }, { status: 201 });
  } catch (error) {
    console.error("POST person error:", error);
    return NextResponse.json(
      { error: "Error al crear registro" },
      { status: 500 }
    );
  }
}
