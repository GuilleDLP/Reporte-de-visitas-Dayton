// ============== SISTEMA DE AUTENTICACIÓN ==============

class SistemaAutenticacion {
    constructor() {
        this.usuarioActual = null;
        this.sessionKey = 'udp_session';
        this.usuariosKey = 'udp_usuarios';
        this.inicializarUsuariosBase();
    }

    // Usuarios base del sistema (en producción esto estaría en Firebase)
    inicializarUsuariosBase() {
        const usuariosBase = this.obtenerUsuariosBase();
        
        // Solo inicializar si no existen usuarios
        if (!localStorage.getItem(this.usuariosKey)) {
            localStorage.setItem(this.usuariosKey, JSON.stringify(usuariosBase));
        }
    }

    // Función de hash compatible con la app de Seguimiento
    hashPassword(password) {
        // Implementación simple de hash para demostración (igual que en Seguimiento)
        let hash = 0;
        for (let i = 0; i < password.length; i++) {
            const char = password.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return hash.toString();
    }

    obtenerUsuariosBase() {
        const fechaBase = new Date().toISOString();
        return {
            'admin': {
                id: 'admin',
                nombre: 'Administrador',
                email: 'admin@dayton.com',
                password: this.hashPassword('admin123'), // Ahora con hash
                rol: 'administrador',
                activo: true,
                fechaCreacion: fechaBase,
                fechaModificacion: fechaBase,
                ultimoAcceso: null
            },
            'hpineda': {
                id: 'hpineda',
                nombre: 'Homero Pineda',
                email: 'hpineda@dayton.com',
                password: this.hashPassword('hpineda2024'),
                rol: 'usuario',
                activo: true,
                fechaCreacion: fechaBase,
                fechaModificacion: fechaBase,
                ultimoAcceso: null
            },
            'fvillarreal': {
                id: 'fvillarreal',
                nombre: 'Fernanda Villarreal',
                email: 'fvillarreal@dayton.com',
                password: this.hashPassword('fvillarreal2024'),
                rol: 'usuario',
                activo: true,
                fechaCreacion: fechaBase,
                fechaModificacion: fechaBase,
                ultimoAcceso: null
            },
            'gdelaparra': {
                id: 'gdelaparra',
                nombre: 'Guillermo de la Parra',
                email: 'gdelaparra@dayton.com',
                password: this.hashPassword('gdelaparra2024'),
                rol: 'usuario',
                activo: true,
                fechaCreacion: fechaBase,
                fechaModificacion: fechaBase,
                ultimoAcceso: null
            },
            'aaguilar': {
                id: 'aaguilar',
                nombre: 'Ana Aguilar',
                email: 'aaguilar@dayton.com',
                password: this.hashPassword('aaguilar2024'),
                rol: 'usuario',
                activo: true,
                fechaCreacion: fechaBase,
                fechaModificacion: fechaBase,
                ultimoAcceso: null
            }
        };
    }

    restaurarUsuariosBase() {
        console.log('🔧 === RESTAURANDO USUARIOS BASE ===');
        console.log('🔧 ADVERTENCIA: Esta función puede sobrescribir cambios locales');
        const usuariosBase = this.obtenerUsuariosBase();
        const usuariosActuales = this.obtenerUsuarios() || {};

        console.log('👤 Usuarios actuales:', Object.keys(usuariosActuales));
        console.log('📦 Usuarios base disponibles:', Object.keys(usuariosBase));

        // Solo agregar usuarios base que NO existan ya
        let agregados = 0;
        for (const [userId, usuarioBase] of Object.entries(usuariosBase)) {
            if (!usuariosActuales[userId]) {
                // Asegurar que el usuario base tenga contraseña hasheada
                if (usuarioBase.password && !usuarioBase.password.includes('-')) {
                    // Si parece que no está hasheada, aplicar hash
                    usuarioBase.password = this.hashPassword(usuarioBase.password);
                }
                usuariosActuales[userId] = usuarioBase;
                agregados++;
                console.log(`➕ Agregado usuario faltante: ${usuarioBase.nombre}`);
            } else {
                console.log(`✓ Usuario ya existe: ${usuariosActuales[userId].nombre}`);
            }
        }

        // Guardar solo si se agregó algo
        localStorage.setItem(this.usuariosKey, JSON.stringify(usuariosActuales));
        console.log(`✅ ${agregados} usuarios base agregados. Total: ${Object.keys(usuariosActuales).length} usuarios`);
        return usuariosActuales;
    }

    obtenerUsuarios() {
        const usuarios = localStorage.getItem(this.usuariosKey);
        return usuarios ? JSON.parse(usuarios) : {};
    }

    guardarUsuarios(usuarios) {
        localStorage.setItem(this.usuariosKey, JSON.stringify(usuarios));
    }

    async login(username, password) {
        const usuarios = this.obtenerUsuarios();
        const usuario = usuarios[username.toLowerCase()];

        if (!usuario) {
            throw new Error('Usuario no encontrado');
        }

        if (!usuario.activo) {
            throw new Error('Usuario desactivado');
        }

        // Verificar contraseña con hash
        const passwordHash = this.hashPassword(password);
        if (usuario.password !== passwordHash) {
            throw new Error('Contraseña incorrecta');
        }

        // Actualizar último acceso
        usuario.ultimoAcceso = new Date().toISOString();
        usuarios[username.toLowerCase()] = usuario;
        this.guardarUsuarios(usuarios);

        // Crear sesión
        const sesion = {
            id: usuario.id,
            nombre: usuario.nombre,
            email: usuario.email,
            rol: usuario.rol,
            loginTime: new Date().toISOString()
        };

        localStorage.setItem(this.sessionKey, JSON.stringify(sesion));
        this.usuarioActual = sesion;

        // También establecer como variable global para compatibilidad
        window.usuarioActual = sesion;

        return sesion;
    }

    logout() {
        localStorage.removeItem(this.sessionKey);
        this.usuarioActual = null;
        window.usuarioActual = null;

        // Limpiar la interfaz antes de recargar
        const userInfo = document.getElementById('userInfo');
        if (userInfo) {
            userInfo.style.display = 'none';
        }

        // Mostrar pantalla de login
        this.mostrarPantallaLogin();
    }

    mostrarPantallaLogin() {
        // Crear nueva instancia de login si no existe
        if (!window.interfazLogin) {
            window.interfazLogin = new InterfazLogin(this);
        } else {
            // Si ya existe, simplemente mostrarla
            window.interfazLogin.mostrarLogin();
        }

        // Limpiar formulario principal
        const form = document.getElementById('reportForm');
        if (form) {
            form.reset();
        }

        // Limpiar campos de vista previa
        const vistaPrevia = document.getElementById('vistaPrevia');
        if (vistaPrevia) {
            vistaPrevia.innerHTML = '';
        }
    }

    obtenerSesionActual() {
        try {
            const sesion = localStorage.getItem(this.sessionKey);
            console.log('🔍 Verificando sesión almacenada:', sesion ? 'EXISTE' : 'NO EXISTE');

            if (sesion) {
                const sesionObj = JSON.parse(sesion);
                console.log('✅ Sesión encontrada para:', sesionObj.nombre);
                this.usuarioActual = sesionObj;
                return this.usuarioActual;
            }
            console.log('❌ No hay sesión activa');
            return null;
        } catch (error) {
            console.error('❌ Error al obtener sesión:', error);
            // Limpiar sesión corrupta
            localStorage.removeItem(this.sessionKey);
            return null;
        }
    }

    esAdmin() {
        // Verificar tanto sesión actual como localStorage SIN logs repetitivos
        const sesionActual = this._obtenerSesionSinLogs();
        return sesionActual && (sesionActual.rol === 'administrador' || sesionActual.rol === 'admin');
    }

    obtenerSesionActual() {
        try {
            const sesion = localStorage.getItem(this.sessionKey);
            if (sesion) {
                const sesionObj = JSON.parse(sesion);
                console.log('✅ Sesión encontrada para:', sesionObj.nombre, 'Rol:', sesionObj.rol);
                this.usuarioActual = sesionObj;
                window.usuarioActual = sesionObj;
                return sesionObj;
            }
            console.log('❌ No hay sesión activa');
            this.usuarioActual = null;
            window.usuarioActual = null;
            return null;
        } catch (error) {
            console.error('Error al obtener sesión:', error);
            return null;
        }
    }

    // Función privada para obtener sesión sin logs repetitivos
    _obtenerSesionSinLogs() {
        try {
            const sesion = localStorage.getItem(this.sessionKey);
            if (sesion) {
                const sesionObj = JSON.parse(sesion);
                this.usuarioActual = sesionObj;
                window.usuarioActual = sesionObj;
                return sesionObj;
            }
            this.usuarioActual = null;
            window.usuarioActual = null;
            return null;
        } catch (error) {
            return null;
        }
    }

    crearUsuario(datosUsuario) {
        if (!this.esAdmin()) {
            throw new Error('Solo los administradores pueden crear usuarios');
        }

        const usuarios = this.obtenerUsuarios();
        const username = datosUsuario.username.toLowerCase();

        if (usuarios[username]) {
            throw new Error('El usuario ya existe');
        }

        const nuevoUsuario = {
            id: username,
            nombre: datosUsuario.nombre,
            email: datosUsuario.email,
            password: datosUsuario.password,
            rol: datosUsuario.rol || 'usuario',
            activo: true,
            fechaCreacion: new Date().toISOString(),
            fechaModificacion: new Date().toISOString(),
            ultimoAcceso: null,
            creadoPor: this.usuarioActual.id,
            pendienteSincronizacion: true
        };

        usuarios[username] = nuevoUsuario;
        this.guardarUsuarios(usuarios);

        return nuevoUsuario;
    }

    actualizarUsuario(username, cambios) {
        if (!this.esAdmin()) {
            throw new Error('Solo los administradores pueden modificar usuarios');
        }

        const usuarios = this.obtenerUsuarios();

        console.log('🔍 Actualizando usuario:', username);
        console.log('🔍 Usuarios disponibles:', Object.keys(usuarios));

        // Buscar usuario con diferentes variaciones
        let usuario = usuarios[username] ||
                     usuarios[username.toLowerCase()] ||
                     usuarios[username.toUpperCase()];

        let actualUsername = username;

        // Si no lo encuentra, buscar por id interno
        if (!usuario) {
            Object.keys(usuarios).forEach(key => {
                if (usuarios[key].id === username) {
                    usuario = usuarios[key];
                    actualUsername = key;
                }
            });
        }

        if (!usuario) {
            console.log('❌ Usuario no encontrado para:', username);
            console.log('❌ Usuarios disponibles:', Object.keys(usuarios));
            throw new Error('Usuario no encontrado');
        }

        console.log('✅ Usuario encontrado:', usuario);


        // Actualizar campos permitidos
        if (cambios.nombre) usuario.nombre = cambios.nombre;
        if (cambios.email) usuario.email = cambios.email;
        if (cambios.password) usuario.password = cambios.password;
        if (cambios.activo !== undefined) usuario.activo = cambios.activo;
        if (cambios.rol) usuario.rol = cambios.rol;
        
        usuario.fechaModificacion = new Date().toISOString();
        usuario.modificadoPor = this.usuarioActual.id;
        usuario.pendienteSincronizacion = true; // Marcar como pendiente de sincronizar

        usuarios[actualUsername] = usuario;
        this.guardarUsuarios(usuarios);

        
        // Verificar que se guardó correctamente
        const verificacion = this.obtenerUsuarios();

        return usuario;
    }

    listarUsuarios() {
        if (!this.esAdmin()) {
            throw new Error('Solo los administradores pueden ver la lista de usuarios');
        }

        return this.obtenerUsuarios();
    }
}

// ============== INTERFAZ DE LOGIN ==============
class InterfazLogin {
    constructor(auth) {
        this.auth = auth;
        this.crearInterfaz();
    }

    crearInterfaz() {
        const loginHTML = `
            <div id="loginContainer" class="login-container">
                <div class="login-card">
                    <div class="login-header">
                        <h2>Reportes de Visita</h2>
                        <p>University of Dayton Publishing</p>
                    </div>
                    
                    <form id="loginForm" class="login-form">
                        <div class="form-group">
                            <label for="loginUsername">Usuario</label>
                            <input type="text" id="loginUsername" name="username" required 
                                   autocomplete="username" placeholder="Ingresa tu usuario">
                        </div>
                        
                        <div class="form-group">
                            <label for="loginPassword">Contraseña</label>
                            <div class="password-field">
                                <input type="password" id="loginPassword" name="password" required 
                                       autocomplete="current-password" placeholder="Ingresa tu contraseña">
                                <button type="button" class="toggle-password" onclick="togglePasswordVisibility()">
                                    👁️
                                </button>
                            </div>
                        </div>
                        
                        <div id="loginMessage" class="message" style="display: none;"></div>
                        
                        <button type="submit" class="btn-login">
                            🔐 Iniciar Sesión
                        </button>
                    </form>
                </div>
            </div>

            <style>
                .login-container {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    z-index: 10000;
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                }
                
                .login-card {
                    background: white;
                    border-radius: 20px;
                    padding: 40px;
                    box-shadow: 0 25px 50px rgba(0,0,0,0.15);
                    width: 100%;
                    max-width: 450px;
                    margin: 20px;
                    position: relative;
                    overflow: hidden;
                }
                
                .login-card::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    height: 5px;
                    background: linear-gradient(90deg, #667eea, #764ba2, #f093fb, #f5576c);
                }
                
                .login-header {
                    text-align: center;
                    margin-bottom: 30px;
                }
                
                .login-header h2 {
                    color: #2c3e50;
                    margin: 0 0 10px 0;
                    font-size: 28px;
                    font-weight: 600;
                }
                
                .login-header p {
                    color: #7f8c8d;
                    margin: 0;
                    font-size: 16px;
                }
                
                .login-form .form-group {
                    margin-bottom: 20px;
                }
                
                .login-form label {
                    display: block;
                    margin-bottom: 8px;
                    font-weight: 600;
                    color: #2c3e50;
                }
                
                .login-form input {
                    width: 100%;
                    padding: 15px;
                    border: 2px solid #e1e8ed;
                    border-radius: 10px;
                    font-size: 16px;
                    transition: all 0.3s ease;
                    box-sizing: border-box;
                }
                
                .login-form input:focus {
                    outline: none;
                    border-color: #667eea;
                    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
                }
                
                .password-field {
                    position: relative;
                    display: flex;
                    align-items: center;
                }
                
                .password-field input {
                    padding-right: 50px;
                }
                
                .toggle-password {
                    position: absolute;
                    right: 10px;
                    background: none;
                    border: none;
                    cursor: pointer;
                    font-size: 18px;
                    padding: 5px;
                    z-index: 1;
                }
                
                .btn-login {
                    width: 100%;
                    padding: 15px;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    border: none;
                    border-radius: 10px;
                    font-size: 16px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    margin-top: 10px;
                }
                
                .btn-login:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 10px 25px rgba(102, 126, 234, 0.3);
                }
                
                .btn-login:active {
                    transform: translateY(0);
                }
                
                .message {
                    padding: 10px 15px;
                    border-radius: 8px;
                    margin: 15px 0;
                    font-size: 14px;
                    font-weight: 500;
                }
                
                .message.success {
                    background: #d4edda;
                    color: #155724;
                    border: 1px solid #c3e6cb;
                }
                
                .message.error {
                    background: #f8d7da;
                    color: #721c24;
                    border: 1px solid #f5c6cb;
                }
                
                @media (max-width: 500px) {
                    .login-card {
                        padding: 30px 20px;
                        margin: 10px;
                    }
                    
                    .login-header h2 {
                        font-size: 24px;
                    }
                    
                    .login-header p {
                        font-size: 14px;
                    }
                }
            </style>
        `;

        // Insertar el HTML de login en el body
        document.body.insertAdjacentHTML('afterbegin', loginHTML);

        // Configurar event listeners
        this.configurarEventos();
    }

    configurarEventos() {
        const form = document.getElementById('loginForm');
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.manejarLogin();
        });

        // Enter para enviar
        document.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && document.getElementById('loginContainer').style.display !== 'none') {
                this.manejarLogin();
            }
        });
    }

    async manejarLogin() {
        const username = document.getElementById('loginUsername').value.trim();
        const password = document.getElementById('loginPassword').value;
        const messageDiv = document.getElementById('loginMessage');

        if (!username || !password) {
            this.mostrarMensaje('Por favor ingresa usuario y contraseña', 'error');
            return;
        }

        try {
            this.mostrarMensaje('Iniciando sesión...', 'info');
            
            const usuario = await this.auth.login(username, password);
            
            this.mostrarMensaje(`¡Bienvenido, ${usuario.nombre}!`, 'success');
            
            setTimeout(() => {
                this.ocultarLogin();
                if (usuario.rol === 'administrador' || usuario.rol === 'admin') {
                    console.log('🎯 Usuario es admin, llamando mostrarPanelAdmin()');
                    this.mostrarPanelAdmin();
                }
                // Reinicializar la app con el usuario autenticado
                window.inicializarAppConUsuario(usuario);
            }, 1000);

        } catch (error) {
            this.mostrarMensaje(error.message, 'error');
        }
    }

    mostrarMensaje(texto, tipo) {
        const messageDiv = document.getElementById('loginMessage');
        messageDiv.className = `message ${tipo}`;
        messageDiv.textContent = texto;
        messageDiv.style.display = 'block';
    }

    ocultarLogin() {
        const loginContainer = document.getElementById('loginContainer');
        if (loginContainer) {
            loginContainer.style.display = 'none';
        }
    }

    mostrarLogin() {
        const loginContainer = document.getElementById('loginContainer');
        if (loginContainer) {
            loginContainer.style.display = 'flex';
        }
    }

    mostrarPanelAdmin() {
        console.log('🔧 mostrarPanelAdmin llamado');
        // Agregar botón de administración en la interfaz principal
        setTimeout(() => {
            // Buscar diferentes posibles selectores
            let userInfo = document.querySelector('.user-info') ||
                          document.querySelector('#userInfo') ||
                          document.querySelector('.header-user') ||
                          document.querySelector('.usuario-info');

            console.log('🔍 Buscando elemento user-info:', userInfo);
            console.log('🔍 Elementos disponibles:', Array.from(document.querySelectorAll('[class*="user"], [id*="user"]')).map(el => el.className || el.id));

            if (userInfo && !document.getElementById('adminPanel')) {
                console.log('✅ Creando botón de admin');
                const adminButton = document.createElement('button');
                adminButton.id = 'adminPanel';
                adminButton.innerHTML = '⚙️ Panel Admin';
                adminButton.className = 'btn-admin-header';
                adminButton.style.cssText = `
                    background: rgba(255,255,255,0.2);
                    color: white;
                    border: 1px solid rgba(255,255,255,0.3);
                    padding: 8px 15px;
                    border-radius: 20px;
                    cursor: pointer;
                    font-size: 14px;
                    transition: all 0.3s;
                    margin-right: 10px;
                `;
                adminButton.onmouseover = () => {
                    adminButton.style.background = 'rgba(255,255,255,0.3)';
                    adminButton.style.transform = 'translateY(-1px)';
                };
                adminButton.onmouseout = () => {
                    adminButton.style.background = 'rgba(255,255,255,0.2)';
                    adminButton.style.transform = 'translateY(0)';
                };
                adminButton.onclick = () => window.mostrarPanelAdministrador();

                // Insertar antes del botón de salir
                const logoutButton = userInfo.querySelector('.btn-logout') || userInfo.querySelector('[onclick*="logout"]');
                if (logoutButton) {
                    userInfo.insertBefore(adminButton, logoutButton);
                } else {
                    // Si no hay botón de logout, agregar al final
                    userInfo.appendChild(adminButton);
                }
                console.log('✅ Botón de admin agregado');
            } else {
                console.log('❌ No se pudo agregar botón de admin');
                if (!userInfo) console.log('   - No se encontró elemento user-info');
                if (document.getElementById('adminPanel')) console.log('   - El botón ya existe');

                // Como fallback, agregar el botón al body si no existe
                if (!document.getElementById('adminPanel')) {
                    console.log('🆘 Agregando botón de admin como fallback al body');
                    const adminButton = document.createElement('button');
                    adminButton.id = 'adminPanel';
                    adminButton.innerHTML = '⚙️ Panel Admin';
                    adminButton.style.cssText = `
                        position: fixed;
                        top: 20px;
                        right: 20px;
                        background: #007bff;
                        color: white;
                        border: none;
                        padding: 10px 15px;
                        border-radius: 5px;
                        cursor: pointer;
                        z-index: 1000;
                        font-size: 14px;
                    `;
                    adminButton.onclick = () => window.mostrarPanelAdministrador();
                    document.body.appendChild(adminButton);
                }
            }
        }, 500);
    }
}

// ============== FUNCIONES GLOBALES ==============
function togglePasswordVisibility() {
    const passwordInput = document.getElementById('loginPassword');
    const toggleButton = document.querySelector('.toggle-password');
    
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        toggleButton.textContent = '🙈';
    } else {
        passwordInput.type = 'password';
        toggleButton.textContent = '👁️';
    }
}

// Instancias globales
let sistemaAuth = null;
let interfazLogin = null;

// Referencias globales para compatibilidad
window.sistemaAuth = null;
window.sistemaAutenticacion = null;

// Inicialización del sistema de autenticación
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Inicializando sistema de autenticación...');

    sistemaAuth = new SistemaAutenticacion();

    // Establecer referencias globales
    window.sistemaAuth = sistemaAuth;
    window.sistemaAutenticacion = sistemaAuth;

    // Verificar si hay una sesión activa con manejo de errores mejorado
    try {
        const sesionActual = sistemaAuth.obtenerSesionActual();

        if (!sesionActual) {
            console.log('❌ No hay sesión activa - Mostrando login');
            // No hay sesión, mostrar login
            interfazLogin = new InterfazLogin(sistemaAuth);
        } else {
            console.log('✅ Sesión activa encontrada - Restaurando app para:', sesionActual.nombre);

            // Pequeño delay para asegurar que el DOM esté completamente cargado
            setTimeout(() => {
                // Hay sesión activa, mostrar la app
                window.inicializarAppConUsuario(sesionActual);

                if (sesionActual.rol === 'administrador' || sesionActual.rol === 'admin') {
                    console.log('🎯 Sesión admin detectada, llamando mostrarPanelAdmin()');
                    interfazLogin = new InterfazLogin(sistemaAuth);
                    interfazLogin.mostrarPanelAdmin();
                }
            }, 100);
        }
    } catch (error) {
        console.error('❌ Error en inicialización de autenticación:', error);
        // En caso de error, mostrar login
        interfazLogin = new InterfazLogin(sistemaAuth);
    }
});

console.log('🔐 Sistema de autenticación cargado');
