
export const StatCard = ({
  title,
  value,
  subtext,
  icon: Icon,
  badge,
  onClick,
  className = '',
}) => {
  return (
    <div
      onClick={onClick}
      className={`card-base p-3.5 sm:p-5 transition-colors duration-150 ${
        onClick ? 'cursor-pointer hover:border-zinc-400 dark:hover:border-zinc-700' : ''
      } ${className}`}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] sm:text-xs font-medium text-zinc-500 dark:text-zinc-400 truncate">
          {title}
        </p>
        {Icon && (
          <div className="p-1 sm:p-1.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 shrink-0">
            <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </div>
        )}
      </div>

      <div className="mt-2 sm:mt-3 flex items-baseline justify-between flex-wrap gap-1">
        <h3 className="text-lg sm:text-2xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50 break-words">
          {value}
        </h3>
        {badge && <div className="ml-1 sm:ml-2">{badge}</div>}
      </div>

      {subtext && (
        <p className="mt-1 sm:mt-1.5 text-[11px] sm:text-xs text-zinc-500 dark:text-zinc-400 line-clamp-1">
          {subtext}
        </p>
      )}
    </div>
  );
};

