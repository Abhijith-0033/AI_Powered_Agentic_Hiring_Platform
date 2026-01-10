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
                <label className="block text-sm font-medium text-dark-200 mb-1.5">
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
            transition-all duration-300 cursor-pointer
            ${isDragging
                            ? 'border-primary-500 bg-primary-500/10'
                            : 'border-dark-600 hover:border-dark-500 hover:bg-dark-800/50'
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
              p-3 rounded-full mb-3 transition-colors duration-300
              ${isDragging ? 'bg-primary-500/20' : 'bg-dark-700'}
            `}>
                            <Upload className={`w-6 h-6 ${isDragging ? 'text-primary-400' : 'text-dark-400'}`} />
                        </div>

                        <p className="text-sm text-dark-200 text-center">
                            <span className="text-primary-400 font-medium">Click to upload</span>
                            {' '}or drag and drop
                        </p>

                        {hint && (
                            <p className="text-xs text-dark-500 mt-1">{hint}</p>
                        )}
                    </div>
                </div>
            ) : (
                <div className="flex items-center gap-3 p-4 bg-dark-800 border border-dark-600 rounded-xl">
                    <div className="p-2 bg-primary-500/20 rounded-lg">
                        <File className="w-5 h-5 text-primary-400" />
                    </div>

                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-dark-100 truncate">
                            {selectedFile.name}
                        </p>
                        <p className="text-xs text-dark-500">
                            {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                    </div>

                    <button
                        onClick={removeFile}
                        className="p-1.5 rounded-lg text-dark-400 hover:text-dark-100 hover:bg-dark-700 transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}
        </div>
    );
};

export default FileUpload;
