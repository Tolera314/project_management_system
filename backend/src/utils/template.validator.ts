import { Task, Milestone, List } from '@prisma/client';

export interface TemplateValidationResult {
    isValid: boolean;
    errors: string[];
    warnings: string[];
}

export const validateTemplateStructure = (project: any): TemplateValidationResult => {
    const errors: string[] = [];
    const warnings: string[] = [];

    // 1. Basic Structure Validation
    if (!project.lists || project.lists.length === 0) {
        errors.push('Template must have at least one list.');
    }

    const tasks = project.lists?.flatMap((l: any) => l.tasks || []) || [];
    if (tasks.length === 0) {
        errors.push('Template must have at least one task.');
    }

    // 2. Circular Dependency Check (Simple DFS)
    const hasCircularDependency = (tasks: any[]) => {
        const adj = new Map<string, string[]>();
        tasks.forEach(task => {
            if (task.dependents) {
                adj.set(task.id, task.dependents.map((d: any) => d.targetId));
            }
        });

        const visited = new Set<string>();
        const recStack = new Set<string>();

        const isCyclic = (u: string): boolean => {
            if (recStack.has(u)) return true;
            if (visited.has(u)) return false;

            visited.add(u);
            recStack.add(u);

            const neighbors = adj.get(u) || [];
            for (const v of neighbors) {
                if (isCyclic(v)) return true;
            }

            recStack.delete(u);
            return false;
        };

        for (const task of tasks) {
            if (isCyclic(task.id)) return true;
        }
        return false;
    };

    // Note: This requires full graph data which might not be in the flat fetch. 
    // We expect dependencies to be populated if we want to check for cycles.

    // 3. Realistic Checks
    const tasksWithoutPriority = tasks.filter((t: any) => !t.priority);
    if (tasksWithoutPriority.length > 0) {
        warnings.push(`${tasksWithoutPriority.length} tasks are missing priority levels.`);
    }

    const emptyLists = project.lists?.filter((l: any) => !l.tasks || l.tasks.length === 0) || [];
    if (emptyLists.length > 0) {
        warnings.push(`${emptyLists.length} lists are currently empty.`);
    }

    return {
        isValid: errors.length === 0,
        errors,
        warnings
    };
};
