const Input = ({ label, name, type = 'text', value, onChange, placeholder, required, error }) => {
  return (
    <div className="mb-4">
      {label && (
        <label className="label" htmlFor={name}>
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className={`input-field ${error ? 'border-red-400' : ''}`}
      />
      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
    </div>
  );
};

export default Input;