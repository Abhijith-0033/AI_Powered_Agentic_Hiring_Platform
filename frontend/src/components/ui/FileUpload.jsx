import { File, Upload, X } from 'lucide-react';
import { useState } from 'react';

/**
 * File upload component with drag and drop
 * 
 * @param {Object} props
 * @param {string} props.label - Upload label
 * @param {string} props.accept - Accepted file types
 * @param {string} props.hint - Helper text
 * @param {Function} props.onFileSelect - File selection handler (UI only)
 */
const FileUpload = ({
    label,
    accept = '.pdf,.doc,.docx',
    hint = 'PDF, DOC up to 10MB',
    onFileSelect,
    className = '',
}) => {
    const [isDragging, setIsDragging] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        if (file) {
            setSelectedFile(file);
            onFileSelect && onFileSelect(file);
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedFile(file);
            onFileSelect && onFileSelect(file);
        }
    };

    const removeFile = () => {
        setSelectedFile(null);
        onFileSelect && onFileSelect(null);
    };

    return (
        <div className={className}>
            {label && (
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                    {label}
                </label>
            )}

            {!selectedFile ? (
                <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`
            relative border-2 border-dashed rounded-xl
            transition-all duration-300 cursor-pointer group
            ${isDragging
                            ? 'border-primary-500 bg-primary-50 ring-2 ring-primary-500/20'
                            : 'border-neutral-300 hover:border-primary-400 hover:bg-neutral-50'
                        }
          `}
                >
                    <input
                        type="file"
                        accept={accept}
                        onChange={handleFileChange}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />

                    <div className="flex flex-col items-center justify-center py-8 px-4">
                        <div className={`
              p-3 rounded-full mb-3 transition-colors duration-300 shadow-sm
              ${isDragging ? 'bg-primary-100 text-primary-600' : 'bg-neutral-100 text-neutral-500 group-hover:bg-primary-50 group-hover:text-primary-500'}
            `}>
                            <Upload className="w-6 h-6" />
                        </div>

                        <p className="text-sm text-neutral-600 text-center font-medium">
                            <span className="text-primary-600 hover:text-primary-700 transition-colors">Click to upload</span>
                            {' '}or drag and drop
                        </p>

                        {hint && (
                            <p className="text-xs text-neutral-400 mt-1">{hint}</p>
                        )}
                    </div>
                </div>
            ) : (
                <div className="flex items-center gap-3 p-4 bg-white border border-neutral-200 rounded-xl shadow-sm animate-scale-in">
                    <div className="p-2 bg-primary-50 text-primary-600 rounded-lg">
                        <File className="w-5 h-5" />
                    </div>

                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-neutral-900 truncate">
                            {selectedFile.name}
                        </p>
                        <p className="text-xs text-neutral-500">
                            {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                    </div>

                    <button
                        onClick={removeFile}
                        className="p-1.5 rounded-lg text-neutral-400 hover:text-error-600 hover:bg-error-50 transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}
        </div>
    );
};

export default FileUpload;
