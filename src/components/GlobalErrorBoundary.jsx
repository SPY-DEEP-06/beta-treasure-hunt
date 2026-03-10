import React from 'react';

class GlobalErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        // Update state so the next render will show the fallback UI.
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        // You can also log the error to an error reporting service
        console.error("Uncaught React Exception:", error, errorInfo);
        this.setState({ errorInfo });
    }

    render() {
        if (this.state.hasError) {
            // You can render any custom fallback UI
            return (
                <div style={{ padding: '20px', fontFamily: 'monospace', color: 'red', backgroundColor: '#330000', minHeight: '100vh', wordWrap: 'break-word', overflow: 'auto' }}>
                    <h2>CRITICAL REACT RENDER CRASH</h2>
                    <p>The screen went blank because of this exact code error:</p>
                    <hr />
                    <p><strong>{this.state.error && this.state.error.toString()}</strong></p>
                    <br />
                    <details style={{ whiteSpace: 'pre-wrap' }}>
                        <summary>Click for technical stack trace (Please screenshot this and send to Admin)</summary>
                        {this.state.errorInfo && this.state.errorInfo.componentStack}
                    </details>
                    <br />
                    <button style={{ padding: '10px 20px', background: 'red', color: 'white', border: 'none', cursor: 'pointer' }} onClick={() => window.location.reload()}>Reload App</button>
                </div>
            );
        }

        return this.props.children;
    }
}

export default GlobalErrorBoundary;
