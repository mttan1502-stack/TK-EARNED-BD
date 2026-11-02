import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { useTheme } from '../../context/ThemeContext.js';
import { Task, TaskCategory } from '../../types/index.js';
import { AdTimerModal } from './AdTimerModal.js';
import { TaskExecutionModal } from './TaskExecutionModal.js';
import {
  Clock,
  Sparkles,
  CheckCircle2,
  Search,
  Filter,
  ShieldCheck,
  Globe,
  Smartphone,
  HelpCircle,
  Play,
  Users2,
} from 'lucide-react';

export const TasksView: React.FC = () => {
  const { token, user, setAuthModal } = useAuth();
  const { formatMoney } = useTheme();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<TaskCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // 10-Second Ad Gate & Execution states
  const [selectedTaskForAd, setSelectedTaskForAd] = useState<Task | null>(null);
  const [unlockedTaskState, setUnlockedTaskState] = useState<{ task: Task; unlockToken: string } | null>(null);

  const fetchTasks = async () => {
    try {
      const res = await fetch('/api/user/tasks', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        setTasks(data.tasks || []);
      }
    } catch (err) {
      console.error('Failed to fetch tasks:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [token]);

  const handleStartTaskClick = (task: Task) => {
    if (!user) {
      setAuthModal('login');
      return;
    }
    setSelectedTaskForAd(task);
  };

  const handleAdVerified = (taskUnlockToken: string) => {
    if (selectedTaskForAd) {
      setUnlockedTaskState({
        task: selectedTaskForAd,
        unlockToken: taskUnlockToken,
      });
      setSelectedTaskForAd(null);
    }
  };

  const handleTaskCompleted = (rewardBdt: number) => {
    if (unlockedTaskState) {
      setTasks((prev) =>
        prev.map((t) => (t.id === unlockedTaskState.task.id ? { ...t, isCompletedByUser: true } as any : t))
      );
      setUnlockedTaskState(null);
    }
  };

  // Filter tasks based on category and search query
  const filteredTasks = tasks.filter((task) => {
    const matchesCategory = selectedCategory === 'all' || task.category === selectedCategory;
    const matchesSearch =
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const categories: { id: TaskCategory; label: string; icon: React.ReactNode }[] = [
    { id: 'all', label: 'All Tasks', icon: <Filter className="w-3.5 h-3.5" /> },
    { id: 'social_task', label: 'Social', icon: <Users2 className="w-3.5 h-3.5" /> },
    { id: 'web_visit', label: 'Web Visit', icon: <Globe className="w-3.5 h-3.5" /> },
    { id: 'survey', label: 'Surveys', icon: <HelpCircle className="w-3.5 h-3.5" /> },
    { id: 'app_review', label: 'App Reviews', icon: <Smartphone className="w-3.5 h-3.5" /> },
    { id: 'video', label: 'Video Tasks', icon: <Play className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Page Title & Rules */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white flex items-center gap-2">
            Available Earning Tasks
            <Sparkles className="w-5 h-5 text-amber-400" />
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Browse verified tasks, complete the 10-second sponsor ad security verification, and claim instant cash rewards.
          </p>
        </div>

        {/* 10-Second Ad Badge Notice */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-950/60 border border-purple-500/30 rounded-xl text-xs text-purple-300 self-start sm:self-auto">
          <ShieldCheck className="w-4 h-4 text-purple-400" />
          <span className="font-semibold">10-Second Sponsor Protection Active</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between bg-slate-900/80 p-3 rounded-2xl border border-slate-800">
        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 transition-all flex items-center gap-1.5 ${
                selectedCategory === cat.id
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-950'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {cat.icon}
              {cat.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative min-w-[220px]">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tasks..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-800 focus:border-purple-500 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none transition-colors"
          />
        </div>
      </div>

      {/* Tasks Grid */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-400">Loading verified earning tasks...</p>
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="py-16 text-center rounded-2xl border border-dashed border-slate-800 bg-slate-900/40 p-8 space-y-2">
          <p className="text-sm font-semibold text-slate-300">No tasks found matching your filters</p>
          <p className="text-xs text-slate-500">Try changing the category or clearing the search query.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTasks.map((task: any) => {
            const isCompleted = task.isCompletedByUser;
            return (
              <div
                key={task.id}
                className={`p-5 rounded-2xl bg-slate-900 border transition-all flex flex-col justify-between space-y-4 group ${
                  isCompleted
                    ? 'border-slate-800/80 opacity-75'
                    : 'border-slate-800 hover:border-purple-500/50 hover:shadow-xl hover:shadow-purple-950/20'
                }`}
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-purple-400">
                      {task.category.replace('_', ' ')}
                    </span>
                    <div className="flex items-center gap-1.5 text-slate-400 font-mono text-[11px]">
                      <Clock className="w-3.5 h-3.5" />
                      {task.durationSeconds}s
                    </div>
                  </div>

                  <h3 className="text-base font-bold text-white group-hover:text-purple-300 transition-colors">
                    {task.title}
                  </h3>

                  <p className="text-xs text-slate-400 leading-relaxed line-clamp-3">
                    {task.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                  <div>
                    <div className="text-[10px] text-slate-500 uppercase font-semibold">Reward</div>
                    <div className="text-lg font-extrabold font-mono tabular-nums text-emerald-400">
                      {formatMoney(task.rewardBdt)}
                    </div>
                  </div>

                  {isCompleted ? (
                    <div className="px-3 py-1.5 rounded-xl bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      Completed
                    </div>
                  ) : (
                    <button
                      onClick={() => handleStartTaskClick(task)}
                      className="py-2.5 px-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl shadow-md shadow-purple-900/40 transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                      Start (10s Ad)
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 10-Second Ad Timer Modal */}
      {selectedTaskForAd && (
        <AdTimerModal
          task={selectedTaskForAd}
          onClose={() => setSelectedTaskForAd(null)}
          onAdVerified={handleAdVerified}
        />
      )}

      {/* Task Execution Modal */}
      {unlockedTaskState && (
        <TaskExecutionModal
          task={unlockedTaskState.task}
          taskUnlockToken={unlockedTaskState.unlockToken}
          onClose={() => setUnlockedTaskState(null)}
          onTaskCompleted={handleTaskCompleted}
        />
      )}
    </div>
  );
};
