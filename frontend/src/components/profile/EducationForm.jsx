import { Briefcase, Plus, Trash2 } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle, Button, Input, Textarea } from '../ui';

const EducationForm = ({ education, onUpdate, onAdd, onRemove }) => {
    return (
        <Card className="mb-6">
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2"><Briefcase className="w-5 h-5" /> Education</CardTitle>
                <Button variant="outline" size="sm" onClick={onAdd} leftIcon={<Plus className="w-3 h-3" />}>Add Education</Button>
            </CardHeader>
            <CardContent className="space-y-6">
                {education.map((edu, index) => (
                    <div key={index} className="p-4 border border-neutral-200 rounded-lg relative">
                        <button onClick={() => onRemove(index)} className="absolute top-4 right-4 text-neutral-400 hover:text-error-500"><Trash2 className="w-4 h-4" /></button>
                        <div className="grid md:grid-cols-2 gap-4 pr-8">
                            <Input label="Institution" value={edu.school || ''} onChange={(e) => onUpdate(index, 'school', e.target.value)} />
                            <Input label="Degree" value={edu.degree || ''} onChange={(e) => onUpdate(index, 'degree', e.target.value)} />
                            <Input label="Field of Study" value={edu.fieldOfStudy || ''} onChange={(e) => onUpdate(index, 'fieldOfStudy', e.target.value)} />
                            <Input label="Grade / CGPA" value={edu.grade || ''} onChange={(e) => onUpdate(index, 'grade', e.target.value)} />
                            <Input label="Start Date" type="date" value={edu.startDate || ''} onChange={(e) => onUpdate(index, 'startDate', e.target.value)} />
                            <Input label="End Date" type="date" value={edu.endDate || ''} onChange={(e) => onUpdate(index, 'endDate', e.target.value)} />
                        </div>
                        <div className="mt-4">
                            <Textarea label="Description" value={edu.description || ''} onChange={(e) => onUpdate(index, 'description', e.target.value)} rows={2} />
                        </div>
                    </div>
                ))}
                {education.length === 0 && <p className="text-center text-neutral-500 py-4">No education added yet.</p>}
            </CardContent>
        </Card>
    );
};

export default EducationForm;
