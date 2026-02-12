import { Calendar, CheckCircle, ClipboardCheck, FileText, MapPin, Star, User, XCircle, Video } from 'lucide-react';
import Badge from '../ui/Badge';
import Button from '../ui/Button';

/**
 * Applicant card for recruiter view
 * All action buttons are always visible so the recruiter can change status at any time.
 */
const ApplicantCard = ({
    applicant,
    onViewResume,
    onViewProfile,
    onShortlist,
    onInterview,
    onAccept,
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
        applied: { label: 'Applied', color: 'info' },
        new: { label: 'New', color: 'info' },
        reviewing: { label: 'Reviewing', color: 'warning' },
        shortlisted: { label: 'Shortlisted', color: 'success' },
        shortlisted_for_test: { label: 'Test Scheduled', color: 'warning' },
        interview: { label: 'Interview', color: 'warning' },
        accepted: { label: 'Accepted', color: 'success' },
        rejected: { label: 'Rejected', color: 'error' },
    };

    const normalizedStatus = (status || 'applied').toLowerCase();
    const statusInfo = statusConfig[normalizedStatus] || statusConfig.applied;

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

            {/* Actions — Always visible so recruiter can change status at any time */}
            <div className="flex flex-wrap items-center gap-2 pt-4 border-t border-neutral-100">
                <Button
                    variant="secondary"
                    size="sm"
                    leftIcon={<FileText className="w-4 h-4" />}
                    onClick={onViewResume}
                >
                    Resume
                </Button>

                {onViewProfile && (
                    <Button
                        variant="outline"
                        size="sm"
                        leftIcon={<User className="w-4 h-4" />}
                        onClick={onViewProfile}
                    >
                        Profile
                    </Button>
                )}

                <div className="w-full mt-2 flex flex-wrap gap-2">
                    <Button
                        variant={normalizedStatus === 'shortlisted' ? 'primary' : 'outline'}
                        size="sm"
                        leftIcon={<CheckCircle className="w-3.5 h-3.5" />}
                        onClick={() => onShortlist && onShortlist()}
                        disabled={normalizedStatus === 'shortlisted'}
                    >
                        Shortlist
                    </Button>
                    <Button
                        variant={normalizedStatus === 'shortlisted_for_test' ? 'warning' : 'outline'}
                        size="sm"
                        leftIcon={<ClipboardCheck className="w-3.5 h-3.5" />}
                        onClick={() => onShortlist && onShortlist('shortlisted_for_test')}
                        disabled={normalizedStatus === 'shortlisted_for_test'}
                    >
                        Test
                    </Button>
                    <Button
                        variant={normalizedStatus === 'interview' ? 'primary' : 'outline'}
                        size="sm"
                        leftIcon={<Video className="w-3.5 h-3.5" />}
                        onClick={() => onInterview && onInterview()}
                        disabled={normalizedStatus === 'interview'}
                    >
                        Interview
                    </Button>
                    <Button
                        variant={normalizedStatus === 'accepted' ? 'success' : 'outline'}
                        size="sm"
                        leftIcon={<CheckCircle className="w-3.5 h-3.5" />}
                        onClick={() => onAccept && onAccept()}
                        disabled={normalizedStatus === 'accepted'}
                    >
                        Accept
                    </Button>
                    <Button
                        variant={normalizedStatus === 'rejected' ? 'danger' : 'outline'}
                        size="sm"
                        leftIcon={<XCircle className="w-3.5 h-3.5" />}
                        onClick={() => onReject && onReject()}
                        disabled={normalizedStatus === 'rejected'}
                    >
                        Reject
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default ApplicantCard;
