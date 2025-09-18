class GitHubSync {
    constructor() {
        this.config = cargarConfiguracionGitHub();
        this.baseUrl = 'https://api.github.com';
    }

    // Actualizar configuración
    actualizarConfiguracion(owner, repo, token) {
        this.config = {
            ...this.config,
            owner,
            repo,
            token
        };
        guardarConfiguracionGitHub(this.config);
    }

    // Construir URL de la API
    construirUrl(path) {
        return `${this.baseUrl}/repos/${this.config.owner}/${this.config.repo}/contents/${path}`;
    }

    // Headers para las peticiones
    obtenerHeaders() {
        return {
            'Authorization': `Bearer ${this.config.token}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json'
        };
    }

    // Leer archivo de GitHub
    async leerArchivo(path) {
        try {
            const response = await fetch(this.construirUrl(path), {
                headers: this.obtenerHeaders()
            });

            if (response.status === 404) {
                console.log(`📄 Archivo no existe en GitHub: ${path}`);
                return null;
            }

            if (!response.ok) {
                throw new Error(`Error leyendo archivo: ${response.status}`);
            }

            const data = await response.json();
            const content = atob(data.content);
            return {
                content: JSON.parse(content),
                sha: data.sha
            };
        } catch (error) {
            console.error('Error leyendo de GitHub:', error);
            throw error;
        }
    }

    // Escribir archivo en GitHub
    async escribirArchivo(path, content, message, sha = null) {
        try {
            const body = {
                message: message,
                content: btoa(JSON.stringify(content, null, 2)),
                branch: this.config.branch
            };

            if (sha) {
                body.sha = sha;
            }

            const response = await fetch(this.construirUrl(path), {
                method: 'PUT',
                headers: this.obtenerHeaders(),
                body: JSON.stringify(body)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(`Error escribiendo archivo: ${JSON.stringify(error)}`);
            }

            const result = await response.json();
            console.log(`✅ Archivo guardado en GitHub: ${path}`);
            return result;
        } catch (error) {
            console.error('Error escribiendo en GitHub:', error);
            throw error;
        }
    }

    // Sincronizar usuarios (SUBIR datos locales a GitHub como backup)
    async sincronizarUsuarios() {
        console.log('🔄 SUBIENDO usuarios locales a GitHub...');
        
        try {
            // Obtener usuarios locales del sistema de autenticación
            const sistemaAuth = window.sistemaAuth || window.sistemaAutenticacion;
            if (!sistemaAuth) {
                throw new Error('Sistema de autenticación no disponible');
            }
            
            console.log('🔍 DEBUG: Obteniendo usuarios del sistema de autenticación...');
            const usuariosObj = sistemaAuth.obtenerUsuarios() || {};
            console.log('🔍 DEBUG: Usuarios obtenidos:', usuariosObj);
            
            // También verificar directamente en localStorage
            const usuariosDirectoLS = localStorage.getItem('udp_usuarios');
            console.log('🔍 DEBUG: Usuarios directo de localStorage:', usuariosDirectoLS);
            
            const usuariosLocales = Object.values(usuariosObj);
            console.log(`📊 Usuarios locales para subir: ${usuariosLocales.length}`);
            console.log('🔍 DEBUG: Lista de usuarios a subir:', usuariosLocales.map(u => `${u.id}: ${u.nombre} (modificado: ${u.fechaModificacion})`));

            if (usuariosLocales.length === 0) {
                throw new Error('No hay usuarios locales para sincronizar');
            }

            // Marcar todos los usuarios con timestamp de sincronización
            const usuariosParaSubir = usuariosLocales.map(usuario => ({
                ...usuario,
                ultimaSincronizacion: new Date().toISOString(),
                sincronizadoDesde: 'local'
            }));

            // Obtener el SHA actual del archivo en GitHub (si existe)
            const archivoGitHub = await this.leerArchivo(this.config.paths.usuarios);
            
            // SUBIR usuarios locales a GitHub (SOBRESCRIBIR GitHub con datos locales)
            await this.escribirArchivo(
                this.config.paths.usuarios,
                usuariosParaSubir,
                `📤 Backup de usuarios desde local - ${new Date().toLocaleString()}`,
                archivoGitHub?.sha
            );

            console.log(`✅ BACKUP COMPLETADO: ${usuariosParaSubir.length} usuarios subidos a GitHub`);
            return { exito: true, cantidad: usuariosParaSubir.length, accion: 'backup' };

        } catch (error) {
            console.error('❌ Error haciendo backup de usuarios:', error);
            throw error;
        }
    }

    // Nueva función para DESCARGAR usuarios desde GitHub (para nuevos equipos)
    async descargarUsuarios() {
        console.log('📥 DESCARGANDO usuarios desde GitHub...');
        
        try {
            // Obtener usuarios de GitHub
            const archivoGitHub = await this.leerArchivo(this.config.paths.usuarios);
            if (!archivoGitHub || !archivoGitHub.content || archivoGitHub.content.length === 0) {
                throw new Error('No hay datos de usuarios en GitHub para descargar');
            }

            const usuariosGitHub = archivoGitHub.content;
            console.log(`📊 Usuarios encontrados en GitHub: ${usuariosGitHub.length}`);

            // Convertir a formato del sistema de autenticación
            const usuariosObj = {};
            usuariosGitHub.forEach(usuario => {
                // Marcar como descargado desde GitHub
                usuario.descargadoDesde = 'github';
                usuario.fechaDescarga = new Date().toISOString();
                usuariosObj[usuario.id] = usuario;
            });

            // SOBRESCRIBIR usuarios locales con los de GitHub
            localStorage.setItem('udp_usuarios', JSON.stringify(usuariosObj));

            console.log(`✅ DESCARGA COMPLETADA: ${usuariosGitHub.length} usuarios restaurados desde GitHub`);
            return { exito: true, cantidad: usuariosGitHub.length, accion: 'restore' };

        } catch (error) {
            console.error('❌ Error descargando usuarios desde GitHub:', error);
            throw error;
        }
    }

    // Sincronizar reportes (SUBIR datos locales a GitHub como backup)
    async sincronizarReportes() {
        console.log('🔄 SUBIENDO reportes locales a GitHub...');
        
        try {
            // Obtener reportes locales usando reportesDB si está disponible
            let reportesLocales = [];
            if (window.reportesDB && typeof window.reportesDB.obtenerTodosLosReportes === 'function') {
                reportesLocales = await window.reportesDB.obtenerTodosLosReportes();
            } else {
                // Fallback a localStorage
                const reportesGuardados = localStorage.getItem('reportes') || '[]';
                reportesLocales = JSON.parse(reportesGuardados);
            }
            console.log(`📊 Reportes locales para subir: ${reportesLocales.length}`);

            if (reportesLocales.length === 0) {
                console.log('ℹ️ No hay reportes locales para hacer backup');
                return { exito: true, cantidad: 0, accion: 'backup' };
            }

            // Marcar todos los reportes con timestamp de sincronización
            const reportesParaSubir = reportesLocales.map(reporte => ({
                ...reporte,
                ultimaSincronizacion: new Date().toISOString(),
                sincronizadoDesde: 'local',
                sincronizadoGitHub: true
            }));

            // Obtener el SHA actual del archivo en GitHub (si existe)
            const archivoGitHub = await this.leerArchivo(this.config.paths.reportes);
            
            // SUBIR reportes locales a GitHub (SOBRESCRIBIR GitHub con datos locales)
            await this.escribirArchivo(
                this.config.paths.reportes,
                reportesParaSubir,
                `📤 Backup de reportes desde local - ${new Date().toLocaleString()}`,
                archivoGitHub?.sha
            );

            console.log(`✅ BACKUP COMPLETADO: ${reportesParaSubir.length} reportes subidos a GitHub`);
            return { exito: true, cantidad: reportesParaSubir.length, accion: 'backup' };

        } catch (error) {
            console.error('❌ Error haciendo backup de reportes:', error);
            throw error;
        }
    }

    // Nueva función para DESCARGAR reportes desde GitHub (para nuevos equipos)
    async descargarReportes() {
        console.log('📥 DESCARGANDO reportes desde GitHub...');
        
        try {
            // Obtener reportes de GitHub
            const archivoGitHub = await this.leerArchivo(this.config.paths.reportes);
            if (!archivoGitHub || !archivoGitHub.content || archivoGitHub.content.length === 0) {
                console.log('ℹ️ No hay reportes en GitHub para descargar');
                return { exito: true, cantidad: 0, accion: 'restore' };
            }

            const reportesGitHub = archivoGitHub.content;
            console.log(`📊 Reportes encontrados en GitHub: ${reportesGitHub.length}`);

            // Marcar reportes como descargados
            const reportesParaRestaurar = reportesGitHub.map(reporte => ({
                ...reporte,
                descargadoDesde: 'github',
                fechaDescarga: new Date().toISOString(),
                sincronizadoGitHub: true
            }));

            // SOBRESCRIBIR reportes locales con los de GitHub
            if (window.reportesDB && typeof window.reportesDB.guardarReporte === 'function') {
                // Limpiar base de datos local y agregar reportes de GitHub
                for (const reporte of reportesParaRestaurar) {
                    await window.reportesDB.guardarReporte(reporte);
                }
            } else {
                // Fallback a localStorage
                localStorage.setItem('reportes', JSON.stringify(reportesParaRestaurar));
            }

            console.log(`✅ DESCARGA COMPLETADA: ${reportesGitHub.length} reportes restaurados desde GitHub`);
            return { exito: true, cantidad: reportesGitHub.length, accion: 'restore' };

        } catch (error) {
            console.error('❌ Error descargando reportes desde GitHub:', error);
            throw error;
        }
    }

    // BACKUP completo (subir todo local a GitHub)
    async sincronizarTodo() {
        console.log('🚀 Iniciando BACKUP completo a GitHub...');
        
        const resultados = {
            usuarios: null,
            reportes: null,
            exito: false,
            accion: 'backup'
        };

        try {
            // Validar configuración
            if (!validarConfiguracionGitHub(this.config)) {
                throw new Error('Configuración de GitHub incompleta. Por favor configura owner, repo y token.');
            }

            // SUBIR usuarios locales a GitHub
            resultados.usuarios = await this.sincronizarUsuarios();

            // SUBIR reportes locales a GitHub
            resultados.reportes = await this.sincronizarReportes();

            // Actualizar metadata
            await this.escribirArchivo(
                this.config.paths.metadata,
                {
                    ultimoBackup: new Date().toISOString(),
                    usuarios: resultados.usuarios.cantidad,
                    reportes: resultados.reportes.cantidad,
                    tipo: 'backup_desde_local'
                },
                `📤 Metadata de backup - ${new Date().toLocaleString()}`
            );

            resultados.exito = true;
            console.log('✅ BACKUP completo exitoso - Datos locales subidos a GitHub');

        } catch (error) {
            console.error('❌ Error en backup completo:', error);
            resultados.error = error.message;
        }

        return resultados;
    }

    // RESTORE completo (descargar todo desde GitHub a local)
    async restaurarTodo() {
        console.log('🚀 Iniciando RESTORE completo desde GitHub...');
        
        const resultados = {
            usuarios: null,
            reportes: null,
            exito: false,
            accion: 'restore'
        };

        try {
            // Validar configuración
            if (!validarConfiguracionGitHub(this.config)) {
                throw new Error('Configuración de GitHub incompleta. Por favor configura owner, repo y token.');
            }

            // DESCARGAR usuarios desde GitHub
            resultados.usuarios = await this.descargarUsuarios();

            // DESCARGAR reportes desde GitHub
            resultados.reportes = await this.descargarReportes();

            resultados.exito = true;
            console.log('✅ RESTORE completo exitoso - Datos de GitHub restaurados localmente');

        } catch (error) {
            console.error('❌ Error en restore completo:', error);
            resultados.error = error.message;
        }

        return resultados;
    }

    // Probar conexión con GitHub
    async probarConexion() {
        try {
            const response = await fetch(`${this.baseUrl}/repos/${this.config.owner}/${this.config.repo}`, {
                headers: this.obtenerHeaders()
            });

            if (response.ok) {
                const repo = await response.json();
                console.log('✅ Conexión exitosa con GitHub');
                console.log(`📦 Repositorio: ${repo.full_name}`);
                console.log(`📝 Descripción: ${repo.description || 'Sin descripción'}`);
                return { exito: true, repo };
            } else {
                throw new Error(`Error de conexión: ${response.status}`);
            }
        } catch (error) {
            console.error('❌ Error probando conexión:', error);
            return { exito: false, error: error.message };
        }
    }
}

// Función para inicializar githubSync cuando el DOM esté listo
function inicializarGitHubSync() {
    if (typeof cargarConfiguracionGitHub === 'function') {
        window.githubSync = new GitHubSync();
        console.log('✅ GitHubSync inicializado correctamente');
        return true;
    } else {
        console.warn('⚠️ Funciones de configuración no disponibles aún');
        return false;
    }
}

// Intentar inicializar inmediatamente
if (!inicializarGitHubSync()) {
    // Si falla, intentar de nuevo después de que se cargue el DOM
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', inicializarGitHubSync);
    } else {
        // Si el DOM ya está listo, esperar un poco más
        setTimeout(inicializarGitHubSync, 100);
    }
}
