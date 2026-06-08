import React from 'react';
import { AlertCircle } from 'lucide-react';

interface State {
  hasError: boolean;
}

export default class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-6 text-center">
          <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mb-3">
            <AlertCircle size={24} className="text-red-500" />
          </div>
          <h2 className="text-base font-bold text-gray-800 mb-1">오류가 발생했습니다</h2>
          <p className="text-sm text-gray-500 mb-4">예상치 못한 오류가 발생했습니다.</p>
          <button
            onClick={() => this.setState({ hasError: false })}
            className="px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 active:scale-95 transition-all"
          >
            다시 시도
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
