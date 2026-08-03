import React from 'react';
import TextareaAutosize from 'react-textarea-autosize';

const EditableField = ({ value, onChange, className = '', style = {}, multiline = false, placeholder = '' }) => {
  const commonStyle = {
    background: 'transparent',
    border: 'none',
    outline: 'none',
    width: '100%',
    fontFamily: 'inherit',
    fontSize: 'inherit',
    fontWeight: 'inherit',
    color: 'inherit',
    textAlign: 'inherit',
    resize: 'none',
    padding: 0,
    margin: 0,
    ...style
  };

  if (multiline) {
    return (
      <TextareaAutosize
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={className}
        style={commonStyle}
        placeholder={placeholder}
      />
    );
  }

  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={className}
      style={commonStyle}
      placeholder={placeholder}
    />
  );
};

export default EditableField;
