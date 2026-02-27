export type BurnoutField = {
    key: string;
    label: string;
    options: { value: number; label: string }[];
};

// ========== STATIC FIELDS (Profile tab, stored in DB via /api/profile) ==========

export const staticFields: BurnoutField[] = [
    {
        key: "Gender",
        label: "Género",
        options: [
            { value: 1, label: "Masculino" },
            { value: 2, label: "Femenino" },
        ],
    },
    {
        key: "Age code",
        label: "Edad",
        options: [
            { value: 1, label: "20-29 años" },
            { value: 2, label: "30-39 años" },
            { value: 3, label: "40-49 años" },
            { value: 4, label: "50-59 años" },
            { value: 5, label: "60-69 años" },
        ],
    },
    {
        key: "BMI",
        label: "IMC",
        options: [
            { value: 1, label: "Bajo peso" },
            { value: 2, label: "Normal" },
            { value: 3, label: "Sobrepeso" },
            { value: 4, label: "Obesidad" },
        ],
    },
    {
        key: "Designation",
        label: "Cargo",
        options: [
            { value: 1, label: "Professor" },
            { value: 2, label: "Associate Professor" },
            { value: 3, label: "Assistant Professor" },
            { value: 4, label: "Medical Officer" },
            { value: 5, label: "Consultant" },
            { value: 6, label: "Sr. Consultant" },
            { value: 7, label: "Jr. Consultant" },
            { value: 8, label: "Postgraduate Student" },
            { value: 9, label: "Register" },
            { value: 10, label: "Honorary Medical Officer" },
            { value: 11, label: "Assistant Register" },
            { value: 12, label: "Lecturer" },
        ],
    },
    {
        key: "Specialization",
        label: "Especialización",
        options: [
            { value: 1, label: "Medicine" },
            { value: 2, label: "Surgery" },
            { value: 3, label: "Oncology" },
            { value: 4, label: "Cardiology" },
            { value: 5, label: "Nephrology" },
            { value: 6, label: "Ophthalmology" },
            { value: 7, label: "Hematology" },
            { value: 8, label: "Neurology" },
            { value: 9, label: "Pediatrics" },
            { value: 10, label: "Orthopedics" },
            { value: 11, label: "Gynecology" },
            { value: 12, label: "Pathology" },
            { value: 13, label: "Dentistry" },
            { value: 14, label: "Dermatology" },
            { value: 15, label: "Hepatology" },
            { value: 16, label: "Urology" },
            { value: 17, label: "Radiology" },
            { value: 18, label: "Neonatology" },
            { value: 19, label: "Anesthesiology" },
            { value: 20, label: "Gastroenterology" },
            { value: 21, label: "Endocrinology" },
        ],
    },
    {
        key: "Working_Place",
        label: "Lugar de trabajo",
        options: [
            { value: 1, label: "Hospital público" },
            { value: 2, label: "Hospital privado" },
            { value: 3, label: "Clínica" },
        ],
    },
    {
        key: "Duration",
        label: "Duración en el trabajo",
        options: [
            { value: 1, label: "< 1 año" },
            { value: 2, label: "1-3 años" },
            { value: 3, label: "3-5 años" },
            { value: 4, label: "5-10 años" },
            { value: 5, label: "> 10 años" },
        ],
    },
    {
        key: "Private_Practice",
        label: "Práctica privada",
        options: [
            { value: 1, label: "Dentro de la ciudad" },
            { value: 2, label: "Fuera de la ciudad" },
            { value: 3, label: "Ninguna" },
            { value: 4, label: "Ambas" },
        ],
    },
    {
        key: "Working_Hour",
        label: "Horas de trabajo",
        options: [
            { value: 1, label: "Hasta 6h" },
            { value: 2, label: "Hasta 8h" },
            { value: 3, label: "Hasta 10h" },
            { value: 4, label: "Hasta 12h" },
            { value: 5, label: "Hasta 14h" },
            { value: 6, label: "Más de 14h" },
        ],
    },
    {
        key: "Weekly_Vacation",
        label: "Vacación semanal",
        options: [
            { value: 1, label: "Sí" },
            { value: 2, label: "No" },
        ],
    },
    {
        key: "Marital_Status",
        label: "Estado civil",
        options: [
            { value: 1, label: "Soltero/a" },
            { value: 2, label: "Casado/a" },
            { value: 3, label: "Divorciado/a" },
            { value: 4, label: "Viudo/a" },
        ],
    },
    {
        key: "Income",
        label: "Ingreso mensual",
        options: [
            { value: 1, label: "< 20 BDT" },
            { value: 2, label: "20 - 29 BDT" },
            { value: 3, label: "30 - 39 BDT" },
            { value: 4, label: "40 - 49 BDT" },
            { value: 5, label: "50 - 1 lakh BDT" },
            { value: 6, label: "> 1 lakh BDT" },
        ],
    },
    {
        key: "Family_members",
        label: "Miembros de familia",
        options: [
            { value: 1, label: "2 miembros" },
            { value: 2, label: "3 miembros" },
            { value: 3, label: "4 miembros" },
            { value: 4, label: "5 miembros" },
            { value: 5, label: "6 miembros" },
            { value: 6, label: "7 miembros" },
            { value: 7, label: "8 miembros" },
            { value: 8, label: "> 8 miembros" },
        ],
    },
    {
        key: "Liabilities ",
        label: "Deudas/Obligaciones",
        options: [
            { value: 1, label: "Sí" },
            { value: 2, label: "No" },
        ],
    },
    {
        key: "Staying_with_Family",
        label: "Vive con familia",
        options: [
            { value: 1, label: "Sí" },
            { value: 2, label: "No" },
        ],
    },
];

// ========== DYNAMIC FIELDS (Asked each time user clicks "Analizar") ==========

export const dynamicFields: BurnoutField[] = [
    {
        key: "Vacation_with_Family",
        label: "Vacaciones con familia",
        options: [
            { value: 1, label: "A veces" },
            { value: 2, label: "Rara vez" },
            { value: 3, label: "No muy seguido" },
        ],
    },
    {
        key: "Family_Functions",
        label: "Funciones familiares",
        options: [
            { value: 1, label: "A veces" },
            { value: 2, label: "Rara vez" },
            { value: 3, label: "No muy seguido" },
        ],
    },
    {
        key: "Disappointing_Thing",
        label: "Lo más decepcionante",
        options: [
            { value: 1, label: "Carga laboral" },
            { value: 2, label: "Turno largo" },
            { value: 3, label: "Bajo salario" },
            { value: 4, label: "Falta de seguridad" },
            { value: 5, label: "Falta de ascenso" },
            { value: 6, label: "Bajo salario vs carga laboral" },
            { value: 7, label: "Bajo salario y falta de seguridad" },
            { value: 8, label: "Turno largo y bajo salario" },
            { value: 9, label: "Carga profesional compleja" },
        ],
    },
    {
        key: "Feelings",
        label: "¿Cómo te sientes hoy?",
        options: [
            { value: 1, label: "Monótono" },
            { value: 2, label: "Bien" },
            { value: 3, label: "Angustiado" },
            { value: 4, label: "Irritado" },
            { value: 5, label: "Estado mental complejo" },
            { value: 6, label: "Angustiado e irritado" },
        ],
    },
    {
        key: "Conflict",
        label: "¿Conflictos recientes con...?",
        options: [
            { value: 1, label: "Compañeros de trabajo" },
            { value: 2, label: "Familiares" },
            { value: 3, label: "Ambos" },
            { value: 4, label: "Ninguno" },
        ],
    },
    {
        key: "Dissatisfaction",
        label: "¿Qué sientes actualmente?",
        options: [
            { value: 1, label: "Ansiedad" },
            { value: 2, label: "Fatiga" },
            { value: 3, label: "Insomnio" },
            { value: 4, label: "Agitación" },
            { value: 5, label: "Depresión" },
            { value: 6, label: "Ansiedad y depresión" },
            { value: 7, label: "Fatiga e insomnio" },
            { value: 8, label: "Ninguna" },
        ],
    },
    {
        key: "Mental_Disturbances",
        label: "¿Qué necesitas ahora?",
        options: [
            { value: 1, label: "Cambiar de trabajo" },
            { value: 2, label: "Tomar medicación" },
            { value: 3, label: "Necesita vacaciones" },
            { value: 4, label: "Dificultad gestión del tiempo" },
            { value: 5, label: "Necesita terapia conductual" },
            { value: 6, label: "Necesita entrenamiento social" },
            { value: 7, label: "Medicación y vacaciones" },
            { value: 8, label: "Gestión del tiempo y terapia" },
            { value: 9, label: "Vacaciones y gestión del tiempo" },
        ],
    },
    {
        key: "Politics",
        label: "¿La política organizacional te afecta?",
        options: [
            { value: 1, label: "Sí" },
            { value: 2, label: "No" },
        ],
    },
    {
        key: "Flexibility",
        label: "¿Tienes flexibilidad laboral?",
        options: [
            { value: 1, label: "Sí" },
            { value: 2, label: "No" },
        ],
    },
];

// All fields combined
export const burnoutFields: BurnoutField[] = [...staticFields, ...dynamicFields];

export type BurnoutProfile = Record<string, number>;

export function isStaticProfileComplete(profile: BurnoutProfile): boolean {
    return staticFields.every((f) => profile[f.key] !== 0 && profile[f.key] !== undefined);
}
