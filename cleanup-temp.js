// Script temporal para verificar la eliminación
console.log('🧹 Script de limpieza cargado');

// Verificar que no haya conflictos de GitHubSync
console.log('Verificando GitHubSync...');
if (window.githubSync) {
    console.log('✅ window.githubSync existe');
    console.log('Métodos disponibles:', Object.getOwnPropertyNames(Object.getPrototypeOf(window.githubSync)));
} else {
    console.log('❌ window.githubSync no existe');
}
