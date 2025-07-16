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
      // Suppress deprecated DOM mutation event warnings more effectively
      const originalWarn = console.warn;
      const originalError = console.error;
      
      console.warn = (...args) => {
        const message = args[0];
        if (typeof message === 'string' && 
            (message.includes('DOMNodeInserted') || 
             message.includes('mutation event') ||
             message.includes('DOMNodeRemoved'))) {
          return; // Suppress Quill's deprecated mutation event warnings
        }
        originalWarn.apply(console, args);
      };

      console.error = (...args) => {
        const message = args[0];
        if (typeof message === 'string' && 
            (message.includes('DOMNodeInserted') || 
             message.includes('mutation event') ||
             message.includes('DOMNodeRemoved'))) {
          return; // Suppress Quill's deprecated mutation event warnings
        }
        originalError.apply(console, args);
      };

      // Default modules configuration with modern settings
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
        },
        history: {
          delay: 2000,
          maxStack: 500,
          userOnly: true
        }
      };

      // Merge with custom modules
      const finalModules = { ...defaultModules, ...modules };

      try {
        // Initialize Quill with error handling
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

        // Handle text change with debouncing
        let changeTimeout;
        quillRef.current.on('text-change', () => {
          clearTimeout(changeTimeout);
          changeTimeout = setTimeout(() => {
            const html = quillRef.current.root.innerHTML;
            const text = quillRef.current.getText();
            
            if (onChange) {
              onChange({
                html: html === '<p><br></p>' ? '' : html,
                text: text.trim(),
                quill: quillRef.current
              });
            }
          }, 100);
        });

      } catch (error) {
        console.error('Failed to initialize Quill editor:', error);
      }

      // Restore console methods after initialization
      setTimeout(() => {
        console.warn = originalWarn;
        console.error = originalError;
      }, 1000);
    }

    return () => {
      if (quillRef.current) {
        try {
          quillRef.current.off('text-change');
          quillRef.current = null;
        } catch (error) {
          console.error('Error cleaning up Quill editor:', error);
        }
      }
    };
  }, []);

  // Update value when prop changes
  useEffect(() => {
    if (quillRef.current && value !== quillRef.current.root.innerHTML) {
      try {
        quillRef.current.root.innerHTML = value;
      } catch (error) {
        console.error('Error updating Quill editor value:', error);
      }
    }
  }, [value]);

  // Update read-only mode
  useEffect(() => {
    if (quillRef.current) {
      try {
        quillRef.current.enable(!readOnly);
      } catch (error) {
        console.error('Error updating Quill editor read-only mode:', error);
      }
    }
  }, [readOnly]);

  return (
    <div className={`quill-editor ${className}`} style={style}>
      <div ref={editorRef} />
      <style>{`
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