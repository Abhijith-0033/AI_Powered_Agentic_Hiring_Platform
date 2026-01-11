import { useState } from 'react';
import Modal, { ModalFooter } from '../ui/Modal';
import { Button, Input, Textarea } from '../ui';
import { addExperience } from '../../api/users'; // We need to add this to users.js

const AddExperienceModal = ({ isOpen, onClose, onSuccess }) => {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        company: '',
        location: '',
        start_date: '',
        end_date: '',
        current: false,
        description: ''
    });
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!formData.title || !formData.company || !formData.start_date) {
            setError('Title, Company, and Start Date are required');
            return;
        }

        setLoading(true);

        try {
            const result = await addExperience(formData);

            if (result.success) {
                onSuccess();
                onClose();
                setFormData({
                    title: '',
                    company: '',
                    location: '',
                    start_date: '',
                    end_date: '',
                    current: false,
                    description: ''
                });
            } else {
                setError(result.message || 'Failed to add experience');
            }
        } catch (err) {
            console.error('Add Experience Error:', err);
            const errorMessage = err.response?.data?.message || err.message || 'An error occurred. Please try again.';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Add Experience"
            size="lg"
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <Input
                        label="Job Title"
                        placeholder="e.g. Senior Software Engineer"
                        value={formData.title}
                        onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                        required
                    />
                    <Input
                        label="Company"
                        placeholder="e.g. Google"
                        value={formData.company}
                        onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
                        required
                    />
                </div>

                <Input
                    label="Location"
                    placeholder="e.g. Mountain View, CA or Remote"
                    value={formData.location}
                    onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                />

                <div className="grid grid-cols-2 gap-4">
                    <Input
                        label="Start Date"
                        type="date"
                        value={formData.start_date}
                        onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                        required
                    />

                    <div className="space-y-2">
                        <Input
                            label="End Date"
                            type="date"
                            value={formData.end_date}
                            onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                            disabled={formData.current}
                        />
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="current-job"
                                checked={formData.current}
                                onChange={(e) => setFormData(prev => ({ ...prev, current: e.target.checked, end_date: e.target.checked ? '' : prev.end_date }))}
                                className="rounded border-dark-600 bg-dark-800 text-primary-500 focus:ring-primary-500"
                            />
                            <label htmlFor="current-job" className="text-sm text-dark-300 select-none">
                                I currently work here
                            </label>
                        </div>
                    </div>
                </div>

                <Textarea
                    label="Description"
                    placeholder="Describe your responsibilities and achievements..."
                    rows={4}
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                />

                {error && (
                    <div className="text-red-500 text-sm bg-red-500/10 p-2 rounded">
                        {error}
                    </div>
                )}

                <ModalFooter>
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={onClose}
                        disabled={loading}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        loading={loading}
                    >
                        Add Experience
                    </Button>
                </ModalFooter>
            </form>
        </Modal>
    );
};

export default AddExperienceModal;
