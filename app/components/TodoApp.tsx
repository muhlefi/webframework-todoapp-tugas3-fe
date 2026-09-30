'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import TodoForm from './TodoForm';
import TodoList from './TodoList';
import { Button } from '@/app/components/ui/button';
import { authService } from '@/services/authService';
import { todoService } from '@/services/todoService';
import { ApiError } from '@/services/api';
import { Todo } from '@/types/todo';

export default function TodoApp() {
  const router = useRouter();
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);

  // Auth Guard & Pemuatan Data Awal saat halaman dibuka
  useEffect(() => {
    const token = authService.getToken();
    if (!token) {
      router.replace('/login');
      return;
    }

    const loadTodos = async () => {
      try {
        setLoading(true);
        const data = await todoService.getTodos();
        const formatted: Todo[] = data.map((item) => ({
          id: item.id,
          title: item.todo,
          completed: Boolean(item.completed),
          createdAt: new Date().toISOString().split('T')[0],
        }));
        setTodos(formatted);
      } catch (err) {
        if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
          authService.logout();
          router.replace('/login');
        }
      } finally {
        setLoading(false);
      }
    };

    loadTodos();
  }, [router]);

  // Handler Tambah Tugas Baru (Create -> POST /api/todos)
  const handleAddTodo = async (title: string) => {
    try {
      const created = await todoService.createTodo(title);
      const newTodo: Todo = {
        id: created.id,
        title: created.todo,
        completed: Boolean(created.completed),
        createdAt: new Date().toISOString().split('T')[0],
      };
      setTodos((prev) => [newTodo, ...prev]);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Terjadi kesalahan';
      alert(`Gagal menambah tugas: ${message}`);
    }
  };

  // Handler Checklist / Toggle Status Completed (Update -> PUT /api/todos/:id)
  const handleToggleTodo = async (id: number) => {
    const target = todos.find((t) => t.id === id);
    if (!target) return;

    const nextCompleted = !target.completed;

    setTodos((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: nextCompleted } : t))
    );

    try {
      await todoService.updateTodo(id, {
        task: target.title,
        is_completed: nextCompleted,
      });
    } catch (err) {
      setTodos((prev) =>
        prev.map((t) => (t.id === id ? { ...t, completed: target.completed } : t))
      );
      const message = err instanceof Error ? err.message : 'Terjadi kesalahan';
      alert(`Gagal memperbarui status: ${message}`);
    }
  };

  // Handler Hapus Tugas (Delete -> DELETE /api/todos/:id)
  const handleDeleteTodo = async (id: number) => {
    try {
      await todoService.deleteTodo(id);
      setTodos((prev) => prev.filter((t) => t.id !== id));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Terjadi kesalahan';
      alert(`Gagal menghapus tugas: ${message}`);
    }
  };

  const handleLogout = () => {
    authService.logout();
    router.replace('/login');
  };

  return (
    <div>
      {/* Form Input */}
      <TodoForm onAddTodo={handleAddTodo} />

      {/* List Tugas */}
      {loading ? (
        <div className="text-center p-8 text-gray-400 text-sm">
          Memuat data...
        </div>
      ) : (
        <TodoList
          todos={todos}
          onToggleTodo={handleToggleTodo}
          onDeleteTodo={handleDeleteTodo}
        />
      )}

      <div className="mt-6 pt-4 border-t border-gray-100 flex justify-end">
        <Button
          type="button"
          onClick={handleLogout}
          variant="destructive"
          size="xs"
          className="text-xs font-medium"
        >
          Logout ⨂
        </Button>
      </div>
    </div>
  );
}
