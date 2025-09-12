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

    obtenerUsuariosBase() {
        return {
            'admin': {
                id: 'admin',
                nombre: 'Administrador',
                email: 'admin@dayton.com',
                password: 'admin123', // En producción debe estar hasheada
                rol: 'administrador',
                activo: true,
                fechaCreacion: new Date().toISOString(),
                ultimoAcceso: null
            },
            'hpineda': {
                id: 'hpineda',
                nombre: 'Homero Pineda',
                email: 'hpineda@dayton.com',
                password: 'hpineda2024',
                rol: 'usuario',
                activo: true,
                fechaCreacion: new Date().toISOString(),
                ultimoAcceso: null
            },
            'fvillarreal': {
                id: 'fvillarreal',
                nombre: 'Fernanda Villarreal',
                email: 'fvillarreal@dayton.com',
                password: 'fvillarreal2024',
                rol: 'usuario',
                activo: true,
                fechaCreacion: new Date().toISOString(),
                ultimoAcceso: null
            },
            'gdelaparra': {
                id: 'gdelaparra',
                nombre: 'Guillermo de la Parra',
                email: 'gdelaparra@dayton.com',
                password: 'gdelaparra2024',
                rol: 'usuario',
                activo: true,
                fechaCreacion: new Date().toISOString(),
                ultimoAcceso: null
            },
            'aaguilar': {
                id: 'aaguilar',
                nombre: 'Ana Aguilar',
                email: 'aaguilar@dayton.com',
                password: 'aaguilar2024',
                rol: 'usuario',
                activo: true,
                fechaCreacion: new Date().toISOString(),
                ultimoAcceso: null
            }
        };
    }

    restaurarUsuariosBase() {
        console.log('🔧 Restaurando usuarios base...');
        const usuariosBase = this.obtenerUsuariosBase();
        const usuariosActuales = this.obtenerUsuarios() || {};
        
        console.log('👤 Usuarios actuales:', Object.keys(usuariosActuales));
        console.log('📦 Usuarios base disponibles:', Object.keys(usuariosBase));
        
        // Solo agregar usuarios base que NO existan ya
        let agregados = 0;
        for (const [userId, usuarioBase] of Object.entries(usuariosBase)) {
            if (!usuariosActuales[userId]) {
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

        if (usuario.password !== password) {
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

        return sesion;
    }

    logout() {
        localStorage.removeItem(this.sessionKey);
        this.usuarioActual = null;
        window.location.reload();
    }

    obtenerSesionActual() {
        const sesion = localStorage.getItem(this.sessionKey);
        if (sesion) {
            this.usuarioActual = JSON.parse(sesion);
            return this.usuarioActual;
        }
        return null;
    }

    esAdmin() {
        return this.usuarioActual && this.usuarioActual.rol === 'administrador';
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
            ultimoAcceso: null,
            creadoPor: this.usuarioActual.id
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
        const usuario = usuarios[username.toLowerCase()];

        if (!usuario) {
            throw new Error('Usuario no encontrado');
        }

        // Actualizar campos permitidos
        if (cambios.nombre) usuario.nombre = cambios.nombre;
        if (cambios.email) usuario.email = cambios.email;
        if (cambios.password) usuario.password = cambios.password;
        if (cambios.activo !== undefined) usuario.activo = cambios.activo;
        
        usuario.fechaModificacion = new Date().toISOString();
        usuario.modificadoPor = this.usuarioActual.id;

        usuarios[username.toLowerCase()] = usuario;
        this.guardarUsuarios(usuarios);

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
                if (usuario.rol === 'administrador') {
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
        // Agregar botón de administración en la interfaz principal
        setTimeout(() => {
            const userInfo = document.querySelector('.user-info');
            if (userInfo && !document.getElementById('adminPanel')) {
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
                const logoutButton = userInfo.querySelector('.btn-logout');
                userInfo.insertBefore(adminButton, logoutButton);
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

// Inicialización del sistema de autenticación
document.addEventListener('DOMContentLoaded', () => {
    sistemaAuth = new SistemaAutenticacion();
    
    // Verificar si hay una sesión activa
    const sesionActual = sistemaAuth.obtenerSesionActual();
    
    if (!sesionActual) {
        // No hay sesión, mostrar login
        interfazLogin = new InterfazLogin(sistemaAuth);
    } else {
        // Hay sesión activa, mostrar la app
        console.log('✅ Sesión activa:', sesionActual);
        window.inicializarAppConUsuario(sesionActual);
        
        if (sesionActual.rol === 'administrador') {
            interfazLogin = new InterfazLogin(sistemaAuth);
            interfazLogin.mostrarPanelAdmin();
        }
    }
});

console.log('🔐 Sistema de autenticación cargado');
