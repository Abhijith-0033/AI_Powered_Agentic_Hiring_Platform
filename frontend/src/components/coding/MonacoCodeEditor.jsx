import { Editor } from '@monaco-editor/react';

/**
 * Monaco Code Editor Component
 * Props:
 * - value: string - Current code content
 * - onChange: function - Callback when code changes
 * - language: string - Programming language (python3, cpp, javascript, java)
 * - height: string - Editor height (default: 400px)
 * - readOnly: boolean - Whether editor is read-only
 * - theme: string - Editor theme (default: vs-dark)
 */
const MonacoCodeEditor = ({
    value,
    onChange,
    language = 'python3',
    height = '400px',
    readOnly = false,
    theme = 'vs-dark'
}) => {
    // Map our language IDs to Monaco language IDs
    const languageMap = {
        python3: 'python',
        python: 'python',
        cpp: 'cpp',
        javascript: 'javascript',
        js: 'javascript',
        java: 'java'
    };

    const monacoLanguage = languageMap[language.toLowerCase()] || 'python';

    const editorOptions = {
        readOnly,
        minimap: { enabled: false },
        fontSize: 14,
        lineNumbers: 'on',
        scrollBeyondLastLine: false,
        automaticLayout: true,
        tabSize: 4,
        wordWrap: 'on',
        renderLineHighlight: 'all',
        scrollbar: {
            vertical: 'auto',
            horizontal: 'auto'
        }
    };

    const handleEditorChange = (newValue) => {
        if (onChange && !readOnly) {
            onChange(newValue);
        }
    };

    return (
        <div
            className="border border-gray-700 rounded-lg overflow-hidden"
            style={{ height: height }}
        >
            <Editor
                height="100%"
                language={monacoLanguage}
                value={value}
                onChange={handleEditorChange}
                theme={theme}
                options={editorOptions}
                loading={
                    <div className="flex items-center justify-center h-full bg-gray-900">
                        <div className="text-white">Loading editor...</div>
                    </div>
                }
            />
        </div>
    );
};

export default MonacoCodeEditor;
