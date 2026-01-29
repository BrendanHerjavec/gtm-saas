import { getRecipients } from "@/actions/recipients";
import { CreateTaskForm } from "@/components/features/tasks/create-task-form";

export const metadata = {
  title: "Create Task | GTM SaaS",
  description: "Create a new task",
};

export default async function NewTaskPage() {
  const { recipients } = await getRecipients({ limit: 100 });

  return (
    <div className="container max-w-4xl py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Create Task</h1>
        <p className="text-muted-foreground mt-2">
          Create a new task to add to your task deck.
        </p>
      </div>

      <CreateTaskForm recipients={recipients} />
    </div>
  );
}
