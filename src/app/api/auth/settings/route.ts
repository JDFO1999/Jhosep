import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { verifyPassword, hashPassword } from "@/lib/auth";
import { settingsSchema } from "@/lib/validations";

export async function PUT(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = settingsSchema.safeParse(body);

    if (!parsed.success) {
      const errors = parsed.error.flatten().fieldErrors;
      return NextResponse.json(
        { error: Object.values(errors).flat().join(", ") },
        { status: 400 }
      );
    }

    const { name, username, currentPassword, newPassword } = parsed.data;

    const admin = await prisma.admin.findUnique({
      where: { id: session.userId },
    });

    if (!admin) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const valid = await verifyPassword(currentPassword, admin.passwordHash);
    if (!valid) {
      return NextResponse.json(
        { error: "Contraseña actual incorrecta" },
        { status: 400 }
      );
    }

    if (username !== admin.username) {
      const exists = await prisma.admin.findUnique({
        where: { username },
      });
      if (exists) {
        return NextResponse.json(
          { error: "El nombre de usuario ya existe" },
          { status: 400 }
        );
      }
    }

    const updateData: Record<string, string> = { name, username };
    if (newPassword) {
      updateData.passwordHash = await hashPassword(newPassword);
    }

    const updated = await prisma.admin.update({
      where: { id: session.userId },
      data: updateData,
      select: { id: true, name: true, username: true },
    });

    return NextResponse.json({ admin: updated });
  } catch (error) {
    console.error("Settings error:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
