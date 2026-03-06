import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';

let toastCounter = 0;
let addToastExternal = null;

export function ToastContainer() {
    const [toasts, setToasts] = useState([]);

    useEffect(() => {
        addToastExternal = (message, type = 'info') => {
            const id = ++toastCounter;
            setToasts(prev => [...prev, { id, message, type }]);
            setTimeout(() => {
                setToasts(prev => prev.filter(t => t.id !== id));
            }, 3000);
        };
    }, []);

    const removeToast = (id) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    };

    return (
        <div className="toast-container">
            {toasts.map(toast => (
                <div key={toast.id} className={`toast toast-${toast.type}`}>
                    <div className="toast-icon">
                        {toast.type === 'success' && <CheckCircle size={20} />}
                        {toast.type === 'error' && <XCircle size={20} />}
                        {toast.type === 'warning' && <AlertCircle size={20} />}
                        {toast.type === 'info' && <Info size={20} />}
                    </div>
                    <div className="toast-message">{toast.message}</div>
                    <button className="toast-close" onClick={() => removeToast(toast.id)}>
                        <X size={16} />
                    </button>
                </div>
            ))}
        </div>
    );
}

export const showToast = {
    success: (msg) => addToastExternal?.(msg, 'success'),
    error: (msg) => addToastExternal?.(msg, 'error'),
    warning: (msg) => addToastExternal?.(msg, 'warning'),
    info: (msg) => addToastExternal?.(msg, 'info'),
};
