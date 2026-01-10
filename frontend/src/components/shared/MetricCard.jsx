import { TrendingDown, TrendingUp } from 'lucide-react';

/**
 * Metric card for dashboard statistics
 * 
 * @param {Object} props
 * @param {string} props.title - Metric title
 * @param {string|number} props.value - Metric value
 * @param {string} props.change - Percentage change
 * @param {'up' | 'down'} props.trend - Trend direction
 * @param {React.ReactNode} props.icon - Metric icon
 * @param {'primary' | 'secondary' | 'success' | 'warning'} props.color - Accent color
 */
const MetricCard = ({
    title,
    value,
    change,
    trend,
    icon: Icon,
    color = 'primary',
    className = '',
}) => {
    const colorClasses = {
        primary: 'from-primary-500/20 to-primary-600/20 border-primary-500/30',
        secondary: 'from-secondary-500/20 to-secondary-600/20 border-secondary-500/30',
        success: 'from-emerald-500/20 to-emerald-600/20 border-emerald-500/30',
        warning: 'from-amber-500/20 to-amber-600/20 border-amber-500/30',
    };

    const iconColorClasses = {
        primary: 'bg-primary-500/20 text-primary-400',
        secondary: 'bg-secondary-500/20 text-secondary-400',
        success: 'bg-emerald-500/20 text-emerald-400',
        warning: 'bg-amber-500/20 text-amber-400',
    };

    return (
        <div
            className={`
        relative overflow-hidden
        bg-gradient-to-br ${colorClasses[color]}
        border rounded-xl p-6
        hover:scale-[1.02] transition-transform duration-300
        ${className}
      `}
        >
            {/* Background Decoration */}
            <div className="absolute -right-8 -top-8 w-24 h-24 rounded-full bg-gradient-to-br from-white/5 to-transparent" />

            <div className="flex items-start justify-between">
                <div>
                    <p className="text-sm font-medium text-dark-400 mb-1">{title}</p>
                    <p className="text-3xl font-bold text-dark-100">{value}</p>

                    {change && (
                        <div className="flex items-center gap-1 mt-2">
                            {trend === 'up' ? (
                                <TrendingUp className="w-4 h-4 text-emerald-400" />
                            ) : (
                                <TrendingDown className="w-4 h-4 text-rose-400" />
                            )}
                            <span className={`text-sm font-medium ${trend === 'up' ? 'text-emerald-400' : 'text-rose-400'
                                }`}>
                                {change}
                            </span>
                            <span className="text-sm text-dark-500">vs last week</span>
                        </div>
                    )}
                </div>

                {Icon && (
                    <div className={`p-3 rounded-xl ${iconColorClasses[color]}`}>
                        <Icon className="w-6 h-6" />
                    </div>
                )}
            </div>
        </div>
    );
};

export default MetricCard;
