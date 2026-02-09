
export const mapProfileToFrontend = (data) => {
    if (!data) return null;
    const { personal_info, education, experience, achievements, projects } = data;

    return {
        name: personal_info?.name || '',
        title: '', // Not consistently in backend user profile but useful for frontend state
        email: personal_info?.email || '',
        phone: personal_info?.phone_number || '',
        location: personal_info?.location || '',
        linkedin: personal_info?.linkedin_url || '',
        github: personal_info?.github_url || '',
        about: personal_info?.profile_description || '',
        avatar: '', // Handled separately usually
        skills: (personal_info?.skills || []).map(s => ({ name: s, level: 'Intermediate', years: 1 })),

        experience: (experience || []).map(exp => ({
            id: exp.id,
            title: exp.job_title,
            company: exp.company_name,
            location: exp.location,
            employmentType: exp.employment_type,
            startDate: exp.start_date ? exp.start_date.split('T')[0] : '',
            endDate: exp.end_date ? exp.end_date.split('T')[0] : '',
            current: exp.is_current,
            description: exp.description
        })),

        education: (education || []).map(edu => ({
            id: edu.id,
            degree: edu.degree,
            school: edu.institution,
            fieldOfStudy: edu.field_of_study,
            startDate: edu.start_date ? edu.start_date.split('T')[0] : '',
            endDate: edu.end_date ? edu.end_date.split('T')[0] : '',
            grade: edu.grade_or_cgpa,
            description: edu.description
        })),

        achievements: (achievements || []).map(ach => ({
            id: ach.id,
            title: ach.title,
            issuer: ach.issuer,
            date: ach.date ? ach.date.split('T')[0] : '',
            description: ach.description
        })),

        projects: (projects || []).map(proj => ({
            id: proj.id,
            title: proj.project_title,
            link: proj.project_link,
            technologies: proj.technologies_used || [],
            startDate: proj.start_date ? proj.start_date.split('T')[0] : '',
            endDate: proj.end_date ? proj.end_date.split('T')[0] : '',
            description: proj.project_description
        })),

        profileCompletion: 0,
        isFresher: personal_info?.is_fresher !== undefined ? personal_info.is_fresher : true,
        experienceYears: personal_info?.experience_years || 0,
        resumeUrl: personal_info?.resume_pdf ? 'Resume Uploaded' : ''
    };
};

export const mapProfileToBackend = (state) => {
    if (!state) return null;
    return {
        personal_info: {
            name: state.name,
            email: state.email,
            phone_number: state.phone,
            location: state.location,
            github_url: state.github,
            linkedin_url: state.linkedin,
            is_fresher: state.isFresher,
            experience_years: state.isFresher ? 0 : parseInt(state.experienceYears || 0),
            skills: (state.skills || []).map(s => s.name),
            profile_description: state.about,
            title: state.title // Optional pass-through
        },

        experience: (state.experience || []).map(e => ({
            job_title: e.title,
            company_name: e.company,
            location: e.location,
            employment_type: e.employmentType,
            start_date: e.startDate,
            end_date: e.endDate,
            is_current: e.current,
            description: e.description
        })),

        education: (state.education || []).map(e => ({
            institution: e.school,
            degree: e.degree,
            field_of_study: e.fieldOfStudy,
            start_date: e.startDate,
            end_date: e.endDate,
            grade_or_cgpa: e.grade,
            description: e.description,
            graduation_year: e.endDate ? new Date(e.endDate).getFullYear().toString() : null
        })),

        achievements: (state.achievements || []).map(a => ({
            title: a.title,
            issuer: a.issuer,
            date: a.date,
            description: a.description
        })),

        projects: (state.projects || []).map(p => ({
            project_title: p.title,
            project_description: p.description,
            technologies_used: p.technologies,
            project_link: p.link,
            start_date: p.startDate,
            end_date: p.endDate
        }))
    };
};
