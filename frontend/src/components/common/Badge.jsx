const Badge = ({ status }) => {
  const statusMap = {
    PENDING:     { label: 'Pendiente',   className: 'badge-pending' },
    CONFIRMED:   { label: 'Confirmada',  className: 'badge-confirmed' },
    IN_PROGRESS: { label: 'En consulta', className: 'badge-in-progress' },
    COMPLETED:   { label: 'Completada',  className: 'badge-completed' },
    CANCELLED:   { label: 'Cancelada',   className: 'badge-cancelled' },
    NO_SHOW:     { label: 'No asistió',  className: 'badge-no-show' },
  };
  const config = statusMap[status] || { label: status, className: 'badge bg-gray-100 text-gray-700' };
  return <span className={config.className}>{config.label}</span>;
};

export default Badge;