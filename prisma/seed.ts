import { PrismaClient } from "@prisma/client";
import crypto from "crypto";

const prisma = new PrismaClient();

function hashPassword(password: string): string {
    const salt = crypto.randomBytes(16).toString("hex");
    const iterations = 1000;
    const hash = crypto
        .pbkdf2Sync(password, salt, iterations, 32, "sha256")
        .toString("base64url");
    return `pbkdf2$${iterations}$${salt}$${hash}`;
}

async function main() {
    const passwordHash = hashPassword("doctor123");

    // Seed doctors as Users
    const doctors = [
        {
            name: "Dra. María García",
            email: "doctor@demo.com",
            role: "doctor",
            specialty: "Psicóloga Clínica",
            passwordHash,
            scheduling: {
                workStartHour: 8,
                workEndHour: 20,
                slotDuration: 60,
            },
        },
        {
            name: "Dr. Carlos Mendoza",
            email: "carlos.mendoza@demo.com",
            role: "doctor",
            specialty: "Psiquiatra",
            passwordHash,
            scheduling: {
                workStartHour: 9,
                workEndHour: 18,
                slotDuration: 60,
            },
        },
        {
            name: "Dra. Ana López",
            email: "ana.lopez@demo.com",
            role: "doctor",
            specialty: "Psicóloga Organizacional",
            passwordHash,
            scheduling: {
                workStartHour: 8,
                workEndHour: 16,
                slotDuration: 60,
            },
        },
    ];

    for (const doc of doctors) {
        const { scheduling, ...userData } = doc;

        await prisma.user.upsert({
            where: { email: userData.email },
            update: {
                name: userData.name,
                role: userData.role,
                specialty: userData.specialty,
                passwordHash: userData.passwordHash,
                person: {
                    upsert: {
                        create: scheduling,
                        update: scheduling,
                    }
                }
            },
            create: {
                ...userData,
                person: {
                    create: scheduling
                }
            },
        });
    }

    // Seed demo user account
    const userPasswordHash = hashPassword("user123");
    await prisma.user.upsert({
        where: { email: "usuario@demo.com" },
        update: {
            name: "Juan Pérez",
            role: "user",
            passwordHash: userPasswordHash,
            person: {
                upsert: {
                    create: {},
                    update: {},
                },
            },
        },
        create: {
            name: "Juan Pérez",
            email: "usuario@demo.com",
            role: "user",
            passwordHash: userPasswordHash,
            person: {
                create: {},
            },
        },
    });

    // Seed demo admin account
    const adminPasswordHash = hashPassword("admin123");
    await prisma.user.upsert({
        where: { email: "admin@demo.com" },
        update: {
            name: "Admin Demo",
            role: "admin",
            passwordHash: adminPasswordHash,
        },
        create: {
            name: "Admin Demo",
            email: "admin@demo.com",
            role: "admin",
            passwordHash: adminPasswordHash,
        },
    });

    console.log("✅ Seed completed: 3 doctors, 1 user, and 1 admin created");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
