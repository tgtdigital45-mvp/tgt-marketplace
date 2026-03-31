
import React, { useState, useCallback } from 'react';

interface FileUploadProps {
  id?: string;
  accept: string;
  maxSizeMb: number;
  multiple?: boolean;
  onFileChange: (file: File | null) => void;
  className?: string;
  compact?: boolean;
}

const PDFIcon = () => (
  <svg className="w-8 h-8 mx-auto text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const FileUpload: React.FC<FileUploadProps> = ({ id = `file-upload-${Math.random().toString(36).substr(2, 9)}`, accept, maxSizeMb, onFileChange, className = '', compact = false }) => {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setError(null);
    if (selectedFile.size > maxSizeMb * 1024 * 1024) {
      setError(`Arquivo excede ${maxSizeMb} MB`);
      return;
    }

    setFile(selectedFile);
    onFileChange(selectedFile);

    if (selectedFile.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result as string);
      reader.readAsDataURL(selectedFile);
    } else {
      setPreview('pdf');
    }
  }, [maxSizeMb, onFileChange]);

  const removeFile = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setFile(null);
    setPreview(null);
    setError(null);
    onFileChange(null);
  };

  return (
    <div className={`w-full ${className}`}>
      <div className={`relative flex flex-col justify-center items-center border-2 border-dashed rounded-2xl transition-all h-full ${error ? 'border-red-400 bg-red-50/30' : 'border-gray-200 hover:border-blue-400 hover:bg-blue-50/30'} ${compact ? 'p-2' : 'p-6'}`}>
        {!file ? (
          <label htmlFor={id} className="cursor-pointer w-full h-full flex flex-col items-center justify-center text-center space-y-2">
            <input id={id} name={id} type="file" className="sr-only" onChange={handleFileChange} accept={accept} />
            
            <svg className={`${compact ? 'h-5 w-5' : 'h-10 w-10'} text-gray-400 group-hover:text-blue-500 transition-colors`} stroke="currentColor" fill="none" viewBox="0 0 48 48">
              <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            
            <div className={`flex flex-col text-gray-500 ${compact ? 'text-[8px]' : 'text-sm'}`}>
              <span className="font-bold text-blue-600 hover:text-blue-500">Anexar</span>
              {!compact && <span className="text-xs">ou arraste e solte</span>}
            </div>
            
            {!compact && <p className="text-[10px] text-gray-400">Até {maxSizeMb}MB</p>}
          </label>
        ) : (
          <div className="relative w-full h-full flex items-center justify-center">
            {preview === 'pdf' ? (
              <div className="text-center p-2">
                <PDFIcon />
                <p className="text-[10px] text-gray-500 mt-1 truncate max-w-[100px]">{file.name}</p>
              </div>
            ) : (
              <img src={preview!} alt="Preview" className="max-w-full max-h-full rounded-lg object-cover" />
            )}
            
            <button
              onClick={removeFile}
              className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1 shadow-lg hover:scale-110 transition-transform z-10"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
          </div>
        )}
      </div>
      {error && <p className="mt-1 text-[10px] text-red-500 text-center">{error}</p>}
    </div>
  );
};

export default FileUpload;
