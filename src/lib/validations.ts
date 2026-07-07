import { z } from "zod";

const IPV4_REGEX =
  /^(?:(?:25[0-5]|2[0-4]\d|1?\d?\d)\.){3}(?:25[0-5]|2[0-4]\d|1?\d?\d)$/;

const MAC_REGEX =
  /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/;

export const loginSchema = z.object({
  username: z.string().min(1, "Usuario requerido").trim(),
  password: z.string().min(1, "Contraseña requerida"),
  rememberMe: z.boolean().optional().default(false),
});

export const settingsSchema = z
  .object({
    name: z.string().min(1, "Nombre requerido").trim(),
    username: z.string().min(1, "Usuario requerido").trim(),
    currentPassword: z.string().min(1, "Contraseña actual requerida"),
    newPassword: z.string().min(6, "Mínimo 6 caracteres").optional().or(z.literal("")),
    confirmPassword: z.string().optional().or(z.literal("")),
  })
  .refine(
    (data) => {
      if (data.newPassword && data.newPassword !== data.confirmPassword) {
        return false;
      }
      return true;
    },
    { message: "Las contraseñas no coinciden", path: ["confirmPassword"] }
  );

export const departmentSchema = z.object({
  name: z.string().min(1, "Nombre requerido").trim().max(100),
});

export const personSchema = z.object({
  name: z.string().min(1, "Nombre requerido").trim().max(150),
  ip: z
    .string()
    .trim()
    .refine((val) => !val || IPV4_REGEX.test(val), "IP inválida"),
  mac: z
    .string()
    .trim()
    .refine(
      (val) => !val || MAC_REGEX.test(val),
      "MAC inválida (formato: AA:BB:CC:DD:EE:FF)"
    ),
  computerName: z.string().min(1, "Nombre de equipo requerido").trim().max(100),
  clave: z.string().trim().max(200).optional().or(z.literal("")),
  departmentId: z.string().min(1, "Departamento requerido"),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type SettingsInput = z.infer<typeof settingsSchema>;
export type DepartmentInput = z.infer<typeof departmentSchema>;
export type PersonInput = z.infer<typeof personSchema>;
