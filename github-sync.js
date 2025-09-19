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
            
            const usuariosObj = sistemaAuth.obtenerUsuarios() || {};
            
            // También verificar directamente en localStorage
            const usuariosDirectoLS = localStorage.getItem('udp_usuarios');
            
            const usuariosLocales = Object.values(usuariosObj);
            console.log(`📊 Usuarios locales para subir: ${usuariosLocales.length}`);

            if (usuariosLocales.length === 0) {
                throw new Error('No hay usuarios locales para sincronizar');
            }

            // Marcar todos los usuarios con timestamp de sincronización y limpiar pendientes
            const usuariosParaSubir = usuariosLocales.map(usuario => ({
                ...usuario,
                ultimaSincronizacion: new Date().toISOString(),
                sincronizadoDesde: 'local',
                pendienteSincronizacion: false // Limpiar flag después del backup
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

            // Actualizar localStorage con usuarios "limpios" (sin pendienteSincronizacion)
            const usuariosLimpios = {};
            usuariosParaSubir.forEach(usuario => {
                usuariosLimpios[usuario.id] = usuario;
            });
            localStorage.setItem('udp_usuarios', JSON.stringify(usuariosLimpios));
            console.log('🧹 Flags pendienteSincronizacion limpiados en localStorage');

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
    async sincronizarReportes(usuarioId = null) {
        console.log('🔄 SUBIENDO reportes locales a GitHub...');
        
        try {
            // Determinar qué usuario usar
            const userId = usuarioId || (window.usuarioActual ? window.usuarioActual.id : null);
            if (!userId) {
                throw new Error('No hay usuario identificado para sincronizar reportes');
            }
            
            console.log(`👤 Sincronizando reportes del usuario: ${userId}`);
            
            // Obtener reportes locales del usuario actual
            let reportesLocales = [];
            if (window.reportesDB && typeof window.reportesDB.obtenerTodosLosReportes === 'function') {
                const todosLosReportes = await window.reportesDB.obtenerTodosLosReportes();
                // Filtrar solo los reportes del usuario actual
                reportesLocales = todosLosReportes.filter(r => r.usuario === userId || r.usuarioId === userId);
            } else {
                // Fallback a localStorage
                const reportesGuardados = localStorage.getItem('reportes') || '[]';
                const todosLosReportes = JSON.parse(reportesGuardados);
                reportesLocales = todosLosReportes.filter(r => r.usuario === userId || r.usuarioId === userId);
            }
            
            console.log(`📊 Reportes del usuario ${userId} para subir: ${reportesLocales.length}`);

            if (reportesLocales.length === 0) {
                console.log(`ℹ️ No hay reportes del usuario ${userId} para hacer backup`);
                return { exito: true, cantidad: 0, usuario: userId, accion: 'backup' };
            }

            // Marcar todos los reportes con timestamp de sincronización
            const reportesParaSubir = reportesLocales.map(reporte => ({
                ...reporte,
                usuario: userId,
                ultimaSincronizacion: new Date().toISOString(),
                sincronizadoDesde: 'local',
                sincronizadoGitHub: true
            }));

            // Determinar la ruta del archivo para este usuario
            const rutaArchivo = typeof this.config.paths.reportesPorUsuario === 'function' 
                ? this.config.paths.reportesPorUsuario(userId)
                : `data/reportes/${userId}.json`;
                
            console.log(`📁 Subiendo a: ${rutaArchivo}`);

            // Obtener el SHA actual del archivo en GitHub (si existe)
            const archivoGitHub = await this.leerArchivo(rutaArchivo);
            
            // SUBIR reportes del usuario a GitHub (SOBRESCRIBIR GitHub con datos locales)
            await this.escribirArchivo(
                rutaArchivo,
                reportesParaSubir,
                `📤 Backup de reportes de ${userId} - ${new Date().toLocaleString()}`,
                archivoGitHub?.sha
            );

            // Actualizar los reportes en la base de datos local para marcarlos como sincronizados
            if (window.reportesDB && typeof window.reportesDB.actualizarReporte === 'function') {
                for (const reporte of reportesParaSubir) {
                    try {
                        await window.reportesDB.actualizarReporte(reporte.id, reporte);
                    } catch (err) {
                        console.warn(`No se pudo actualizar reporte ${reporte.id}:`, err);
                    }
                }
            }

            console.log(`✅ BACKUP COMPLETADO: ${reportesParaSubir.length} reportes de ${userId} subidos a GitHub`);
            return { exito: true, cantidad: reportesParaSubir.length, usuario: userId, accion: 'backup' };

        } catch (error) {
            console.error('❌ Error haciendo backup de reportes:', error);
            throw error;
        }
    }

    // Nueva función para DESCARGAR reportes desde GitHub (para nuevos equipos)
    async descargarReportes(usuarioId = null) {
        console.log('📥 DESCARGANDO reportes desde GitHub...');
        
        try {
            // Determinar qué usuario usar
            const userId = usuarioId || (window.usuarioActual ? window.usuarioActual.id : null);
            if (!userId) {
                throw new Error('No hay usuario identificado para descargar reportes');
            }
            
            console.log(`👤 Descargando reportes del usuario: ${userId}`);
            
            // Determinar la ruta del archivo para este usuario
            const rutaArchivo = typeof this.config.paths.reportesPorUsuario === 'function' 
                ? this.config.paths.reportesPorUsuario(userId)
                : `data/reportes/${userId}.json`;
                
            console.log(`📁 Descargando desde: ${rutaArchivo}`);
            
            // Obtener reportes de GitHub para este usuario
            const archivoGitHub = await this.leerArchivo(rutaArchivo);
            if (!archivoGitHub || !archivoGitHub.content || archivoGitHub.content.length === 0) {
                console.log(`ℹ️ No hay reportes de ${userId} en GitHub para descargar`);
                return { exito: true, cantidad: 0, usuario: userId, accion: 'restore' };
            }

            const reportesGitHub = archivoGitHub.content;
            console.log(`📊 Reportes de ${userId} encontrados en GitHub: ${reportesGitHub.length}`);

            // Marcar reportes como descargados y asegurar que tienen el usuario correcto
            const reportesParaRestaurar = reportesGitHub.map(reporte => ({
                ...reporte,
                usuario: userId,
                usuarioId: userId,
                descargadoDesde: 'github',
                fechaDescarga: new Date().toISOString(),
                sincronizadoGitHub: true
            }));

            // Obtener reportes locales actuales para preservar los de otros usuarios
            let reportesExistentes = [];
            if (window.reportesDB && typeof window.reportesDB.obtenerTodosLosReportes === 'function') {
                const todosLosReportes = await window.reportesDB.obtenerTodosLosReportes();
                // Mantener solo reportes de OTROS usuarios
                reportesExistentes = todosLosReportes.filter(r => r.usuario !== userId && r.usuarioId !== userId);
            } else {
                const reportesGuardados = localStorage.getItem('reportes') || '[]';
                const todosLosReportes = JSON.parse(reportesGuardados);
                reportesExistentes = todosLosReportes.filter(r => r.usuario !== userId && r.usuarioId !== userId);
            }
            
            // Combinar reportes existentes de otros usuarios con los descargados del usuario actual
            const reportesCombinados = [...reportesExistentes, ...reportesParaRestaurar];
            
            // Guardar en la base de datos local
            if (window.reportesDB && typeof window.reportesDB.guardarReporte === 'function') {
                // Limpiar reportes del usuario actual y agregar los de GitHub
                for (const reporte of reportesParaRestaurar) {
                    await window.reportesDB.guardarReporte(reporte);
                }
            } else {
                // Fallback a localStorage
                localStorage.setItem('reportes', JSON.stringify(reportesCombinados));
            }

            console.log(`✅ DESCARGA COMPLETADA: ${reportesGitHub.length} reportes de ${userId} restaurados desde GitHub`);
            return { exito: true, cantidad: reportesGitHub.length, usuario: userId, accion: 'restore' };

        } catch (error) {
            console.error('❌ Error descargando reportes desde GitHub:', error);
            throw error;
        }
    }
    
    // Nueva función para que el ADMIN descargue reportes de TODOS los usuarios
    async descargarReportesDeTodosLosUsuarios() {
        console.log('👑 ADMIN: Descargando reportes de TODOS los usuarios...');
        
        try {
            // Verificar que el usuario actual es admin
            const usuarioActual = window.usuarioActual || (window.sistemaAuth ? window.sistemaAuth.obtenerSesionActual() : null);
            if (!usuarioActual || usuarioActual.rol !== 'administrador') {
                throw new Error('Solo los administradores pueden descargar reportes de todos los usuarios');
            }
            
            // Obtener lista de todos los usuarios
            const sistemaAuth = window.sistemaAuth || window.sistemaAutenticacion;
            if (!sistemaAuth) {
                throw new Error('Sistema de autenticación no disponible');
            }
            
            const usuarios = sistemaAuth.obtenerUsuarios();
            const listaUsuarios = Object.keys(usuarios);
            console.log(`👥 Usuarios encontrados: ${listaUsuarios.join(', ')}`);
            
            let reportesTotales = [];
            let usuariosProcesados = 0;
            
            // Descargar reportes de cada usuario
            for (const userId of listaUsuarios) {
                try {
                    console.log(`📥 Descargando reportes de ${userId}...`);
                    const rutaArchivo = typeof this.config.paths.reportesPorUsuario === 'function' 
                        ? this.config.paths.reportesPorUsuario(userId)
                        : `data/reportes/${userId}.json`;
                    
                    const archivoGitHub = await this.leerArchivo(rutaArchivo);
                    
                    if (archivoGitHub && archivoGitHub.content && archivoGitHub.content.length > 0) {
                        const reportesUsuario = archivoGitHub.content.map(reporte => ({
                            ...reporte,
                            usuario: userId,
                            usuarioId: userId
                        }));
                        reportesTotales = [...reportesTotales, ...reportesUsuario];
                        console.log(`✅ ${reportesUsuario.length} reportes de ${userId} descargados`);
                        usuariosProcesados++;
                    } else {
                        console.log(`ℹ️ Sin reportes para ${userId}`);
                    }
                } catch (error) {
                    console.log(`⚠️ No se pudieron descargar reportes de ${userId}:`, error.message);
                }
            }
            
            // Guardar todos los reportes localmente
            if (reportesTotales.length > 0) {
                if (window.reportesDB) {
                    // Primero limpiar todos los reportes existentes
                    await window.reportesDB.eliminarTodosLosReportes();

                    // Luego guardar los reportes descargados
                    for (const reporte of reportesTotales) {
                        await window.reportesDB.guardarReporte(reporte);
                    }
                } else {
                    localStorage.setItem('reportes', JSON.stringify(reportesTotales));
                }
            }
            
            console.log(`✅ DESCARGA ADMIN COMPLETADA: ${reportesTotales.length} reportes de ${usuariosProcesados} usuarios`);
            return { 
                exito: true, 
                totalReportes: reportesTotales.length, 
                usuariosProcesados, 
                accion: 'restore-admin' 
            };
            
        } catch (error) {
            console.error('❌ Error en descarga admin:', error);
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

            // SUBIR reportes del usuario actual a GitHub (archivos por usuario)
            const usuarioActual = window.usuarioActual || (window.sistemaAuth ? window.sistemaAuth.obtenerSesionActual() : null);
            if (usuarioActual) {
                resultados.reportes = await this.sincronizarReportes(usuarioActual.id);
            } else {
                console.log('ℹ️ No hay usuario actual identificado para sincronizar reportes');
                resultados.reportes = { exito: true, cantidad: 0, accion: 'backup' };
            }

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
            const usuarioActual = window.usuarioActual || (window.sistemaAuth ? window.sistemaAuth.obtenerSesionActual() : null);
            if (usuarioActual) {
                if (usuarioActual.rol === 'administrador') {
                    // Si es admin, descargar reportes de todos los usuarios
                    resultados.reportes = await this.descargarReportesDeTodosLosUsuarios();
                } else {
                    // Si es usuario normal, solo sus reportes
                    resultados.reportes = await this.descargarReportes(usuarioActual.id);
                }
            } else {
                console.log('ℹ️ No hay usuario actual identificado para descargar reportes');
                resultados.reportes = { exito: true, cantidad: 0, accion: 'restore' };
            }

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

    // Sincronizar reportes después de eliminación (sobrescribir completamente en GitHub)
    async sincronizarReportesConEliminacion(reportesRestantes) {
        console.log('🔄 Sincronizando reportes con GitHub después de eliminación...');

        try {
            const usuarioActual = window.usuarioActual || (window.sistemaAuth ? window.sistemaAuth.obtenerSesionActual() : null);

            if (!usuarioActual) {
                throw new Error('No hay usuario autenticado');
            }

            // Obtener el SHA actual del archivo en GitHub
            const pathUsuario = typeof this.config.paths.reportesPorUsuario === 'function'
                ? this.config.paths.reportesPorUsuario(usuarioActual.id)
                : `data/reportes/${usuarioActual.id}.json`;
            const archivoUsuario = await this.leerArchivo(pathUsuario);

            // Marcar todos como sincronizados
            reportesRestantes.forEach(reporte => {
                reporte.sincronizadoGitHub = true;
            });

            // Sobrescribir completamente el archivo en GitHub con los reportes restantes
            await this.escribirArchivo(
                pathUsuario,
                reportesRestantes,
                `Eliminación de reporte - ${usuarioActual.nombre} - ${new Date().toLocaleString()}`,
                archivoUsuario?.sha
            );

            console.log(`✅ GitHub actualizado después de eliminación: ${reportesRestantes.length} reportes restantes`);
            return { exito: true, cantidad: reportesRestantes.length };

        } catch (error) {
            console.error('❌ Error al actualizar GitHub después de eliminación:', error);
            throw error;
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
