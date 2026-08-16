// src/app/dashboard/expenses/page.tsx
import { prisma } from "@/lib/prisma";
import ExpensesClient from "@/components/ExpensesClient";

export const revalidate = 0;

export default async function ExpensesPage() {
  const [expenses, employees] = await Promise.all([
    prisma.expense.findMany({
      include: { employee: true },
      orderBy: { date: "desc" },
    }),
    prisma.employee.findMany({
      orderBy: [{ isActive: "desc" }, { name: "asc" }],
    }),
  ]);

  return (
    <ExpensesClient
      initialExpenses={JSON.parse(JSON.stringify(expenses))}
      initialEmployees={JSON.parse(JSON.stringify(employees))}
    />
  );
}
