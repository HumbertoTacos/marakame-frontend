import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { AppError } from '../middlewares/errorHandler';
import { EstadoPaciente } from '@prisma/client';

/**
 * Obtener lista de pacientes filtrada por estado
 * GET /api/v1/pacientes?estado=PROSPECTO
 * GET /api/v1/pacientes?vista=medico → { pendientesDiagnostico, diagnosticados }
 */
export const getPacientes = async (req: Request, res: Response) => {
  const { estado, sinValorar, vista } = req.query;

  // ── VISTA MÉDICA ───────────────────────────────────────────────────────────
  // Devuelve dos grupos separados usando valoracionDiagnostica como gate:
  //   pendientesDiagnostico: EN_VALORACION | PENDIENTE_INGRESO SIN valoracion
  //   diagnosticados:        tienen al menos un registro de valoracionDiagnostica
  if (vista === 'medico') {
    const camposPaciente = {
      id: true,
      claveUnica: true,
      nombre: true,
      apellidoPaterno: true,
      apellidoMaterno: true,
      sexo: true,
      fechaNacimiento: true,
      estado: true,
      sustancias: true,
      createdAt: true,
      primerContacto: {
        select: {
          id: true,
          nombreLlamada: true,
          parentescoLlamada: true,
          edadPaciente: true,
          sustancias: true
        },
        orderBy: { createdAt: 'desc' as const },
        take: 1
      },
      valoraciones: {
        select: {
          id: true,
          cumpleCriteriosInternamiento: true,
          aceptaInternarse: true,
          medicoNombre: true,
          observacionesMedicas: true,
          fechaTentativaIngreso: true,
          createdAt: true
        },
        orderBy: { createdAt: 'desc' as const },
        take: 1
      }
    } as const;

    const [pendientesDiagnostico, diagnosticados] = await Promise.all([
      // Sin valoracionDiagnostica y en estados de flujo de admisión
      prisma.paciente.findMany({
        where: {
          deletedAt: null,
          estado: { in: ['EN_VALORACION', 'PENDIENTE_INGRESO'] },
          valoraciones: { none: {} }
        },
        select: camposPaciente,
        orderBy: { createdAt: 'desc' }
      }),
      // Con al menos una valoracionDiagnostica (criterio de diagnóstico completado)
      prisma.paciente.findMany({
        where: {
          deletedAt: null,
          valoraciones: { some: {} }
        },
        select: camposPaciente,
        orderBy: { createdAt: 'desc' }
      })
    ]);

    return res.json({
      success: true,
      data: { pendientesDiagnostico, diagnosticados }
    });
  }

  // ── VISTA GENERAL (comportamiento existente) ───────────────────────────────
  const where: any = {
    deletedAt: null
  };

  // Validar y aplicar filtro de estado si existe
  if (estado) {
    if (!Object.values(EstadoPaciente).includes(estado as any)) {
      throw new AppError(400, 'Estado de paciente no válido');
    }
    where.estado = estado;
    // Para la bandeja médica, ocultar pacientes cuyo primerContacto fue archivado
    if (estado === 'EN_VALORACION') {
      where.primerContacto = { some: { activo: true } };
    }
  }

  // Filtro específico para Area Médica (Solo los que no tienen valoración registrada)
  if (sinValorar === 'true') {
    where.valoracionMedica = { is: null };
  }

  const pacientes = await prisma.paciente.findMany({
    where,
    select: {
      id: true,
      claveUnica: true,
      nombre: true,
      apellidoPaterno: true,
      apellidoMaterno: true,
      sexo: true,
      fechaNacimiento: true,
      estado: true,
      sustancias: true,
      createdAt: true,
      primerContacto: {
        where: { activo: true },
        select: {
          id: true,
          nombreLlamada: true,
          parentescoLlamada: true,
          edadPaciente: true,
          sustancias: true
        },
        orderBy: { createdAt: 'desc' },
        take: 1
      },
      cama: {
        select: {
          numero: true,
          habitacion: {
            select: { nombre: true, area: true }
          }
        }
      },
      valoracionMedica: {
        select: {
          id: true,
          esAptoParaIngreso: true,
          createdAt: true
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  // Mapear campos para compatibilidad con el frontend
  const mappedPacientes = pacientes.map(p => {
    const pc = p.primerContacto?.[0];
    return {
      ...p,
      primerContacto: pc ? [{
        ...pc,
        solicitanteNombre: pc.nombreLlamada,
        relacionPaciente: pc.parentescoLlamada
      }] : []
    };
  });

  res.json({
    success: true,
    data: mappedPacientes
  });
};

/**
 * Obtener pacientes que ya fueron aprobados por el médico (PENDIENTE_INGRESO)
 * GET /api/v1/pacientes/aprobados-para-ingreso
 */
export const getAprobadosParaIngreso = async (_req: Request, res: Response) => {
  const pacientes = await prisma.paciente.findMany({
    where: {
      OR: [
        { estado: 'PENDIENTE_INGRESO' },
        { estado: 'EN_VALORACION' }
      ]
    },
    select: {
      id: true,
      nombre: true,
      apellidoPaterno: true,
      apellidoMaterno: true,
      curp: true,
      sexo: true,
      fechaNacimiento: true,
      areaDeseada: true,
      sustancias: true,
      primerContacto: {
        select: {
          nombreLlamada: true,
          parentescoLlamada: true,
          telCasaLlamada: true,
          celularLlamada: true,
          conclusionMedica: true
        },
        orderBy: { createdAt: 'desc' },
        take: 1
      },
      familiar: {
        select: {
          correo: true,
          municipio: true,
          estado: true
        }
      },
      valoracionMedica: {
        select: {
          createdAt: true
        }
      }
    },
    orderBy: { updatedAt: 'desc' }
  });

  // Mapear campos para compatibilidad con el frontend
  const mappedPacientes = pacientes.map(p => {
    const pc = p.primerContacto?.[0];
    return {
      ...p,
      primerContacto: pc ? [{
        ...pc,
        solicitanteNombre: pc.nombreLlamada,
        relacionPaciente: pc.parentescoLlamada,
        solicitanteTelefono: pc.telCasaLlamada,
        solicitanteCelular: pc.celularLlamada,
        observaciones: pc.conclusionMedica
      }] : []
    };
  });

  res.json({
    success: true,
    data: mappedPacientes
  });
};

/**
 * Obtener un paciente por ID con todo su contexto clínico
 */
export const getPacienteById = async (req: Request, res: Response) => {
  const { id } = req.params;

  const paciente = await prisma.paciente.findUnique({
    where: { id: parseInt(id as string, 10) },
    include: {
      primerContacto: true,
      valoracionMedica: true,
      expediente: {
        include: {
          notasEvolucion: {
            orderBy: { fecha: 'desc' },
            include: { usuario: true }
          },
          signosVitales: {
            orderBy: { fecha: 'desc' },
            include: { usuario: true }
          }
        }
      },
      familiar: true,
      cama: {
        include: { habitacion: true }
      }
    }
  });

  if (!paciente) {
    throw new AppError(404, 'Paciente no encontrado');
  }

  res.json({
    success: true,
    data: paciente
  });
};
