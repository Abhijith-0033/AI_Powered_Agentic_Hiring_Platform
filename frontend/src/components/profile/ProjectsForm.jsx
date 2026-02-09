import { FolderGit2, Plus, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, Button, Input, Textarea } from '../ui';

const ProjectsForm = ({ projects, onUpdate, onAdd, onRemove }) => {
    return (
        <Card className="mb-6">
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2"><FolderGit2 className="w-5 h-5" /> Projects</CardTitle>
                <Button variant="outline" size="sm" onClick={onAdd} leftIcon={<Plus className="w-3 h-3" />}>Add Project</Button>
            </CardHeader>
            <CardContent className="space-y-6">
                {projects.map((proj, index) => (
                    <div key={index} className="p-4 border border-neutral-200 rounded-lg relative">
                        <button onClick={() => onRemove(index)} className="absolute top-4 right-4 text-neutral-400 hover:text-error-500"><Trash2 className="w-4 h-4" /></button>
                        <div className="grid md:grid-cols-2 gap-4 pr-8">
                            <Input label="Project Title" value={proj.title || ''} onChange={(e) => onUpdate(index, 'title', e.target.value)} />
                            <Input label="Project Link" value={proj.link || ''} onChange={(e) => onUpdate(index, 'link', e.target.value)} />
                            <Input label="Start Date" type="date" value={proj.startDate || ''} onChange={(e) => onUpdate(index, 'startDate', e.target.value)} />
                            <Input label="End Date" type="date" value={proj.endDate || ''} onChange={(e) => onUpdate(index, 'endDate', e.target.value)} />
                            <Input label="Technologies (comma separated)"
                                value={Array.isArray(proj.technologies) ? proj.technologies.join(', ') : (proj.technologies || '')}
                                onChange={(e) => onUpdate(index, 'technologies', e.target.value.split(',').map(t => t.trim()))}
                            />
                        </div>
                        <div className="mt-4">
                            <Textarea label="Description" value={proj.description || ''} onChange={(e) => onUpdate(index, 'description', e.target.value)} rows={2} />
                        </div>
                    </div>
                ))}
                {projects.length === 0 && <p className="text-center text-neutral-500 py-4">No projects added yet.</p>}
            </CardContent>
        </Card>
    );
};

export default ProjectsForm;
