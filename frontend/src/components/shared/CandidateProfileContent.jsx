
import { User, Briefcase, GraduationCap, Code, Award, FolderGit2, FileText, ExternalLink, Mail, Phone, MapPin, Linkedin, Github, Clock } from 'lucide-react';
import { Button, Badge } from '../ui';

const CandidateProfileContent = ({ data, resumeUrl, onViewResume, isSnapshot, snapshotDate }) => {
    const info = data?.personal_info || {};

    return (
        <div className="space-y-6">
            {/* Snapshot Badge */}
            {isSnapshot && snapshotDate && (
                <div className="p-3 bg-primary-50 border border-primary-200 rounded-lg flex items-center gap-2">
                    <Clock className="w-4 h-4 text-primary-600" />
                    <span className="text-sm text-primary-700">
                        Profile snapshot from <strong>{new Date(snapshotDate).toLocaleDateString()}</strong>
                    </span>
                </div>
            )}

            {/* Profile Image & Basic Info */}
            <div className="flex items-center gap-4">
                {data?.profile_image_url ? (
                    <img
                        src={data.profile_image_url}
                        alt="Profile"
                        className="w-20 h-20 rounded-full object-cover border-2 border-primary-200"
                    />
                ) : (
                    <div className="w-20 h-20 rounded-full bg-neutral-200 flex items-center justify-center">
                        <User className="w-10 h-10 text-neutral-400" />
                    </div>
                )}
                <div>
                    <h3 className="text-xl font-bold text-neutral-900">{info.name || 'Candidate Name'}</h3>
                    <p className="text-neutral-600">{info.title || 'Job Title'}</p>
                </div>
            </div>

            {/* Contact Info */}
            <div className="grid grid-cols-2 gap-3 text-sm">
                {info.email && (
                    <div className="flex items-center gap-2 text-neutral-600">
                        <Mail className="w-4 h-4" />
                        <a href={`mailto:${info.email}`} className="hover:text-primary-600 truncate" title={info.email}>{info.email}</a>
                    </div>
                )}
                {info.phone && (
                    <div className="flex items-center gap-2 text-neutral-600">
                        <Phone className="w-4 h-4" />
                        <span>{info.phone}</span>
                    </div>
                )}
                {info.location && (
                    <div className="flex items-center gap-2 text-neutral-600">
                        <MapPin className="w-4 h-4" />
                        <span>{info.location}</span>
                    </div>
                )}
                {info.linkedin && (
                    <div className="flex items-center gap-2 text-neutral-600">
                        <Linkedin className="w-4 h-4" />
                        <a href={info.linkedin} target="_blank" rel="noreferrer" className="hover:text-primary-600 truncate" title={info.linkedin}>LinkedIn</a>
                    </div>
                )}
                {info.github && (
                    <div className="flex items-center gap-2 text-neutral-600">
                        <Github className="w-4 h-4" />
                        <a href={info.github} target="_blank" rel="noreferrer" className="hover:text-primary-600 truncate" title={info.github}>GitHub</a>
                    </div>
                )}
            </div>

            {/* About */}
            {info.about && (
                <div>
                    <h4 className="font-semibold text-neutral-800 mb-2">About</h4>
                    <p className="text-sm text-neutral-600 whitespace-pre-line">{info.about}</p>
                </div>
            )}

            {/* Resume Button */}
            {resumeUrl && (
                <Button variant="outline" className="w-full" onClick={onViewResume}>
                    <FileText className="w-4 h-4 mr-2" />
                    View Resume
                </Button>
            )}

            {/* Skills */}
            {data?.skills?.length > 0 && (
                <div>
                    <h4 className="font-semibold text-neutral-800 mb-2 flex items-center gap-2">
                        <Code className="w-4 h-4" /> Skills
                    </h4>
                    <div className="flex flex-wrap gap-2">
                        {data.skills.map((skill, i) => (
                            <Badge key={i} variant="secondary">{skill}</Badge>
                        ))}
                    </div>
                </div>
            )}

            {/* Experience */}
            {data?.experience?.length > 0 && (
                <div>
                    <h4 className="font-semibold text-neutral-800 mb-3 flex items-center gap-2">
                        <Briefcase className="w-4 h-4" /> Experience
                    </h4>
                    <div className="space-y-4">
                        {data.experience.map((exp, i) => (
                            <div key={i} className="p-3 bg-neutral-50 rounded-lg border border-neutral-200">
                                <p className="font-medium text-neutral-900">{exp.job_title}</p>
                                <p className="text-sm text-neutral-600">{exp.company}</p>
                                <p className="text-xs text-neutral-500">
                                    {exp.start_date} - {exp.is_current ? 'Present' : exp.end_date}
                                </p>
                                {exp.description && (
                                    <p className="text-sm text-neutral-600 mt-2">{exp.description}</p>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Education */}
            {data?.education?.length > 0 && (
                <div>
                    <h4 className="font-semibold text-neutral-800 mb-3 flex items-center gap-2">
                        <GraduationCap className="w-4 h-4" /> Education
                    </h4>
                    <div className="space-y-3">
                        {data.education.map((edu, i) => (
                            <div key={i} className="p-3 bg-neutral-50 rounded-lg border border-neutral-200">
                                <p className="font-medium text-neutral-900">{edu.degree}</p>
                                <p className="text-sm text-neutral-600">{edu.institution}</p>
                                <p className="text-xs text-neutral-500">{edu.graduation_year}</p>
                                {edu.gpa && <p className="text-xs text-neutral-500">GPA: {edu.gpa}</p>}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Projects */}
            {data?.projects?.length > 0 && (
                <div>
                    <h4 className="font-semibold text-neutral-800 mb-3 flex items-center gap-2">
                        <FolderGit2 className="w-4 h-4" /> Projects
                    </h4>
                    <div className="space-y-3">
                        {data.projects.map((proj, i) => (
                            <div key={i} className="p-3 bg-neutral-50 rounded-lg border border-neutral-200">
                                <div className="flex justify-between items-start">
                                    <p className="font-medium text-neutral-900">{proj.title}</p>
                                    {proj.link && (
                                        <a href={proj.link} target="_blank" rel="noreferrer" className="text-primary-600 hover:text-primary-700">
                                            <ExternalLink className="w-4 h-4" />
                                        </a>
                                    )}
                                </div>
                                {proj.description && (
                                    <p className="text-sm text-neutral-600 mt-1">{proj.description}</p>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Achievements */}
            {data?.achievements?.length > 0 && (
                <div>
                    <h4 className="font-semibold text-neutral-800 mb-3 flex items-center gap-2">
                        <Award className="w-4 h-4" /> Achievements
                    </h4>
                    <div className="space-y-2">
                        {data.achievements.map((ach, i) => (
                            <div key={i} className="p-3 bg-neutral-50 rounded-lg border border-neutral-200">
                                <p className="font-medium text-neutral-900">{ach.title}</p>
                                {ach.description && (
                                    <p className="text-sm text-neutral-600">{ach.description}</p>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Screening Question Answers */}
            {data?.answers?.length > 0 && (
                <div>
                    <h4 className="font-semibold text-neutral-800 mb-3 flex items-center gap-2">
                        <FileText className="w-4 h-4" /> Screening Answers
                    </h4>
                    <div className="space-y-4">
                        {data.answers.map((qa, i) => (
                            <div key={i} className="p-4 bg-neutral-50 rounded-lg border border-neutral-200">
                                <p className="font-medium text-neutral-800 mb-2">{qa.question}</p>
                                <div className="bg-white rounded p-3 border border-neutral-200">
                                    <p className="text-sm text-neutral-700">{qa.answer}</p>
                                </div>
                                {qa.expected_answer && (
                                    <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded">
                                        <p className="text-xs font-semibold text-amber-800 mb-1">Your Expected Answer:</p>
                                        <p className="text-sm text-amber-700">{qa.expected_answer}</p>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default CandidateProfileContent;
