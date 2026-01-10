/**
 * Mock company data
 * Used for provider/recruiter side views
 */
export const companies = [
    {
        id: 1,
        name: "TechCorp Inc.",
        logo: "https://ui-avatars.com/api/?name=TC&background=6366f1&color=fff&size=128",
        industry: "Technology",
        size: "1000-5000 employees",
        location: "San Francisco, CA",
        website: "https://techcorp.example.com",
        description: "TechCorp is a leading technology company focused on building innovative solutions for enterprise customers. We're passionate about creating products that make a difference.",
        founded: 2010,
        culture: ["Innovation", "Collaboration", "Work-Life Balance", "Diversity"],
        benefits: [
            "Competitive salary",
            "Health insurance",
            "401k matching",
            "Remote work options",
            "Learning budget",
            "Gym membership",
        ],
        openPositions: 12,
        totalEmployees: 2500,
    },
];

/**
 * Current company (for logged-in recruiter)
 */
export const currentCompany = companies[0];

/**
 * Provider/Recruiter dashboard stats
 */
export const providerDashboardStats = {
    jobsPosted: 8,
    totalApplicants: 234,
    shortlisted: 45,
    interviewed: 18,
    hired: 5,
    pendingReview: 67,
    avgTimeToHire: "21 days",
    applicationTrend: [12, 18, 24, 32, 28, 34, 45],
};

/**
 * Posted jobs by the company
 */
export const postedJobs = [
    {
        id: 1,
        title: "Senior Frontend Developer",
        department: "Engineering",
        location: "San Francisco, CA",
        type: "Full-time",
        remote: true,
        salary: "$150k - $180k",
        applicants: 45,
        status: "active",
        posted: "2024-01-15",
        deadline: "2024-02-15",
    },
    {
        id: 2,
        title: "Product Manager",
        department: "Product",
        location: "New York, NY",
        type: "Full-time",
        remote: false,
        salary: "$140k - $170k",
        applicants: 32,
        status: "active",
        posted: "2024-01-10",
        deadline: "2024-02-10",
    },
    {
        id: 3,
        title: "DevOps Engineer",
        department: "Engineering",
        location: "Remote",
        type: "Full-time",
        remote: true,
        salary: "$130k - $160k",
        applicants: 28,
        status: "active",
        posted: "2024-01-08",
        deadline: "2024-02-08",
    },
    {
        id: 4,
        title: "UX Designer",
        department: "Design",
        location: "San Francisco, CA",
        type: "Contract",
        remote: true,
        salary: "$100k - $120k",
        applicants: 56,
        status: "paused",
        posted: "2024-01-01",
        deadline: "2024-01-31",
    },
];
