import { PrismaClient } from "../src/generated/prisma/client";

const prisma = new PrismaClient();

async function main() {
    // Seed doctors
    const doctors = [
        {
            name: "Dra. María García",
            email: "doctor@demo.com",
            specialty: "Psicóloga Clínica",
            workStartHour: 8,
            workEndHour: 20,
            slotDuration: 60,
        },
        {
            name: "Dr. Carlos Mendoza",
            email: "carlos.mendoza@demo.com",
            specialty: "Psiquiatra",
            workStartHour: 9,
            workEndHour: 18,
            slotDuration: 60,
        },
        {
            name: "Dra. Ana López",
            email: "ana.lopez@demo.com",
            specialty: "Psicóloga Organizacional",
            workStartHour: 8,
            workEndHour: 16,
            slotDuration: 60,
        },
    ];

    for (const doctor of doctors) {
        await prisma.doctor.upsert({
            where: { email: doctor.email },
            update: doctor,
            create: doctor,
        });
    }

    console.log("✅ Seed completed: 3 doctors created");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
