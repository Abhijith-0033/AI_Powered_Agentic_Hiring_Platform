/**
 * Mock applications data
 * Tracks job seeker's application history
 */
export const applications = [
    {
        id: 1,
        jobId: 1,
        jobTitle: "Senior Frontend Developer",
        company: "TechCorp Inc.",
        companyLogo: "https://ui-avatars.com/api/?name=TC&background=6366f1&color=fff",
        appliedDate: "2024-01-20",
        status: "applied",
        lastUpdate: "2024-01-20",
        notes: "Applied through referral",
    },
    {
        id: 2,
        jobId: 2,
        jobTitle: "Full Stack Engineer",
        company: "StartupXYZ",
        companyLogo: "https://ui-avatars.com/api/?name=SX&background=8b5cf6&color=fff",
        appliedDate: "2024-01-18",
        status: "interview",
        lastUpdate: "2024-01-22",
        interviewDate: "2024-01-25",
        notes: "Technical interview scheduled",
    },
    {
        id: 3,
        jobId: 3,
        jobTitle: "Machine Learning Engineer",
        company: "AI Labs",
        companyLogo: "https://ui-avatars.com/api/?name=AL&background=10b981&color=fff",
        appliedDate: "2024-01-15",
        status: "reviewing",
        lastUpdate: "2024-01-19",
        notes: "Resume under review",
    },
    {
        id: 4,
        jobId: 4,
        jobTitle: "DevOps Engineer",
        company: "CloudScale",
        companyLogo: "https://ui-avatars.com/api/?name=CS&background=f59e0b&color=fff",
        appliedDate: "2024-01-10",
        status: "rejected",
        lastUpdate: "2024-01-17",
        notes: "Position filled internally",
    },
    {
        id: 5,
        jobId: 5,
        jobTitle: "Product Designer",
        company: "DesignHub",
        companyLogo: "https://ui-avatars.com/api/?name=DH&background=ec4899&color=fff",
        appliedDate: "2024-01-08",
        status: "offer",
        lastUpdate: "2024-01-21",
        notes: "Offer received! Salary: $125k",
        offerDetails: {
            salary: "$125,000",
            startDate: "2024-02-15",
            benefits: ["Health Insurance", "401k", "Remote Work"],
        },
    },
    {
        id: 6,
        jobId: 6,
        jobTitle: "Backend Developer",
        company: "DataFlow Inc.",
        companyLogo: "https://ui-avatars.com/api/?name=DF&background=14b8a6&color=fff",
        appliedDate: "2024-01-05",
        status: "applied",
        lastUpdate: "2024-01-05",
        notes: "",
    },
    {
        id: 7,
        jobId: 7,
        jobTitle: "Mobile Developer",
        company: "AppWorks",
        companyLogo: "https://ui-avatars.com/api/?name=AW&background=3b82f6&color=fff",
        appliedDate: "2024-01-03",
        status: "interview",
        lastUpdate: "2024-01-20",
        interviewDate: "2024-01-28",
        notes: "Second round interview",
    },
    {
        id: 8,
        jobId: 8,
        jobTitle: "Data Scientist",
        company: "Analytics Pro",
        companyLogo: "https://ui-avatars.com/api/?name=AP&background=8b5cf6&color=fff",
        appliedDate: "2024-01-01",
        status: "rejected",
        lastUpdate: "2024-01-12",
        notes: "Looking for more experience in ML",
    },
];

/**
 * Application status labels and colors
 */
export const statusConfig = {
    applied: {
        label: "Applied",
        color: "info",
        description: "Application submitted",
    },
    reviewing: {
        label: "Under Review",
        color: "warning",
        description: "Recruiter is reviewing your application",
    },
    interview: {
        label: "Interview",
        color: "success",
        description: "Interview scheduled",
    },
    offer: {
        label: "Offer",
        color: "success",
        description: "Offer received",
    },
    rejected: {
        label: "Rejected",
        color: "error",
        description: "Application was not successful",
    },
    withdrawn: {
        label: "Withdrawn",
        color: "default",
        description: "You withdrew your application",
    },
};

/**
 * Get applications by status
 */
export const getApplicationsByStatus = (status) => {
    return applications.filter(app => app.status === status);
};

/**
 * Get application statistics
 */
export const getApplicationStats = () => {
    const stats = {
        total: applications.length,
        applied: 0,
        reviewing: 0,
        interview: 0,
        offer: 0,
        rejected: 0,
    };

    applications.forEach(app => {
        if (stats[app.status] !== undefined) {
            stats[app.status]++;
        }
    });

    return stats;
};
