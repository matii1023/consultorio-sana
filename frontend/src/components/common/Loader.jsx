const Loader = ({ size = 'md', text = 'Cargando...' }) => {
  const sizes = {
    sm: 'w-5 h-5',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return (
    <div className="flex flex-col items-center justify-center gap-3 py-8">
      <div className={`${sizes[size]} border-3 border-sana-200 border-t-sana-500 rounded-full animate-spin`} />
      {text && <p className="text-sm text-sana-500">{text}</p>}
    </div>
  );
};

export default Loader;