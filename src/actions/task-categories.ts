"use server";

import { revalidatePath } from "next/cache";

import { supabaseServer, verifyAdmin } from "@/lib/supabase.server";
import { type TaskCategory, TaskCategorySchema, type TaskCategoryWithCount } from "@/types/crm";

const TABLE = "task_categories";
const TASKS_TABLE = "tasks";

/**
 * Fetch all task categories sorted alphabetically by name.
 */
export async function getTaskCategories() {
  try {
    const { data: list, error } = await supabaseServer.from(TABLE).select("*").order("name", { ascending: true });

    if (error) throw new Error(error.message);

    return { success: true, taskCategories: (list || []) as TaskCategory[] };
  } catch (error) {
    console.error("[getTaskCategories] Error:", error);
    return { success: false, error: (error as Error).message, taskCategories: [] };
  }
}

/**
 * Fetch all task categories enriched with task usage counts.
 */
export async function getTaskCategoriesWithCounts() {
  try {
    const [categoriesResult, tasksResult] = await Promise.all([
      supabaseServer.from(TABLE).select("*").order("name", { ascending: true }),
      supabaseServer.from(TASKS_TABLE).select("category"),
    ]);

    if (categoriesResult.error) throw new Error(categoriesResult.error.message);
    if (tasksResult.error) throw new Error(tasksResult.error.message);

    const categories = (categoriesResult.data || []) as TaskCategory[];
    const tasks = tasksResult.data || [];

    // Aggregate counts by category name
    const countMap = new Map<string, number>();
    for (const t of tasks) {
      if (t.category) {
        countMap.set(t.category, (countMap.get(t.category) || 0) + 1);
      }
    }

    const taskCategories: TaskCategoryWithCount[] = categories.map((cat) => {
      const taskCount = countMap.get(cat.name) || 0;
      return {
        ...cat,
        taskCount,
        isLinked: taskCount > 0,
      };
    });

    return { success: true, taskCategories };
  } catch (error) {
    console.error("[getTaskCategoriesWithCounts] Error:", error);
    return { success: false, error: (error as Error).message, taskCategories: [] };
  }
}

/**
 * Fetch a single task category by ID, including its usage count.
 */
export async function getTaskCategory(id: string) {
  try {
    const { data: record, error } = await supabaseServer.from(TABLE).select("*").eq("id", id).single();

    if (error) throw new Error(error.message);
    if (!record) throw new Error("Task category not found");

    // Fetch count of tasks using this category
    const { count, error: countError } = await supabaseServer
      .from(TASKS_TABLE)
      .select("*", { count: "exact", head: true })
      .eq("category", record.name);

    if (countError) throw new Error(countError.message);

    return {
      success: true,
      taskCategory: record as TaskCategory,
      taskCount: count ?? 0,
    };
  } catch (error) {
    console.error("[getTaskCategory] Error:", error);
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Create a new task category. Only allowed for admins.
 */
export async function createTaskCategory(data: Partial<TaskCategory>) {
  try {
    await verifyAdmin();

    const validated = TaskCategorySchema.parse({
      ...data,
      name: data.name?.trim(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const { data: inserted, error } = await supabaseServer
      .from(TABLE)
      .insert({ name: validated.name })
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        throw new Error(`A task category named "${validated.name}" already exists.`);
      }
      throw new Error(error.message);
    }

    revalidatePath("/dashboard/admin/task-categories");
    revalidatePath("/dashboard/crm/tasks");

    return { success: true, id: inserted.id };
  } catch (error) {
    console.error("[createTaskCategory] Error:", error);
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Update an existing task category. If the category name changes,
 * automatically cascades the change to all tasks currently in that category.
 * Only allowed for admins.
 */
export async function updateTaskCategory(id: string, data: Partial<TaskCategory>) {
  try {
    await verifyAdmin();

    const validated = TaskCategorySchema.parse({
      ...data,
      name: data.name?.trim(),
      updatedAt: new Date().toISOString(),
    });

    // 1. Get the current category name before updating
    const { data: current, error: fetchError } = await supabaseServer.from(TABLE).select("name").eq("id", id).single();

    if (fetchError || !current) throw new Error("Task category not found.");

    const oldName = current.name;
    const newName = validated.name;

    // 2. If name changed, rename in tasks table first
    if (oldName !== newName) {
      const { error: cascadeError } = await supabaseServer
        .from(TASKS_TABLE)
        .update({ category: newName, updatedAt: new Date().toISOString() })
        .eq("category", oldName);

      if (cascadeError) {
        throw new Error(`Failed to update associated tasks: ${cascadeError.message}`);
      }
    }

    // 3. Update the task category record
    const { error: updateError } = await supabaseServer
      .from(TABLE)
      .update({
        name: newName,
        updatedAt: validated.updatedAt,
      })
      .eq("id", id);

    if (updateError) {
      if (updateError.code === "23505") {
        throw new Error(`A task category named "${newName}" already exists.`);
      }
      throw new Error(updateError.message);
    }

    revalidatePath("/dashboard/admin/task-categories");
    revalidatePath(`/dashboard/admin/task-categories/${id}`);
    revalidatePath("/dashboard/crm/tasks");

    return { success: true };
  } catch (error) {
    console.error("[updateTaskCategory] Error:", error);
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Delete a task category.
 * If tasks exist with this category, a replacement category name MUST be provided.
 * All existing tasks in this category will be reassigned before deleting.
 * Only allowed for admins.
 */
export async function deleteTaskCategory(id: string, reassignToCategoryName?: string) {
  try {
    await verifyAdmin();

    // 1. Fetch current category record
    const { data: current, error: fetchError } = await supabaseServer.from(TABLE).select("name").eq("id", id).single();

    if (fetchError || !current) throw new Error("Task category not found.");

    // 2. Check how many tasks are assigned to this category
    const { count, error: countError } = await supabaseServer
      .from(TASKS_TABLE)
      .select("*", { count: "exact", head: true })
      .eq("category", current.name);

    if (countError) throw new Error(countError.message);

    const taskCount = count ?? 0;

    // 3. If tasks exist, require and perform reassignment
    if (taskCount > 0) {
      if (!reassignToCategoryName?.trim()) {
        throw new Error(
          `Cannot delete category "${current.name}" because it is used by ${taskCount} task(s). Please choose a replacement category to reassign them to.`,
        );
      }

      const targetCategory = reassignToCategoryName.trim();
      if (targetCategory === current.name) {
        throw new Error("Replacement category must be different from the category being deleted.");
      }

      // Reassign all associated tasks to target category
      const { error: reassignError } = await supabaseServer
        .from(TASKS_TABLE)
        .update({ category: targetCategory, updatedAt: new Date().toISOString() })
        .eq("category", current.name);

      if (reassignError) throw new Error(`Failed to reassign tasks: ${reassignError.message}`);
    }

    // 4. Delete the category record
    const { error: deleteError } = await supabaseServer.from(TABLE).delete().eq("id", id);

    if (deleteError) throw new Error(deleteError.message);

    revalidatePath("/dashboard/admin/task-categories");
    revalidatePath("/dashboard/crm/tasks");

    return { success: true, reassignedCount: taskCount };
  } catch (error) {
    console.error("[deleteTaskCategory] Error:", error);
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Bulk reassign all tasks from a source category to a target category.
 * Only allowed for admins.
 */
export async function bulkReassignTaskCategory(sourceCategoryName: string, targetCategoryName: string) {
  try {
    await verifyAdmin();

    const source = sourceCategoryName.trim();
    const target = targetCategoryName.trim();

    if (!source || !target) {
      throw new Error("Source and target categories are required.");
    }

    if (source === target) {
      throw new Error("Source and target categories must be different.");
    }

    const { error } = await supabaseServer
      .from(TASKS_TABLE)
      .update({ category: target, updatedAt: new Date().toISOString() })
      .eq("category", source);

    if (error) throw new Error(error.message);

    revalidatePath("/dashboard/admin/task-categories");
    revalidatePath("/dashboard/crm/tasks");

    return { success: true };
  } catch (error) {
    console.error("[bulkReassignTaskCategory] Error:", error);
    return { success: false, error: (error as Error).message };
  }
}
