/**
 * Mock applicants data for recruiter view
 * Represents candidates who applied to company's jobs
 */
export const applicants = [
    {
        id: 1,
        name: "Sarah Chen",
        email: "sarah.chen@email.com",
        avatar: "https://ui-avatars.com/api/?name=SC&background=ec4899&color=fff",
        title: "Senior Software Engineer",
        location: "San Francisco, CA",
        experience: "6 years",
        skills: ["React", "TypeScript", "Node.js", "Python", "AWS"],
        education: "M.S. Computer Science, Stanford University",
        appliedFor: "Senior Frontend Developer",
        appliedDate: "2024-01-20",
        status: "new",
        matchScore: 95,
        resumeUrl: "/resumes/sarah-chen.pdf",
        notes: "",
        source: "LinkedIn",
    },
    {
        id: 2,
        name: "Michael Roberts",
        email: "m.roberts@email.com",
        avatar: "https://ui-avatars.com/api/?name=MR&background=3b82f6&color=fff",
        title: "Full Stack Developer",
        location: "New York, NY",
        experience: "4 years",
        skills: ["JavaScript", "React", "Python", "Django", "PostgreSQL"],
        education: "B.S. Computer Science, MIT",
        appliedFor: "Senior Frontend Developer",
        appliedDate: "2024-01-19",
        status: "shortlisted",
        matchScore: 88,
        resumeUrl: "/resumes/michael-roberts.pdf",
        notes: "Strong portfolio, good cultural fit",
        source: "Referral",
    },
    {
        id: 3,
        name: "Emily Watson",
        email: "emily.w@email.com",
        avatar: "https://ui-avatars.com/api/?name=EW&background=10b981&color=fff",
        title: "Frontend Developer",
        location: "Austin, TX",
        experience: "3 years",
        skills: ["React", "Vue.js", "CSS", "JavaScript", "Figma"],
        education: "B.A. Design, UCLA",
        appliedFor: "Senior Frontend Developer",
        appliedDate: "2024-01-18",
        status: "interview",
        matchScore: 82,
        resumeUrl: "/resumes/emily-watson.pdf",
        notes: "Great design skills, schedule for technical round",
        interviewDate: "2024-01-25",
        source: "Indeed",
    },
    {
        id: 4,
        name: "David Kim",
        email: "david.kim@email.com",
        avatar: "https://ui-avatars.com/api/?name=DK&background=f59e0b&color=fff",
        title: "React Developer",
        location: "Seattle, WA",
        experience: "5 years",
        skills: ["React", "Redux", "TypeScript", "GraphQL", "Node.js"],
        education: "B.S. Software Engineering, University of Washington",
        appliedFor: "Senior Frontend Developer",
        appliedDate: "2024-01-17",
        status: "rejected",
        matchScore: 75,
        resumeUrl: "/resumes/david-kim.pdf",
        notes: "Good technical skills but salary expectations too high",
        source: "Direct",
    },
    {
        id: 5,
        name: "Jessica Martinez",
        email: "j.martinez@email.com",
        avatar: "https://ui-avatars.com/api/?name=JM&background=8b5cf6&color=fff",
        title: "Software Engineer",
        location: "Chicago, IL",
        experience: "4 years",
        skills: ["React", "Angular", "Java", "Spring Boot", "Docker"],
        education: "B.S. Computer Science, Northwestern University",
        appliedFor: "Product Manager",
        appliedDate: "2024-01-16",
        status: "new",
        matchScore: 91,
        resumeUrl: "/resumes/jessica-martinez.pdf",
        notes: "",
        source: "LinkedIn",
    },
    {
        id: 6,
        name: "James Wilson",
        email: "james.w@email.com",
        avatar: "https://ui-avatars.com/api/?name=JW&background=14b8a6&color=fff",
        title: "DevOps Engineer",
        location: "Denver, CO",
        experience: "5 years",
        skills: ["Kubernetes", "Docker", "Terraform", "AWS", "Python"],
        education: "B.S. Information Technology, Colorado State",
        appliedFor: "DevOps Engineer",
        appliedDate: "2024-01-15",
        status: "shortlisted",
        matchScore: 93,
        resumeUrl: "/resumes/james-wilson.pdf",
        notes: "Excellent DevOps experience, strong AWS skills",
        source: "Referral",
    },
    {
        id: 7,
        name: "Amanda Lee",
        email: "amanda.lee@email.com",
        avatar: "https://ui-avatars.com/api/?name=AL&background=6366f1&color=fff",
        title: "UX/UI Designer",
        location: "Los Angeles, CA",
        experience: "6 years",
        skills: ["Figma", "Sketch", "Adobe XD", "User Research", "Prototyping"],
        education: "M.F.A. Interaction Design, RISD",
        appliedFor: "UX Designer",
        appliedDate: "2024-01-14",
        status: "interview",
        matchScore: 97,
        resumeUrl: "/resumes/amanda-lee.pdf",
        notes: "Outstanding portfolio, scheduled final round",
        interviewDate: "2024-01-26",
        source: "Portfolio",
    },
    {
        id: 8,
        name: "Robert Brown",
        email: "r.brown@email.com",
        avatar: "https://ui-avatars.com/api/?name=RB&background=ef4444&color=fff",
        title: "Backend Developer",
        location: "Boston, MA",
        experience: "7 years",
        skills: ["Python", "Go", "PostgreSQL", "Redis", "Microservices"],
        education: "Ph.D. Computer Science, Harvard",
        appliedFor: "Senior Frontend Developer",
        appliedDate: "2024-01-12",
        status: "new",
        matchScore: 68,
        resumeUrl: "/resumes/robert-brown.pdf",
        notes: "Strong backend, limited frontend experience",
        source: "Indeed",
    },
];

/**
 * Applicant status configuration
 */
export const applicantStatusConfig = {
    new: {
        label: "New",
        color: "info",
        description: "Application received",
    },
    reviewing: {
        label: "Reviewing",
        color: "warning",
        description: "Under review",
    },
    shortlisted: {
        label: "Shortlisted",
        color: "success",
        description: "Candidate shortlisted",
    },
    interview: {
        label: "Interview",
        color: "success",
        description: "Interview scheduled",
    },
    offer: {
        label: "Offer Sent",
        color: "success",
        description: "Offer extended",
    },
    hired: {
        label: "Hired",
        color: "success",
        description: "Candidate hired",
    },
    rejected: {
        label: "Rejected",
        color: "error",
        description: "Not moving forward",
    },
};

/**
 * Get applicants by status
 */
export const getApplicantsByStatus = (status) => {
    return applicants.filter(app => app.status === status);
};

/**
 * Get applicants by job
 */
export const getApplicantsByJob = (jobTitle) => {
    return applicants.filter(app => app.appliedFor === jobTitle);
};
