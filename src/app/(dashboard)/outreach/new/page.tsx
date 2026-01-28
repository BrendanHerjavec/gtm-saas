import { getRecipients } from "@/actions/recipients";
import { CreateTaskForm } from "@/components/features/outreach/create-task-form";

export const metadata = {
  title: "Create Task | GTM SaaS",
  description: "Create a new outreach task",
};

export default async function NewTaskPage() {
  const { recipients } = await getRecipients({ limit: 100 });

  return (
    <div className="container max-w-4xl py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Create Outreach Task</h1>
        <p className="text-muted-foreground mt-2">
          Create a new task to add to your outreach deck.
        </p>
      </div>

      <CreateTaskForm recipients={recipients} />
    </div>
  );
}
