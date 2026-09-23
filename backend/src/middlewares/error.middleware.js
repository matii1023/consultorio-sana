const errorHandler = (err, req, res, next) => {
  console.error('❌ Error:', err.message);
  console.error('   Stack:', err.stack);
  console.error('   Query:', err.query || 'N/A');

  res.status(err.status || 500).json({
    message: err.message || 'Error interno del servidor',
    // Solo en desarrollo: incluir el detalle
    ...(process.env.NODE_ENV === 'development' && { detail: err.message }),
  });
};

module.exports = errorHandler;