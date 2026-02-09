import { Briefcase, Plus, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, Button, Input, Textarea, Toggle } from '../ui';

const ExperienceForm = ({ experience, onUpdate, onAdd, onRemove }) => {
    return (
        <Card className="mb-6">
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2"><Briefcase className="w-5 h-5" /> Experience</CardTitle>
                <Button variant="outline" size="sm" onClick={onAdd} leftIcon={<Plus className="w-3 h-3" />}>Add Position</Button>
            </CardHeader>
            <CardContent className="space-y-6">
                {experience.map((exp, index) => (
                    <div key={index} className="p-4 border border-neutral-200 rounded-lg relative">
                        <button onClick={() => onRemove(index)} className="absolute top-4 right-4 text-neutral-400 hover:text-error-500"><Trash2 className="w-4 h-4" /></button>
                        <div className="grid md:grid-cols-2 gap-4 pr-8">
                            <Input label="Job Title" value={exp.title || ''} onChange={(e) => onUpdate(index, 'title', e.target.value)} />
                            <Input label="Company" value={exp.company || ''} onChange={(e) => onUpdate(index, 'company', e.target.value)} />
                            <Input label="Location" value={exp.location || ''} onChange={(e) => onUpdate(index, 'location', e.target.value)} />
                            <Input label="Employment Type" placeholder="Full-time, Part-time..." value={exp.employmentType || ''} onChange={(e) => onUpdate(index, 'employmentType', e.target.value)} />
                            <Input label="Start Date" type="date" value={exp.startDate || ''} onChange={(e) => onUpdate(index, 'startDate', e.target.value)} />
                            {!exp.current && <Input label="End Date" type="date" value={exp.endDate || ''} onChange={(e) => onUpdate(index, 'endDate', e.target.value)} />}
                            <div className="flex items-center gap-2 h-10 mt-6">
                                <Toggle checked={exp.current || false} onChange={(val) => onUpdate(index, 'current', val)} />
                                <span className="text-sm text-neutral-600">Currently working here</span>
                            </div>
                        </div>
                        <div className="mt-4">
                            <Textarea label="Description" value={exp.description || ''} onChange={(e) => onUpdate(index, 'description', e.target.value)} rows={3} />
                        </div>
                    </div>
                ))}
                {experience.length === 0 && <p className="text-center text-neutral-500 py-4">No experience added yet.</p>}
            </CardContent>
        </Card>
    );
};

export default ExperienceForm;
