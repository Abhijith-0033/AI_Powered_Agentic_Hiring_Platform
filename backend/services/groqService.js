import Groq from 'groq-sdk';
import dotenv from 'dotenv';

dotenv.config();

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

/**
 * Optimize resume using Groq Llama 3 8B
 * @param {string} resumeText - Full text of the resume
 * @param {object} jobData - Job details (title, required_skills, etc.)
 * @returns {Promise<object>} - Structured JSON from LLM
 */
export const optimizeResumeWithGroq = async (resumeText, jobData) => {
  try {
    const systemPrompt = "You are an ATS resume optimization engine. Return strictly valid JSON.";

    const userPrompt = `
        Provide a structured optimization of the following resume based on the target job.

        TARGET JOB DETAILS:
        - Title: ${jobData.job_title}
        - Required Skills: ${jobData.required_skills}
        - Preferred Skills: ${jobData.preferred_skills || 'N/A'}
        - Min Experience: ${jobData.min_experience || 'N/A'}
        - Required Education: ${jobData.required_education || 'N/A'}
        - Full Job Description: ${jobData.job_description || jobData.description || 'N/A'}

        FULL RESUME CONTENT:
        ${resumeText}

        TASKS:
        1. Identify missing required skills.
        2. Identify missing preferred skills.
        3. Identify education gap.
        4. Identify experience gap.
        5. Provide match_score (0–100).
        6. Rewrite resume to better match job:
           - Improve summary
           - Add relevant bullet points
           - Insert missing skills naturally
           - Improve project descriptions
           - Make ATS-friendly

        STRICT JSON RESPONSE FORMAT:
        {
          "match_score": number,
          "missing_required_skills": [],
          "missing_preferred_skills": [],
          "education_gap": boolean,
          "experience_gap": number,
          "suggestions": {
            "improve_summary": "string",
            "add_skills": ["string"],
            "add_projects": ["string"]
          },
          "optimized_resume": {
            "summary": "string",
            "skills": ["string"],
            "experience": [
              {
                "company": "string",
                "title": "string",
                "duration": "string",
                "responsibilities": ["string"]
              }
            ],
            "projects": [
              {
                "title": "string",
                "description": "string",
                "technologies": ["string"]
              }
            ],
            "education": "string"
          }
        }

        Return ONLY the JSON object.
        `;

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      model: 'llama-3.3-70b-versatile',
      response_format: { type: 'json_object' },
      temperature: 0.2,
    });

    const content = chatCompletion.choices[0]?.message?.content;
    if (!content) {
      throw new Error('Empty response from Groq');
    }

    return JSON.parse(content);
  } catch (error) {
    console.error('Groq Optimization Error:', error);
    throw new Error('Failed to optimize resume with Groq: ' + error.message);
  }
};

/**
 * Analyze Resume vs Job Match + Gap Bridging recommendations
 * @param {string} resumeText 
 * @param {object} jobData 
 */
export const analyzeMatchWithGroq = async (resumeText, jobData) => {
  try {
    const systemPrompt = "You are a Career Coach and Technical Recruiter expert. Return strictly valid JSON.";

    const userPrompt = `
        Evaluate the match between the following resume and the target job. 
        Provide specific Gap Bridging recommendations for missing skills.

        TARGET JOB:
        - Title: ${jobData.job_title}
        - Skills: ${jobData.required_skills}
        - Description: ${jobData.job_description || jobData.description || 'N/A'}

        RESUME:
        ${resumeText}

        OUTPUT FORMAT (JSON ONLY):
        {
          "match_percentage": number (0-100),
          "skill_analysis": {
            "matching_skills": ["string"],
            "missing_skills": ["string"]
          },
          "culture_fit_analysis": "string (Short paragraph about alignment with role/industry)",
          "gap_bridging": [
            {
              "missing_skill": "string",
              "recommended_project": {
                "title": "string",
                "description": "string",
                "tech_stack": ["string"]
              },
              "learning_resources": [
                { "title": "string", "platform": "Coursera/Udemy/YouTube", "type": "Course" }
              ]
            }
          ],
          "overall_reasoning": "string"
        }
        `;

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      model: 'llama-3.3-70b-versatile',
      response_format: { type: 'json_object' },
      temperature: 0.3,
    });

    const content = chatCompletion.choices[0]?.message?.content;
    if (!content) throw new Error('Empty response from Groq');

    return JSON.parse(content);
  } catch (error) {
    console.error('Groq Analysis Error:', error);
    throw new Error('Failed to analyze match: ' + error.message);
  }
};
