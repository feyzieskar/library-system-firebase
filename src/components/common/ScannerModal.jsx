import { useEffect, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { X, Camera } from 'lucide-react';

export default function ScannerModal({ onClose, onScan, t }) {
    const [error, setError] = useState(null);

    useEffect(() => {
        // Basic setup for html5-qrcode scanner
        const config = {
            fps: 10,
            qrbox: { width: 250, height: 150 },
            aspectRatio: 1.0,
            supportedScanTypes: [
                0 // QR_CODE
            ]
        };

        // To scan ISBN barcodes (EAN_13 usually), we don't strict limit supported types in scanner config 
        // to allow standard barcodes too.
        const scanner = new Html5QrcodeScanner("reader", {
            fps: 10,
            qrbox: { width: 250, height: 150 },
            rememberLastUsedCamera: true
        }, false);

        scanner.render(
            (decodedText) => {
                // Stop scanning after success
                scanner.clear().then(() => {
                    onScan(decodedText);
                    onClose();
                });
            },
            (err) => {
                // Ignored. Errors are continuous when no barcode is in frame.
            }
        );

        return () => {
            scanner.clear().catch(e => console.error(e));
        };
    }, [onClose, onScan]);

    return (
        <div className="modal-overlay" onClick={onClose} style={{ zIndex: 9999 }}>
            <div className="modal" onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: '500px' }}>
                <div className="modal-header">
                    <h2 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Camera size={20} /> {t('books.scanBarcode', 'Barkod / QR Tarat')}
                    </h2>
                    <button className="btn-icon" onClick={onClose}><X size={20} /></button>
                </div>
                <div className="modal-body" style={{ padding: '1rem' }}>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem', textAlign: 'center' }}>
                        Kitabın arkasındaki ISBN barkodunu veya QR kodunu kameraya gösterin.
                    </p>
                    {error && <div className="toast toast-error">{error}</div>}
                    <div id="reader" style={{ width: '100%', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}></div>
                </div>
            </div>
        </div>
    );
}
