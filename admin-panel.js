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
        
        // Cargar reportes locales (agregando soporte para archivos por usuario)
        try {
            if (window.reportesDB) {
                const reportesLocales = await window.reportesDB.obtenerTodosLosReportes();
                this.reportes = reportesLocales;
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
        const container = document.getElementById('listaReportesAdmin');
        const filtroUsuario = document.getElementById('filtroUsuario').value;
        const filtroFecha = document.getElementById('filtroFecha').value;

        let reportesFiltrados = this.reportes;

        if (filtroUsuario) {
            // Buscar tanto por usuarioId como por usuario (para compatibilidad)
            reportesFiltrados = reportesFiltrados.filter(r =>
                r.usuarioId === filtroUsuario ||
                r.usuario === filtroUsuario ||
                r.creadoPor === filtroUsuario
            );
        }

        if (filtroFecha) {
            reportesFiltrados = reportesFiltrados.filter(r => r.fecha === filtroFecha);
        }
        
        container.innerHTML = reportesFiltrados.map(reporte => {
            const usuario = Object.values(this.usuarios).find(u => u.id === reporte.usuarioId);
            const nombreUsuario = usuario ? usuario.nombre : (reporte.usuarioId || 'Usuario Local');
            
            return `
                <div class="reporte-admin-card">
                    <div class="reporte-admin-header">
                        <div>
                            <strong>${reporte.colegio}</strong>
                            <div class="reporte-admin-usuario">${nombreUsuario}</div>
                        </div>
                        <div>
                            <small>${new Date(reporte.fecha).toLocaleDateString()}</small>
                        </div>
                    </div>
                    <p><strong>Contacto:</strong> ${reporte.nombreContacto} (${reporte.cargoContacto})</p>
                    <p><strong>Zona:</strong> ${reporte.gerencia} - ${reporte.zona}</p>
                    <p><strong>Objetivo:</strong> ${reporte.objetivo}</p>
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
    if (window.panelAdmin) {
        window.panelAdmin.filtrarReportesAdmin();
    } else {
        console.error('Panel de administrador no está inicializado');
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

console.log('⚙️ Panel de administrador cargado');
