import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { personSchema } from "@/lib/validations";
import { getSession } from "@/lib/auth";
import { encryptClave } from "@/lib/clave-crypto";

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
    const parsed = personSchema.safeParse(body);

    if (!parsed.success) {
      const errors = parsed.error.flatten().fieldErrors;
      return NextResponse.json(
        { error: Object.values(errors).flat().join(", ") },
        { status: 400 }
      );
    }

    const person = await prisma.person.update({
      where: { id },
      data: {
        name: parsed.data.name,
        ip: parsed.data.ip || null,
        mac: parsed.data.mac || null,
        computerName: parsed.data.computerName,
        ...(parsed.data.clave
          ? { clave: encryptClave(parsed.data.clave) }
          : {}),
        departmentId: parsed.data.departmentId,
      },
      include: {
        department: { select: { id: true, name: true } },
      },
    });

    const { clave, ...rest } = person;
    return NextResponse.json({ person: { ...rest, hasClave: !!clave } });
  } catch (error) {
    console.error("PUT person error:", error);
    return NextResponse.json(
      { error: "Error al actualizar registro" },
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

    await prisma.person.update({
      where: { id },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE person error:", error);
    return NextResponse.json(
      { error: "Error al eliminar registro" },
      { status: 500 }
    );
  }
}
