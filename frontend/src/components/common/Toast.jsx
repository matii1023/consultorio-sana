import { useEffect } from 'react';

const Toast = ({ message, type = 'info', onClose, duration = 4000 }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [onClose, duration]);

  const config = {
    success: { bg: 'bg-emerald-500', icon: '✓' },
    error: { bg: 'bg-red-500', icon: '✕' },
    warning: { bg: 'bg-amber-500', icon: '⚠' },
    info: { bg: 'bg-sana-500', icon: 'ℹ' },
  };

  const { bg, icon } = config[type] || config.info;

  return (
    <div className="animate-slide-up">
      <div className={`${bg} text-white rounded-2xl shadow-xl px-5 py-4 
                       flex items-center gap-3 min-w-[300px] max-w-md`}>
        <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center 
                        font-semibold flex-shrink-0">
          {icon}
        </div>
        <p className="text-sm flex-1">{message}</p>
        <button
          onClick={onClose}
          className="text-white/70 hover:text-white transition text-lg leading-none"
        >
          ✕
        </button>
      </div>
    </div>
  );
};

export default Toast;