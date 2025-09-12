// ============== CONFIGURACIÓN FIREBASE ==============
const firebaseConfig = {
    apiKey: "AIzaSyDjqICWH-rHFWeCZWtCW9aH0guSfzG79E8",
    authDomain: "reporte-de-visitas-dayton.firebaseapp.com",
    projectId: "reporte-de-visitas-dayton",
    storageBucket: "reporte-de-visitas-dayton.firebasestorage.app",
    messagingSenderId: "971246051474",
    appId: "1:971246051474:web:bab82335d9d3ffe04d864b"
};

// ============== SISTEMA DE SINCRONIZACIÓN ==============
class SincronizadorFirebase {
    constructor() {
        this.db = null;
        this.auth = null;
        this.usuario = null;
        this.usuarioActual = null; // Usuario del sistema de autenticación local
        this.sincronizando = false;
    }

    async inicializar() {
        try {
            console.log('🔥 Inicializando Firebase con configuración:', {
                projectId: firebaseConfig.projectId,
                authDomain: firebaseConfig.authDomain
            });

            // Importar Firebase dinámicamente
            const { initializeApp } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js');
            const { getFirestore, collection, addDoc, getDocs, query, where, updateDoc, doc, serverTimestamp, enableIndexedDbPersistence, connectFirestoreEmulator } = 
                await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
            const { getAuth, signInAnonymously, onAuthStateChanged } = 
                await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js');

            // Inicializar Firebase
            console.log('📱 Creando app Firebase...');
            const app = initializeApp(firebaseConfig);
            console.log('✅ App Firebase creada');

            console.log('🗄️ Conectando Firestore...');
            this.db = getFirestore(app);
            console.log('✅ Firestore conectado');

            console.log('🔐 Configurando Auth...');
            this.auth = getAuth(app);
            console.log('✅ Auth configurado');

            // Habilitar persistencia offline (sin bloquear si falla)
            try {
                console.log('💾 Habilitando persistencia offline...');
                await enableIndexedDbPersistence(this.db);
                console.log('✅ Persistencia offline habilitada');
            } catch (err) {
                if (err.code === 'failed-precondition') {
                    console.warn('⚠️ Múltiples pestañas abiertas, persistencia solo en una');
                } else if (err.code === 'unimplemented') {
                    console.warn('⚠️ Navegador no soporta persistencia offline');
                } else {
                    console.warn('⚠️ Error en persistencia offline:', err.message);
                }
                // Continuar sin persistencia offline
            }

            // Autenticación anónima
            console.log('👤 Iniciando autenticación...');
            await this.autenticar();
            console.log('✅ Autenticación completada');

            // Escuchar cambios de conexión
            this.configurarListeners();

            console.log('🎉 Firebase inicializado completamente');
            return true;
            
        } catch (error) {
            console.error('❌ Error detallado inicializando Firebase:', {
                message: error.message,
                code: error.code,
                stack: error.stack
            });
            
            // Intentar diagnosticar el problema
            if (error.message?.includes('auth')) {
                console.error('🔐 Error de autenticación - verificar configuración');
            } else if (error.message?.includes('firestore')) {
                console.error('🗄️ Error de Firestore - verificar permisos');
            } else if (error.message?.includes('network')) {
                console.error('🌐 Error de red - verificar conexión');
            }
            
            return false;
        }
    }

    async autenticar() {
        return new Promise((resolve, reject) => {
            onAuthStateChanged(this.auth, async (user) => {
                if (user) {
                    this.usuario = user;
                    console.log('✅ Usuario autenticado:', user.uid);
                    resolve(user);
                } else {
                    try {
                        const credential = await signInAnonymously(this.auth);
                        this.usuario = credential.user;
                        console.log('✅ Usuario anónimo creado:', credential.user.uid);
                        resolve(credential.user);
                    } catch (error) {
                        console.error('❌ Error en autenticación:', error);
                        reject(error);
                    }
                }
            });
        });
    }

    configurarListeners() {
        // Detectar cambios de conexión
        window.addEventListener('online', () => {
            console.log('🌐 Conexión restaurada');
            this.sincronizarPendientes();
        });

        window.addEventListener('offline', () => {
            console.log('📵 Sin conexión');
        });

        // Sincronización periódica cada 5 minutos
        setInterval(() => {
            if (navigator.onLine && !this.sincronizando) {
                this.sincronizarPendientes();
            }
        }, 300000);
    }

    async sincronizarReporte(reporte) {
        if (!this.db || !this.usuario) {
            throw new Error('Firebase no inicializado');
        }

        try {
            const { addDoc, collection, serverTimestamp } = 
                await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');

            const reporteConMetadata = {
                ...reporte,
                firebaseUserId: this.usuario.uid, // ID anónimo de Firebase
                usuarioId: this.usuarioActual?.id || 'desconocido', // ID del usuario local
                nombreUsuario: this.usuarioActual?.nombre || 'Usuario desconocido',
                fechaSincronizacion: serverTimestamp(),
                dispositivo: navigator.userAgent,
                version: '1.0.0'
            };

            const docRef = await addDoc(collection(this.db, 'reportes'), reporteConMetadata);
            console.log('✅ Reporte sincronizado:', docRef.id, 'Usuario:', this.usuarioActual?.nombre);
            return docRef.id;
        } catch (error) {
            console.error('❌ Error sincronizando reporte:', error);
            throw error;
        }
    }

    async sincronizarPendientes() {
        if (this.sincronizando || !navigator.onLine) return;
        
        this.sincronizando = true;
        this.reportesSubidos = 0;
        console.log('🔄 Iniciando sincronización...');

        try {
            // Obtener reportes locales no sincronizados
            const reportesLocales = await reportesDB.obtenerTodosLosReportes();
            const pendientes = reportesLocales.filter(r => !r.sincronizadoFirebase);

            if (pendientes.length === 0) {
                console.log('✅ Todos los reportes están sincronizados');
                return;
            }

            console.log(`📤 Sincronizando ${pendientes.length} reportes...`);

            for (const reporte of pendientes) {
                try {
                    const firebaseId = await this.sincronizarReporte(reporte);
                    
                    // Marcar como sincronizado en IndexedDB
                    reporte.sincronizadoFirebase = true;
                    reporte.firebaseId = firebaseId;
                    reporte.fechaUltimaSincronizacion = new Date().toISOString();
                    
                    // Actualizar en IndexedDB
                    await reportesDB.actualizarReporte(reporte);
                    this.reportesSubidos++;
                    
                } catch (error) {
                    console.error(`❌ Error sincronizando reporte ${reporte.id}:`, error);
                }
            }

            if (this.reportesSubidos > 0) {
                mostrarMensaje(`✅ ${this.reportesSubidos} reportes subidos a la nube`);
            }
            
        } catch (error) {
            console.error('❌ Error en sincronización masiva:', error);
        } finally {
            this.sincronizando = false;
        }
    }

    async obtenerReportesRemoto() {
        if (!this.db || !this.usuario) {
            throw new Error('Firebase no inicializado');
        }

        try {
            const { collection, query, where, getDocs } = 
                await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');

            // Si es administrador, obtener todos los reportes
            let q;
            if (this.usuarioActual?.rol === 'administrador') {
                q = query(collection(this.db, 'reportes'));
            } else {
                // Solo reportes del usuario actual
                q = query(
                    collection(this.db, 'reportes'),
                    where('usuarioId', '==', this.usuarioActual?.id || 'desconocido')
                );
            }
            
            const querySnapshot = await getDocs(q);
            const reportes = [];
            
            querySnapshot.forEach((doc) => {
                reportes.push({
                    firebaseId: doc.id,
                    ...doc.data()
                });
            });

            console.log(`📥 ${reportes.length} reportes obtenidos de Firebase para ${this.usuarioActual?.nombre || 'usuario'}`);
            return reportes;
        } catch (error) {
            console.error('❌ Error obteniendo reportes remotos:', error);
            throw error;
        }
    }

    async obtenerTodosLosReportes() {
        // Función específica para administradores
        if (!this.db || !this.usuario) {
            throw new Error('Firebase no inicializado');
        }

        if (this.usuarioActual?.rol !== 'administrador') {
            throw new Error('Solo los administradores pueden acceder a todos los reportes');
        }

        try {
            const { collection, getDocs } = 
                await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');

            const querySnapshot = await getDocs(collection(this.db, 'reportes'));
            const reportes = [];
            
            querySnapshot.forEach((doc) => {
                reportes.push({
                    firebaseId: doc.id,
                    ...doc.data()
                });
            });

            console.log(`📥 ${reportes.length} reportes totales obtenidos para administrador`);
            return reportes;
        } catch (error) {
            console.error('❌ Error obteniendo todos los reportes:', error);
            throw error;
        }
    }

    async sincronizarBidireccional() {
        try {
            console.log('🔄 Iniciando sincronización bidireccional...');
            
            // 1. Subir reportes locales no sincronizados
            console.log('⬆️ Subiendo reportes locales...');
            await this.sincronizarPendientes();

            // 2. Descargar reportes remotos del usuario
            console.log('⬇️ Descargando reportes de Firebase...');
            const reportesRemotos = await this.obtenerReportesRemoto();
            
            // 3. Obtener reportes locales para comparar
            const reportesLocales = await reportesDB.obtenerTodosLosReportes();
            const firebaseIdsLocales = reportesLocales
                .filter(r => r.firebaseId)
                .map(r => r.firebaseId);
            
            let nuevosReportes = 0;
            
            // 4. Merge inteligente (evitar duplicados)
            for (const reporteRemoto of reportesRemotos) {
                // Verificar si el reporte ya existe localmente por firebaseId
                const yaExiste = firebaseIdsLocales.includes(reporteRemoto.firebaseId);
                
                if (!yaExiste) {
                    // Verificar también por contenido para evitar duplicados
                    const duplicadoPorContenido = reportesLocales.some(local => 
                        local.colegio === reporteRemoto.colegio &&
                        local.fecha === reporteRemoto.fecha &&
                        local.nombreContacto === reporteRemoto.nombreContacto
                    );
                    
                    if (!duplicadoPorContenido) {
                        // Agregar reporte remoto a local
                        const nuevoReporte = {
                            ...reporteRemoto,
                            id: Date.now() + Math.random().toString(36).substr(2, 9),
                            sincronizadoFirebase: true,
                            fechaDescarga: new Date().toISOString()
                        };
                        
                        await reportesDB.guardarReporte(nuevoReporte);
                        nuevosReportes++;
                        console.log(`✅ Nuevo reporte descargado: ${reporteRemoto.colegio}`);
                    }
                }
            }

            console.log(`✅ Sincronización bidireccional completada`);
            console.log(`   - Reportes subidos: ${this.reportesSubidos || 0}`);
            console.log(`   - Reportes descargados: ${nuevosReportes}`);
            console.log(`   - Total en Firebase: ${reportesRemotos.length}`);
            
            // Refrescar UI si hay cambios
            if (nuevosReportes > 0) {
                await cargarBorradores();
            }
            
            return {
                subidos: this.reportesSubidos || 0,
                descargados: nuevosReportes,
                totalRemoto: reportesRemotos.length
            };
            
        } catch (error) {
            console.error('❌ Error en sincronización bidireccional:', error);
            throw error;
        }
    }
}

// ============== INTEGRACIÓN CON LA APP EXISTENTE ==============
let sincronizador = null;

// Modificar la función guardarReporte existente para incluir sincronización
window.addEventListener('load', () => {
    // Guardar referencia a la función original después de que se cargue
    setTimeout(() => {
        if (typeof window.guardarReporte === 'function') {
            const guardarReporteOriginal = window.guardarReporte;
            
            window.guardarReporte = async function() {
                // Llamar a la función original
                await guardarReporteOriginal();
                
                // Sincronizar con Firebase si está disponible
                if (sincronizador && navigator.onLine) {
                    setTimeout(() => {
                        sincronizador.sincronizarPendientes();
                    }, 1000);
                }
            };
        }
    }, 2000);
});

// Agregar métodos a ReportesDB para sincronización
ReportesDB.prototype.actualizarReporte = async function(reporte) {
    if (!this.db) throw new Error('Base de datos no inicializada');
    
    return new Promise((resolve, reject) => {
        const transaction = this.db.transaction(['reportes'], 'readwrite');
        const store = transaction.objectStore('reportes');
        const request = store.put(reporte);
        
        request.onsuccess = () => {
            console.log('Reporte actualizado:', reporte.id);
            resolve();
        };
        
        request.onerror = () => {
            console.error('Error al actualizar reporte:', request.error);
            reject(request.error);
        };
    });
};

ReportesDB.prototype.buscarPorFirebaseId = async function(firebaseId) {
    if (!this.db) throw new Error('Base de datos no inicializada');
    
    return new Promise((resolve, reject) => {
        const transaction = this.db.transaction(['reportes'], 'readonly');
        const store = transaction.objectStore('reportes');
        const request = store.openCursor();
        
        request.onsuccess = (event) => {
            const cursor = event.target.result;
            if (cursor) {
                if (cursor.value.firebaseId === firebaseId) {
                    resolve(cursor.value);
                    return;
                }
                cursor.continue();
            } else {
                resolve(null);
            }
        };
        
        request.onerror = () => {
            reject(request.error);
        };
    });
};

// ============== INICIALIZACIÓN AL CARGAR LA PÁGINA ==============
document.addEventListener('DOMContentLoaded', async () => {
    // Agregar botón de sincronización en la UI
    const formContainer = document.querySelector('.form-container');
    if (formContainer) {
        const syncButton = document.createElement('button');
        syncButton.innerHTML = '☁️ Sincronizar con la Nube';
        syncButton.className = 'btn-info';
        syncButton.style.marginTop = '20px';
        syncButton.style.width = '100%';
        
        syncButton.onclick = async () => {
            if (!sincronizador) {
                mostrarMensaje('⏳ Conectando con Firebase...', 'warning');
                sincronizador = new SincronizadorFirebase();
                const inicializado = await sincronizador.inicializar();
                
                if (inicializado) {
                    await sincronizador.sincronizarBidireccional();
                    mostrarMensaje('✅ Sincronización completada', 'success');
                } else {
                    mostrarMensaje('❌ Error conectando con Firebase', 'error');
                }
            } else {
                await sincronizador.sincronizarBidireccional();
                mostrarMensaje('✅ Sincronización completada', 'success');
            }
        };
        
        // Insertar antes del footer
        const footer = document.querySelector('.footer-leyenda');
        formContainer.insertBefore(syncButton, footer);
        
        // Agregar indicador de estado de sincronización
        const statusIndicator = document.createElement('div');
        statusIndicator.id = 'sync-status';
        statusIndicator.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            padding: 10px 15px;
            background: ${navigator.onLine ? '#28a745' : '#dc3545'};
            color: white;
            border-radius: 20px;
            font-size: 12px;
            z-index: 9999;
            display: flex;
            align-items: center;
            gap: 8px;
        `;
        statusIndicator.innerHTML = `
            <span style="font-size: 16px;">${navigator.onLine ? '🟢' : '🔴'}</span>
            <span>${navigator.onLine ? 'En línea' : 'Sin conexión'}</span>
        `;
        document.body.appendChild(statusIndicator);
        
        // Actualizar indicador cuando cambie el estado
        window.addEventListener('online', () => {
            statusIndicator.style.background = '#28a745';
            statusIndicator.innerHTML = `
                <span style="font-size: 16px;">🟢</span>
                <span>En línea</span>
            `;
        });
        
        window.addEventListener('offline', () => {
            statusIndicator.style.background = '#dc3545';
            statusIndicator.innerHTML = `
                <span style="font-size: 16px;">🔴</span>
                <span>Sin conexión</span>
            `;
        });
    }
});

// ============== FUNCIÓN DE PRUEBA FIREBASE ==============
async function probarFirebaseBasico() {
    console.log('🧪 === PRUEBA BÁSICA DE FIREBASE ===');
    
    try {
        // Paso 1: Verificar configuración
        console.log('1️⃣ Verificando configuración...', firebaseConfig);
        
        // Paso 2: Importar Firebase
        console.log('2️⃣ Importando Firebase...');
        const { initializeApp } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js');
        const { getFirestore, doc, setDoc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
        console.log('✅ Firebase importado');
        
        // Paso 3: Inicializar app
        console.log('3️⃣ Inicializando app...');
        const app = initializeApp(firebaseConfig);
        console.log('✅ App inicializada');
        
        // Paso 4: Conectar Firestore
        console.log('4️⃣ Conectando Firestore...');
        const db = getFirestore(app);
        console.log('✅ Firestore conectado');
        
        // Paso 5: Prueba simple de escritura
        console.log('5️⃣ Prueba de escritura...');
        const testDoc = doc(db, 'prueba', 'test-' + Date.now());
        await setDoc(testDoc, {
            mensaje: 'Prueba de conexión',
            timestamp: new Date().toISOString(),
            usuario: 'test'
        });
        console.log('✅ Escritura exitosa');
        
        console.log('🎉 FIREBASE FUNCIONA CORRECTAMENTE');
        return true;
        
    } catch (error) {
        console.error('❌ Error en prueba Firebase:', error);
        return false;
    }
}

// Hacer prueba disponible globalmente
window.probarFirebase = probarFirebaseBasico;

console.log('🚀 Módulo de sincronización Firebase cargado');
console.log('💡 Ejecuta "probarFirebase()" en la consola para probar Firebase');;
