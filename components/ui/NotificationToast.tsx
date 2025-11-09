
import React, { useEffect, useState, useRef } from 'react';
import { Notification } from '../../types';
import { WarningIcon, XIcon, CheckIcon } from './Icons'; 

interface NotificationToastProps {
    notification: Notification;
    onDismiss: (id: string) => void;
    timeout?: number; // milliseconds
}

const NotificationToast: React.FC<NotificationToastProps> = ({ notification, onDismiss, timeout = 5000 }) => {
    const [isVisible, setIsVisible] = useState(true);
    const isMounted = useRef(false); // Add mounted ref

    useEffect(() => {
        isMounted.current = true; // Component is mounted
        return () => {
            isMounted.current = false; // Component is unmounted
        };
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (isMounted.current) { // Only update if component is still mounted
                setIsVisible(false);
                setTimeout(() => {
                    if (isMounted.current) { // Check before calling onDismiss (which updates parent state)
                        onDismiss(notification.id);
                    }
                }, 300); // Allow fade-out animation
            }
        }, timeout);
        return () => clearTimeout(timer);
    }, [notification.id, onDismiss, timeout]);

    const handleDismiss = () => {
        if (isMounted.current) { // Only update if component is still mounted
            setIsVisible(false);
            setTimeout(() => {
                if (isMounted.current) { // Check before calling onDismiss (which updates parent state)
                    onDismiss(notification.id);
                }
            }, 300); // Allow fade-out animation
        }
    };

    let icon = <WarningIcon className="w-5 h-5 text-yellow-300" />;
    let bgColor = 'bg-yellow-800';
    let borderColor = 'border-yellow-600';

    if (notification.type === 'expiring_promo') {
        icon = <WarningIcon className="w-5 h-5 text-blue-300" />;
        bgColor = 'bg-blue-800';
        borderColor = 'border-blue-600';
    } else if (notification.type === 'low_stock') {
        icon = <WarningIcon className="w-5 h-5 text-red-300" />;
        bgColor = 'bg-red-800';
        borderColor = 'border-red-600';
    }


    return (
        <div
            role="alert"
            aria-live="polite"
            className={`flex items-center justify-between p-4 mb-3 rounded-lg border-s-4 ${bgColor} ${borderColor} text-white shadow-md transition-all duration-300 ease-in-out transform ${
                isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-full'
            }`}
            style={{ minWidth: '300px' }}
        >
            <div className="flex items-center">
                {icon}
                <span className="ms-3 text-sm font-medium">{notification.message}</span>
            </div>
            <button
                onClick={handleDismiss}
                className="ms-auto -mx-1.5 -my-1.5 bg-transparent text-gray-400 hover:text-white rounded-lg focus:ring-2 focus:ring-gray-300 p-1.5 hover:bg-gray-700 inline-flex items-center justify-center h-8 w-8"
                aria-label="Dismiss"
            >
                <span className="sr-only">إغلاق</span>
                <XIcon className="w-5 h-5" />
            </button>
        </div>
    );
};

export default NotificationToast;
