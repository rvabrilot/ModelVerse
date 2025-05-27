// src/components/shared/FileUploadZone.tsx
"use client";
import type { ChangeEvent, DragEvent } from 'react';
import React, { useState, useCallback, useRef } from 'react';
import { UploadCloud } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface FileUploadZoneProps {
  onFilesAccepted: (files: File[]) => void;
  acceptedFileTypes?: string;
  maxFiles?: number;
  maxFileSizeMB?: number;
  label?: string;
  description?: string;
  className?: string;
  id?: string;
}

export function FileUploadZone({
  onFilesAccepted,
  acceptedFileTypes = ".pt,.onnx,.tf,.h5,.pb,image/*,.txt,.csv,.json", // Common model and data types
  maxFiles = 5,
  maxFileSizeMB = 1024, // Max 1GB per file
  label = "Drag & drop files here, or click to browse",
  description,
  className,
  id = "file-upload",
}: FileUploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleDragEnter = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragging) setIsDragging(true);
  }, [isDragging]);

  const processFiles = useCallback((fileList: FileList) => {
    const files = Array.from(fileList);
    const validFiles: File[] = [];
    let invalidFileFound = false;

    if (files.length > maxFiles) {
      toast({
        title: "Too many files",
        description: `You can upload a maximum of ${maxFiles} files at a time.`,
        variant: "destructive",
      });
      return;
    }

    files.forEach(file => {
      if (file.size > maxFileSizeMB * 1024 * 1024) {
        toast({
          title: "File too large",
          description: `File "${file.name}" exceeds the ${maxFileSizeMB}MB size limit.`,
          variant: "destructive",
        });
        invalidFileFound = true;
        return;
      }
      // Basic type check (can be improved with more specific MIME types)
      if (acceptedFileTypes) {
        const typesArray = acceptedFileTypes.split(',');
        const fileExtension = `.${file.name.split('.').pop()?.toLowerCase()}`;
        const fileMimeType = file.type.toLowerCase();
        
        const isValidType = typesArray.some(type => 
          type.startsWith('.') ? fileExtension === type.toLowerCase() : fileMimeType.startsWith(type.replace('/*', ''))
        );

        if (!isValidType) {
           toast({
            title: "Invalid file type",
            description: `File "${file.name}" is not an accepted type. Accepted: ${acceptedFileTypes}`,
            variant: "destructive",
          });
          invalidFileFound = true;
          return;
        }
      }
      validFiles.push(file);
    });

    if (validFiles.length > 0 && !invalidFileFound) {
      onFilesAccepted(validFiles);
      toast({
        title: "Files selected",
        description: `${validFiles.length} file(s) ready for processing.`,
      });
    } else if (validFiles.length === 0 && files.length > 0 && !invalidFileFound) {
       toast({
        title: "No valid files selected",
        description: "Please select files of the accepted types and size.",
        variant: "destructive",
      });
    }
  }, [onFilesAccepted, acceptedFileTypes, maxFiles, maxFileSizeMB, toast]);

  const handleDrop = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
      e.dataTransfer.clearData();
    }
  }, [processFiles]);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center w-full p-8 border-2 border-dashed rounded-lg cursor-pointer transition-colors",
        isDragging ? "border-primary bg-accent/10" : "border-border hover:border-accent",
        className
      )}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      aria-labelledby={`${id}-label`}
      aria-describedby={description ? `${id}-desc` : undefined}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && handleClick()}
    >
      <input
        ref={fileInputRef}
        id={id}
        type="file"
        multiple={maxFiles > 1}
        accept={acceptedFileTypes}
        onChange={handleFileChange}
        className="hidden"
      />
      <UploadCloud className={cn("w-12 h-12 mb-4", isDragging ? "text-primary" : "text-muted-foreground")} />
      <p id={`${id}-label`} className="mb-2 text-sm font-semibold text-center text-foreground">
        {label}
      </p>
      {description && (
         <p id={`${id}-desc`} className="text-xs text-center text-muted-foreground">{description}</p>
      )}
      <p className="text-xs text-center text-muted-foreground mt-2">
        Accepted: {acceptedFileTypes}. Max files: {maxFiles}. Max size: {maxFileSizeMB === 1024 ? "1GB" : `${maxFileSizeMB}MB`}/file.
      </p>
      <Button variant="link" size="sm" className="mt-2 text-primary">
        Or click to browse
      </Button>
    </div>
  );
}
