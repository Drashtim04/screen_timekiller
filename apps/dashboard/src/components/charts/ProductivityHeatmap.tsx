import { useState, useMemo } from 'react';
import { HeatmapDay } from '../../types/analytics';
import { Calendar, Layers, Clock, CheckCircle2, ChevronRight, HelpCircle } from 'lucide-react';

interface ProductivityHeatmapProps {
  data: HeatmapDay[];
}

type MetricType = 'sessions' | 'minutes' | 'completion';
type ViewType = 'daily' | 'weekly' | 'monthly';

export default function ProductivityHeatmap({ data }: ProductivityHeatmapProps) {
  const [metric, setMetric] = useState<MetricType>('sessions');
  const [view, setView] = useState<ViewType>('daily');
  const [hoveredCell, setHoveredCell] = useState<{
    label: string;
    sessions: number;
    minutes: number;
    completed: number;
    completionRate: number;
    x: number;
    y: number;
  } | null>(null);

  // 1. Group / aggregate data based on selected view
  const processedData = useMemo(() => {
    if (!data || data.length === 0) return [];

    if (view === 'daily') {
      // Return daily list with individual calculated completion rate
      return data.map((day) => {
        const rate = day.sessions > 0 ? (day.completed / day.sessions) * 100 : 0;
        
        // Map intensity level (0 to 4)
        let level: 0 | 1 | 2 | 3 | 4 = 0;
        if (metric === 'sessions') {
          if (day.sessions > 3) level = 4;
          else if (day.sessions === 3) level = 3;
          else if (day.sessions === 2) level = 2;
          else if (day.sessions === 1) level = 1;
        } else if (metric === 'minutes') {
          if (day.minutes > 75) level = 4;
          else if (day.minutes > 50) level = 3;
          else if (day.minutes > 25) level = 2;
          else if (day.minutes > 0) level = 1;
        } else {
          // Completion
          if (day.sessions === 0) level = 0;
          else if (rate >= 100) level = 4;
          else if (rate >= 75) level = 3;
          else if (rate >= 50) level = 2;
          else level = 1;
        }

        return {
          ...day,
          completionRate: rate,
          level
        };
      });
    }

    if (view === 'weekly') {
      // Chunk into weeks (7 days each)
      const weeks: { date: string; sessions: number; minutes: number; completed: number; completionRate: number; level: 0 | 1 | 2 | 3 | 4 }[] = [];
      const numWeeks = Math.ceil(data.length / 7);

      for (let i = 0; i < numWeeks; i++) {
        const chunk = data.slice(i * 7, (i + 1) * 7);
        const wSessions = chunk.reduce((acc, d) => acc + d.sessions, 0);
        const wMinutes = chunk.reduce((acc, d) => acc + d.minutes, 0);
        const wCompleted = chunk.reduce((acc, d) => acc + d.completed, 0);
        const rate = wSessions > 0 ? (wCompleted / wSessions) * 100 : 0;
        const startDate = chunk[0]?.date || '';
        const endDate = chunk[chunk.length - 1]?.date || '';

        let level: 0 | 1 | 2 | 3 | 4 = 0;
        if (metric === 'sessions') {
          if (wSessions > 15) level = 4;
          else if (wSessions > 10) level = 3;
          else if (wSessions > 5) level = 2;
          else if (wSessions > 0) level = 1;
        } else if (metric === 'minutes') {
          if (wMinutes > 360) level = 4;
          else if (wMinutes > 240) level = 3;
          else if (wMinutes > 120) level = 2;
          else if (wMinutes > 0) level = 1;
        } else {
          if (wSessions === 0) level = 0;
          else if (rate >= 100) level = 4;
          else if (rate >= 75) level = 3;
          else if (rate >= 50) level = 2;
          else level = 1;
        }

        weeks.push({
          date: `Week ${i + 1} (${startDate} to ${endDate})`,
          sessions: wSessions,
          minutes: wMinutes,
          completed: wCompleted,
          completionRate: rate,
          level
        });
      }
      return weeks;
    }

    // monthly view
    // Group by calendar month
    const monthlyMap: Record<string, { date: string; sessions: number; minutes: number; completed: number }> = {};
    data.forEach((day) => {
      const dateObj = new Date(day.date);
      const key = `${dateObj.getFullYear()}-${(dateObj.getMonth() + 1).toString().padStart(2, '0')}`;
      const monthName = dateObj.toLocaleString('default', { month: 'long', year: 'numeric' });
      
      if (!monthlyMap[key]) {
        monthlyMap[key] = { date: monthName, sessions: 0, minutes: 0, completed: 0 };
      }
      monthlyMap[key].sessions += day.sessions;
      monthlyMap[key].minutes += day.minutes;
      monthlyMap[key].completed += day.completed;
    });

    return Object.entries(monthlyMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([_, val]) => {
        const rate = val.sessions > 0 ? (val.completed / val.sessions) * 100 : 0;
        
        let level: 0 | 1 | 2 | 3 | 4 = 0;
        if (metric === 'sessions') {
          if (val.sessions > 45) level = 4;
          else if (val.sessions > 30) level = 3;
          else if (val.sessions > 15) level = 2;
          else if (val.sessions > 0) level = 1;
        } else if (metric === 'minutes') {
          if (val.minutes > 900) level = 4;
          else if (val.minutes > 600) level = 3;
          else if (val.minutes > 300) level = 2;
          else if (val.minutes > 0) level = 1;
        } else {
          if (val.sessions === 0) level = 0;
          else if (rate >= 100) level = 4;
          else if (rate >= 75) level = 3;
          else if (rate >= 50) level = 2;
          else level = 1;
        }

        return {
          ...val,
          completionRate: rate,
          level
        };
      });
  }, [data, metric, view]);

  // Daily layout columns configuration (Sunday alignment)
  const dailyGridCells = useMemo(() => {
    if (view !== 'daily' || processedData.length === 0) return [];
    
    // Pad start of array to align with day-of-week
    const firstDate = new Date(processedData[0].date);
    const startDayOfWeek = firstDate.getDay(); // 0 = Sunday, 6 = Saturday
    const padded = Array.from({ length: startDayOfWeek }).map(() => null);
    
    return [...padded, ...processedData];
  }, [processedData, view]);

  // Color mapping utilities
  const bgClasses = {
    0: 'bg-[#121217] border-white/[0.03] text-slate-600',
    1: 'bg-violet-950/40 border-violet-900/30 text-violet-400',
    2: 'bg-violet-850/50 border-violet-750/30 text-violet-300',
    3: 'bg-violet-600/60 border-violet-500/40 text-violet-200',
    4: 'bg-violet-500 border-violet-400 text-white'
  };

  const handleCellHover = (e: React.MouseEvent, cell: any) => {
    if (!cell) {
      setHoveredCell(null);
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    const parentRect = e.currentTarget.parentElement?.getBoundingClientRect() || { left: 0, top: 0 };
    
    setHoveredCell({
      label: cell.date,
      sessions: cell.sessions,
      minutes: cell.minutes,
      completed: cell.completed,
      completionRate: Math.round(cell.completionRate),
      x: rect.left - parentRect.left + rect.width / 2,
      y: rect.top - parentRect.top - 8
    });
  };

  return (
    <div className="bg-gradient-to-br from-white/[0.03] to-white/[0.01] border border-white/[0.08] rounded-3xl p-6 shadow-xl flex flex-col space-y-6 relative">
      
      {/* Heatmap Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-semibold text-white tracking-tight flex items-center gap-2">
            Productivity Heatmap
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-400 border border-violet-500/20">
              Interactive
            </span>
          </h3>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Visualize flow consistency, sessions completed, and minutes logged
          </p>
        </div>

        {/* View and Metric Selectors */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Metric Selector */}
          <div className="flex bg-[#121217] rounded-xl p-1 border border-white/[0.05] text-[11px] font-semibold text-slate-400">
            {(['sessions', 'minutes', 'completion'] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMetric(m)}
                className={`px-3 py-1.5 rounded-lg transition-all capitalize ${
                  metric === m 
                    ? 'bg-violet-600 text-white shadow-sm' 
                    : 'hover:text-slate-200'
                }`}
              >
                {m === 'completion' ? 'Completion %' : m}
              </button>
            ))}
          </div>

          {/* Time Aggregation Selector */}
          <div className="flex bg-[#121217] rounded-xl p-1 border border-white/[0.05] text-[11px] font-semibold text-slate-400">
            {(['daily', 'weekly', 'monthly'] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-3 py-1.5 rounded-lg transition-all capitalize ${
                  view === v 
                    ? 'bg-violet-600 text-white shadow-sm' 
                    : 'hover:text-slate-200'
                }`}
              >
                {v}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Aggregation Level Guide */}
      <div className="flex items-center justify-between text-xs text-slate-500 border-b border-white/[0.05] pb-4">
        <div className="flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-violet-400" />
          <span className="font-medium text-slate-400">
            Showing {view === 'daily' ? 'Rolling 365 Days' : view === 'weekly' ? 'Weekly Rollups' : 'Monthly Aggregates'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span>Less</span>
          <div className="flex gap-1.5">
            <span className="w-3 h-3 rounded-[3px] bg-[#121217] border border-white/[0.03]" />
            <span className="w-3 h-3 rounded-[3px] bg-violet-950/40 border border-violet-900/30" />
            <span className="w-3 h-3 rounded-[3px] bg-violet-850/50 border border-violet-750/30" />
            <span className="w-3 h-3 rounded-[3px] bg-violet-600/60 border border-violet-500/40" />
            <span className="w-3 h-3 rounded-[3px] bg-violet-500 border border-violet-400" />
          </div>
          <span>More</span>
        </div>
      </div>

      {/* Main Heatmap Visual Grid */}
      <div className="relative pt-2 min-h-[140px]">
        {/* Tooltip Overlay */}
        {hoveredCell && (
          <div 
            className="absolute z-20 -translate-x-1/2 -translate-y-full bg-slate-900 border border-violet-500/30 rounded-xl p-3 shadow-xl pointer-events-none text-left space-y-1 text-[11px] w-48 transition-all animate-in fade-in slide-in-from-bottom-2 duration-150"
            style={{ left: hoveredCell.x, top: hoveredCell.y }}
          >
            <div className="font-bold text-white border-b border-white/[0.06] pb-1 mb-1.5 break-words">
              {hoveredCell.label}
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Focus Sessions:</span>
              <span className="font-semibold text-white">{hoveredCell.sessions}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Completed Time:</span>
              <span className="font-semibold text-violet-400">{hoveredCell.minutes} mins</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Completion Rate:</span>
              <span className={`font-semibold ${hoveredCell.completionRate >= 80 ? 'text-green-400' : 'text-orange-400'}`}>
                {hoveredCell.completionRate}% ({hoveredCell.completed}/{hoveredCell.sessions})
              </span>
            </div>
          </div>
        )}

        {/* Daily Calendar Heatmap View */}
        {view === 'daily' && (
          <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-2 pt-2">
            {/* Days labels */}
            <div className="grid grid-rows-7 text-[9px] font-bold text-slate-600 pr-1 h-[90px] select-none items-center">
              <span>Sun</span>
              <span>Mon</span>
              <span>Tue</span>
              <span>Wed</span>
              <span>Thu</span>
              <span>Fri</span>
              <span>Sat</span>
            </div>

            {/* Heatmap cells list */}
            <div className="grid grid-flow-col grid-rows-7 gap-1 h-[90px]">
              {dailyGridCells.map((day, index) => {
                if (!day) {
                  return (
                    <div 
                      key={`pad-${index}`} 
                      className="w-2.5 h-2.5 bg-transparent"
                    />
                  );
                }

                return (
                  <div
                    key={`cell-${index}`}
                    onMouseEnter={(e) => handleCellHover(e, day)}
                    onMouseLeave={() => setHoveredCell(null)}
                    className={`w-2.5 h-2.5 rounded-[2px] border transition-all hover:scale-125 cursor-pointer ${bgClasses[day.level]}`}
                  />
                );
              })}
            </div>
          </div>
        )}

        {/* Weekly aggregated strip view */}
        {view === 'weekly' && (
          <div className="flex gap-1 overflow-x-auto custom-scrollbar pb-2 pt-1 h-[110px]">
            {processedData.map((week: any, index) => (
              <div
                key={`week-${index}`}
                onMouseEnter={(e) => handleCellHover(e, week)}
                onMouseLeave={() => setHoveredCell(null)}
                className={`flex-1 min-w-[12px] max-w-[20px] h-16 rounded-[4px] border transition-all hover:scale-y-110 cursor-pointer ${bgClasses[week.level]}`}
              />
            ))}
          </div>
        )}

        {/* Monthly view */}
        {view === 'monthly' && (
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3 pb-2 pt-1">
            {processedData.map((month: any, index) => (
              <div
                key={`month-${index}`}
                onMouseEnter={(e) => handleCellHover(e, month)}
                onMouseLeave={() => setHoveredCell(null)}
                className={`p-4 rounded-2xl border text-center transition-all hover:scale-[1.03] cursor-pointer flex flex-col justify-between space-y-2 ${bgClasses[month.level]}`}
              >
                <span className="text-[10px] font-bold tracking-tight opacity-75 truncate">{month.date}</span>
                <div className="flex flex-col">
                  <span className="text-sm font-extrabold">{month.sessions} sessions</span>
                  <span className="text-[10px] opacity-60 font-semibold">{month.minutes} mins focus</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
