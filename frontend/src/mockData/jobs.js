/**
 * Mock job listings data
 * Used for job discovery, dashboard recommendations, and provider views
 */
export const jobs = [
    {
        id: 1,
        title: "Senior Frontend Developer",
        company: "TechCorp Inc.",
        companyLogo: "https://ui-avatars.com/api/?name=TC&background=6366f1&color=fff",
        location: "San Francisco, CA",
        type: "Full-time",
        experience: "5+ years",
        salary: "$150k - $180k",
        skills: ["React", "TypeScript", "Node.js", "GraphQL"],
        description: "We're looking for a passionate frontend developer to join our team...",
        remote: true,
        posted: "2 days ago",
        applicants: 45,
        matchScore: 92,
    },
    {
        id: 2,
        title: "Full Stack Engineer",
        company: "StartupXYZ",
        companyLogo: "https://ui-avatars.com/api/?name=SX&background=8b5cf6&color=fff",
        location: "New York, NY",
        type: "Full-time",
        experience: "3-5 years",
        salary: "$120k - $150k",
        skills: ["Python", "React", "PostgreSQL", "AWS"],
        description: "Join our fast-growing startup to build the future of fintech...",
        remote: false,
        posted: "1 week ago",
        applicants: 78,
        matchScore: 85,
    },
    {
        id: 3,
        title: "Machine Learning Engineer",
        company: "AI Labs",
        companyLogo: "https://ui-avatars.com/api/?name=AL&background=10b981&color=fff",
        location: "Seattle, WA",
        type: "Full-time",
        experience: "4+ years",
        salary: "$170k - $220k",
        skills: ["Python", "TensorFlow", "PyTorch", "MLOps"],
        description: "Work on cutting-edge AI models that power our products...",
        remote: true,
        posted: "3 days ago",
        applicants: 32,
        matchScore: 78,
    },
    {
        id: 4,
        title: "DevOps Engineer",
        company: "CloudScale",
        companyLogo: "https://ui-avatars.com/api/?name=CS&background=f59e0b&color=fff",
        location: "Austin, TX",
        type: "Full-time",
        experience: "3+ years",
        salary: "$130k - $160k",
        skills: ["Kubernetes", "Docker", "Terraform", "AWS"],
        description: "Help us scale our infrastructure to millions of users...",
        remote: true,
        posted: "5 days ago",
        applicants: 23,
        matchScore: 88,
    },
    {
        id: 5,
        title: "Product Designer",
        company: "DesignHub",
        companyLogo: "https://ui-avatars.com/api/?name=DH&background=ec4899&color=fff",
        location: "Los Angeles, CA",
        type: "Full-time",
        experience: "2-4 years",
        salary: "$100k - $130k",
        skills: ["Figma", "UI/UX", "Prototyping", "User Research"],
        description: "Create beautiful and intuitive user experiences...",
        remote: false,
        posted: "1 day ago",
        applicants: 56,
        matchScore: 72,
    },
    {
        id: 6,
        title: "Backend Developer",
        company: "DataFlow Inc.",
        companyLogo: "https://ui-avatars.com/api/?name=DF&background=14b8a6&color=fff",
        location: "Chicago, IL",
        type: "Contract",
        experience: "4-6 years",
        salary: "$140k - $170k",
        skills: ["Go", "PostgreSQL", "Redis", "Microservices"],
        description: "Build robust and scalable backend systems...",
        remote: true,
        posted: "4 days ago",
        applicants: 34,
        matchScore: 81,
    },
    {
        id: 7,
        title: "Mobile Developer (React Native)",
        company: "AppWorks",
        companyLogo: "https://ui-avatars.com/api/?name=AW&background=3b82f6&color=fff",
        location: "Boston, MA",
        type: "Full-time",
        experience: "2-3 years",
        salary: "$110k - $140k",
        skills: ["React Native", "JavaScript", "iOS", "Android"],
        description: "Build cross-platform mobile applications...",
        remote: true,
        posted: "6 days ago",
        applicants: 41,
        matchScore: 95,
    },
    {
        id: 8,
        title: "Data Scientist",
        company: "Analytics Pro",
        companyLogo: "https://ui-avatars.com/api/?name=AP&background=8b5cf6&color=fff",
        location: "Denver, CO",
        type: "Full-time",
        experience: "3-5 years",
        salary: "$140k - $175k",
        skills: ["Python", "SQL", "Machine Learning", "Statistics"],
        description: "Turn data into actionable insights...",
        remote: false,
        posted: "2 weeks ago",
        applicants: 67,
        matchScore: 76,
    },
];

/**
 * Get job by ID
 */
export const getJobById = (id) => jobs.find(job => job.id === id);

/**
 * Filter jobs by criteria
 */
export const filterJobs = ({ role, experience, location, remote }) => {
    return jobs.filter(job => {
        if (role && !job.title.toLowerCase().includes(role.toLowerCase())) return false;
        if (location && !job.location.toLowerCase().includes(location.toLowerCase())) return false;
        if (remote !== undefined && job.remote !== remote) return false;
        return true;
    });
};
