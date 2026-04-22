import React, { useRef } from 'react';
import { Upload } from 'lucide-react';

export const SeccionFotografia = ({ datos, setDatos }: any) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFile = (file: File) => {
        if (!file) return;

        if (!file.type.startsWith('image/')) {
        alert('Solo se permiten imágenes');
        return;
        }

        if (file.size > 5 * 1024 * 1024) {
        alert('Máximo 5MB');
        return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
        setDatos({ solicitanteFoto: reader.result });
        };
        reader.readAsDataURL(file);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        if (e.dataTransfer.files[0]) {
        handleFile(e.dataTransfer.files[0]);
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        
        <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a' }}>
            2. Fotografía del solicitante
        </h2>

        <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            style={{
            border: '2px dashed #cbd5f5',
            borderRadius: '20px',
            padding: '3rem',
            textAlign: 'center',
            cursor: 'pointer',
            backgroundColor: '#f8fafc',
            transition: 'all 0.2s'
            }}
        >
            {datos.solicitanteFoto ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                    
                    <img
                    src={datos.solicitanteFoto}
                    alt="preview"
                    style={{
                        maxWidth: '250px',
                        borderRadius: '16px'
                    }}
                    />

                    <button
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation(); // 👈 importante para que no abra el file picker
                        setDatos({ solicitanteFoto: '' });
                    }}
                    style={{
                        padding: '0.5rem 1rem',
                        borderRadius: '10px',
                        border: '1px solid #ef4444',
                        backgroundColor: '#fee2e2',
                        color: '#dc2626',
                        fontWeight: '700',
                        cursor: 'pointer'
                    }}
                    >
                    Quitar foto
                    </button>

                </div>
                ) : (
            <>
                <Upload size={40} color="#94a3b8" />
                <p style={{ fontWeight: '700', marginTop: '1rem' }}>
                Haz clic o arrastra una imagen aquí
                </p>
                <p style={{ fontSize: '12px', color: '#64748b' }}>
                PNG, JPG (Máx. 5MB)
                </p>

                <button
                type="button"
                style={{
                    marginTop: '1rem',
                    padding: '0.6rem 1.2rem',
                    borderRadius: '10px',
                    border: '1px solid #e2e8f0',
                    backgroundColor: 'white',
                    cursor: 'pointer',
                    fontWeight: '600'
                }}
                >
                Subir fotografía
                </button>
            </>
            )}

            <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            hidden
            onChange={(e) => {
                if (e.target.files?.[0]) {
                handleFile(e.target.files[0]);
                }
            }}
            />
        </div>
        </div>
    );
};