// ============== PANEL DE ADMINISTRADOR ==============

class PanelAdministrador {
    constructor() {
        this.usuarios = [];
        this.reportes = [];
    }

    mostrar() {
        if (!sistemaAuth.esAdmin()) {
            alert('Acceso denegado. Solo los administradores pueden acceder a este panel.');
            return;
        }

        // Asignar la instancia global para que las funciones HTML puedan acceder
        window.panelAdmin = this;

        this.crearInterfaz();
        this.cargarDatos();
    }

    crearInterfaz() {
        // Crear overlay del panel admin
        const adminHTML = `
            <div id="adminOverlay" class="admin-overlay">
                <div class="admin-panel">
                    <div class="admin-header">
                        <h2>⚙️ Panel de Administrador</h2>
                        <button class="close-admin" onclick="cerrarPanelAdmin()">✖️</button>
                    </div>
                    
                    <div class="admin-tabs">
                        <button class="tab-button active" onclick="mostrarTab('usuarios')">👥 Usuarios</button>
                        <button class="tab-button" onclick="mostrarTab('reportes')">📊 Reportes</button>
                        <button class="tab-button" onclick="mostrarTab('estadisticas')">📈 Estadísticas</button>
                        <button class="tab-button" onclick="mostrarTab('analisis')">📊 Análisis</button>
                    </div>
                    
                    <!-- TAB USUARIOS -->
                    <div id="tab-usuarios" class="tab-content active">
                        <div class="admin-section">
                            <div class="section-header">
                                <h3>Gestión de Usuarios</h3>
                                <div>
                                    <button class="btn-admin btn-info" onclick="sincronizarUsuariosGitHub()">
                                        📤 Backup a GitHub
                                    </button>
                                    <button class="btn-admin btn-warning" onclick="restaurarUsuariosGitHub()">
                                        📥 Restore desde GitHub
                                    </button>
                                    <button class="btn-admin btn-warning" onclick="restaurarUsuariosBase()">
                                        🔧 Restaurar Usuarios Base
                                    </button>
                                    <button class="btn-admin btn-success" onclick="mostrarFormularioNuevoUsuario()">
                                        ➕ Nuevo Usuario
                                    </button>
                                </div>
                            </div>
                            
                            <div id="formularioNuevoUsuario" class="nuevo-usuario-form" style="display: none;">
                                <h4>Crear Nuevo Usuario</h4>
                                <div class="form-row">
                                    <div>
                                        <label for="nuevoUsername">Usuario (ID)</label>
                                        <input type="text" id="nuevoUsername" placeholder="ej: jperez" required>
                                    </div>
                                    <div>
                                        <label for="nuevoNombre">Nombre Completo</label>
                                        <input type="text" id="nuevoNombre" placeholder="Juan Pérez" required>
                                    </div>
                                </div>
                                <div class="form-row">
                                    <div>
                                        <label for="nuevoEmail">Correo Electrónico</label>
                                        <input type="email" id="nuevoEmail" placeholder="jperez@dayton.com" required>
                                    </div>
                                    <div>
                                        <label for="nuevoPassword">Contraseña</label>
                                        <input type="password" id="nuevoPassword" placeholder="Mínimo 6 caracteres" required>
                                    </div>
                                </div>
                                <div class="form-row">
                                    <div>
                                        <label for="nuevoRol">Rol</label>
                                        <select id="nuevoRol">
                                            <option value="usuario">Usuario</option>
                                            <option value="administrador">Administrador</option>
                                        </select>
                                    </div>
                                </div>
                                <div class="form-actions">
                                    <button class="btn-admin btn-success" onclick="crearNuevoUsuario()">Crear Usuario</button>
                                    <button class="btn-admin btn-secondary" onclick="cancelarNuevoUsuario()">Cancelar</button>
                                </div>
                            </div>
                            
                            <div class="usuarios-lista">
                                <div id="listaUsuarios"></div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- TAB REPORTES -->
                    <div id="tab-reportes" class="tab-content">
                        <div class="admin-section">
                            <div class="section-header">
                                <h3>Reportes de Todos los Usuarios</h3>
                                <div>
                                    <button class="btn-admin btn-info" onclick="sincronizarReportesAdminGitHub()">
                                        📤 Backup Reportes a GitHub
                                    </button>
                                    <button class="btn-admin btn-warning" onclick="restaurarReportesAdminGitHub()">
                                        📥 Restaurar Reportes desde GitHub
                                    </button>
                                </div>
                            </div>
                            <div class="filtros-admin">
                                <div class="form-row">
                                    <div>
                                        <label for="filtroUsuario">Filtrar por Usuario</label>
                                        <select id="filtroUsuario" onchange="filtrarReportesAdmin()">
                                            <option value="">Todos los usuarios</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label for="filtroFecha">Filtrar por Fecha</label>
                                        <input type="date" id="filtroFecha" onchange="filtrarReportesAdmin()">
                                    </div>
                                </div>
                            </div>
                            <div id="listaReportesAdmin" class="reportes-admin-lista"></div>
                        </div>
                    </div>
                    
                    <!-- TAB ESTADÍSTICAS -->
                    <div id="tab-estadisticas" class="tab-content">
                        <div class="admin-section">
                            <h3>Estadísticas Generales</h3>
                            <div id="estadisticasGenerales" class="estadisticas-container"></div>
                        </div>
                    </div>

                    <!-- TAB ANÁLISIS -->
                    <div id="tab-analisis" class="tab-content">
                        <div class="admin-section">
                            <h3>📊 Reportes Administrativos</h3>
                            <p class="section-description">
                                Genere reportes comprehensivos de actividad para análisis administrativo y toma de decisiones.
                            </p>

                            <div class="report-controls">
                                <div class="control-group">
                                    <label for="reportPeriodoVisitas">📅 Período de Reporte:</label>
                                    <select id="reportPeriodoVisitas" onchange="actualizarFechasReporteVisitas()">
                                        <option value="mes">Último Mes</option>
                                        <option value="trimestre">Último Trimestre</option>
                                        <option value="semestre">Último Semestre</option>
                                        <option value="ano">Último Año</option>
                                        <option value="custom">Período Personalizado</option>
                                    </select>
                                </div>

                                <div class="control-group" id="customDateRangeVisitas" style="display: none;">
                                    <label for="reportFechaInicioVisitas">Fecha Inicio:</label>
                                    <input type="date" id="reportFechaInicioVisitas">
                                    <label for="reportFechaFinVisitas">Fecha Fin:</label>
                                    <input type="date" id="reportFechaFinVisitas">
                                </div>

                                <div class="control-group">
                                    <label for="reportUsuarioVisitas">👥 Usuario:</label>
                                    <select id="reportUsuarioVisitas">
                                        <option value="todos">Todos los Usuarios</option>
                                    </select>
                                </div>

                                <div class="control-group">
                                    <label for="reportGerenciaVisitas">🏢 Gerencia:</label>
                                    <select id="reportGerenciaVisitas">
                                        <option value="todas">Todas las Gerencias</option>
                                        <option value="Bajío">Bajío</option>
                                        <option value="Centro-Norte">Centro-Norte</option>
                                        <option value="Centro-Sur">Centro-Sur</option>
                                        <option value="Norte">Norte</option>
                                        <option value="Occidente">Occidente</option>
                                        <option value="Oriente">Oriente</option>
                                        <option value="Pacífico">Pacífico</option>
                                        <option value="Sur">Sur</option>
                                    </select>
                                </div>
                            </div>

                            <div class="report-actions">
                                <button class="btn-admin btn-primary" onclick="generarReporteEjecutivoVisitas()">
                                    📈 Reporte Ejecutivo
                                </button>
                                <button class="btn-admin btn-secondary" onclick="generarReporteDetalladoVisitas()">
                                    📋 Reporte Detallado
                                </button>
                                <button class="btn-admin btn-info" onclick="previsualizarReporteVisitas()">
                                    👁️ Vista Previa
                                </button>
                            </div>

                            <div id="reportPreviewVisitas" class="report-preview" style="display: none;">
                                <h4>📊 Vista Previa del Reporte</h4>
                                <div id="reportPreviewContentVisitas"></div>
                            </div>

                            <div class="export-formats">
                                <h4>💾 Exportar Reporte</h4>
                                <div class="export-buttons">
                                    <button class="btn-admin btn-success" onclick="exportarReportePDFVisitas()">
                                        📑 PDF Ejecutivo
                                    </button>
                                    <button class="btn-admin btn-success" onclick="exportarReporteExcelVisitas()">
                                        📊 Excel Detallado
                                    </button>
                                    <button class="btn-admin btn-success" onclick="exportarReporteCSVVisitas()">
                                        📄 CSV Analítico
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <style>
                .admin-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0,0,0,0.8);
                    z-index: 10001;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    padding: 20px;
                    box-sizing: border-box;
                }
                
                .admin-panel {
                    background: white;
                    border-radius: 15px;
                    width: 100%;
                    max-width: 1200px;
                    max-height: 90vh;
                    overflow-y: auto;
                    box-shadow: 0 25px 50px rgba(0,0,0,0.3);
                }
                
                .admin-header {
                    background: linear-gradient(135deg, #2c3e50, #34495e);
                    color: white;
                    padding: 20px 30px;
                    border-radius: 15px 15px 0 0;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                
                .admin-header h2 {
                    margin: 0;
                    font-size: 24px;
                }
                
                .close-admin {
                    background: none;
                    border: none;
                    color: white;
                    font-size: 20px;
                    cursor: pointer;
                    padding: 5px 10px;
                    border-radius: 5px;
                    transition: background 0.3s;
                }
                
                .close-admin:hover {
                    background: rgba(255,255,255,0.2);
                }
                
                .admin-tabs {
                    display: flex;
                    background: #f8f9fa;
                    border-bottom: 1px solid #e1e8ed;
                }
                
                .tab-button {
                    flex: 1;
                    padding: 15px 20px;
                    background: none;
                    border: none;
                    cursor: pointer;
                    font-size: 16px;
                    font-weight: 500;
                    transition: all 0.3s;
                    border-bottom: 3px solid transparent;
                }
                
                .tab-button:hover {
                    background: #e9ecef;
                }
                
                .tab-button.active {
                    background: white;
                    border-bottom-color: #667eea;
                    color: #667eea;
                }
                
                .tab-content {
                    display: none;
                    padding: 30px;
                }
                
                .tab-content.active {
                    display: block;
                }
                
                .admin-section {
                    margin-bottom: 30px;
                }
                
                .section-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 20px;
                }
                
                .section-header h3 {
                    margin: 0;
                    color: #2c3e50;
                }
                
                .btn-admin {
                    padding: 10px 20px;
                    border: none;
                    border-radius: 8px;
                    font-size: 14px;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.3s;
                    margin: 0 5px;
                }
                
                .btn-admin.btn-success {
                    background: #28a745;
                    color: white;
                }
                
                .btn-admin.btn-danger {
                    background: #dc3545;
                    color: white;
                }
                
                .btn-admin.btn-warning {
                    background: #ffc107;
                    color: #212529;
                }
                
                .btn-admin.btn-secondary {
                    background: #6c757d;
                    color: white;
                }
                
                .btn-admin.btn-info {
                    background: #17a2b8;
                    color: white;
                }
                
                .btn-admin:hover {
                    transform: translateY(-1px);
                    box-shadow: 0 5px 15px rgba(0,0,0,0.2);
                }
                
                .nuevo-usuario-form {
                    background: #f8f9fa;
                    padding: 20px;
                    border-radius: 10px;
                    margin-bottom: 20px;
                    border: 2px solid #e1e8ed;
                }
                
                .nuevo-usuario-form h4 {
                    margin: 0 0 20px 0;
                    color: #2c3e50;
                }
                
                .form-row {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 15px;
                    margin-bottom: 15px;
                }
                
                .form-row > div {
                    display: flex;
                    flex-direction: column;
                }
                
                .nuevo-usuario-form label {
                    font-weight: 600;
                    margin-bottom: 5px;
                    color: #2c3e50;
                }
                
                .nuevo-usuario-form input,
                .nuevo-usuario-form select {
                    padding: 10px;
                    border: 1px solid #ced4da;
                    border-radius: 6px;
                    font-size: 14px;
                }
                
                .form-actions {
                    display: flex;
                    gap: 10px;
                    margin-top: 20px;
                }
                
                .usuario-card {
                    background: white;
                    border: 1px solid #e1e8ed;
                    border-radius: 10px;
                    padding: 20px;
                    margin-bottom: 15px;
                    transition: all 0.3s;
                }
                
                .usuario-card:hover {
                    box-shadow: 0 5px 15px rgba(0,0,0,0.1);
                    transform: translateY(-2px);
                }
                
                .usuario-info {
                    display: grid;
                    grid-template-columns: 1fr 1fr 1fr auto;
                    gap: 15px;
                    align-items: center;
                }
                
                .usuario-datos h4 {
                    margin: 0 0 5px 0;
                    color: #2c3e50;
                }
                
                .usuario-datos p {
                    margin: 2px 0;
                    color: #6c757d;
                    font-size: 14px;
                }
                
                .usuario-estado {
                    padding: 4px 12px;
                    border-radius: 20px;
                    font-size: 12px;
                    font-weight: 500;
                    text-align: center;
                }
                
                .usuario-estado.activo {
                    background: #d4edda;
                    color: #155724;
                }
                
                .usuario-estado.inactivo {
                    background: #f8d7da;
                    color: #721c24;
                }
                
                .usuario-acciones {
                    display: flex;
                    gap: 5px;
                }
                
                .filtros-admin {
                    background: #f8f9fa;
                    padding: 20px;
                    border-radius: 10px;
                    margin-bottom: 20px;
                }
                
                .reporte-admin-card {
                    background: white;
                    border: 1px solid #e1e8ed;
                    border-radius: 8px;
                    padding: 15px;
                    margin-bottom: 10px;
                    border-left: 4px solid #667eea;
                }
                
                .reporte-admin-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 10px;
                }
                
                .reporte-admin-usuario {
                    background: #667eea;
                    color: white;
                    padding: 2px 8px;
                    border-radius: 12px;
                    font-size: 12px;
                    font-weight: 500;
                }
                
                .estadisticas-container {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                    gap: 20px;
                }
                
                .stat-card {
                    background: white;
                    border: 1px solid #e1e8ed;
                    border-radius: 10px;
                    padding: 20px;
                    text-align: center;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.05);
                }
                
                .stat-number {
                    font-size: 32px;
                    font-weight: bold;
                    color: #667eea;
                    margin-bottom: 10px;
                }
                
                .stat-label {
                    color: #6c757d;
                    font-size: 14px;
                    font-weight: 500;
                }
                
                @media (max-width: 768px) {
                    .admin-panel {
                        width: 95%;
                        height: 95%;
                        margin: 20px;
                    }
                    
                    .form-row {
                        grid-template-columns: 1fr;
                    }
                    
                    .usuario-info {
                        grid-template-columns: 1fr;
                        text-align: center;
                    }
                    
                    .admin-tabs {
                        flex-direction: column;
                    }
                }
            </style>
        `;

        // Insertar en el DOM
        const existingOverlay = document.getElementById('adminOverlay');
        if (existingOverlay) {
            existingOverlay.remove();
        }
        
        document.body.insertAdjacentHTML('beforeend', adminHTML);
    }

    async cargarDatos() {
        // Cargar usuarios - siempre usar método local primero
        try {
            // Intentar método asíncrono si está disponible
            if (typeof sistemaAuth.listarUsuarios === 'function') {
                this.usuarios = await sistemaAuth.listarUsuarios();
            } else {
                // Fallback a método síncrono
                this.usuarios = sistemaAuth.obtenerUsuarios() || {};
            }
            
            if (Object.keys(this.usuarios).length === 0) {
                console.warn('⚠️ No hay usuarios cargados');
            }
            
            this.mostrarUsuarios();
            
        } catch (error) {
            console.error('Error cargando usuarios:', error);
            // Fallback directo a usuarios locales
            this.usuarios = sistemaAuth.obtenerUsuarios() || {};
            this.mostrarUsuarios();
        }
        
        // Cargar reportes locales (sin filtrar - el admin ve todo)
        try {
            if (window.reportesDB) {
                // Como admin, necesitamos ver TODOS los reportes sin filtrar
                const reportesLocales = await window.reportesDB.obtenerTodosLosReportesSinFiltrar();
                this.reportes = reportesLocales;
                console.log(`📊 Admin panel cargó ${reportesLocales.length} reportes total`);
            } else {
                // Fallback a localStorage
                const reportesGuardados = localStorage.getItem('reportes') || '[]';
                this.reportes = JSON.parse(reportesGuardados);
            }
            
            // Si somos admin y hay GitHub sync disponible, intentar cargar reportes de todos los usuarios
            const usuarioActual = window.usuarioActual || (window.sistemaAuth ? window.sistemaAuth.obtenerSesionActual() : null);
            if (usuarioActual && usuarioActual.rol === 'administrador' && window.githubSync) {
                console.log('👑 Admin detectado: Intentando cargar reportes de todos los usuarios desde GitHub...');
                try {
                    const resultadoDescarga = await window.githubSync.descargarReportesDeTodosLosUsuarios();
                    if (resultadoDescarga.exito && resultadoDescarga.totalReportes > 0) {
                        console.log(`✅ Admin: ${resultadoDescarga.totalReportes} reportes cargados desde GitHub`);
                        // Recargar reportes después de la descarga
                        if (window.reportesDB) {
                            this.reportes = await window.reportesDB.obtenerTodosLosReportes();
                        } else {
                            const reportesActualizados = localStorage.getItem('reportes') || '[]';
                            this.reportes = JSON.parse(reportesActualizados);
                        }
                    }
                } catch (errorGitHub) {
                    console.log('⚠️ No se pudieron cargar reportes adicionales desde GitHub:', errorGitHub.message);
                }
            }
            
            this.mostrarReportes();
            this.mostrarEstadisticas();
        } catch (error) {
            console.error('Error cargando reportes:', error);
            this.reportes = [];
        }
        this.mostrarEstadisticas();
    }

    mostrarUsuarios() {
        const container = document.getElementById('listaUsuarios');
        const usuarios = Object.values(this.usuarios);
        
        container.innerHTML = usuarios.map(usuario => `
            <div class="usuario-card">
                <div class="usuario-info">
                    <div class="usuario-datos">
                        <h4>${usuario.nombre}</h4>
                        <p>👤 ${usuario.id}</p>
                        <p>📧 ${usuario.email}</p>
                        <p>🔑 ${usuario.rol}</p>
                    </div>
                    <div>
                        <p><strong>Creado:</strong></p>
                        <p>${new Date(usuario.fechaCreacion).toLocaleDateString()}</p>
                        ${usuario.ultimoAcceso ? `
                            <p><strong>Último acceso:</strong></p>
                            <p>${new Date(usuario.ultimoAcceso).toLocaleDateString()}</p>
                        ` : '<p><em>Sin accesos</em></p>'}
                    </div>
                    <div class="usuario-estado ${usuario.activo ? 'activo' : 'inactivo'}">
                        ${usuario.activo ? '✅ Activo' : '❌ Inactivo'}
                    </div>
                    <div class="usuario-acciones">
                        <button class="btn-admin btn-warning" onclick="editarUsuario('${usuario.id}')">
                            ✏️ Editar
                        </button>
                        <button class="btn-admin ${usuario.activo ? 'btn-danger' : 'btn-success'}" 
                                onclick="toggleUsuario('${usuario.id}')">
                            ${usuario.activo ? '🚫 Desactivar' : '✅ Activar'}
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    mostrarReportes() {
        const container = document.getElementById('listaReportesAdmin');
        const filtroUsuario = document.getElementById('filtroUsuario');
        
        // Llenar opciones de filtro de usuario
        const usuariosUnicos = [...new Set(this.reportes.map(r => r.usuarioId || 'local').filter(Boolean))];
        filtroUsuario.innerHTML = '<option value="">Todos los usuarios</option>' +
            usuariosUnicos.map(userId => {
                const usuario = Object.values(this.usuarios).find(u => u.id === userId);
                const nombre = usuario ? usuario.nombre : userId;
                return `<option value="${userId}">${nombre}</option>`;
            }).join('');
        
        this.filtrarReportesAdmin();
    }

    filtrarReportesAdmin() {
        console.log('🔍 Ejecutando filtro de reportes admin...');
        const container = document.getElementById('listaReportesAdmin');
        const filtroUsuario = document.getElementById('filtroUsuario')?.value || '';
        const filtroFecha = document.getElementById('filtroFecha')?.value || '';

        console.log(`📊 Total reportes disponibles: ${this.reportes.length}`);
        console.log(`🔍 Filtro usuario: "${filtroUsuario}"`);
        console.log(`📅 Filtro fecha: "${filtroFecha}"`);

        let reportesFiltrados = [...this.reportes];

        if (filtroUsuario) {
            const antes = reportesFiltrados.length;
            // Buscar tanto por usuarioId como por usuario (para compatibilidad)
            reportesFiltrados = reportesFiltrados.filter(r => {
                const coincide = r.usuarioId === filtroUsuario ||
                                r.usuario === filtroUsuario ||
                                r.creadoPor === filtroUsuario;

                if (coincide) {
                    console.log(`✅ Reporte coincide: ${r.colegio} - Usuario: ${r.usuarioId || r.usuario}`);
                }
                return coincide;
            });
            console.log(`👤 Después de filtrar por usuario: ${antes} → ${reportesFiltrados.length}`);
        }

        if (filtroFecha) {
            const antes = reportesFiltrados.length;
            reportesFiltrados = reportesFiltrados.filter(r => r.fecha === filtroFecha);
            console.log(`📅 Después de filtrar por fecha: ${antes} → ${reportesFiltrados.length}`);
        }
        
        container.innerHTML = reportesFiltrados.map(reporte => {
            const usuario = Object.values(this.usuarios).find(u => u.id === reporte.usuarioId);
            const nombreUsuario = usuario ? usuario.nombre : (reporte.usuarioId || 'Usuario Local');

            // Corregir problema de timezone agregando la hora del mediodía
            const fechaCorregida = reporte.fecha + 'T12:00:00';
            const fechaFormateada = new Date(fechaCorregida).toLocaleDateString('es-MX');

            // Función helper para escapar HTML y preservar caracteres especiales
            const escapeHtml = (text) => {
                if (!text) return '';
                const div = document.createElement('div');
                div.textContent = text;
                return div.innerHTML;
            };

            return `
                <div class="reporte-admin-card">
                    <div class="reporte-admin-header">
                        <div>
                            <strong>${escapeHtml(reporte.colegio)}</strong>
                            <div class="reporte-admin-usuario">${escapeHtml(nombreUsuario)}</div>
                        </div>
                        <div>
                            <small>${fechaFormateada}</small>
                        </div>
                    </div>
                    <p><strong>Contacto:</strong> ${escapeHtml(reporte.nombreContacto)} (${escapeHtml(reporte.cargoContacto)})</p>
                    <p><strong>Zona:</strong> ${escapeHtml(reporte.gerencia)} - ${escapeHtml(reporte.zona)}</p>
                    <p><strong>Objetivo:</strong> ${escapeHtml(reporte.objetivo)}</p>
                    ${reporte.sincronizadoFirebase ? 
                        '<span style="color: green;">☁️ Sincronizado</span>' : 
                        '<span style="color: orange;">📱 Solo local</span>'}
                </div>
            `;
        }).join('');
        
        if (reportesFiltrados.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: #6c757d; font-style: italic;">No se encontraron reportes con los filtros aplicados</p>';
        }
    }

    mostrarEstadisticas() {
        const container = document.getElementById('estadisticasGenerales');
        const usuarios = Object.values(this.usuarios);
        const usuariosActivos = usuarios.filter(u => u.activo).length;
        const totalReportes = this.reportes.length;
        const reportesSincronizados = this.reportes.filter(r => r.sincronizadoFirebase).length;
        
        // Estadísticas por usuario
        const reportesPorUsuario = {};
        this.reportes.forEach(reporte => {
            const userId = reporte.usuarioId || 'local';
            reportesPorUsuario[userId] = (reportesPorUsuario[userId] || 0) + 1;
        });
        
        container.innerHTML = `
            <div class="stat-card">
                <div class="stat-number">${usuarios.length}</div>
                <div class="stat-label">Total Usuarios</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${usuariosActivos}</div>
                <div class="stat-label">Usuarios Activos</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${totalReportes}</div>
                <div class="stat-label">Total Reportes</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${reportesSincronizados}</div>
                <div class="stat-label">Reportes Sincronizados</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${Object.keys(reportesPorUsuario).length}</div>
                <div class="stat-label">Usuarios con Reportes</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${Math.round(totalReportes / usuarios.length)}</div>
                <div class="stat-label">Promedio por Usuario</div>
            </div>
        `;
    }
}

// ============== FUNCIONES GLOBALES DEL PANEL ADMIN ==============

function mostrarPanelAdministrador() {
    const panel = new PanelAdministrador();
    panel.mostrar();
}

function cerrarPanelAdmin() {
    const overlay = document.getElementById('adminOverlay');
    if (overlay) {
        overlay.remove();
    }
}

function mostrarTab(tabName) {
    // Ocultar todas las tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelectorAll('.tab-button').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Mostrar la tab seleccionada
    document.getElementById(`tab-${tabName}`).classList.add('active');
    event.target.classList.add('active');
}

function mostrarFormularioNuevoUsuario() {
    const form = document.getElementById('formularioNuevoUsuario');
    form.style.display = form.style.display === 'none' ? 'block' : 'none';
}

function cancelarNuevoUsuario() {
    document.getElementById('formularioNuevoUsuario').style.display = 'none';
    // Limpiar campos
    ['nuevoUsername', 'nuevoNombre', 'nuevoEmail', 'nuevoPassword'].forEach(id => {
        document.getElementById(id).value = '';
    });
    document.getElementById('nuevoRol').value = 'usuario';
}

async function crearNuevoUsuario() {
    const username = document.getElementById('nuevoUsername').value.trim();
    const nombre = document.getElementById('nuevoNombre').value.trim();
    const email = document.getElementById('nuevoEmail').value.trim();
    const password = document.getElementById('nuevoPassword').value;
    const rol = document.getElementById('nuevoRol').value;
    
    if (!username || !nombre || !email || !password) {
        alert('Por favor completa todos los campos');
        return;
    }
    
    if (password.length < 6) {
        alert('La contraseña debe tener al menos 6 caracteres');
        return;
    }
    
    try {
        // Mostrar mensaje de carga
        const boton = event.target;
        const textoOriginal = boton.textContent;
        boton.textContent = 'Creando...';
        boton.disabled = true;
        
        await sistemaAuth.crearUsuario({
            id: username,
            username,
            nombre,
            email,
            password,
            rol
        });
        
        alert(`Usuario ${nombre} creado exitosamente en Firebase`);
        cancelarNuevoUsuario();
        
        // Recargar panel
        setTimeout(() => {
            cerrarPanelAdmin();
            mostrarPanelAdministrador();
        }, 500);
        
    } catch (error) {
        alert('Error creando usuario: ' + error.message);
    }
}

async function editarUsuario(userId) {
    const nuevoNombre = prompt('Nuevo nombre:');
    const nuevoEmail = prompt('Nuevo email:');
    const nuevaPassword = prompt('Nueva contraseña (dejar vacío para no cambiar):');
    
    if (nuevoNombre && nuevoEmail) {
        try {
            const cambios = { nombre: nuevoNombre, email: nuevoEmail };
            if (nuevaPassword) {
                cambios.password = nuevaPassword;
            }
            
            await sistemaAuth.actualizarUsuario(userId, cambios);
            alert('Usuario actualizado exitosamente en Firebase');
            
            // Recargar panel
            setTimeout(() => {
                cerrarPanelAdmin();
                mostrarPanelAdministrador();
            }, 500);
        } catch (error) {
            alert('Error actualizando usuario: ' + error.message);
        }
    }
}

async function toggleUsuario(userId) {
    try {
        const usuarios = await sistemaAuth.listarUsuarios();
        const usuario = usuarios[userId];
        
        if (!usuario) {
            alert('Usuario no encontrado');
            return;
        }
        
        if (confirm(`¿${usuario.activo ? 'Desactivar' : 'Activar'} usuario ${usuario.nombre}?`)) {
            await sistemaAuth.actualizarUsuario(userId, { activo: !usuario.activo });
            alert(`Usuario ${usuario.activo ? 'desactivado' : 'activado'} exitosamente en Firebase`);
            
            // Recargar panel
            setTimeout(() => {
                cerrarPanelAdmin();
                mostrarPanelAdministrador();
            }, 500);
        }
    } catch (error) {
        alert('Error modificando usuario: ' + error.message);
    }
}

function filtrarReportesAdmin() {
    // Esta función se ejecuta desde el HTML cuando cambian los filtros
    console.log('🎯 Función global filtrarReportesAdmin llamada');
    if (window.panelAdmin) {
        console.log('✅ Panel admin encontrado, ejecutando filtro...');
        window.panelAdmin.filtrarReportesAdmin();
    } else {
        console.error('❌ Panel de administrador no está inicializado');
        console.log('🔍 Intentando inicializar panel admin...');

        // Intentar encontrar y usar el panel
        if (typeof PanelAdministrador !== 'undefined') {
            window.panelAdmin = new PanelAdministrador();
            if (window.reportesDB) {
                window.reportesDB.obtenerTodosLosReportesSinFiltrar().then(reportes => {
                    window.panelAdmin.reportes = reportes;
                    window.panelAdmin.usuarios = sistemaAuth.obtenerUsuarios();
                    window.panelAdmin.filtrarReportesAdmin();
                });
            }
        }
    }
}

async function sincronizarUsuariosGitHub() {
    const boton = event.target;
    const textoOriginal = boton.textContent;
    
    console.log('📤 === INICIO BACKUP USUARIOS A GITHUB ===');
    
    try {
        boton.textContent = '⏳ Iniciando...';
        boton.disabled = true;
        
        // Verificar que githubSync esté disponible
        if (!window.githubSync) {
            console.log('🔧 Intentando inicializar githubSync...');
            // Usar la función global para asegurar GitHubSync
            if (window.asegurarGitHubSync && window.asegurarGitHubSync()) {
                console.log('✅ githubSync inicializado exitosamente');
            } else {
                alert('❌ Sistema de GitHub no disponible. Recarga la página y asegúrate de tener configuración válida.');
                boton.textContent = textoOriginal;
                boton.disabled = false;
                return;
            }
        }
        
        // Verificar configuración de GitHub
        if (!validarConfiguracionGitHub(window.githubSync.config)) {
            alert('⚠️ Por favor configura GitHub primero (botón Config GitHub en el header)');
            boton.textContent = textoOriginal;
            boton.disabled = false;
            return;
        }
        
        // Verificar usuarios locales
        console.log('👥 Verificando usuarios locales...');
        const usuariosLocales = sistemaAuth.obtenerUsuarios() || {};
        console.log('📊 Usuarios locales encontrados:', Object.keys(usuariosLocales));
        
        if (Object.keys(usuariosLocales).length === 0) {
            alert('⚠️ No hay usuarios locales. Usa "Restaurar Usuarios Base" primero.');
            boton.textContent = textoOriginal;
            boton.disabled = false;
            return;
        }
        
        // Hacer backup a GitHub
        boton.textContent = '📤 Subiendo a GitHub...';
        console.log('🌐 Haciendo backup de usuarios a GitHub...');
        
        const resultado = await window.githubSync.sincronizarUsuarios();
        
        if (resultado.exito) {
            console.log('✅ Backup exitoso:', resultado);
            alert(`✅ Backup completado: ${resultado.cantidad} usuarios subidos a GitHub`);
            if (window.panelAdmin) {
                window.panelAdmin.cargarUsuarios();
            }
        } else {
            throw new Error(resultado.error || 'Error desconocido');
        }
        
    } catch (error) {
        console.error('❌ Error en sincronización:', error);
        alert(`❌ Error sincronizando con GitHub: ${error.message}`);
        
    } finally {
        console.log('🏁 === FIN BACKUP USUARIOS ===');
        boton.textContent = textoOriginal;
        boton.disabled = false;
    }
}

async function restaurarUsuariosGitHub() {
    if (!confirm('⚠️ ¿Estás seguro de que quieres RESTAURAR usuarios desde GitHub?\n\nEsto SOBRESCRIBIRÁ todos los usuarios locales con los datos de GitHub.')) {
        return;
    }

    const boton = event.target;
    const textoOriginal = boton.textContent;
    
    console.log('📥 === INICIO RESTORE USUARIOS DESDE GITHUB ===');
    
    try {
        boton.textContent = '⏳ Descargando...';
        boton.disabled = true;
        
        // Verificar que githubSync esté disponible
        if (!window.githubSync) {
            console.log('🔧 Intentando inicializar githubSync...');
            if (window.asegurarGitHubSync && window.asegurarGitHubSync()) {
                console.log('✅ githubSync inicializado exitosamente');
            } else {
                alert('❌ Sistema de GitHub no disponible. Recarga la página.');
                return;
            }
        }
        
        // Verificar configuración de GitHub
        if (!validarConfiguracionGitHub(window.githubSync.config)) {
            alert('⚠️ Por favor configura GitHub primero (botón Config GitHub en el header)');
            return;
        }
        
        // Restaurar usuarios desde GitHub
        boton.textContent = '📥 Descargando desde GitHub...';
        console.log('🌐 Restaurando usuarios desde GitHub...');
        
        const resultado = await window.githubSync.descargarUsuarios();
        
        if (resultado.exito) {
            console.log('✅ Restore exitoso:', resultado);
            alert(`✅ Restore completado: ${resultado.cantidad} usuarios descargados desde GitHub`);
            
            // Recargar panel para mostrar usuarios restaurados
            setTimeout(() => {
                window.location.reload(); // Recargar toda la página para reinicializar el sistema
            }, 1000);
        } else {
            throw new Error(resultado.error || 'Error desconocido');
        }
        
    } catch (error) {
        console.error('❌ Error en restore:', error);
        alert(`❌ Error restaurando desde GitHub: ${error.message}`);
        
    } finally {
        console.log('🏁 === FIN RESTORE USUARIOS ===');
        boton.textContent = textoOriginal;
        boton.disabled = false;
    }
}

async function restaurarUsuariosBase() {
    if (confirm('¿Restaurar usuarios base (admin, hpineda, fvillarreal, gdelaparra, aaguilar)? Esto NO eliminará usuarios existentes, solo agregará los que falten.')) {
        try {
            const usuariosRestaurados = sistemaAuth.restaurarUsuariosBase();
            alert(`✅ Usuarios base restaurados. Total: ${Object.keys(usuariosRestaurados).length} usuarios disponibles.`);
            
            // Recargar panel
            setTimeout(() => {
                cerrarPanelAdmin();
                mostrarPanelAdministrador();
            }, 500);
            
        } catch (error) {
            alert('❌ Error restaurando usuarios: ' + error.message);
            console.error('Error:', error);
        }
    }
}

// ============== FUNCIONES ADICIONALES PARA EL PANEL ==============

function mostrarFormularioNuevoUsuario() {
    const formulario = document.getElementById('formularioNuevoUsuario');
    formulario.style.display = formulario.style.display === 'none' ? 'block' : 'none';
}

function cancelarNuevoUsuario() {
    document.getElementById('formularioNuevoUsuario').style.display = 'none';
    // Limpiar formulario
    document.getElementById('nuevoUsername').value = '';
    document.getElementById('nuevoNombre').value = '';
    document.getElementById('nuevoEmail').value = '';
    document.getElementById('nuevoPassword').value = '';
    document.getElementById('nuevoRol').value = 'usuario';
}

async function crearNuevoUsuario() {
    const username = document.getElementById('nuevoUsername').value.trim();
    const nombre = document.getElementById('nuevoNombre').value.trim();
    const email = document.getElementById('nuevoEmail').value.trim();
    const password = document.getElementById('nuevoPassword').value;
    const rol = document.getElementById('nuevoRol').value;

    if (!username || !nombre || !email || !password) {
        alert('Por favor completa todos los campos');
        return;
    }

    if (password.length < 6) {
        alert('La contraseña debe tener al menos 6 caracteres');
        return;
    }

    try {
        const nuevoUsuario = sistemaAuth.crearUsuario({
            username,
            nombre,
            email,
            password,
            rol
        });

        alert(`✅ Usuario "${nuevoUsuario.nombre}" creado exitosamente`);
        cancelarNuevoUsuario();
        if (window.panelAdmin) {
            window.panelAdmin.cargarUsuarios();
        }
    } catch (error) {
        alert('❌ Error creando usuario: ' + error.message);
    }
}

function editarUsuario(userId) {
    try {
        const usuarios = sistemaAuth.obtenerUsuarios();
        const usuario = usuarios[userId];
        
        if (!usuario) {
            alert('Usuario no encontrado');
            return;
        }

        // Crear modal de edición
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.5);display:flex;justify-content:center;align-items:center;z-index:10002';
        
        modal.innerHTML = `
            <div style="background:white;padding:30px;border-radius:10px;max-width:500px;width:90%;max-height:80vh;overflow-y:auto">
                <h2 style="margin-bottom:20px;color:#2c3e50">✏️ Editar Usuario</h2>
                <form id="editarUsuarioForm">
                    <div style="margin-bottom:15px">
                        <label style="display:block;margin-bottom:5px;font-weight:600">ID de Usuario:</label>
                        <input type="text" id="editUserId" value="${usuario.id}" 
                               style="width:100%;padding:8px;border:1px solid #ddd;border-radius:4px;background:#f5f5f5" readonly>
                    </div>
                    <div style="margin-bottom:15px">
                        <label style="display:block;margin-bottom:5px;font-weight:600">Nombre Completo:</label>
                        <input type="text" id="editUserName" value="${usuario.nombre}" 
                               style="width:100%;padding:8px;border:1px solid #ddd;border-radius:4px" required>
                    </div>
                    <div style="margin-bottom:15px">
                        <label style="display:block;margin-bottom:5px;font-weight:600">Correo Electrónico:</label>
                        <input type="email" id="editUserEmail" value="${usuario.email}" 
                               style="width:100%;padding:8px;border:1px solid #ddd;border-radius:4px" required>
                    </div>
                    <div style="margin-bottom:15px">
                        <label style="display:block;margin-bottom:5px;font-weight:600">Nueva Contraseña:</label>
                        <input type="password" id="editUserPassword" placeholder="Dejar vacío para mantener la actual" 
                               style="width:100%;padding:8px;border:1px solid #ddd;border-radius:4px">
                        <small style="color:#666;font-size:12px">Mínimo 6 caracteres si deseas cambiarla</small>
                    </div>
                    <div style="margin-bottom:15px">
                        <label style="display:block;margin-bottom:5px;font-weight:600">Rol:</label>
                        <select id="editUserRole" style="width:100%;padding:8px;border:1px solid #ddd;border-radius:4px">
                            <option value="usuario" ${usuario.rol === 'usuario' ? 'selected' : ''}>Usuario</option>
                            <option value="administrador" ${usuario.rol === 'administrador' ? 'selected' : ''}>Administrador</option>
                        </select>
                    </div>
                    <div style="margin-bottom:15px">
                        <label style="display:flex;align-items:center;gap:8px;font-weight:600">
                            <input type="checkbox" id="editUserActive" ${usuario.activo ? 'checked' : ''}>
                            Usuario Activo
                        </label>
                    </div>
                    
                    <div style="border-top:1px solid #eee;padding-top:15px;margin-top:15px">
                        <small style="color:#666">
                            <strong>Creado:</strong> ${new Date(usuario.fechaCreacion).toLocaleString()}<br>
                            ${usuario.ultimoAcceso ? `<strong>Último acceso:</strong> ${new Date(usuario.ultimoAcceso).toLocaleString()}<br>` : ''}
                            ${usuario.creadoPor ? `<strong>Creado por:</strong> ${usuario.creadoPor}<br>` : ''}
                        </small>
                    </div>
                    
                    <div style="display:flex;gap:10px;margin-top:20px">
                        <button type="submit" class="btn-admin btn-success" style="background:#27ae60;color:white;border:none;padding:10px 20px;border-radius:5px;cursor:pointer">
                            💾 Guardar Cambios
                        </button>
                        <button type="button" onclick="this.closest('.modal-overlay').remove()" 
                                class="btn-admin btn-secondary" style="background:#95a5a6;color:white;border:none;padding:10px 20px;border-radius:5px;cursor:pointer">
                            ❌ Cancelar
                        </button>
                    </div>
                </form>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Manejar envío del formulario
        document.getElementById('editarUsuarioForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const nombre = document.getElementById('editUserName').value.trim();
            const email = document.getElementById('editUserEmail').value.trim();
            const password = document.getElementById('editUserPassword').value;
            const rol = document.getElementById('editUserRole').value;
            const activo = document.getElementById('editUserActive').checked;
            
            if (!nombre || !email) {
                alert('Nombre y email son obligatorios');
                return;
            }
            
            if (password && password.length < 6) {
                alert('La contraseña debe tener al menos 6 caracteres');
                return;
            }
            
            try {
                const cambios = {
                    nombre,
                    email,
                    activo
                };
                
                // Solo incluir password si se proporcionó uno nuevo
                if (password) {
                    cambios.password = password;
                }
                
                // Solo cambiar rol si el usuario actual es admin y no se está editando a sí mismo
                const usuarioActual = sistemaAuth.obtenerSesionActual();
                if (usuarioActual.id !== userId) {
                    cambios.rol = rol;
                } else if (rol !== usuario.rol) {
                    alert('⚠️ No puedes cambiar tu propio rol');
                    return;
                }
                
                const usuarioActualizado = sistemaAuth.actualizarUsuario(userId, cambios);
                
                alert(`✅ Usuario "${usuarioActualizado.nombre}" actualizado exitosamente`);
                modal.remove();
                
                if (window.panelAdmin) {
                    window.panelAdmin.cargarUsuarios();
                }
                
            } catch (error) {
                alert('❌ Error actualizando usuario: ' + error.message);
            }
        });
        
        // Enfocar el primer campo editable
        setTimeout(() => {
            document.getElementById('editUserName').focus();
        }, 100);
        
    } catch (error) {
        alert('❌ Error cargando datos del usuario: ' + error.message);
        console.error('Error:', error);
    }
}

function toggleUsuario(userId) {
    try {
        const usuarios = sistemaAuth.obtenerUsuarios();
        const usuario = usuarios[userId];
        
        if (!usuario) {
            alert('Usuario no encontrado');
            return;
        }

        const nuevoEstado = !usuario.activo;
        
        sistemaAuth.actualizarUsuario(userId, { activo: nuevoEstado });
        
        alert(`✅ Usuario ${nuevoEstado ? 'activado' : 'desactivado'} exitosamente`);
        if (window.panelAdmin) {
            window.panelAdmin.cargarUsuarios();
        }
    } catch (error) {
        alert('❌ Error actualizando usuario: ' + error.message);
    }
}

function filtrarReportesAdmin() {
    if (window.panelAdmin) {
        window.panelAdmin.filtrarReportesAdmin();
    }
}

async function sincronizarReportesAdminGitHub() {
    const boton = event.target;
    const textoOriginal = boton.textContent;
    
    console.log('📤 === INICIO BACKUP REPORTES ADMIN A GITHUB ===');
    
    try {
        boton.textContent = '⏳ Iniciando...';
        boton.disabled = true;
        
        // Verificar que es admin
        const usuarioActual = window.usuarioActual || (window.sistemaAuth ? window.sistemaAuth.obtenerSesionActual() : null);
        if (!usuarioActual || usuarioActual.rol !== 'administrador') {
            alert('❌ Solo los administradores pueden hacer backup de reportes');
            return;
        }
        
        // Verificar que githubSync esté disponible
        if (!window.githubSync) {
            alert('❌ Sistema de GitHub no disponible. Recarga la página y asegúrate de tener configuración válida.');
            return;
        }
        
        // Verificar configuración de GitHub
        if (!validarConfiguracionGitHub(window.githubSync.config)) {
            alert('⚠️ Por favor configura GitHub primero (botón Config GitHub en el header)');
            return;
        }
        
        // Obtener todos los usuarios para hacer backup de sus reportes
        const usuarios = window.sistemaAuth.obtenerUsuarios() || {};
        const listaUsuarios = Object.keys(usuarios);
        
        if (listaUsuarios.length === 0) {
            alert('⚠️ No hay usuarios para hacer backup de reportes');
            return;
        }
        
        boton.textContent = '📤 Subiendo reportes...';
        console.log(`🌐 Haciendo backup de reportes de ${listaUsuarios.length} usuarios...`);
        
        let totalExitosos = 0;
        let totalReportes = 0;
        
        // Hacer backup de cada usuario por separado
        for (const userId of listaUsuarios) {
            try {
                console.log(`👤 Backup reportes de ${userId}...`);
                const resultado = await window.githubSync.sincronizarReportes(userId);
                if (resultado.exito) {
                    totalExitosos++;
                    totalReportes += resultado.cantidad;
                    console.log(`✅ ${resultado.cantidad} reportes de ${userId} subidos`);
                }
            } catch (error) {
                console.log(`⚠️ Error con reportes de ${userId}:`, error.message);
            }
        }
        
        console.log('✅ Backup completo:', { usuariosExitosos: totalExitosos, totalReportes });
        alert(`✅ Backup completado: ${totalReportes} reportes de ${totalExitosos} usuarios subidos a GitHub`);
        
    } catch (error) {
        console.error('❌ Error en backup de reportes:', error);
        alert(`❌ Error en backup de reportes: ${error.message}`);
        
    } finally {
        console.log('🏁 === FIN BACKUP REPORTES ADMIN ===');
        boton.textContent = textoOriginal;
        boton.disabled = false;
    }
}

async function restaurarReportesAdminGitHub() {
    if (!confirm('⚠️ ¿Estás seguro de que quieres RESTAURAR reportes desde GitHub?\n\nEsto SOBRESCRIBIRÁ todos los reportes locales con los datos de GitHub.')) {
        return;
    }

    const boton = event.target;
    const textoOriginal = boton.textContent;
    
    console.log('📥 === INICIO RESTORE REPORTES ADMIN DESDE GITHUB ===');
    
    try {
        boton.textContent = '⏳ Descargando...';
        boton.disabled = true;
        
        // Verificar que es admin
        const usuarioActual = window.usuarioActual || (window.sistemaAuth ? window.sistemaAuth.obtenerSesionActual() : null);
        if (!usuarioActual || usuarioActual.rol !== 'administrador') {
            alert('❌ Solo los administradores pueden restaurar reportes');
            return;
        }
        
        // Verificar que githubSync esté disponible
        if (!window.githubSync) {
            alert('❌ Sistema de GitHub no disponible. Recarga la página.');
            return;
        }
        
        // Verificar configuración de GitHub
        if (!validarConfiguracionGitHub(window.githubSync.config)) {
            alert('⚠️ Por favor configura GitHub primero (botón Config GitHub en el header)');
            return;
        }
        
        // Restaurar reportes de todos los usuarios desde GitHub
        boton.textContent = '📥 Descargando desde GitHub...';
        console.log('🌐 Restaurando reportes de todos los usuarios desde GitHub...');
        
        const resultado = await window.githubSync.descargarReportesDeTodosLosUsuarios();
        
        if (resultado.exito) {
            console.log('✅ Restore exitoso:', resultado);
            alert(`✅ Restore completado: ${resultado.totalReportes} reportes de ${resultado.usuariosProcesados} usuarios descargados desde GitHub`);
            
            // Recargar panel para mostrar reportes restaurados
            if (window.panelAdmin) {
                await window.panelAdmin.cargarDatos();
            } else {
                setTimeout(() => {
                    cerrarPanelAdmin();
                    mostrarPanelAdministrador();
                }, 1000);
            }
        } else {
            throw new Error(resultado.error || 'Error desconocido');
        }
        
    } catch (error) {
        console.error('❌ Error en restore de reportes:', error);
        alert(`❌ Error restaurando reportes desde GitHub: ${error.message}`);
        
    } finally {
        console.log('🏁 === FIN RESTORE REPORTES ADMIN ===');
        boton.textContent = textoOriginal;
        boton.disabled = false;
    }
}

// ====================================================================
// FUNCIONES DE REPORTES ADMINISTRATIVOS PARA REPORTE DE VISITAS
// ====================================================================

// Variables globales para reportes de visitas
let reporteDataVisitas = {
    reportes: [],
    borradores: [],
    usuarios: {},
    fechaInicio: null,
    fechaFin: null,
    filtros: {}
};

// Actualizar fechas según período seleccionado
function actualizarFechasReporteVisitas() {
    const periodo = document.getElementById('reportPeriodoVisitas').value;
    const customRange = document.getElementById('customDateRangeVisitas');
    const fechaInicio = document.getElementById('reportFechaInicioVisitas');
    const fechaFin = document.getElementById('reportFechaFinVisitas');

    if (periodo === 'custom') {
        customRange.style.display = 'block';
        return;
    }

    customRange.style.display = 'none';

    const hoy = new Date();
    let inicio = new Date();

    switch (periodo) {
        case 'mes':
            inicio.setMonth(hoy.getMonth() - 1);
            break;
        case 'trimestre':
            inicio.setMonth(hoy.getMonth() - 3);
            break;
        case 'semestre':
            inicio.setMonth(hoy.getMonth() - 6);
            break;
        case 'ano':
            inicio.setFullYear(hoy.getFullYear() - 1);
            break;
    }

    fechaInicio.value = inicio.toISOString().split('T')[0];
    fechaFin.value = hoy.toISOString().split('T')[0];
}

// Cargar datos para reportes de visitas
async function cargarDatosReporteVisitas() {
    try {
        console.log('📊 Cargando datos de reportes de visitas...');

        // Cargar reportes generados
        if (window.reportesDB) {
            reporteDataVisitas.reportes = await window.reportesDB.obtenerTodosLosReportesSinFiltrar() || [];
        } else {
            const reportesGuardados = localStorage.getItem('reportes') || '[]';
            reporteDataVisitas.reportes = JSON.parse(reportesGuardados);
        }

        // Cargar borradores
        const borradoresGuardados = localStorage.getItem('borradores') || '[]';
        reporteDataVisitas.borradores = JSON.parse(borradoresGuardados);

        // Cargar usuarios
        reporteDataVisitas.usuarios = sistemaAuth.obtenerUsuarios() || {};

        // Cargar usuarios en dropdown
        const usuarioSelect = document.getElementById('reportUsuarioVisitas');
        if (usuarioSelect) {
            usuarioSelect.innerHTML = '<option value="todos">Todos los Usuarios</option>';
            Object.entries(reporteDataVisitas.usuarios).forEach(([username, usuario]) => {
                if (username !== 'administrador') {
                    usuarioSelect.innerHTML += `<option value="${username}">${usuario.nombre}</option>`;
                }
            });
        }

        console.log(`✅ Datos cargados: ${reporteDataVisitas.reportes.length} reportes, ${reporteDataVisitas.borradores.length} borradores`);

    } catch (error) {
        console.error('❌ Error cargando datos para reporte de visitas:', error);
        alert('Error cargando datos. Verifique la aplicación.');
    }
}

// Filtrar datos según criterios seleccionados
function filtrarDatosReporteVisitas() {
    const periodo = document.getElementById('reportPeriodoVisitas').value;
    const usuario = document.getElementById('reportUsuarioVisitas').value;
    const gerencia = document.getElementById('reportGerenciaVisitas').value;

    let fechaInicio, fechaFin;

    if (periodo === 'custom') {
        fechaInicio = document.getElementById('reportFechaInicioVisitas').value;
        fechaFin = document.getElementById('reportFechaFinVisitas').value;
    } else {
        actualizarFechasReporteVisitas();
        fechaInicio = document.getElementById('reportFechaInicioVisitas').value;
        fechaFin = document.getElementById('reportFechaFinVisitas').value;
    }

    if (!fechaInicio || !fechaFin) {
        alert('Por favor seleccione un período válido');
        return [];
    }

    // Combinar reportes generados y borradores para análisis completo
    const todosLosDatos = [
        ...reporteDataVisitas.reportes.map(r => ({...r, tipo: 'reporte'})),
        ...reporteDataVisitas.borradores.map(b => ({...b, tipo: 'borrador'}))
    ];

    return todosLosDatos.filter(item => {
        // Filtro por fecha
        const fechaItem = item.fechaVisita || item.fecha || item.timestamp;
        if (!fechaItem) return false;

        const fechaStr = typeof fechaItem === 'string' ? fechaItem.split('T')[0] : new Date(fechaItem).toISOString().split('T')[0];
        if (fechaStr < fechaInicio || fechaStr > fechaFin) {
            return false;
        }

        // Filtro por usuario
        if (usuario !== 'todos') {
            const usuarioItem = item.usuarioId || item.creadoPor || 'local';
            if (usuarioItem !== usuario) {
                return false;
            }
        }

        // Filtro por gerencia
        if (gerencia !== 'todas') {
            const gerenciaItem = item.gerencia;
            if (gerenciaItem !== gerencia) {
                return false;
            }
        }

        return true;
    });
}

// Generar estadísticas del reporte de visitas
function generarEstadisticasReporteVisitas(datosFiltrados) {
    const stats = {
        totalItems: datosFiltrados.length,
        reportesGenerados: datosFiltrados.filter(d => d.tipo === 'reporte').length,
        borradoresGuardados: datosFiltrados.filter(d => d.tipo === 'borrador').length,
        institucionesUnicas: new Set(datosFiltrados.map(d => d.colegio || d.institucion).filter(Boolean)).size,
        usuariosActivos: new Set(datosFiltrados.map(d => d.usuarioId || d.creadoPor || 'local')).size,
        gerenciasActivas: new Set(datosFiltrados.map(d => d.gerencia).filter(Boolean)).size,
        serviciosPorTipo: {},
        actividadPorUsuario: {},
        actividadPorGerencia: {},
        timelineActividad: {}
    };

    // Analizar servicios y actividad
    datosFiltrados.forEach(item => {
        // Servicios por tipo
        const servicios = [item.capacitacion, item.comercial, item.institucional, item.operativo].filter(Boolean);
        servicios.forEach(servicio => {
            if (servicio && servicio.trim()) {
                stats.serviciosPorTipo[servicio] = (stats.serviciosPorTipo[servicio] || 0) + 1;
            }
        });

        // Actividad por usuario
        const usuario = item.usuarioId || item.creadoPor || 'local';
        stats.actividadPorUsuario[usuario] = (stats.actividadPorUsuario[usuario] || 0) + 1;

        // Actividad por gerencia
        if (item.gerencia) {
            stats.actividadPorGerencia[item.gerencia] = (stats.actividadPorGerencia[item.gerencia] || 0) + 1;
        }

        // Timeline de actividad
        const fecha = item.fechaVisita || item.fecha || item.timestamp;
        if (fecha) {
            const mes = (typeof fecha === 'string' ? fecha : new Date(fecha).toISOString()).substring(0, 7);
            stats.timelineActividad[mes] = (stats.timelineActividad[mes] || 0) + 1;
        }
    });

    return stats;
}

// Vista previa del reporte
async function previsualizarReporteVisitas() {
    await cargarDatosReporteVisitas();
    const datosFiltrados = filtrarDatosReporteVisitas();
    const stats = generarEstadisticasReporteVisitas(datosFiltrados);

    const preview = document.getElementById('reportPreviewVisitas');
    const content = document.getElementById('reportPreviewContentVisitas');

    content.innerHTML = `
        <div class="stats-summary">
            <div class="stat-item">
                <strong>📊 Total Items:</strong> ${stats.totalItems}
            </div>
            <div class="stat-item">
                <strong>📄 Reportes Generados:</strong> ${stats.reportesGenerados}
            </div>
            <div class="stat-item">
                <strong>💾 Borradores:</strong> ${stats.borradoresGuardados}
            </div>
            <div class="stat-item">
                <strong>🏫 Instituciones Únicas:</strong> ${stats.institucionesUnicas}
            </div>
            <div class="stat-item">
                <strong>👥 Usuarios Activos:</strong> ${stats.usuariosActivos}
            </div>
            <div class="stat-item">
                <strong>🌍 Gerencias Activas:</strong> ${stats.gerenciasActivas}
            </div>
        </div>

        <div class="stats-detail">
            <h5>🔧 Top Servicios:</h5>
            ${Object.entries(stats.serviciosPorTipo)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5)
                .map(([servicio, count]) => `<div>${servicio}: ${count} menciones</div>`)
                .join('')}
        </div>

        <div class="stats-detail">
            <h5>👥 Actividad por Usuario:</h5>
            ${Object.entries(stats.actividadPorUsuario)
                .sort((a, b) => b[1] - a[1])
                .map(([usuarioId, count]) => {
                    const usuario = reporteDataVisitas.usuarios[usuarioId];
                    const nombre = usuario ? usuario.nombre : usuarioId;
                    return `<div>${nombre}: ${count} items</div>`;
                })
                .join('')}
        </div>
    `;

    preview.style.display = 'block';
}

// Generar reporte ejecutivo
async function generarReporteEjecutivoVisitas() {
    await cargarDatosReporteVisitas();
    const datosFiltrados = filtrarDatosReporteVisitas();
    const stats = generarEstadisticasReporteVisitas(datosFiltrados);

    if (datosFiltrados.length === 0) {
        alert('⚠️ No hay datos para el período y filtros seleccionados');
        return;
    }

    alert(`📊 Reporte Ejecutivo generado: ${stats.totalItems} items encontrados (${stats.reportesGenerados} reportes, ${stats.borradoresGuardados} borradores). Use los botones de exportación para descargar.`);
}

// Generar reporte detallado
async function generarReporteDetalladoVisitas() {
    await cargarDatosReporteVisitas();
    const datosFiltrados = filtrarDatosReporteVisitas();

    if (datosFiltrados.length === 0) {
        alert('⚠️ No hay datos para el período y filtros seleccionados');
        return;
    }

    alert(`📋 Reporte Detallado generado: ${datosFiltrados.length} items. Use los botones de exportación para descargar.`);
}

// Exportar reporte a PDF
async function exportarReportePDFVisitas() {
    await cargarDatosReporteVisitas();
    const datosFiltrados = filtrarDatosReporteVisitas();
    const stats = generarEstadisticasReporteVisitas(datosFiltrados);

    if (datosFiltrados.length === 0) {
        alert('⚠️ No hay datos para exportar');
        return;
    }

    try {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        // Encabezado
        doc.setFontSize(18);
        doc.text('REPORTE DE VISITAS - UNIVERSITY OF DAYTON PUBLISHING', 14, 20);
        doc.setFontSize(12);
        doc.text(`Período: ${document.getElementById('reportFechaInicioVisitas').value} - ${document.getElementById('reportFechaFinVisitas').value}`, 14, 30);
        doc.text(`Generado: ${new Date().toLocaleDateString('es-MX')}`, 14, 38);

        let yPos = 50;

        // Resumen ejecutivo
        doc.setFontSize(14);
        doc.text('RESUMEN EJECUTIVO', 14, yPos);
        yPos += 10;

        doc.setFontSize(10);
        doc.text(`Total de Items: ${stats.totalItems}`, 14, yPos);
        yPos += 6;
        doc.text(`Reportes Generados: ${stats.reportesGenerados}`, 14, yPos);
        yPos += 6;
        doc.text(`Borradores Guardados: ${stats.borradoresGuardados}`, 14, yPos);
        yPos += 6;
        doc.text(`Instituciones Visitadas: ${stats.institucionesUnicas}`, 14, yPos);
        yPos += 6;
        doc.text(`Usuarios Activos: ${stats.usuariosActivos}`, 14, yPos);
        yPos += 15;

        // Actividad por usuario
        doc.setFontSize(12);
        doc.text('ACTIVIDAD POR USUARIO', 14, yPos);
        yPos += 8;

        doc.setFontSize(10);
        Object.entries(stats.actividadPorUsuario)
            .sort((a, b) => b[1] - a[1])
            .forEach(([usuarioId, count]) => {
                const usuario = reporteDataVisitas.usuarios[usuarioId];
                const nombre = usuario ? usuario.nombre : usuarioId;
                const porcentaje = ((count / stats.totalItems) * 100).toFixed(1);
                doc.text(`${nombre}: ${count} items (${porcentaje}%)`, 14, yPos);
                yPos += 6;
            });

        const fileName = `reporte_visitas_ejecutivo_${new Date().toISOString().split('T')[0]}.pdf`;
        doc.save(fileName);

        alert(`✅ Reporte PDF exportado: ${fileName}`);

    } catch (error) {
        console.error('❌ Error exportando PDF:', error);
        alert('Error al generar PDF. Verifique que jsPDF esté cargado.');
    }
}

// Exportar reporte a Excel
async function exportarReporteExcelVisitas() {
    await cargarDatosReporteVisitas();
    const datosFiltrados = filtrarDatosReporteVisitas();
    const stats = generarEstadisticasReporteVisitas(datosFiltrados);

    if (datosFiltrados.length === 0) {
        alert('⚠️ No hay datos para exportar');
        return;
    }

    try {
        const wb = XLSX.utils.book_new();

        // Hoja 1: Resumen Ejecutivo
        const resumenData = [
            ['REPORTE DE VISITAS - UNIVERSITY OF DAYTON PUBLISHING', ''],
            ['Período', `${document.getElementById('reportFechaInicioVisitas').value} - ${document.getElementById('reportFechaFinVisitas').value}`],
            ['Generado', new Date().toLocaleDateString('es-MX')],
            ['', ''],
            ['MÉTRICAS PRINCIPALES', ''],
            ['Total Items', stats.totalItems],
            ['Reportes Generados', stats.reportesGenerados],
            ['Borradores Guardados', stats.borradoresGuardados],
            ['Instituciones Únicas', stats.institucionesUnicas],
            ['Usuarios Activos', stats.usuariosActivos],
            ['', ''],
            ['ACTIVIDAD POR USUARIO', 'CANTIDAD']
        ];

        Object.entries(stats.actividadPorUsuario)
            .sort((a, b) => b[1] - a[1])
            .forEach(([usuarioId, count]) => {
                const usuario = reporteDataVisitas.usuarios[usuarioId];
                const nombre = usuario ? usuario.nombre : usuarioId;
                resumenData.push([nombre, count]);
            });

        const ws1 = XLSX.utils.aoa_to_sheet(resumenData);
        XLSX.utils.book_append_sheet(wb, ws1, 'Resumen Ejecutivo');

        // Hoja 2: Datos Detallados
        const headers = ['Fecha', 'Tipo', 'Institución', 'Gerencia', 'Usuario', 'Capacitación', 'Comercial', 'Institucional', 'Operativo'];
        const detailedData = datosFiltrados.map(item => [
            item.fechaVisita || item.fecha || new Date(item.timestamp).toISOString().split('T')[0],
            item.tipo || 'N/A',
            item.colegio || item.institucion || 'N/A',
            item.gerencia || 'N/A',
            (() => {
                const usuarioId = item.usuarioId || item.creadoPor || 'local';
                const usuario = reporteDataVisitas.usuarios[usuarioId];
                return usuario ? usuario.nombre : usuarioId;
            })(),
            item.capacitacion || '',
            item.comercial || '',
            item.institucional || '',
            item.operativo || ''
        ]);

        const ws2 = XLSX.utils.aoa_to_sheet([headers, ...detailedData]);
        XLSX.utils.book_append_sheet(wb, ws2, 'Datos Detallados');

        const fileName = `reporte_visitas_detallado_${new Date().toISOString().split('T')[0]}.xlsx`;
        XLSX.writeFile(wb, fileName);

        alert(`✅ Reporte Excel exportado: ${fileName}`);

    } catch (error) {
        console.error('❌ Error exportando Excel:', error);
        alert('Error al generar Excel. Verifique que XLSX esté cargado.');
    }
}

// Exportar reporte a CSV
async function exportarReporteCSVVisitas() {
    await cargarDatosReporteVisitas();
    const datosFiltrados = filtrarDatosReporteVisitas();

    if (datosFiltrados.length === 0) {
        alert('⚠️ No hay datos para exportar');
        return;
    }

    try {
        const headers = ['Fecha', 'Tipo', 'Institución', 'Gerencia', 'Usuario', 'Capacitación', 'Comercial', 'Institucional', 'Operativo'];
        const rows = datosFiltrados.map(item => [
            item.fechaVisita || item.fecha || new Date(item.timestamp).toISOString().split('T')[0],
            item.tipo || 'N/A',
            item.colegio || item.institucion || 'N/A',
            item.gerencia || 'N/A',
            (() => {
                const usuarioId = item.usuarioId || item.creadoPor || 'local';
                const usuario = reporteDataVisitas.usuarios[usuarioId];
                return usuario ? usuario.nombre : usuarioId;
            })(),
            item.capacitacion || '',
            item.comercial || '',
            item.institucional || '',
            item.operativo || ''
        ]);

        const csvContent = "\\uFEFF" + [
            headers.map(h => `"${h.replace(/"/g, '""')}"`).join(','),
            ...rows.map(row => row.map(cell => `"${String(cell || '').replace(/"/g, '""')}"`).join(','))
        ].join('\\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const fileName = `reporte_visitas_analitico_${new Date().toISOString().split('T')[0]}.csv`;

        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', fileName);
        link.click();
        URL.revokeObjectURL(url);

        alert(`✅ Reporte CSV exportado: ${fileName}`);

    } catch (error) {
        console.error('❌ Error exportando CSV:', error);
        alert('Error al generar CSV.');
    }
}

console.log('⚙️ Panel de administrador cargado');
