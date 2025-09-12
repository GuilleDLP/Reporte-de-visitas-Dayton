// ============== SINCRONIZACIÓN DE USUARIOS CON FIREBASE ==============

class GestorUsuariosFirebase {
    constructor() {
        this.db = null;
        this.inicializado = false;
        this.usuariosCache = {};
        this.sincronizando = false;
    }

    async inicializar() {
        try {
            // Esperar a que Firebase esté inicializado
            if (!window.sincronizador || !window.sincronizador.db) {
                console.log('⏳ Esperando inicialización de Firebase...');
                return false;
            }

            this.db = window.sincronizador.db;
            this.inicializado = true;
            
            console.log('✅ Gestor de usuarios Firebase inicializado');
            
            // Sincronizar usuarios iniciales
            await this.sincronizarUsuariosIniciales();
            
            return true;
        } catch (error) {
            console.error('❌ Error inicializando gestor de usuarios:', error);
            return false;
        }
    }

    async sincronizarUsuariosIniciales() {
        if (!this.db || this.sincronizando) return;
        
        this.sincronizando = true;
        
        try {
            const { collection, getDocs, setDoc, doc } = 
                await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');

            // Obtener usuarios de Firebase
            const usuariosRef = collection(this.db, 'usuarios');
            const snapshot = await getDocs(usuariosRef);
            
            if (snapshot.empty) {
                console.log('📤 Primera sincronización: subiendo usuarios locales a Firebase...');
                
                // Si Firebase está vacío, subir usuarios locales
                const usuariosLocales = sistemaAuth.obtenerUsuarios() || {};
                
                if (Object.keys(usuariosLocales).length === 0) {
                    console.log('⚠️ No hay usuarios locales, restaurando usuarios base...');
                    const usuariosRestaurados = sistemaAuth.restaurarUsuariosBase();
                    // Subir usuarios base a Firebase
                    for (const [userId, usuario] of Object.entries(usuariosRestaurados)) {
                        await setDoc(doc(this.db, 'usuarios', userId), {
                            ...usuario,
                            password: this.hashPassword(usuario.password),
                            fechaSincronizacion: new Date().toISOString()
                        });
                        console.log(`✅ Usuario base ${usuario.nombre} subido a Firebase`);
                    }
                    this.usuariosCache = usuariosRestaurados;
                } else {
                    // Subir usuarios locales existentes
                    for (const [userId, usuario] of Object.entries(usuariosLocales)) {
                        await setDoc(doc(this.db, 'usuarios', userId), {
                            ...usuario,
                            password: this.hashPassword(usuario.password), // Hash simple para no guardar en texto plano
                            fechaSincronizacion: new Date().toISOString()
                        });
                        console.log(`✅ Usuario ${usuario.nombre} subido a Firebase`);
                    }
                    this.usuariosCache = usuariosLocales;
                }
                
            } else {
                console.log('📥 Mezclando usuarios de Firebase con locales...');
                
                // Obtener usuarios locales actuales
                const usuariosLocales = sistemaAuth.obtenerUsuarios() || {};
                
                // Si Firebase tiene datos, hacer merge inteligente
                const usuariosFirebase = {};
                
                snapshot.forEach((doc) => {
                    const datos = doc.data();
                    if (datos && doc.id) {
                        usuariosFirebase[doc.id] = {
                            ...datos,
                            password: datos.password ? this.unhashPassword(datos.password) : ''
                        };
                    }
                });
                
                // Merge: Combinar usuarios locales con Firebase (Firebase tiene prioridad para conflictos)
                const usuariosCombinados = {
                    ...usuariosLocales,  // Mantener usuarios locales
                    ...usuariosFirebase  // Agregar/actualizar con Firebase
                };
                
                // Actualizar almacenamiento local con el merge
                localStorage.setItem('udp_usuarios', JSON.stringify(usuariosCombinados));
                this.usuariosCache = usuariosCombinados;
                
                console.log(`✅ ${Object.keys(usuariosFirebase).length} usuarios de Firebase mezclados con ${Object.keys(usuariosLocales).length} locales`);
                console.log(`📊 Total final: ${Object.keys(usuariosCombinados).length} usuarios`);
            }
            
        } catch (error) {
            console.error('❌ Error en sincronización inicial:', error);
        } finally {
            this.sincronizando = false;
        }
    }

    async obtenerUsuarios() {
        // SIEMPRE devolver usuarios locales primero - no interferir con el sistema local
        const usuariosLocales = sistemaAuth.obtenerUsuarios() || {};
        
        if (!this.inicializado) {
            return usuariosLocales;
        }

        // Solo actualizar cache, no localStorage
        try {
            const { collection, getDocs } = 
                await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');

            const usuariosRef = collection(this.db, 'usuarios');
            const snapshot = await getDocs(usuariosRef);
            
            if (snapshot.empty) {
                console.log('📦 Firebase está vacío, manteniendo usuarios locales');
                return usuariosLocales;
            }
            
            // Solo actualizar el cache interno, NO el localStorage
            const usuariosFirebase = {};
            snapshot.forEach((doc) => {
                const datos = doc.data();
                if (datos && doc.id) {
                    usuariosFirebase[doc.id] = {
                        ...datos,
                        password: datos.password ? this.unhashPassword(datos.password) : ''
                    };
                }
            });
            
            this.usuariosCache = usuariosFirebase;
            console.log(`📋 Cache actualizado con ${Object.keys(usuariosFirebase).length} usuarios de Firebase`);
            
            // IMPORTANTE: Devolver usuarios locales, no Firebase
            return usuariosLocales;
            
        } catch (error) {
            console.error('❌ Error consultando Firebase:', error);
            return usuariosLocales;
        }
    }

    async crearUsuario(datosUsuario) {
        if (!this.inicializado) {
            throw new Error('Firebase no está inicializado');
        }

        try {
            const { setDoc, doc, serverTimestamp } = 
                await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');

            const userId = datosUsuario.id || datosUsuario.username.toLowerCase();
            
            const nuevoUsuario = {
                ...datosUsuario,
                password: this.hashPassword(datosUsuario.password),
                fechaCreacion: new Date().toISOString(),
                fechaSincronizacion: serverTimestamp(),
                activo: true
            };

            // Guardar en Firebase
            await setDoc(doc(this.db, 'usuarios', userId), nuevoUsuario);
            
            // Actualizar cache local
            this.usuariosCache[userId] = {
                ...datosUsuario,
                fechaCreacion: nuevoUsuario.fechaCreacion
            };
            localStorage.setItem('udp_usuarios', JSON.stringify(this.usuariosCache));
            
            console.log(`✅ Usuario ${datosUsuario.nombre} creado en Firebase`);
            return nuevoUsuario;
            
        } catch (error) {
            console.error('❌ Error creando usuario en Firebase:', error);
            throw error;
        }
    }

    async actualizarUsuario(userId, cambios) {
        if (!this.inicializado) {
            throw new Error('Firebase no está inicializado');
        }

        try {
            const { updateDoc, doc, serverTimestamp } = 
                await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');

            const actualizaciones = {
                ...cambios,
                fechaModificacion: new Date().toISOString(),
                fechaSincronizacion: serverTimestamp()
            };

            // Si se actualiza la contraseña, hashearla
            if (cambios.password) {
                actualizaciones.password = this.hashPassword(cambios.password);
            }

            // Actualizar en Firebase
            await updateDoc(doc(this.db, 'usuarios', userId), actualizaciones);
            
            // Actualizar cache local
            if (this.usuariosCache[userId]) {
                this.usuariosCache[userId] = {
                    ...this.usuariosCache[userId],
                    ...cambios
                };
                localStorage.setItem('udp_usuarios', JSON.stringify(this.usuariosCache));
            }
            
            console.log(`✅ Usuario ${userId} actualizado en Firebase`);
            return true;
            
        } catch (error) {
            console.error('❌ Error actualizando usuario en Firebase:', error);
            throw error;
        }
    }

    async validarCredenciales(username, password) {
        try {
            // Primero intentar obtener usuarios de Firebase
            const usuarios = await this.obtenerUsuarios();
            const usuario = usuarios[username.toLowerCase()];
            
            if (!usuario) {
                return { valido: false, error: 'Usuario no encontrado' };
            }
            
            if (!usuario.activo) {
                return { valido: false, error: 'Usuario desactivado' };
            }
            
            if (usuario.password !== password) {
                return { valido: false, error: 'Contraseña incorrecta' };
            }
            
            // Actualizar último acceso en Firebase
            if (this.inicializado) {
                this.actualizarUltimoAcceso(username.toLowerCase());
            }
            
            return { 
                valido: true, 
                usuario: {
                    id: usuario.id,
                    nombre: usuario.nombre,
                    email: usuario.email,
                    rol: usuario.rol
                }
            };
            
        } catch (error) {
            console.error('❌ Error validando credenciales:', error);
            
            // Fallback a validación local
            const usuariosLocales = sistemaAuth.obtenerUsuarios();
            const usuario = usuariosLocales[username.toLowerCase()];
            
            if (!usuario || usuario.password !== password) {
                return { valido: false, error: 'Credenciales inválidas' };
            }
            
            return { 
                valido: true, 
                usuario: {
                    id: usuario.id,
                    nombre: usuario.nombre,
                    email: usuario.email,
                    rol: usuario.rol
                }
            };
        }
    }

    async actualizarUltimoAcceso(userId) {
        try {
            const { updateDoc, doc, serverTimestamp } = 
                await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');

            await updateDoc(doc(this.db, 'usuarios', userId), {
                ultimoAcceso: new Date().toISOString(),
                fechaSincronizacion: serverTimestamp()
            });
            
        } catch (error) {
            console.error('Error actualizando último acceso:', error);
        }
    }

    // Funciones de hash simples (en producción usar bcrypt o similar)
    hashPassword(password) {
        // Codificación simple en base64 (NO SEGURA para producción)
        return btoa(password);
    }

    unhashPassword(hashedPassword) {
        // Decodificación simple desde base64
        try {
            return atob(hashedPassword);
        } catch {
            return hashedPassword; // Si falla, devolver tal cual
        }
    }

    async subirTodosLosUsuariosLocales() {
        console.log('📤 === SUBIENDO USUARIOS LOCALES ===');
        
        if (!this.inicializado) {
            throw new Error('Firebase no inicializado');
        }

        try {
            console.log('📦 Importando funciones de Firebase...');
            const { setDoc, doc, serverTimestamp } = 
                await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
            console.log('✅ Funciones Firebase importadas');

            const usuariosLocales = sistemaAuth.obtenerUsuarios() || {};
            console.log(`👥 ${Object.keys(usuariosLocales).length} usuarios locales para subir:`, Object.keys(usuariosLocales));
            
            for (const [userId, usuario] of Object.entries(usuariosLocales)) {
                console.log(`⬆️ Subiendo usuario: ${userId} (${usuario.nombre})...`);
                
                const usuarioParaFirebase = {
                    ...usuario,
                    password: this.hashPassword(usuario.password),
                    fechaSincronizacion: serverTimestamp(),
                    ultimaActualizacion: new Date().toISOString()
                };

                console.log(`💾 Guardando en Firebase: usuarios/${userId}...`);
                await setDoc(doc(this.db, 'usuarios', userId), usuarioParaFirebase);
                console.log(`✅ Usuario ${usuario.nombre} subido exitosamente`);
            }
            
            console.log('🎉 Todos los usuarios subidos exitosamente');
            return usuariosLocales;
            
        } catch (error) {
            console.error('❌ Error en subirTodosLosUsuariosLocales:', error);
            throw error;
        }
    }

    async sincronizarConFirebase() {
        if (!this.inicializado || this.sincronizando) return;
        
        this.sincronizando = true;
        console.log('🔄 Sincronizando usuarios con Firebase...');
        
        try {
            // SOLO subir usuarios locales a Firebase - no tocar localStorage
            console.log('📤 Subiendo usuarios locales a Firebase...');
            const usuariosLocales = sistemaAuth.obtenerUsuarios() || {};
            
            if (Object.keys(usuariosLocales).length === 0) {
                console.log('⚠️ No hay usuarios locales para sincronizar');
                return {};
            }
            
            await this.subirTodosLosUsuariosLocales();
            
            console.log(`✅ ${Object.keys(usuariosLocales).length} usuarios subidos a Firebase exitosamente`);
            
            // Devolver los usuarios locales sin modificarlos
            return usuariosLocales;
            
        } catch (error) {
            console.error('❌ Error sincronizando usuarios:', error);
            
            // Fallback a usuarios locales
            const usuariosLocales = sistemaAuth.obtenerUsuarios() || {};
            console.log('📱 Usando usuarios locales como fallback');
            return usuariosLocales;
            
        } finally {
            this.sincronizando = false;
        }
    }
}

// ============== INTEGRACIÓN CON EL SISTEMA EXISTENTE ==============

// Instancia global del gestor
let gestorUsuariosFirebase = null;

// Modificar el sistema de autenticación existente
document.addEventListener('DOMContentLoaded', () => {
    // Inicializar gestor de usuarios Firebase
    setTimeout(async () => {
        gestorUsuariosFirebase = new GestorUsuariosFirebase();
        
        // Esperar a que Firebase esté listo
        const intervalo = setInterval(async () => {
            if (window.sincronizador && window.sincronizador.db) {
                clearInterval(intervalo);
                const inicializado = await gestorUsuariosFirebase.inicializar();
                if (inicializado) {
                    console.log('✅ Sistema de usuarios sincronizado con Firebase');
                }
            }
        }, 1000);
    }, 2000);
});

// Extender el sistema de autenticación para usar Firebase
if (typeof SistemaAutenticacion !== 'undefined') {
    // Sobrescribir método login
    const loginOriginal = SistemaAutenticacion.prototype.login;
    SistemaAutenticacion.prototype.login = async function(username, password) {
        // Si Firebase está disponible, usar validación de Firebase
        if (gestorUsuariosFirebase && gestorUsuariosFirebase.inicializado) {
            const resultado = await gestorUsuariosFirebase.validarCredenciales(username, password);
            
            if (!resultado.valido) {
                throw new Error(resultado.error);
            }
            
            // Crear sesión
            const sesion = {
                ...resultado.usuario,
                loginTime: new Date().toISOString()
            };
            
            localStorage.setItem(this.sessionKey, JSON.stringify(sesion));
            this.usuarioActual = sesion;
            
            return sesion;
        } else {
            // Fallback al método original
            return loginOriginal.call(this, username, password);
        }
    };
    
    // Sobrescribir método crearUsuario
    const crearUsuarioOriginal = SistemaAutenticacion.prototype.crearUsuario;
    SistemaAutenticacion.prototype.crearUsuario = async function(datosUsuario) {
        if (!this.esAdmin()) {
            throw new Error('Solo los administradores pueden crear usuarios');
        }
        
        // Si Firebase está disponible, crear en Firebase
        if (gestorUsuariosFirebase && gestorUsuariosFirebase.inicializado) {
            return await gestorUsuariosFirebase.crearUsuario(datosUsuario);
        } else {
            // Fallback al método original
            return crearUsuarioOriginal.call(this, datosUsuario);
        }
    };
    
    // Sobrescribir método actualizarUsuario
    const actualizarUsuarioOriginal = SistemaAutenticacion.prototype.actualizarUsuario;
    SistemaAutenticacion.prototype.actualizarUsuario = async function(username, cambios) {
        if (!this.esAdmin()) {
            throw new Error('Solo los administradores pueden modificar usuarios');
        }
        
        // Si Firebase está disponible, actualizar en Firebase
        if (gestorUsuariosFirebase && gestorUsuariosFirebase.inicializado) {
            await gestorUsuariosFirebase.actualizarUsuario(username.toLowerCase(), cambios);
            
            // También actualizar localmente
            const usuarios = this.obtenerUsuarios();
            if (usuarios[username.toLowerCase()]) {
                usuarios[username.toLowerCase()] = {
                    ...usuarios[username.toLowerCase()],
                    ...cambios
                };
                this.guardarUsuarios(usuarios);
            }
            
            return usuarios[username.toLowerCase()];
        } else {
            // Fallback al método original
            return actualizarUsuarioOriginal.call(this, username, cambios);
        }
    };
    
    // Sobrescribir método listarUsuarios
    const listarUsuariosOriginal = SistemaAutenticacion.prototype.listarUsuarios;
    SistemaAutenticacion.prototype.listarUsuarios = async function() {
        if (!this.esAdmin()) {
            throw new Error('Solo los administradores pueden ver la lista de usuarios');
        }
        
        // Si Firebase está disponible, obtener de Firebase
        if (gestorUsuariosFirebase && gestorUsuariosFirebase.inicializado) {
            return await gestorUsuariosFirebase.obtenerUsuarios();
        } else {
            // Fallback al método original
            return listarUsuariosOriginal.call(this);
        }
    };
}

console.log('🔐 Sistema de usuarios Firebase cargado');
