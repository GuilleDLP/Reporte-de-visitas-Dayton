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
                                    <button class="btn-admin btn-info" onclick="sincronizarUsuariosFirebase()">
                                        🔄 Sincronizar con Firebase
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
                            <h3>Reportes de Todos los Usuarios</h3>
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
        
        // Cargar reportes de Firebase
        if (sincronizador && sincronizador.db) {
            try {
                const reportesRemotos = await sincronizador.obtenerTodosLosReportes();
                this.reportes = reportesRemotos;
                this.mostrarReportes();
                this.mostrarEstadisticas();
            } catch (error) {
                console.error('Error cargando reportes:', error);
            }
        }
        
        // También cargar reportes locales
        const reportesLocales = await reportesDB.obtenerTodosLosReportes();
        this.reportes = [...this.reportes, ...reportesLocales];
        this.mostrarReportes();
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
            reportesFiltrados = reportesFiltrados.filter(r => r.usuarioId === filtroUsuario);
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
    const panel = new PanelAdministrador();
    panel.reportes = window.reportesGlobalesAdmin || [];
    panel.usuarios = sistemaAuth.obtenerUsuarios();
    panel.filtrarReportesAdmin();
}

async function sincronizarUsuariosFirebase() {
    const boton = event.target;
    const textoOriginal = boton.textContent;
    
    console.log('🔄 === INICIO SINCRONIZACIÓN USUARIOS ===');
    
    try {
        boton.textContent = '⏳ Inicializando...';
        boton.disabled = true;
        
        // Paso 1: Verificar usuarios locales
        console.log('👥 Paso 1: Verificando usuarios locales...');
        const usuariosLocales = sistemaAuth.obtenerUsuarios() || {};
        console.log('📊 Usuarios locales encontrados:', Object.keys(usuariosLocales));
        
        if (Object.keys(usuariosLocales).length === 0) {
            alert('⚠️ No hay usuarios locales. Usa "Restaurar Usuarios Base" primero.');
            return;
        }
        
        // Paso 2: Verificar/inicializar Firebase
        console.log('🔥 Paso 2: Verificando Firebase...');
        if (!gestorUsuariosFirebase) {
            console.log('➕ Creando gestor de usuarios...');
            gestorUsuariosFirebase = new GestorUsuariosFirebase();
        }
        
        // Verificar si el sincronizador general está listo
        if (!window.sincronizador || !window.sincronizador.db) {
            console.log('🚀 Inicializando sincronizador general...');
            boton.textContent = '⏳ Conectando Firebase...';
            
            if (!window.sincronizador) {
                window.sincronizador = new SincronizadorFirebase();
                window.sincronizador.usuarioActual = window.usuarioActual;
            }
            
            console.log('🔗 Conectando con Firebase...');
            await window.sincronizador.inicializar();
            console.log('✅ Sincronizador general listo');
        }
        
        // Inicializar gestor de usuarios si no está listo
        if (!gestorUsuariosFirebase.inicializado) {
            console.log('⚙️ Inicializando gestor de usuarios...');
            boton.textContent = '⏳ Preparando usuarios...';
            await gestorUsuariosFirebase.inicializar();
            console.log('✅ Gestor de usuarios listo');
        }
        
        // Paso 3: Sincronizar con timeout
        console.log('☁️ Paso 3: Subiendo usuarios a Firebase...');
        boton.textContent = '⏳ Subiendo usuarios...';
        
        // Agregar timeout para evitar que se quede colgado
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Timeout: Sincronización tardó más de 30 segundos')), 30000);
        });
        
        const syncPromise = gestorUsuariosFirebase.sincronizarConFirebase();
        
        const resultado = await Promise.race([syncPromise, timeoutPromise]);
        
        console.log('✅ Sincronización completada:', resultado);
        const cantidadUsuarios = Object.keys(usuariosLocales).length;
        alert(`✅ ${cantidadUsuarios} usuarios subidos a Firebase exitosamente`);
        
        // Recargar panel
        console.log('🔄 Recargando panel...');
        setTimeout(() => {
            cerrarPanelAdmin();
            mostrarPanelAdministrador();
        }, 500);
        
    } catch (error) {
        console.error('❌ Error en sincronización:', error);
        
        const usuariosLocales = sistemaAuth.obtenerUsuarios() || {};
        const cantidadUsuarios = Object.keys(usuariosLocales).length;
        
        if (error.message?.includes('Timeout')) {
            alert(`⏱️ Sincronización lenta. Usuarios locales OK (${cantidadUsuarios}). Reintenta si es necesario.`);
        } else if (cantidadUsuarios > 0) {
            alert(`⚠️ Usuarios locales OK (${cantidadUsuarios}), pero error conectando Firebase: ${error.message || 'Error desconocido'}`);
        } else {
            alert('❌ No hay usuarios locales y error conectando Firebase. Usa "Restaurar Usuarios Base" primero.');
        }
        
        console.error('Error completo:', error);
        
    } finally {
        console.log('🏁 === FIN SINCRONIZACIÓN USUARIOS ===');
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

console.log('⚙️ Panel de administrador cargado');
