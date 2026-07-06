import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { departmentSchema } from "@/lib/validations";
import { getSession } from "@/lib/auth";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const parsed = departmentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Nombre requerido" },
        { status: 400 }
      );
    }

    const existing = await prisma.department.findFirst({
      where: { name: parsed.data.name, NOT: { id } },
    });

    if (existing) {
      return NextResponse.json(
        { error: "El departamento ya existe" },
        { status: 409 }
      );
    }

    const department = await prisma.department.update({
      where: { id },
      data: { name: parsed.data.name },
    });

    return NextResponse.json({ department });
  } catch (error) {
    console.error("PUT department error:", error);
    return NextResponse.json(
      { error: "Error al actualizar departamento" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await params;

    const peopleCount = await prisma.person.count({
      where: { departmentId: id },
    });

    if (peopleCount > 0) {
      return NextResponse.json(
        { error: "No se puede eliminar: hay personas asociadas a este departamento" },
        { status: 400 }
      );
    }

    await prisma.department.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE department error:", error);
    return NextResponse.json(
      { error: "Error al eliminar departamento" },
      { status: 500 }
    );
  }
}
