// src/app/dashboard/tasks/page.tsx
import { prisma } from "@/lib/prisma";
import TasksClient from "@/components/TasksClient";

export const revalidate = 0;

export default async function TasksPage() {
  const tasks = await prisma.task.findMany({
    include: {
      booking: {
        select: { id: true, clientName: true, startDate: true, hashtag: true },
      },
    },
    orderBy: [{ status: "asc" }, { priority: "desc" }, { createdAt: "asc" }],
  });

  return <TasksClient initialTasks={JSON.parse(JSON.stringify(tasks))} />;
}
