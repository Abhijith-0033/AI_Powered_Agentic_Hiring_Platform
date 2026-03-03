import Groq from 'groq-sdk';
import dotenv from 'dotenv';

dotenv.config();

// specific client for Career Roadmap to avoid rate limits on main key
const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY_CAREER || process.env.GROQ_API_KEY,
});

/**
 * Generate a visual career roadmap using Llama 3
 * @param {string} skill - The target skill to learn (e.g., "Full Stack Development")
 * @param {string} currentLevel - User's current level (Beginner, Intermediate, Advanced)
 * @returns {Promise<object>} - { nodes: [], edges: [] } formatted for React Flow
 */
export const generateCareerRoadmap = async (skill, currentLevel = 'Beginner') => {
    try {
        const systemPrompt = `
        You are a Senior Technical Career Coach and Curriculum Architect. 
        Your goal is to create a structured, step-by-step learning roadmap for a specific skill.
        
        OUTPUT FORMAT:
        Strictly return a JSON object compatible with a graph visualization library (like React Flow).
        The structure must be:
        {
          "nodes": [
            { "id": "1", "data": { "label": "Fundamentals", "description": "...", "resources": [{"title": "...", "url": "..."}], "estimated_time": "2 weeks" }, "position": { "x": 100, "y": 100 } }
          ],
          "edges": [
            { "id": "e1-2", "source": "1", "target": "2" }
          ]
        }
        
        RULES:
        1. Create a "Metro Map" style progression.
        2. Start from ${currentLevel} level concepts.
        3. End with "Mastery" or "Professional Project" nodes.
        4. Include 6-10 distinct nodes (milestones).
        5. 'position' is important: arrange them logically from top to bottom or left to right (increment x or y).
        6. 'resources' should be real, high-quality free or paid links (Coursera, Udemy, YouTube, Documentation).
        `;

        const userPrompt = `Create a learning roadmap for: ${skill}. Current Level: ${currentLevel}.`;

        const completion = await groq.chat.completions.create({
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
            ],
            model: 'llama-3.3-70b-versatile',
            response_format: { type: 'json_object' },
            temperature: 0.3
        });

        const content = completion.choices[0]?.message?.content;
        if (!content) throw new Error('Empty response from AI');

        return JSON.parse(content);

    } catch (error) {
        console.error('Career Roadmap Generation Error:', error);
        throw new Error('Failed to generate roadmap: ' + error.message);
    }
};
