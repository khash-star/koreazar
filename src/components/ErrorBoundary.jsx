import React from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    if (typeof window !== 'undefined' && window.console) {
      console.error('ErrorBoundary caught:', error, errorInfo);
    }
  }

  handleRetry = () => {
    if (typeof window !== 'undefined') {
      window.location.reload();
    } else {
      this.setState({ hasError: false, error: null });
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
          <div className="max-w-md w-full text-center">
            <AlertCircle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Алдаа гарлаа</h2>
            <p className="text-gray-600 mb-6">Уучлаарай, ямар нэгэн асуудал гарсан байна. Дахин оролдоно уу.</p>
            <Button
              onClick={this.handleRetry}
              className="bg-amber-600 hover:bg-amber-700"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Дахин ачаалах
            </Button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
