import { useState } from 'react';
import Modal, { ModalFooter } from '../ui/Modal';
import { Button, Input } from '../ui';
import { addEducation } from '../../api/users';

const AddEducationModal = ({ isOpen, onClose, onSuccess }) => {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        degree: '',
        institution: '',
        graduation_year: '',
        gpa: ''
    });
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!formData.degree || !formData.institution) {
            setError('Degree and Institution are required');
            return;
        }

        setLoading(true);

        try {
            const payload = {
                ...formData,
                graduation_year: formData.graduation_year ? parseInt(formData.graduation_year) : null,
                gpa: formData.gpa ? parseFloat(formData.gpa) : null
            };

            const result = await addEducation(payload);

            if (result.success) {
                onSuccess();
                onClose();
                setFormData({ degree: '', institution: '', graduation_year: '', gpa: '' });
            } else {
                setError(result.message || 'Failed to add education');
            }
        } catch (err) {
            console.error('Add Education Error:', err);
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
            title="Add Education"
            size="md"
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                    label="Degree"
                    placeholder="e.g. Bachelor of Science in Computer Science"
                    value={formData.degree}
                    onChange={(e) => setFormData(prev => ({ ...prev, degree: e.target.value }))}
                    required
                />

                <Input
                    label="Institution"
                    placeholder="e.g. Stanford University"
                    value={formData.institution}
                    onChange={(e) => setFormData(prev => ({ ...prev, institution: e.target.value }))}
                    required
                />

                <div className="grid grid-cols-2 gap-4">
                    <Input
                        label="Graduation Year"
                        type="number"
                        placeholder="YYYY"
                        value={formData.graduation_year}
                        onChange={(e) => setFormData(prev => ({ ...prev, graduation_year: e.target.value }))}
                    />

                    <Input
                        label="GPA"
                        type="number"
                        step="0.01"
                        max="4.00"
                        placeholder="e.g. 3.8"
                        value={formData.gpa}
                        onChange={(e) => setFormData(prev => ({ ...prev, gpa: e.target.value }))}
                    />
                </div>

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
                        Add Education
                    </Button>
                </ModalFooter>
            </form>
        </Modal>
    );
};

export default AddEducationModal;
