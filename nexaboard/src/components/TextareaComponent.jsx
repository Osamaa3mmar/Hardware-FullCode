import { useState, useRef } from 'react';

const TextareaComponent = ({ fontSize, textColor }) => {
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const textareaRef = useRef(null);

  const handleChange = (e) => {
    const newValue = e.target.value;
    const textarea = textareaRef.current;
    
    textarea.value = newValue;
    
    if (textarea.scrollHeight > 500) {
      setError('Text exceeds maximum height. Input blocked.');
      textarea.value = text;
    } else {
      setText(newValue);
      setError('');
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text');
    const newValue = text + pastedText;
    const textarea = textareaRef.current;
    
    textarea.value = newValue;
    
    if (textarea.scrollHeight > 500) {
      setError('Pasted text exceeds maximum height. Paste rejected.');
      textarea.value = text;
    } else {
      setText(newValue);
      setError('');
    }
  };

  return (
    <div className="flex flex-col">
      <textarea
        ref={textareaRef}
        value={text}
        onChange={handleChange}
        onPaste={handlePaste}
        placeholder="Enter your text here..."
        className="border-2 border-base-300 p-4 rounded-xl bg-base-100 focus:outline-none focus:border-primary transition-colors text-base-content"
        style={{
          width: '600px',
          height: '500px',
          fontSize: `${fontSize}px`,
          color: textColor,
          resize: 'none',
          overflow: 'hidden'
        }}
      />
      {error && (
        <div className="alert alert-error mt-3 max-w-[600px] rounded-xl">
          <span className="text-sm">{error}</span>
        </div>
      )}
    </div>
  );
};

export default TextareaComponent;
