import React, { useEffect, useRef } from 'react';
import Quill from 'quill';
import 'quill/dist/quill.snow.css';

// Custom Undo button icon component for Quill editor
const CustomUndo = () => (
  <svg viewBox="0 0 18 18">
    <polygon className="ql-fill ql-stroke" points="6 10 4 12 2 10 6 10" />
    <path
      className="ql-stroke"
      d="M8.09,13.91A4.6,4.6,0,0,0,9,14,5,5,0,1,0,4,9"
    />
  </svg>
);

// Redo button icon component for Quill editor
const CustomRedo = () => (
  <svg viewBox="0 0 18 18">
    <polygon className="ql-fill ql-stroke" points="12 10 14 12 16 10 12 10" />
    <path
      className="ql-stroke"
      d="M9.91,13.91A4.6,4.6,0,0,1,9,14a5,5,0,1,1,5-5"
    />
  </svg>
);

// Undo and redo functions for Custom Toolbar
function undoChange() {
  this.quill.history.undo();
}
function redoChange() {
  this.quill.history.redo();
}

// Add sizes to whitelist and register them
const Size = Quill.import("formats/size");
Size.whitelist = ["extra-small", "small", "medium", "large"];
Quill.register(Size, true);

// Add fonts to whitelist and register them
const Font = Quill.import("formats/font");
Font.whitelist = [
  "arial",
  "comic-sans",
  "courier-new",
  "georgia",
  "helvetica",
  "lucida"
];
Quill.register(Font, true);

// Modules object for setting up the Quill editor
const modules = {
  toolbar: {
    container: "#toolbar",
    handlers: {
      undo: undoChange,
      redo: redoChange
    }
  },
  history: {
    delay: 500,
    maxStack: 100,
    userOnly: true
  }
};

// Formats objects for setting up the Quill editor
const formats = [
  "header",
  "font",
  "size",
  "bold",
  "italic",
  "underline",
  "align",
  "strike",
  "script",
  "blockquote",
  "background",
  "list",
  "indent",
  "link",
  "image",
  "color",
  "code-block"
];

// Quill Toolbar component
const QuillToolbar = () => (
  <div id="toolbar">
    <span className="ql-formats">
      <select className="ql-font" defaultValue="arial">
        <option value="arial">Arial</option>
        <option value="comic-sans">Comic Sans</option>
        <option value="courier-new">Courier New</option>
        <option value="georgia">Georgia</option>
        <option value="helvetica">Helvetica</option>
        <option value="lucida">Lucida</option>
      </select>
      <select className="ql-size" defaultValue="medium">
        <option value="extra-small">Size 1</option>
        <option value="small">Size 2</option>
        <option value="medium">Size 3</option>
        <option value="large">Size 4</option>
      </select>
      <select className="ql-header" defaultValue="3">
        <option value="1">Heading</option>
        <option value="2">Subheading</option>
        <option value="3">Normal</option>
      </select>
    </span>
    <span className="ql-formats">
      <button className="ql-bold" />
      <button className="ql-italic" />
      <button className="ql-underline" />
      <button className="ql-strike" />
    </span>
    <span className="ql-formats">
      <button className="ql-list" value="ordered" />
      <button className="ql-list" value="bullet" />
      <button className="ql-indent" value="-1" />
      <button className="ql-indent" value="+1" />
    </span>
    <span className="ql-formats">
      <button className="ql-script" value="super" />
      <button className="ql-script" value="sub" />
      <button className="ql-blockquote" />
      <button className="ql-direction" />
    </span>
    <span className="ql-formats">
      <select className="ql-align" />
      <select className="ql-color" />
      <select className="ql-background" />
    </span>
    <span className="ql-formats">
      <button className="ql-link" />
      <button className="ql-image" />
      <button className="ql-video" />
    </span>
    <span className="ql-formats">
      <button className="ql-formula" />
      <button className="ql-code-block" />
      <button className="ql-clean" />
    </span>
    <span className="ql-formats">
      <button className="ql-undo">
        <CustomUndo />
      </button>
      <button className="ql-redo">
        <CustomRedo />
      </button>
    </span>
  </div>
);

const QuillEditor = ({ 
  value = '', 
  onChange, 
  placeholder = 'Enter content...',
  readOnly = false,
  className = '',
  style = {}
}) => {
  const editorRef = useRef(null);
  const quillRef = useRef(null);

  useEffect(() => {
    if (editorRef.current && !quillRef.current) {
      // Suppress deprecated DOM mutation event warnings
      const originalWarn = console.warn;
      const originalError = console.error;
      
      console.warn = (...args) => {
        const message = args[0];
        if (typeof message === 'string' && 
            (message.includes('DOMNodeInserted') || 
             message.includes('mutation event') ||
             message.includes('DOMNodeRemoved'))) {
          return;
        }
        originalWarn.apply(console, args);
      };

      console.error = (...args) => {
        const message = args[0];
        if (typeof message === 'string' && 
            (message.includes('DOMNodeInserted') || 
             message.includes('mutation event') ||
             message.includes('DOMNodeRemoved'))) {
          return;
        }
        originalError.apply(console, args);
      };

      try {
        // Initialize Quill with custom configuration
        quillRef.current = new Quill(editorRef.current, {
          theme: 'snow',
          modules,
          formats,
          placeholder
        });

        // Set initial value
        if (value && value.trim()) {
          quillRef.current.root.innerHTML = value;
        }

        // Set read-only mode
        if (readOnly) {
          quillRef.current.enable(false);
        }

        // Handle text change with debouncing
        let changeTimeout;
        let lastContent = '';
        quillRef.current.on('text-change', () => {
          clearTimeout(changeTimeout);
          changeTimeout = setTimeout(() => {
            const html = quillRef.current.root.innerHTML;
            const text = quillRef.current.getText();
            const normalizedHtml = html === '<p><br></p>' || html === '' ? '' : html;
            
            // Only trigger onChange if content actually changed
            if (normalizedHtml !== lastContent && onChange) {
              lastContent = normalizedHtml;
              onChange({
                html: normalizedHtml,
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
    if (quillRef.current && value !== undefined) {
      try {
        // Only update if the content is actually different to avoid double formatting
        const currentContent = quillRef.current.root.innerHTML;
        const normalizedValue = value === '<p><br></p>' || value === '' ? '' : value;
        const normalizedCurrent = currentContent === '<p><br></p>' || currentContent === '' ? '' : currentContent;
        
        if (normalizedValue !== normalizedCurrent) {
          quillRef.current.root.innerHTML = value;
        }
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
      <QuillToolbar />
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