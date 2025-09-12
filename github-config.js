const githubConfig = {
    owner: '', // Configurar en la aplicación
    repo: '', // Configurar en la aplicación
    token: '', // Configurar en la aplicación - NO SUBIR TOKEN A GIT
    branch: 'main',
    
    // Rutas de los archivos en el repositorio
    paths: {
        usuarios: 'data/usuarios.json',
        reportes: 'data/reportes.json',
        metadata: 'data/metadata.json'
    }
};

// Función para guardar configuración en localStorage
function guardarConfiguracionGitHub(config) {
    localStorage.setItem('githubConfig', JSON.stringify(config));
}

// Función para cargar configuración de localStorage
function cargarConfiguracionGitHub() {
    const saved = localStorage.getItem('githubConfig');
    if (saved) {
        return JSON.parse(saved);
    }
    return githubConfig;
}

// Función para validar la configuración
function validarConfiguracionGitHub(config) {
    return config.owner && config.repo && config.token;
}