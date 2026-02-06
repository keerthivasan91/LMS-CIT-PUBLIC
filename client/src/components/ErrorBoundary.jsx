// src/components/ErrorBoundary.jsx
import React from "react";
import "../App.css";

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        if (process.env.NODE_ENV !== "production") {
            console.error("Error caught by boundary:", error, errorInfo);
        }
        // Example: Sentry.captureException(error, { extra: errorInfo });
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null });
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className="error-boundary">
                    <div className="error-card">
                        <h1>Something went wrong</h1>
                        <p>Please refresh the page or try again.</p>

                        <div className="error-actions">
                            <button className="error-btn primary" onClick={this.handleReset}>
                                Try Again
                            </button>
                            <button
                                className="error-btn secondary"
                                onClick={() => (window.location.href = "/dashboard")}
                            >
                                Go to Dashboard
                            </button>
                        </div>

                        {process.env.NODE_ENV !== "production" && this.state.error && (
                            <pre className="error-debug">
                                {this.state.error.toString()}
                            </pre>
                        )}
                    </div>
                </div>

            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
