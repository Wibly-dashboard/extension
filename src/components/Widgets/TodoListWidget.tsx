import { useState } from "react";
import { MdAdd, MdMoreVert, MdCheck, MdTaskAlt } from "react-icons/md";

const initialTasks = [
  { id: 1, title: "프로젝트 UI 디자인", completed: true },
  { id: 2, title: "React 컴포넌트 구현", completed: true },
  { id: 3, title: "API 연동 작업", completed: false },
  { id: 4, title: "코드 리뷰 및 수정", completed: false },
  { id: 5, title: "README 문서 작성", completed: false },
];

export const TodoWidget = () => {
  const [tasks, setTasks] = useState(initialTasks);

  const completedCount = tasks.filter((task) => task.completed).length;

  const progress = tasks.length > 0 ? (completedCount / tasks.length) * 100 : 0;

  const toggleTask = (id: number) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === id ? { ...task, completed: !task.completed } : task,
      ),
    );
  };

  const addTask = () => {
    const title = window.prompt("새로운 할 일을 입력하세요.");
    if (!title?.trim()) return;

    setTasks((prev) => [
      ...prev,
      {
        id: Date.now(),
        title: title.trim(),
        completed: false,
      },
    ]);
  };

  return (
    <div className="flex h-[300px] w-[300px] flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white p-4 font-sans text-gray-800 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MdTaskAlt className="text-2xl text-[#4285F4]" />
          <h2 className="text-base font-semibold">My Tasks</h2>
        </div>

        <button className="rounded-full p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700">
          <MdMoreVert className="text-xl" />
        </button>
      </div>

      {/* Progress */}
      <div className="mt-4">
        <div className="mb-2 flex items-center justify-between text-xs">
          <span className="font-medium text-gray-500">오늘의 진행 상황</span>
          <span className="font-semibold text-[#4285F4]">
            {completedCount}/{tasks.length}
          </span>
        </div>

        <div className="h-1.5 overflow-hidden rounded-full bg-gray-100">
          <div
            className="h-full rounded-full bg-[#4285F4] transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Task List */}
      <div className="mt-3 flex-1 space-y-0.5 overflow-y-auto">
        {tasks.map((task) => (
          <button
            key={task.id}
            onClick={() => toggleTask(task.id)}
            className="group flex w-full items-center gap-2.5 rounded-lg px-1.5 py-2 text-left transition-colors hover:bg-gray-50"
          >
            <span
              className={`flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border transition-colors ${
                task.completed
                  ? "border-[#4285F4] bg-[#4285F4] text-white"
                  : "border-gray-300 text-transparent group-hover:border-[#4285F4]"
              }`}
            >
              {task.completed && <MdCheck className="text-sm" />}
            </span>

            <span
              className={`min-w-0 truncate text-[13px] ${
                task.completed ? "text-gray-400 line-through" : "text-gray-700"
              }`}
            >
              {task.title}
            </span>
          </button>
        ))}
      </div>

      {/* Add Task */}
      <button
        onClick={addTask}
        className="mt-2 flex h-9 shrink-0 items-center gap-2 rounded-lg px-2 text-sm font-medium text-[#4285F4] transition-colors hover:bg-blue-50"
      >
        <MdAdd className="text-xl" />할 일 추가
      </button>
    </div>
  );
};
