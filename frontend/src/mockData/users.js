/**
 * Mock user profile data
 * Represents a job seeker's profile
 */
export const userProfile = {
    id: 1,
    name: "Alex Johnson",
    email: "alex.johnson@email.com",
    avatar: "https://ui-avatars.com/api/?name=AJ&background=6366f1&color=fff&size=128",
    title: "Senior Frontend Developer",
    location: "San Francisco, CA",
    phone: "+1 (555) 123-4567",
    linkedin: "linkedin.com/in/alexjohnson",
    github: "github.com/alexj",
    website: "alexjohnson.dev",
    about: "Passionate frontend developer with 6+ years of experience building scalable web applications. I love creating intuitive user interfaces and writing clean, maintainable code.",
    skills: [
        { name: "React", level: "Expert", years: 5 },
        { name: "TypeScript", level: "Advanced", years: 4 },
        { name: "Node.js", level: "Advanced", years: 4 },
        { name: "GraphQL", level: "Intermediate", years: 2 },
        { name: "Python", level: "Intermediate", years: 3 },
        { name: "AWS", level: "Intermediate", years: 2 },
    ],
    experience: [
        {
            id: 1,
            title: "Senior Frontend Developer",
            company: "TechCorp Inc.",
            location: "San Francisco, CA",
            startDate: "2021-01",
            endDate: null,
            current: true,
            description: "Lead frontend development for flagship product. Mentored junior developers and established best practices.",
        },
        {
            id: 2,
            title: "Frontend Developer",
            company: "StartupABC",
            location: "New York, NY",
            startDate: "2018-06",
            endDate: "2020-12",
            current: false,
            description: "Built responsive web applications using React and Redux. Improved performance by 40%.",
        },
        {
            id: 3,
            title: "Junior Developer",
            company: "WebAgency",
            location: "Boston, MA",
            startDate: "2016-08",
            endDate: "2018-05",
            current: false,
            description: "Developed client websites and internal tools. Learned React and modern JavaScript.",
        },
    ],
    education: [
        {
            id: 1,
            degree: "B.S. Computer Science",
            school: "Massachusetts Institute of Technology",
            location: "Cambridge, MA",
            year: 2016,
            gpa: "3.8",
        },
    ],
    certifications: [
        { name: "AWS Certified Developer", issuer: "Amazon", year: 2022 },
        { name: "Google Cloud Professional", issuer: "Google", year: 2021 },
    ],
    preferences: {
        jobTypes: ["Full-time", "Contract"],
        remotePreference: "Remote",
        salaryExpectation: "$150k - $180k",
        willingToRelocate: false,
        noticePeriod: "2 weeks",
    },
    profileCompletion: 85,
    resumeUrl: "/resumes/alex-johnson-resume.pdf",
    resumeLastUpdated: "2024-01-15",
};

/**
 * Mock activity data for timeline
 */
export const userActivity = [
    {
        id: 1,
        type: "application",
        title: "Applied to Senior Frontend Developer",
        company: "TechCorp Inc.",
        timestamp: "2024-01-20T10:30:00Z",
        status: "pending",
    },
    {
        id: 2,
        type: "match",
        title: "New job match found",
        company: "AI Labs",
        matchScore: 92,
        timestamp: "2024-01-19T15:45:00Z",
    },
    {
        id: 3,
        type: "interview",
        title: "Interview scheduled",
        company: "StartupXYZ",
        timestamp: "2024-01-18T09:00:00Z",
        interviewDate: "2024-01-25T14:00:00Z",
    },
    {
        id: 4,
        type: "view",
        title: "Profile viewed by recruiter",
        company: "CloudScale",
        timestamp: "2024-01-17T14:20:00Z",
    },
    {
        id: 5,
        type: "application",
        title: "Applied to ML Engineer",
        company: "DataFlow Inc.",
        timestamp: "2024-01-15T11:00:00Z",
        status: "rejected",
    },
];

/**
 * Dashboard statistics
 */
export const dashboardStats = {
    applicationsSent: 12,
    matchesFound: 28,
    profileViews: 156,
    interviewsScheduled: 3,
    profileCompletion: 85,
    weeklyApplications: [2, 4, 3, 5, 1, 3, 2],
};
