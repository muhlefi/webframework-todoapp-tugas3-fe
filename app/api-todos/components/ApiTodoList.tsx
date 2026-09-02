'use client';

import React, { useState } from 'react';
import { TaskItem } from '@/types/api-todo';
import { todoService } from '@/services/todoService';
import { Badge } from '@/app/components/ui/badge';
import TodoForm from '@/app/components/TodoForm';

interface ApiTodoListProps {
  initialTasks: TaskItem[];
}

export default function ApiTodoList({ initialTasks }: ApiTodoListProps) {
  const [tasks, setTasks] = useState<TaskItem[]>(initialTasks);

  const handleAddTodo = async (title: string) => {
    const newTask: TaskItem = {
      id: Date.now(),
      title,
      completed: false,
      userId: 1,
      source: 'dummyjson-api',
    };

    setTasks((prev) => [newTask, ...prev]);

    try {
      const response = await fetch('/api/todos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          todo: title,
          completed: false,
          userId: 1,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Gagal memanggil internal API route');
      }
    } catch (err) {
      console.warn('Gagal menambah tugas melalui internal API:', err);
    }
  };

  const handleToggleTask = async (id: number, currentCompleted: boolean) => {
    const targetStatus = !currentCompleted;

    // 1. Optimistic Update di State Lokal
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: targetStatus } : t))
    );

    // 2. Simulasi Update via Internal API
    try {
      const response = await fetch(`/api/todos/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: targetStatus }),
      });
      if (!response.ok) {
        throw new Error('Gagal memanggil internal API route');
      }
    } catch (err) {
      console.warn('Update ke internal API gagal (fallback state):', err);
    }
  };

  return (
    <div className="space-y-4">
      <TodoForm onAddTodo={handleAddTodo} />

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-dark-70">Daftar Tugas</h2>
        <span className="text-xs bg-gray-70 text-gray-600 px-2.5 py-1 rounded-full font-medium">
          {tasks.length} item
        </span>
      </div>

      <div className="space-y-3">
        {tasks.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
            <p className="text-muted text-sm">Tidak ada tugas.</p>
          </div>
        ) : (
          tasks.map((task) => (
            <div
              key={task.id}
              onClick={() => handleToggleTask(task.id, task.completed)}
              className={`group flex items-start sm:items-center justify-between p-4 rounded-xl border transition-all cursor-pointer select-none ${task.completed
                ? 'bg-success-10/20 border-success-20 hover:border-success-40'
                : 'bg-white border-gray-100 hover:border-primary-70/40'
                }`}
            >
              <div className="flex items-start sm:items-center gap-3.5 flex-1 pr-2">
                {/* Simple Checkbox */}
                <input
                  type="checkbox"
                  checked={task.completed}
                  readOnly
                  className="mt-0.5 sm:mt-0 h-5 w-5 shrink-0 cursor-pointer accent-primary-70"
                />

                {/* Title */}
                <div>
                  <p
                    className={`text-xs md:text-sm font-medium leading-relaxed transition-all ${task.completed
                      ? 'line-through text-gray-80'
                      : 'text-dark-70 group-hover:text-primary-100'
                      }`}
                  >
                    {task.title}
                  </p>
                  <p className="text-[10px] text-muted sm:hidden mt-1">
                    ID #{task.id} • User #{task.userId}
                  </p>
                </div>
              </div>

              {/* Badges on right (desktop) - Kontras, Tanpa Abu-abu */}
              <div className="hidden sm:flex items-center gap-2 shrink-0">
                <Badge variant="purple" size="default">
                  ID: #{task.id}
                </Badge>
                <Badge variant="blue" size="default">
                  User: {task.userId}
                </Badge>
                <Badge
                  variant={task.completed ? 'green' : 'yellow'}
                  size="default"
                >
                  {task.completed ? 'Selesai' : 'Pending'}
                </Badge>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
