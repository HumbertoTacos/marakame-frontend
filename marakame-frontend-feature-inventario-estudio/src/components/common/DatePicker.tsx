import React from 'react';
import DatePicker, { registerLocale } from 'react-datepicker';
import { es } from 'date-fns/locale/es';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import "react-datepicker/dist/react-datepicker.css";
import { getYear, getMonth } from 'date-fns';

registerLocale('es', es);

interface CustomDatePickerProps {
  selected: Date | null;
  onChange: (date: Date | null) => void;
  placeholderText?: string;
  label?: string;
  required?: boolean;
  disabled?: boolean;
}

const years = Array.from({ length: 100 }, (_, i) => getYear(new Date()) - i);
const months = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

export const CustomDatePicker: React.FC<CustomDatePickerProps> = ({ 
  selected, 
  onChange, 
  placeholderText = "DD/MM/AAAA",
  label,
  required = false,
  disabled = false
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', width: '100%' }}>
      {label && (
        <label style={{ fontSize: '13px', fontWeight: '600', color: '#475569' }}>
          {label} {required && <span style={{ color: '#ef4444' }}>*</span>}
        </label>
      )}
      <div style={{ position: 'relative', width: '100%' }}>
        <DatePicker
          selected={selected}
          onChange={onChange}
          locale="es"
          dateFormat="dd/MM/yyyy"
          placeholderText={placeholderText}
          required={required}
          disabled={disabled}
          peekNextMonth
          showMonthDropdown
          showYearDropdown
          dropdownMode="select"
          className="marakame-datepicker"
          renderCustomHeader={({
            date,
            changeYear,
            changeMonth,
            decreaseMonth,
            increaseMonth,
            prevMonthButtonDisabled,
            nextMonthButtonDisabled,
          }) => (
            <div style={{
              margin: 10,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: '8px'
            }}>
              <button 
                onClick={(e) => { e.preventDefault(); decreaseMonth(); }} 
                disabled={prevMonthButtonDisabled}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex' }}
              >
                <ChevronLeft size={16} color="#64748b" />
              </button>
              
              <div style={{ display: 'flex', gap: '4px' }}>
                <select
                  value={getYear(date)}
                  onChange={({ target: { value } }) => changeYear(parseInt(value))}
                  style={{ 
                    border: '1px solid #e2e8f0', 
                    borderRadius: '4px', 
                    padding: '2px 4px', 
                    fontSize: '12px',
                    backgroundColor: 'white',
                    fontWeight: '600',
                    color: '#1e293b'
                  }}
                >
                  {years.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>

                <select
                  value={months[getMonth(date)]}
                  onChange={({ target: { value } }) => changeMonth(months.indexOf(value))}
                  style={{ 
                    border: '1px solid #e2e8f0', 
                    borderRadius: '4px', 
                    padding: '2px 4px', 
                    fontSize: '12px',
                    backgroundColor: 'white',
                    fontWeight: '600',
                    color: '#1e293b'
                  }}
                >
                  {months.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>

              <button 
                onClick={(e) => { e.preventDefault(); increaseMonth(); }} 
                disabled={nextMonthButtonDisabled}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex' }}
              >
                <ChevronRight size={16} color="#64748b" />
              </button>
            </div>
          )}
          popperProps={{
            strategy: "fixed"
          }}
        />
        <div style={{ 
          position: 'absolute', 
          right: '12px', 
          top: '50%', 
          transform: 'translateY(-50%)', 
          pointerEvents: 'none',
          color: '#94a3b8'
        }}>
          <Calendar size={18} />
        </div>
      </div>
    </div>
  );
};
