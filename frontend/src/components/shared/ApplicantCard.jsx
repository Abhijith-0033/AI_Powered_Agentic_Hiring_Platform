import { Calendar, FileText, MapPin, Star } from 'lucide-react';
import Badge from '../ui/Badge';
import Button from '../ui/Button';

/**
 * Applicant card for recruiter view
 * 
 * @param {Object} props
 * @param {Object} props.applicant - Applicant data
 * @param {Function} props.onViewResume - View resume handler
 * @param {Function} props.onShortlist - Shortlist handler
 * @param {Function} props.onReject - Reject handler
 */
const ApplicantCard = ({
    applicant,
    onViewResume,
    onShortlist,
    onReject,
    className = '',
}) => {
    const {
        name,
        email,
        avatar,
        title,
        location,
        experience,
        skills,
        appliedFor,
        appliedDate,
        status,
        matchScore,
        source,
    } = applicant;

    const statusConfig = {
        new: { label: 'New', color: 'info' },
        reviewing: { label: 'Reviewing', color: 'warning' },
        shortlisted: { label: 'Shortlisted', color: 'success' },
        interview: { label: 'Interview', color: 'success' },
        rejected: { label: 'Rejected', color: 'error' },
    };

    const statusInfo = statusConfig[status] || statusConfig.new;

    return (
        <div
            className={`
        bg-white border border-neutral-200 rounded-xl p-6
        hover:border-primary-200 hover:shadow-lg hover:shadow-primary-500/5
        transition-all duration-300
        ${className}
      `}
        >
            {/* Header */}
            <div className="flex items-start gap-4 mb-4">
                <img
                    src={avatar}
                    alt={name}
                    className="w-14 h-14 rounded-full object-cover border-2 border-neutral-100"
                />
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-semibold text-neutral-900">{name}</h3>
                        <Badge variant={statusInfo.color} size="sm">
                            {statusInfo.label}
                        </Badge>
                    </div>
                    <p className="text-sm text-neutral-500">{title}</p>
                    <p className="text-xs text-neutral-400">{email}</p>
                </div>

                {/* Match Score */}
                <div className="flex-shrink-0 text-center">
                    <div className={`
            w-14 h-14 rounded-full flex items-center justify-center
            text-lg font-bold border-2
            ${matchScore >= 90 ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                            matchScore >= 75 ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                'bg-neutral-100 text-neutral-600 border-neutral-200'}
          `}>
                        {matchScore}
                    </div>
                    <p className="text-xs text-neutral-500 mt-1">Match</p>
                </div>
            </div>

            {/* Details */}
            <div className="flex flex-wrap items-center gap-3 mb-4 text-sm text-neutral-500">
                <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    <span>{location}</span>
                </div>
                <div className="flex items-center gap-1">
                    <Star className="w-4 h-4" />
                    <span>{experience} experience</span>
                </div>
                <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span>Applied {appliedDate}</span>
                </div>
            </div>

            {/* Applied For */}
            <p className="text-sm text-neutral-500 mb-3">
                Applied for: <span className="text-primary-600 font-medium">{appliedFor}</span>
            </p>

            {/* Skills */}
            <div className="flex flex-wrap gap-2 mb-4">
                {skills.slice(0, 5).map((skill) => (
                    <Badge key={skill} variant="default" size="sm">
                        {skill}
                    </Badge>
                ))}
                {skills.length > 5 && (
                    <Badge variant="default" size="sm">
                        +{skills.length - 5}
                    </Badge>
                )}
            </div>

            {/* Source Tag */}
            {source && (
                <p className="text-xs text-neutral-400 mb-4">
                    Source: {source}
                </p>
            )}

            {/* Actions */}
            <div className="flex items-center gap-2 pt-4 border-t border-neutral-100">
                <Button
                    variant="secondary"
                    size="sm"
                    leftIcon={<FileText className="w-4 h-4" />}
                    onClick={onViewResume}
                >
                    Resume
                </Button>

                {/* Dynamic Actions based on Status */}
                {status === 'applied' && (
                    <>
                        <Button variant="primary" size="sm" onClick={() => onShortlist && onShortlist()}>
                            Shortlist
                        </Button>
                        <Button variant="danger" size="sm" onClick={() => onReject && onReject()}>
                            Reject
                        </Button>
                    </>
                )}

                {status === 'shortlisted' && (
                    <>
                        <Button variant="warning" size="sm" onClick={() => props.onInterview && props.onInterview()}>
                            Interview
                        </Button>
                        <Button variant="danger" size="sm" onClick={() => onReject && onReject()}>
                            Reject
                        </Button>
                    </>
                )}

                {status === 'interview' && (
                    <>
                        <Button variant="success" size="sm" onClick={() => props.onAccept && props.onAccept()}>
                            Accept
                        </Button>
                        <Button variant="danger" size="sm" onClick={() => onReject && onReject()}>
                            Reject
                        </Button>
                    </>
                )}

                {/* Final States - No Actions */}
                {status === 'accepted' && <span className="text-emerald-600 text-sm font-medium ml-auto">Accepted</span>}
                {status === 'rejected' && <span className="text-rose-500 text-sm font-medium ml-auto">Rejected</span>}

            </div>
        </div>
    );
};

export default ApplicantCard;
