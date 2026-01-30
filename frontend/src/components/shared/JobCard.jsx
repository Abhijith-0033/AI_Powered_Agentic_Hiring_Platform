import { Briefcase, Clock, DollarSign, MapPin, Wifi, CheckCircle } from 'lucide-react';
import Badge from '../ui/Badge';
import Button from '../ui/Button';

/**
 * Job card for displaying job listings
 * 
 * @param {Object} props
 * @param {Object} props.job - Job data
 * @param {Function} props.onApply - Apply handler (UI only)
 * @param {boolean} props.showMatchScore - Show match score
 */
const JobCard = ({
    job,
    onApply,
    isApplied = false,
    showMatchScore = true,
    className = '',
}) => {
    const {
        title, job_title,
        company, company_name,
        companyLogo, company_logo,
        location,
        type, job_type,
        salary, salary_min, salary_max,
        skills = [], required_skills,
        remote,
        posted, created_at,
        matchScore,
        applicants,
    } = job;

    // Normalize Data
    const displayTitle = title || job_title;
    const displayCompany = company || company_name;
    const displayLogo = companyLogo || company_logo;
    const displayType = type || job_type;
    const displayPosted = posted || (created_at ? new Date(created_at).toLocaleDateString() : 'Recently');

    // Parse skills if string
    let displaySkills = skills;
    if (required_skills && typeof required_skills === 'string') {
        displaySkills = required_skills.split(',').map(s => s.trim());
    } else if (required_skills && Array.isArray(required_skills)) {
        displaySkills = required_skills;
    }

    // Format Salary
    let displaySalary = salary;
    if (!salary && salary_min && salary_max) {
        displaySalary = `$${salary_min.toLocaleString()} - $${salary_max.toLocaleString()}`;
    } else if (!salary) {
        displaySalary = 'Competitive';
    }

    return (
        <div
            className={`
        bg-dark-800/50 border border-dark-700/50 rounded-xl p-6
        hover:border-dark-600 hover:shadow-lg hover:shadow-dark-900/50
        transition-all duration-300 hover:scale-[1.01]
        ${className}
      `}
        >
            {/* Header */}
            <div className="flex items-start gap-4 mb-4">
                {displayLogo ? (
                    <img
                        src={displayLogo}
                        alt={displayCompany}
                        className="w-12 h-12 rounded-lg object-cover"
                    />
                ) : (
                    <div className="w-12 h-12 rounded-lg bg-primary-500/20 flex items-center justify-center text-primary-400 font-bold text-xl">
                        {displayCompany?.charAt(0) || 'C'}
                    </div>
                )}

                <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-dark-100 truncate">
                        {displayTitle}
                    </h3>
                    <p className="text-sm text-dark-400">{displayCompany}</p>
                </div>

                {showMatchScore && matchScore && (
                    <div className="flex-shrink-0">
                        <div className={`
              px-3 py-1 rounded-full text-sm font-semibold
              ${matchScore >= 90 ? 'bg-emerald-500/20 text-emerald-400' :
                                matchScore >= 75 ? 'bg-amber-500/20 text-amber-400' :
                                    'bg-dark-600 text-dark-300'}
            `}>
                            {matchScore}% Match
                        </div>
                    </div>
                )}
            </div>

            {/* Details */}
            <div className="flex flex-wrap items-center gap-3 mb-4 text-sm text-dark-400">
                <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    <span>{location || 'Remote'}</span>
                </div>
                <div className="flex items-center gap-1">
                    <Briefcase className="w-4 h-4" />
                    <span>{displayType}</span>
                </div>
                {displaySalary && (
                    <div className="flex items-center gap-1">
                        <DollarSign className="w-4 h-4" />
                        <span>{displaySalary}</span>
                    </div>
                )}
                {remote && (
                    <div className="flex items-center gap-1 text-emerald-400">
                        <Wifi className="w-4 h-4" />
                        <span>Remote</span>
                    </div>
                )}
            </div>

            {/* Skills */}
            <div className="flex flex-wrap gap-2 mb-4">
                {displaySkills.slice(0, 4).map((skill) => (
                    <Badge key={skill} variant="default" size="sm">
                        {skill}
                    </Badge>
                ))}
                {displaySkills.length > 4 && (
                    <Badge variant="default" size="sm">
                        +{displaySkills.length - 4} more
                    </Badge>
                )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-4 border-t border-dark-700/50">
                <div className="flex items-center gap-3 text-sm text-dark-500">
                    <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>{displayPosted}</span>
                    </div>
                    {applicants && (
                        <span>• {applicants} applicants</span>
                    )}
                </div>

                <Button
                    size="sm"
                    disabled={isApplied}
                    variant={isApplied ? "outline" : "primary"}
                    onClick={(e) => {
                        if (!isApplied && onApply) onApply(e);
                    }}
                >
                    {isApplied ? <span className="flex items-center gap-1"><CheckCircle className="w-4 h-4" /> Applied</span> : 'Apply Now'}
                </Button>
            </div>
        </div>
    );
};

export default JobCard;
