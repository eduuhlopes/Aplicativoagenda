export const SERVICES: { name: string; value: number; duration: number }[] = [
    { name: 'Banho de Gel', value: 80, duration: 120 },
    { name: 'Esmaltação em gel', value: 50, duration: 60 },
    { name: 'Fibra de Vidro', value: 150, duration: 180 },
    { name: 'Manicure', value: 25, duration: 60 },
    { name: 'Manutenção', value: 100, duration: 120 },
    { name: 'Pedicure', value: 35, duration: 60 },
    { name: 'Pé+Mão', value: 55, duration: 90 },
    { name: 'Sobrancelha', value: 30, duration: 30 },
    { name: 'Spa dos Pés', value: 45, duration: 60 }
];

export const MONTHS: string[] = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

export const DAYS: string[] = Array.from({ length: 31 }, (_, i) => String(i + 1));

export const YEARS: string[] = [String(new Date().getFullYear()), String(new Date().getFullYear() + 1)];

// Horários das 07:00 às 20:00, com intervalos de 30 minutos
export const TIMES: string[] = Array.from({ length: (20 - 7) * 2 + 1 }, (_, i) => {
    const totalMinutes = (i * 30) + (7 * 60); // Start at 7:00 (420 minutes)
    const hour = Math.floor(totalMinutes / 60);
    const minute = totalMinutes % 60;
    return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
});
