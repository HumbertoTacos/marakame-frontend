# Marakame Frontend Context

## Proyecto

Marakame es un sistema web institucional para una clínica/centro de rehabilitación.

El frontend está desarrollado con:

- React
- TypeScript
- Vite

## Objetivo

Construir una interfaz moderna, limpia, profesional y modular para uso institucional interno.

El sistema incluye:

- Área médica
- Admisiones
- Inventario
- Compras
- Nóminas
- CRM de pacientes
- Expediente clínico
- Reportes
- Bitácoras

---

# Arquitectura Frontend

## Stack

- React + TypeScript
- Vite
- Zustand para estado global
- React Router DOM
- CSS modular/simple institucional

## Convenciones

### Componentes

- Componentes reutilizables
- Evitar lógica excesiva dentro del JSX
- Separar UI y lógica cuando sea posible
- Mantener componentes pequeños y legibles

### TypeScript

- NO usar any
- Usar tipado estricto
- Reutilizar interfaces desde /types

### Estilo

- Diseño institucional médico
- UI limpia y moderna
- Evitar estilos exagerados
- Priorizar legibilidad
- Responsive básico

### Organización

- pages = vistas completas
- components = componentes reutilizables
- services = llamadas API
- stores = estado global
- types = interfaces y tipos

---

# API

El backend corre normalmente en:
http://localhost:3000/api/v1

Frontend:
http://localhost:5173

---

# Buenas prácticas

- Mantener consistencia visual
- No romper componentes existentes
- Reutilizar componentes existentes antes de crear nuevos
- Evitar duplicación de lógica
- Mantener nombres descriptivos
- Usar async/await
- Manejar loading y errores

---

# Área Médica

El módulo médico es uno de los módulos principales del sistema.

Incluye:

- Expediente clínico
- Evolución médica
- Signos vitales
- Timeline de notas
- Valoraciones
- Historial
- Seguimiento del paciente

El diseño debe sentirse profesional, clínico e institucional.

---

# Importante

Antes de generar código:

- Revisar estructura existente
- Mantener compatibilidad con componentes actuales
- Respetar naming conventions existentes
- Evitar refactors innecesarios
