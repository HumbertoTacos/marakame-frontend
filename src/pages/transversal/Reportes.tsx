import { useState } from 'react';
import { Download, FileText, FileSpreadsheet, Lock } from 'lucide-react';
import apiClient from '../../services/api';

export function Reportes() {
  const [descargandoPDF, setDescargandoPDF] = useState(false);
  const [descargandoExcel, setDescargandoExcel] = useState(false);

  const descargarExporte = async (tipo: 'pdf' | 'excel') => {
    try {
      if (tipo === 'pdf') setDescargandoPDF(true);
      else setDescargandoExcel(true);

      const endpoint = tipo === 'pdf' ? '/reportes/pacientes/pdf' : '/reportes/almacen/excel';
      const filename = tipo === 'pdf' ? 'pacientes_internados.pdf' : 'inventario_marakame.xlsx';

      const response = await apiClient.get(endpoint, {
        responseType: 'blob' // Esencial para atrapar binarios
      });

      // Crear URL para el Blob
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error en descarga:', error);
      alert('Error descargando el archivo protegido.');
    } finally {
      setDescargandoPDF(false);
      setDescargandoExcel(false);
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '1rem' }}>
      
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '2rem' }}>
        <Download size={28} color="#D69E2E" style={{ marginRight: '1rem' }} />
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#2d3748' }}>Punto de Exportación Segura</h1>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
        
        {/* PDF Box */}
        <div style={{ backgroundColor: 'white', borderRadius: '8px', padding: '2rem', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', borderTop: '4px solid #e53e3e' }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
            <FileText size={32} color="#e53e3e" style={{ marginRight: '1rem' }} />
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#2d3748', margin: 0 }}>Listado de Pacientes</h2>
              <p style={{ color: '#718096', fontSize: '12px', margin: 0 }}>Documento Encriptado (PDF)</p>
            </div>
          </div>
          <p style={{ color: '#4a5568', marginBottom: '2rem', lineHeight: '1.5' }}>
            Genera un documento PDF al vuelo con el listado oficial de pacientes que se encuentran <strong style={{color: '#e53e3e'}}>internados actualmente</strong>. Incluye áreas, camas y fecha de ingreso.
          </p>
          <button 
            onClick={() => descargarExporte('pdf')}
            disabled={descargandoPDF}
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', backgroundColor: '#e53e3e', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
            {descargandoPDF ? 'Generando servidor...' : <><Download size={18} style={{ marginRight: '0.5rem' }}/> Descargar PDF</>}
          </button>
        </div>

        {/* Excel Box */}
        <div style={{ backgroundColor: 'white', borderRadius: '8px', padding: '2rem', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', borderTop: '4px solid #38a169' }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
            <FileSpreadsheet size={32} color="#38a169" style={{ marginRight: '1rem' }} />
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#2d3748', margin: 0 }}>Inventario General</h2>
              <p style={{ color: '#718096', fontSize: '12px', margin: 0 }}>Archivo de Datos (Excel XLSX)</p>
            </div>
          </div>
          <p style={{ color: '#4a5568', marginBottom: '2rem', lineHeight: '1.5' }}>
            Extrae toda la matriz de productos del Almacén General de Marakame. Listo para análisis o reportes financieros contables, con alertas de stock mínimo incluidas.
          </p>
          <button 
            onClick={() => descargarExporte('excel')}
            disabled={descargandoExcel}
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', backgroundColor: '#38a169', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
            {descargandoExcel ? 'Compilando celdas...' : <><Download size={18} style={{ marginRight: '0.5rem' }}/> Descargar Excel</>}
          </button>
        </div>

        {/* Placeholders Futuros */}
        <div style={{ backgroundColor: '#f7fafc', borderRadius: '8px', padding: '2rem', border: '1px dashed #cbd5e0', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#a0aec0' }}>
          <Lock size={32} style={{ marginBottom: '1rem' }} />
          <h2 style={{ fontSize: '16px', fontWeight: 'bold', margin: '0 0 0.5rem 0' }}>Sábana de Nóminas (Próximamente)</h2>
          <p style={{ fontSize: '12px', textAlign: 'center' }}>Módulo de exportación financiera en desarrollo por el equipo de ingeniería.</p>
        </div>

      </div>
    </div>
  );
}
