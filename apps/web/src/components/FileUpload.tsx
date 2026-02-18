
import React, { useState, useCallback } from 'react';

interface FileUploadProps {
  id?: string;
  accept: string;
  maxSizeMb: number;
  multiple?: boolean;
  onFileChange: (file: File | null) => void;
}

const PDFIcon = () => (
  <svg className="w-12 h-12 mx-auto text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const FileUpload: React.FC<FileUploadProps> = ({ id = 'file-upload', accept, maxSizeMb, onFileChange }) => {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    // ... rest of handleFileChange
    if (!selectedFile) return;

    setError(null);
    setFile(null);
    setPreview(null);
    onFileChange(null);

    // Validation
    if (selectedFile.size > maxSizeMb * 1024 * 1024) {
      setError(`Arquivo excede ${maxSizeMb} MB`);
      return;
    }

    setFile(selectedFile);
    onFileChange(selectedFile);

    // Preview
    if (selectedFile.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
    } else {
      setPreview('pdf');
    }
  }, [maxSizeMb, onFileChange]);

  const removeFile = () => {
    setFile(null);
    setPreview(null);
    setError(null);
    onFileChange(null);
  };

  return (
    <div>
      <div className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 ${error ? 'border-red-400' : 'border-gray-300'} border-dashed rounded-md`}>
        {!file ? (
          <div className="space-y-1 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
              <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <div className="flex text-sm text-gray-600">
              <label htmlFor={id} className="relative cursor-pointer bg-white rounded-md font-medium text-primary-600 hover:text-primary-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary-500">
                <span>Anexar documento</span>
                <input id={id} name={id} type="file" className="sr-only" onChange={handleFileChange} accept={accept} />
              </label>
              <p className="pl-1">ou arraste e solte</p>
            </div>
            <p className="text-xs text-gray-500">PDF, PNG, JPG até {maxSizeMb}MB</p>
          </div>
        ) : (
          <div className="relative">
            {preview && preview === 'pdf' &&
              <div className="text-center">
                <PDFIcon />
                <p className="text-sm text-gray-600 mt-2">{file.name}</p>
              </div>
            }
            {preview && preview !== 'pdf' && <img src={preview} alt="Preview" className="h-24 w-auto rounded-md" />}
            <button
              type="button"
              onClick={removeFile}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 leading-none hover:bg-red-600"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
          </div>
        )}
      </div>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
};

export default FileUpload;
