import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  Users,
  TriangleAlert,
  PackageOpen,
  LayoutDashboard,
  ShoppingCart,
  Banknote,
  HeartPulse,
} from "lucide-react";
import { useAuthStore } from "../stores/authStore";
import apiClient from "../services/api";
import { useNavigate } from "react-router-dom";

interface WidgetProps {
  title: string;
  value: string | number | undefined;
  subValue?: string;
  icon: React.ElementType;
  color: string;
  onClick?: () => void;
}

const Widget = ({
  title,
  value,
  subValue,
  icon: Icon,
  color,
  onClick,
}: WidgetProps) => (
  <div
    onClick={onClick}
    style={{
      backgroundColor: "var(--glass-bg)",
      backdropFilter: "blur(10px)",
      padding: "1.75rem",
      borderRadius: "var(--radius-lg)",
      border: "1px solid var(--glass-border)",
      boxShadow: onClick
        ? "0 10px 25px -5px rgba(0,0,0,0.05)"
        : "var(--shadow)",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      cursor: onClick ? "pointer" : "default",
      transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
      position: "relative",
      overflow: "hidden",
    }}
    className="widget-hover"
  >
    <div style={{ position: "relative", zIndex: 1 }}>
      <p
        style={{
          color: "#64748b",
          fontSize: "13px",
          fontWeight: "700",
          marginBottom: "0.75rem",
          textTransform: "uppercase",
          letterSpacing: "0.5px",
        }}
      >
        {title}
      </p>
      <h2
        style={{
          fontSize: "36px",
          fontWeight: "800",
          color: "var(--text-h)",
          margin: 0,
          letterSpacing: "-1px",
        }}
      >
        {value}
      </h2>
      {subValue && (
        <p
          style={{
            color: "#94a3b8",
            fontSize: "13px",
            marginTop: "0.5rem",
            fontWeight: "500",
          }}
        >
          {subValue}
        </p>
      )}
    </div>
    <div
      style={{
        backgroundColor: `${color}15`,
        color: color,
        padding: "1rem",
        borderRadius: "16px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        zIndex: 1,
      }}
    >
      <Icon size={32} />
    </div>
    {/* Decorative gradient blob */}
    <div
      style={{
        position: "absolute",
        top: "-20%",
        right: "-10%",
        width: "120px",
        height: "120px",
        background: `radial-gradient(circle, ${color}10 0%, transparent 70%)`,
        zIndex: 0,
      }}
    ></div>
  </div>
);

export function Dashboard() {
  const { usuario } = useAuthStore();
  const navigate = useNavigate();

  const { data: stats, isLoading } = useQuery({
    queryKey: ["dashboard_stats"],
    queryFn: () => apiClient.get("/dashboard").then((res) => res.data.data),
    refetchInterval: 30000, // Refrescar cada 30 segundos
  });

  if (isLoading) {
    return (
      <div style={{ padding: "2rem", textAlign: "center" }}>
        Cargando panel de control...
      </div>
    );
  }

  // Lógica de Vistas Según Rol
  const esAdmin = usuario?.rol === "ADMIN_GENERAL";
  const esMedico =
    usuario?.rol === "AREA_MEDICA" ||
    usuario?.rol === "NUTRICION" ||
    usuario?.rol === "PSICOLOGIA";
  const esOperativo =
    usuario?.rol === "ALMACEN" ||
    usuario?.rol === "RRHH_FINANZAS" ||
    usuario?.rol === "ADMISIONES";

  return (
    <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
      {/* Cabecera de Bienvenida */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          marginBottom: "3rem",
          padding: "2.5rem",
          background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
          borderRadius: "var(--radius-xl)",
          color: "white",
          boxShadow:
            "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background:
              'url("https://www.transparenttextures.com/patterns/cubes.png")',
            opacity: 0.05,
          }}
        ></div>

        <div
          style={{
            position: "relative",
            zIndex: 1,
            display: "flex",
            alignItems: "center",
            width: "100%",
          }}
        >
          <div
            style={{
              background: "rgba(255, 255, 255, 0.1)",
              backgroundColor: "white",
              padding: "1.25rem",
              borderRadius: "20px",
              marginRight: "1.5rem",
              boxShadow: "inset 0 0 0 1px rgba(255, 255, 255, 0.1)",
            }}
          >
            <LayoutDashboard size={40} color="#60a5fa" />
          </div>
          <div>
            <h1
              style={{
                fontSize: "32px",
                fontWeight: "800",
                color: "#ffffff",
                margin: 0,
                letterSpacing: "-0.5px",
              }}
            >
              Hola, {usuario?.nombre}
            </h1>
            <p
              style={{
                color: "#94a3b8",
                margin: 0,
                marginTop: "0.4rem",
                fontSize: "16px",
                fontWeight: "500",
              }}
            >
              Te presentamos el resumen operativo de{" "}
              <span style={{ color: "#60a5fa", fontWeight: "700" }}>
                Marakame
              </span>{" "}
              para hoy.
            </p>
          </div>
          <div style={{ marginLeft: "auto", textAlign: "right" }}>
            <div
              style={{
                fontSize: "14px",
                color: "#64748b",
                fontWeight: "600",
                textTransform: "uppercase",
                letterSpacing: "1px",
              }}
            >
              Rol Actual
            </div>
            <div
              style={{
                fontSize: "13px",
                background: "rgba(96, 165, 250, 0.2)",
                color: "#60a5fa",
                padding: "0.4rem 1rem",
                borderRadius: "100px",
                display: "inline-block",
                marginTop: "0.5rem",
                fontWeight: "700",
                border: "1px solid rgba(96, 165, 250, 0.3)",
              }}
            >
              {usuario?.rol.replace("_", " ")}
            </div>
          </div>
        </div>
      </div>
      <style>{`
        .widget-hover:hover { 
          transform: translateY(-6px); 
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
          background-color: rgba(255, 255, 255, 0.9) !important;
        }
      `}</style>
      {/* MÉTRICAS CLÍNICAS (Todos las ven pero más enfocadas a Médicos y Admin) */}
      {esAdmin && (
        <>
          <h3
            style={{
              fontSize: "18px",
              color: "#4a5568",
              marginBottom: "1rem",
              display: "flex",
              alignItems: "center",
            }}
          >
            <HeartPulse size={20} style={{ marginRight: "0.5rem" }} /> Estado de
            la Clínica
          </h3>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: "1.5rem",
              marginBottom: "3rem",
            }}
          >
            <Widget
              title="Ocupación de Camas"
              value={`${stats?.ocupacion.porcentaje}%`}
              subValue={`${stats?.ocupacion.internados} de ${stats?.ocupacion.capacidad} camas disponibles`}
              icon={Activity}
              color={stats?.ocupacion.porcentaje > 90 ? "#e53e3e" : "#3182ce"}
              onClick={() => navigate("/dashboard")} // Futuro modulo de habitaciones
            />
            <Widget
              title="Admisiones en Proceso"
              value={stats?.admisiones.enProceso}
              subValue="Candidatos en valoración o estudio socioeconómico"
              icon={Users}
              color="#ed8936"
              onClick={() => navigate("/admisiones/ingreso")}
            />
          </div>
        </>
      )}
      {/* MÉTRICAS CLÍNICAS */}
      {(esAdmin || esMedico) && <>...</>}

      {esMedico && (
        <>
          <h3
            style={{ fontSize: "18px", color: "#4a5568", marginBottom: "1rem" }}
          >
            🩺 Panel Médico
          </h3>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: "1.5rem",
              marginBottom: "3rem",
            }}
          >
            <Widget
              title="Valoraciones Hoy"
              value={stats?.medico?.valoracionesHoy}
              subValue="Valoraciones realizadas hoy"
              icon={HeartPulse}
              color="#3182ce"
            />

            <Widget
              title="Pacientes Totales"
              value={stats?.medico?.totalPacientes}
              subValue="Pacientes registrados en el sistema"
              icon={Users}
              color="#3182ce"
            />

            <Widget
              title="Pendientes de Ingreso"
              value={stats?.medico?.pacientesPendientesIngreso}
              subValue="Pacientes aptos por ingresar"
              icon={Users}
              color="#ed8936"
            />

            <Widget
              title="Pacientes Canalizados"
              value={stats?.medico?.pacientesCanalizados}
              subValue="No aptos / canalizados"
              icon={TriangleAlert}
              color="#e53e3e"
            />
          </div>
        </>
      )}

      {(esAdmin || esOperativo) && <>...</>}
      {/* MÉTRICAS OPERATIVAS (Todos las ven pero más enfocadas a Operativos y Admin) */}
      {(esAdmin || esOperativo) && (
        <>
          <h3
            style={{
              fontSize: "18px",
              color: "#4a5568",
              marginBottom: "1rem",
              display: "flex",
              alignItems: "center",
            }}
          >
            <TriangleAlert size={20} style={{ marginRight: "0.5rem" }} />{" "}
            Alertas Operativas y Administrativas
          </h3>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: "1.5rem",
            }}
          >
            <Widget
              title="Inventario Crítico"
              value={stats?.almacen.criticos}
              subValue={`+${stats?.almacen.bajos} productos con stock bajo`}
              icon={PackageOpen}
              color="#e53e3e"
              onClick={() => navigate("/almacen")}
            />

            {(esAdmin || usuario?.rol === "RRHH_FINANZAS") && (
              <>
                <Widget
                  title="Compras Pendientes"
                  value={stats?.operaciones.comprasAutorizacion}
                  subValue="Requisiciones esperando VoBo Directivo"
                  icon={ShoppingCart}
                  color="#dd6b20"
                  onClick={() => navigate("/compras")}
                />
                <Widget
                  title="Nóminas Abiertas"
                  value={stats?.operaciones.nominasBorrador}
                  subValue="A la espera de captura de incidencias"
                  icon={Banknote}
                  color="#38a169"
                  onClick={() => navigate("/rrhh-nominas")}
                />
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
