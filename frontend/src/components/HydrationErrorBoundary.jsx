// src/components/HydrationErrorBoundary.jsx
import { Component } from 'react';

class HydrationErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    // Solo capturar errores de hidratación
    if (error.message && error.message.includes('hydration')) {
      return { hasError: true };
    }
    return { hasError: false };
  }

  componentDidCatch(error, errorInfo) {
    console.log('Error de hidratación capturado (se recuperará automáticamente):', error);
  }

  render() {
    if (this.state.hasError) {
      // Durante el error, renderizar mínimo para permitir recuperación
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-sm text-gray-600">Cargando aplicación...</p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default HydrationErrorBoundary;