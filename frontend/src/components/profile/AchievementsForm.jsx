import { Award, Plus, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, Button, Input, Textarea } from '../ui';

const AchievementsForm = ({ achievements, onUpdate, onAdd, onRemove }) => {
    return (
        <Card className="mb-6">
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2"><Award className="w-5 h-5" /> Achievements</CardTitle>
                <Button variant="outline" size="sm" onClick={onAdd} leftIcon={<Plus className="w-3 h-3" />}>Add Achievement</Button>
            </CardHeader>
            <CardContent className="space-y-6">
                {achievements.map((ach, index) => (
                    <div key={index} className="p-4 border border-neutral-200 rounded-lg relative">
                        <button onClick={() => onRemove(index)} className="absolute top-4 right-4 text-neutral-400 hover:text-error-500"><Trash2 className="w-4 h-4" /></button>
                        <div className="grid md:grid-cols-2 gap-4 pr-8">
                            <Input label="Title" value={ach.title || ''} onChange={(e) => onUpdate(index, 'title', e.target.value)} />
                            <Input label="Issuer/Organization" value={ach.issuer || ''} onChange={(e) => onUpdate(index, 'issuer', e.target.value)} />
                            <Input label="Date" type="date" value={ach.date || ''} onChange={(e) => onUpdate(index, 'date', e.target.value)} />
                        </div>
                        <div className="mt-4">
                            <Textarea label="Description" value={ach.description || ''} onChange={(e) => onUpdate(index, 'description', e.target.value)} rows={2} />
                        </div>
                    </div>
                ))}
                {achievements.length === 0 && <p className="text-center text-neutral-500 py-4">No achievements added yet.</p>}
            </CardContent>
        </Card>
    );
};

export default AchievementsForm;
