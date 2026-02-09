import { X } from 'lucide-react';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, Input, Button, Badge } from '../ui';

const SkillsForm = ({ skills, onAdd, onRemove }) => {
    const [newSkill, setNewSkill] = useState('');

    const handleAdd = () => {
        if (newSkill.trim()) {
            onAdd(newSkill.trim());
            setNewSkill('');
        }
    };

    return (
        <Card className="mb-6">
            <CardHeader><CardTitle>Skills</CardTitle></CardHeader>
            <CardContent>
                <div className="flex flex-wrap gap-2 mb-4">
                    {skills.map(skill => (
                        <Badge key={skill.name} variant="primary" className="flex items-center gap-1 pr-1">
                            {skill.name}
                            <button onClick={() => onRemove(skill.name)} className="p-0.5 hover:bg-primary-400/20 rounded"><X className="w-3 h-3" /></button>
                        </Badge>
                    ))}
                </div>
                <div className="flex gap-2">
                    <Input
                        placeholder="Add a skill..."
                        value={newSkill}
                        onChange={(e) => setNewSkill(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleAdd()}
                    />
                    <Button onClick={handleAdd}>Add</Button>
                </div>
            </CardContent>
        </Card>
    );
};

export default SkillsForm;
