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

    // Sincronizar usuarios
    async sincronizarUsuarios() {
        console.log('🔄 Sincronizando usuarios con GitHub...');
        
        try {
            // Obtener usuarios locales
            const usuariosLocales = await db.usuarios.toArray();
            console.log(`📊 Usuarios locales: ${usuariosLocales.length}`);

            // Obtener usuarios de GitHub
            const archivoGitHub = await this.leerArchivo(this.config.paths.usuarios);
            const usuariosGitHub = archivoGitHub ? archivoGitHub.content : [];
            console.log(`📊 Usuarios en GitHub: ${usuariosGitHub.length}`);

            // Crear mapa de usuarios para merge
            const usuariosMap = new Map();

            // Agregar usuarios de GitHub
            usuariosGitHub.forEach(usuario => {
                usuariosMap.set(usuario.id, usuario);
            });

            // Agregar/actualizar con usuarios locales
            usuariosLocales.forEach(usuario => {
                const existente = usuariosMap.get(usuario.id);
                if (!existente || new Date(usuario.ultimaModificacion) > new Date(existente.ultimaModificacion)) {
                    usuariosMap.set(usuario.id, usuario);
                }
            });

            // Convertir mapa a array
            const usuariosMerged = Array.from(usuariosMap.values());

            // Actualizar base de datos local
            await db.transaction('rw', db.usuarios, async () => {
                await db.usuarios.clear();
                await db.usuarios.bulkAdd(usuariosMerged);
            });

            // Actualizar GitHub
            await this.escribirArchivo(
                this.config.paths.usuarios,
                usuariosMerged,
                `Sincronización de usuarios - ${new Date().toLocaleString()}`,
                archivoGitHub?.sha
            );

            console.log(`✅ Sincronización completada: ${usuariosMerged.length} usuarios`);
            return { exito: true, cantidad: usuariosMerged.length };

        } catch (error) {
            console.error('❌ Error en sincronización de usuarios:', error);
            throw error;
        }
    }

    // Sincronizar reportes
    async sincronizarReportes() {
        console.log('🔄 Sincronizando reportes con GitHub...');
        
        try {
            // Obtener reportes locales
            const reportesLocales = await db.reportes.toArray();
            console.log(`📊 Reportes locales: ${reportesLocales.length}`);

            // Obtener reportes de GitHub
            const archivoGitHub = await this.leerArchivo(this.config.paths.reportes);
            const reportesGitHub = archivoGitHub ? archivoGitHub.content : [];
            console.log(`📊 Reportes en GitHub: ${reportesGitHub.length}`);

            // Crear mapa de reportes para merge
            const reportesMap = new Map();

            // Agregar reportes de GitHub
            reportesGitHub.forEach(reporte => {
                reportesMap.set(reporte.id, reporte);
            });

            // Agregar/actualizar con reportes locales
            reportesLocales.forEach(reporte => {
                const existente = reportesMap.get(reporte.id);
                if (!existente || new Date(reporte.fechaGuardado) > new Date(existente.fechaGuardado)) {
                    reportesMap.set(reporte.id, reporte);
                }
            });

            // Convertir mapa a array
            const reportesMerged = Array.from(reportesMap.values());

            // Actualizar base de datos local
            await db.transaction('rw', db.reportes, async () => {
                await db.reportes.clear();
                await db.reportes.bulkAdd(reportesMerged);
            });

            // Actualizar GitHub
            await this.escribirArchivo(
                this.config.paths.reportes,
                reportesMerged,
                `Sincronización de reportes - ${new Date().toLocaleString()}`,
                archivoGitHub?.sha
            );

            console.log(`✅ Sincronización completada: ${reportesMerged.length} reportes`);
            return { exito: true, cantidad: reportesMerged.length };

        } catch (error) {
            console.error('❌ Error en sincronización de reportes:', error);
            throw error;
        }
    }

    // Sincronización completa
    async sincronizarTodo() {
        console.log('🚀 Iniciando sincronización completa con GitHub...');
        
        const resultados = {
            usuarios: null,
            reportes: null,
            exito: false
        };

        try {
            // Validar configuración
            if (!validarConfiguracionGitHub(this.config)) {
                throw new Error('Configuración de GitHub incompleta. Por favor configura owner, repo y token.');
            }

            // Sincronizar usuarios
            resultados.usuarios = await this.sincronizarUsuarios();

            // Sincronizar reportes
            resultados.reportes = await this.sincronizarReportes();

            // Actualizar metadata
            await this.escribirArchivo(
                this.config.paths.metadata,
                {
                    ultimaSincronizacion: new Date().toISOString(),
                    usuarios: resultados.usuarios.cantidad,
                    reportes: resultados.reportes.cantidad
                },
                `Metadata de sincronización - ${new Date().toLocaleString()}`
            );

            resultados.exito = true;
            console.log('✅ Sincronización completa exitosa');

        } catch (error) {
            console.error('❌ Error en sincronización completa:', error);
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

// Instancia global
const githubSync = new GitHubSync();