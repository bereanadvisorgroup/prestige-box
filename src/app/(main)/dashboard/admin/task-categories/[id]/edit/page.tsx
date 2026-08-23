import { notFound } from "next/navigation";

import { getTaskCategory } from "@/actions/task-categories";

import { TaskCategoryForm } from "../../_components/task-category-form";

interface EditTaskCategoryPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditTaskCategoryPage({ params }: EditTaskCategoryPageProps) {
  const { id } = await params;
  const result = await getTaskCategory(id);

  if (!result.success || !result.taskCategory) {
    notFound();
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 md:px-6">
      <TaskCategoryForm taskCategory={result.taskCategory} />
    </div>
  );
}
