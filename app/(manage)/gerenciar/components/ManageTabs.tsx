"use client";

type Tab = {
  id: string;
  label: string;
  icon: React.ReactNode;
  count: number;
};

type ManageTabsProps = {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
};

export default function ManageTabs({
  tabs,
  activeTab,
  onTabChange,
}: ManageTabsProps) {
  return (
    <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              isActive
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-700 hover:bg-white/50"
            }`}
          >
            {tab.icon}
            <span className="hidden sm:inline">{tab.label}</span>
            <span className="sm:hidden">{tab.label.slice(0, 4)}</span>
            <span
              className={`text-xs px-1.5 py-0.5 rounded-md font-bold ${
                isActive
                  ? "bg-blue-100 text-blue-700"
                  : "bg-slate-200 text-slate-500"
              }`}
            >
              {tab.count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
