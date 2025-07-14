import React, { useEffect, useRef } from 'react';
import Quill from 'quill';
import 'quill/dist/quill.snow.css';

const QuillEditor = ({ 
  value = '', 
  onChange, 
  placeholder = 'Enter content...',
  readOnly = false,
  theme = 'snow',
  modules = {},
  formats = [],
  className = '',
  style = {}
}) => {
  const editorRef = useRef(null);
  const quillRef = useRef(null);

  useEffect(() => {
    if (editorRef.current && !quillRef.current) {
      // Default modules configuration
      const defaultModules = {
        toolbar: [
          [{ 'header': [1, 2, 3, false] }],
          ['bold', 'italic', 'underline', 'strike'],
          [{ 'color': [] }, { 'background': [] }],
          [{ 'list': 'ordered'}, { 'list': 'bullet' }],
          [{ 'align': [] }],
          ['link', 'image'],
          ['clean']
        ],
        clipboard: {
          matchVisual: false
        }
      };

      // Merge with custom modules
      const finalModules = { ...defaultModules, ...modules };

      // Initialize Quill
      quillRef.current = new Quill(editorRef.current, {
        theme,
        modules: finalModules,
        formats: formats.length > 0 ? formats : [
          'header', 'bold', 'italic', 'underline', 'strike',
          'color', 'background', 'list', 'bullet', 'align',
          'link', 'image', 'clean'
        ],
        placeholder
      });

      // Set initial value
      if (value) {
        quillRef.current.root.innerHTML = value;
      }

      // Set read-only mode
      if (readOnly) {
        quillRef.current.enable(false);
      }

      // Handle text change
      quillRef.current.on('text-change', () => {
        const html = quillRef.current.root.innerHTML;
        const text = quillRef.current.getText();
        
        if (onChange) {
          onChange({
            html: html === '<p><br></p>' ? '' : html,
            text: text.trim(),
            quill: quillRef.current
          });
        }
      });
    }

    return () => {
      if (quillRef.current) {
        quillRef.current = null;
      }
    };
  }, []);

  // Update value when prop changes
  useEffect(() => {
    if (quillRef.current && value !== quillRef.current.root.innerHTML) {
      quillRef.current.root.innerHTML = value;
    }
  }, [value]);

  // Update read-only mode
  useEffect(() => {
    if (quillRef.current) {
      quillRef.current.enable(!readOnly);
    }
  }, [readOnly]);

  return (
    <div className={`quill-editor ${className}`} style={style}>
      <div ref={editorRef} />
      <style jsx>{`
        .quill-editor .ql-editor {
          min-height: 200px;
          font-family: inherit;
        }
        .quill-editor .ql-toolbar {
          border-top-left-radius: 0.375rem;
          border-top-right-radius: 0.375rem;
          border-color: #d1d5db;
        }
        .quill-editor .ql-container {
          border-bottom-left-radius: 0.375rem;
          border-bottom-right-radius: 0.375rem;
          border-color: #d1d5db;
        }
        .quill-editor .ql-editor:focus {
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }
        .quill-editor .ql-editor.ql-blank::before {
          color: #9ca3af;
          font-style: italic;
        }
      `}</style>
    </div>
  );
};

export default QuillEditor; 