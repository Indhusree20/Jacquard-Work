import React, { useRef, useState } from 'react';
import { UploadCloud, FileText, Image as ImageIcon, X } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

interface DesignFileUploaderProps {
  files: File[];
  onChange: (files: File[]) => void;
  maxFiles?: number;
}

export const DesignFileUploader: React.FC<DesignFileUploaderProps> = ({
  files,
  onChange,
  maxFiles = 5
}) => {
  const { language } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFilesAdded = (incomingFiles: FileList | null) => {
    if (!incomingFiles) return;
    const validNewFiles: File[] = [];
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp', 'application/pdf'];

    for (let i = 0; i < incomingFiles.length; i++) {
      const file = incomingFiles[i];
      if (allowedTypes.includes(file.type)) {
        validNewFiles.push(file);
      }
    }

    const combined = [...files, ...validNewFiles].slice(0, maxFiles);
    onChange(combined);
  };

  const handleRemove = (index: number) => {
    const updated = files.filter((_, i) => i !== index);
    onChange(updated);
  };

  return (
    <div className="space-y-3">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          handleFilesAdded(e.dataTransfer.files);
        }}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
          dragOver
            ? 'border-indigo-600 bg-indigo-50/50'
            : 'border-slate-300 hover:border-indigo-400 bg-slate-50/50'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".jpg,.jpeg,.png,.webp,.pdf"
          className="hidden"
          onChange={(e) => handleFilesAdded(e.target.files)}
        />
        <UploadCloud className="w-10 h-10 mx-auto text-indigo-700 mb-2 stroke-[1.5]" />
        <p className="text-sm font-semibold text-slate-800">
          {language === 'ta'
            ? 'கோப்புகளை இங்கே இழுத்துப் போடவும் அல்லது தேர்வு செய்ய கிளிக் செய்யவும்'
            : 'Drag & drop design graphs here or click to browse'}
        </p>
        <p className="text-xs text-slate-500 mt-1">
          {language === 'ta'
            ? 'ஆதரிக்கப்படும் வடிவங்கள்: JPG, PNG, WebP, PDF (அதிகபட்சம் 15MB)'
            : 'Supports JPG, PNG, WebP, PDF graphs & motifs (Max 15MB)'}
        </p>
      </div>

      {/* Selected Files Preview List */}
      {files.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
          {files.map((file, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-2.5 bg-white border border-slate-200 rounded-lg shadow-2xs text-xs"
            >
              <div className="flex items-center gap-2 overflow-hidden">
                {file.type.includes('image') ? (
                  <ImageIcon className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <FileText className="w-4 h-4 text-red-600 shrink-0" />
                )}
                <span className="font-medium text-slate-800 truncate">{file.name}</span>
                <span className="text-slate-400 shrink-0">
                  ({(file.size / 1024).toFixed(0)} KB)
                </span>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemove(idx);
                }}
                className="p-1 text-slate-400 hover:text-red-600 rounded-md hover:bg-slate-100 transition-colors shrink-0"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
