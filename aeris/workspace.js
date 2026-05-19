// ==========================================
// WORKSPACE INTELIGENTE - Aplicación de Tareas
// ==========================================
// Reto JavaScript: Manipulación del DOM, localStorage y sessionStorage
// ==========================================

class WorkspaceInteligente {
    constructor() {
        // ==========================================
        // CONFIGURACIÓN INICIAL
        // ==========================================
        this.tareas = [];
        this.filtroActual = 'todas';
        this.modoOscuro = false;
        this.editandoId = null;

        // Elementos del DOM
        this.contenedor = document.getElementById('workspace-container');
        this.inputTarea = document.getElementById('input-tarea');
        this.btnAgregar = document.getElementById('btn-agregar-tarea');
        this.listaTareas = document.getElementById('lista-tareas');
        this.filtros = document.querySelectorAll('[data-filtro]');
        this.btnModoOscuro = document.getElementById('btn-modo-oscuro');
        this.contadorCompletadas = document.getElementById('contador-completadas');
        this.contadorTotal = document.getElementById('contador-total');

        // Inicializar
        this.cargarDatos();
        this.configurarEventos();
        this.restaurarEstadoSesion();
        this.renderizar();
    }

    // ==========================================
    // GESTIÓN DE DATOS - localStorage vs sessionStorage
    // ==========================================

    /**
     * Guarda las tareas en localStorage (PERSISTENTE)
     * Las tareas deben mantenerse incluso después de cerrar el navegador
     */
    guardarTareas() {
        localStorage.setItem('workspace_tareas', JSON.stringify(this.tareas));
        console.log('Tareas guardadas en localStorage');
    }

    /**
     * Carga las tareas desde localStorage
     */
    cargarTareas() {
        const tareasGuardadas = localStorage.getItem('workspace_tareas');
        this.tareas = tareasGuardadas ? JSON.parse(tareasGuardadas) : [];
        console.log('Tareas cargadas desde localStorage:', this.tareas.length);
    }

    /**
     * Guarda el modo oscuro en localStorage (PERSISTENTE)
     * El usuario espera que su preferencia se mantenga
     */
    guardarModoOscuro() {
        localStorage.setItem('workspace_modo_oscuro', JSON.stringify(this.modoOscuro));
    }

    /**
     * Carga el modo oscuro desde localStorage
     */
    cargarModoOscuro() {
        const modoGuardado = localStorage.getItem('workspace_modo_oscuro');
        this.modoOscuro = modoGuardado ? JSON.parse(modoGuardado) : false;
        this.aplicarModoOscuro();
    }

    /**
     * Guarda el filtro actual en sessionStorage (TEMPORAL)
     * El filtro es preferencia de la sesión actual, no debe persistir
     */
    guardarFiltroSesion() {
        sessionStorage.setItem('workspace_filtro_actual', this.filtroActual);
        console.log('Filtro guardado en sessionStorage:', this.filtroActual);
    }

    /**
     * Restaura el filtro desde sessionStorage
     */
    restaurarFiltroSesion() {
        const filtroGuardado = sessionStorage.getItem('workspace_filtro_actual');
        if (filtroGuardado) {
            this.filtroActual = filtroGuardado;
            console.log('Filtro restaurado desde sessionStorage:', this.filtroActual);
        }
    }

    /**
     * Guarda el mensaje de bienvenida en sessionStorage (TEMPORAL)
     * Solo se muestra una vez por sesión
     */
    guardarMensajeBienvenida() {
        const mensajeYaVisto = sessionStorage.getItem('workspace_bienvenida_vista');
        if (!mensajeYaVisto) {
            sessionStorage.setItem('workspace_bienvenida_vista', 'true');
            this.mostrarBienvenida();
        }
    }

    /**
     * Guarda búsqueda temporal en sessionStorage
     */
    guardarBusquedaTemporal(texto) {
        sessionStorage.setItem('workspace_busqueda_temporal', texto);
    }

    /**
     * Carga todos los datos necesarios
     */
    cargarDatos() {
        this.cargarTareas();
        this.cargarModoOscuro();
    }

    /**
     * Restaura el estado de la sesión actual
     */
    restaurarEstadoSesion() {
        this.restaurarFiltroSesion();
        this.guardarMensajeBienvenida();
    }

    // ==========================================
    // GESTIÓN DE TAREAS
    // ==========================================

    /**
     * Agrega una nueva tarea
     */
    agregarTarea(texto) {
        if (!texto.trim()) {
            alert('Por favor, escribe una tarea');
            return;
        }

        const tarea = {
            id: Date.now(),
            texto: texto.trim(),
            completada: false,
            fechaCreacion: new Date().toLocaleString('es-CO'),
            fechaEdicion: null
        };

        this.tareas.push(tarea);
        this.guardarTareas();
        this.inputTarea.value = '';
        this.renderizar();
        console.log('Tarea agregada:', tarea);
    }

    /**
     * Marca una tarea como completada
     */
    completarTarea(id) {
        const tarea = this.tareas.find(t => t.id === id);
        if (tarea) {
            tarea.completada = !tarea.completada;
            this.guardarTareas();
            this.renderizar();
            console.log('Tarea completada:', tarea);
        }
    }

    /**
     * Elimina una tarea
     */
    eliminarTarea(id) {
        this.tareas = this.tareas.filter(t => t.id !== id);
        this.guardarTareas();
        this.renderizar();
        console.log('Tarea eliminada');
    }

    /**
     * Inicia la edición de una tarea
     */
    iniciarEdicion(id) {
        this.editandoId = id;
        const tarea = this.tareas.find(t => t.id === id);
        if (tarea) {
            this.inputTarea.value = tarea.texto;
            this.inputTarea.focus();
            this.btnAgregar.textContent = 'Guardar Cambios';
            this.btnAgregar.classList.add('editando');
        }
    }

    /**
     * Guarda los cambios de una tarea editada
     */
    guardarEdicion(nuevoTexto) {
        if (!this.editandoId) return;

        const tarea = this.tareas.find(t => t.id === this.editandoId);
        if (tarea && nuevoTexto.trim()) {
            tarea.texto = nuevoTexto.trim();
            tarea.fechaEdicion = new Date().toLocaleString('es-CO');
            this.guardarTareas();
            this.cancelarEdicion();
            this.renderizar();
            console.log('Tarea editada:', tarea);
        }
    }

    /**
     * Cancela la edición
     */
    cancelarEdicion() {
        this.editandoId = null;
        this.inputTarea.value = '';
        this.btnAgregar.textContent = 'Agregar Tarea';
        this.btnAgregar.classList.remove('editando');
    }

    // ==========================================
    // FILTRADO DE TAREAS
    // ==========================================

    /**
     * Filtra las tareas según el criterio
     */
    filtrarTareas() {
        switch (this.filtroActual) {
            case 'pendientes':
                return this.tareas.filter(t => !t.completada);
            case 'completadas':
                return this.tareas.filter(t => t.completada);
            default:
                return this.tareas;
        }
    }

    /**
     * Cambia el filtro actual
     */
    cambiarFiltro(nuevoFiltro) {
        this.filtroActual = nuevoFiltro;
        this.guardarFiltroSesion();
        this.renderizar();
        console.log('Filtro cambiado a:', nuevoFiltro);
    }

    // ==========================================
    // MODO OSCURO
    // ==========================================

    /**
     * Alterna el modo oscuro
     */
    alternarModoOscuro() {
        this.modoOscuro = !this.modoOscuro;
        this.guardarModoOscuro();
        this.aplicarModoOscuro();
        console.log('Modo oscuro:', this.modoOscuro ? 'activado' : 'desactivado');
    }

    /**
     * Aplica los estilos del modo oscuro
     */
    aplicarModoOscuro() {
        if (this.modoOscuro) {
            this.contenedor.classList.add('modo-oscuro');
            this.btnModoOscuro.textContent = 'Modo Claro';
        } else {
            this.contenedor.classList.remove('modo-oscuro');
            this.btnModoOscuro.textContent = 'Modo Oscuro';
        }
    }

    // ==========================================
    // ACTUALIZACIÓN DE CONTADORES
    // ==========================================

    /**
     * Actualiza los contadores de tareas
     */
    actualizarContadores() {
        const completadas = this.tareas.filter(t => t.completada).length;
        const total = this.tareas.length;

        this.contadorCompletadas.textContent = completadas;
        this.contadorTotal.textContent = total;
    }

    // ==========================================
    // MOSTRAR BIENVENIDA (sessionStorage)
    // ==========================================

    /**
     * Muestra mensaje de bienvenida solo una vez por sesión
     */
    mostrarBienvenida() {
        const bienvenida = document.createElement('div');
        bienvenida.className = 'mensaje-bienvenida';
        bienvenida.innerHTML = `
            <p>¡Bienvenido al Workspace Inteligente!</p>
            <small>Este mensaje solo aparece una vez por sesión</small>
        `;
        this.contenedor.insertBefore(bienvenida, this.contenedor.firstChild);

        setTimeout(() => {
            bienvenida.style.opacity = '0';
            setTimeout(() => bienvenida.remove(), 300);
        }, 3000);
    }

    // ==========================================
    // RENDERIZADO DEL DOM
    // ==========================================

    /**
     * Renderiza la interfaz completa
     */
    renderizar() {
        this.renderizarListaTareas();
        this.actualizarContadores();
        this.actualizarFiltros();
    }

    /**
     * Renderiza la lista de tareas filtradas
     */
    renderizarListaTareas() {
        this.listaTareas.innerHTML = '';
        const tareasFiltradas = this.filtrarTareas();

        if (tareasFiltradas.length === 0) {
            this.listaTareas.innerHTML = `
                <div class="sin-tareas">
                    <p>No hay tareas en esta categoría</p>
                </div>
            `;
            return;
        }

        tareasFiltradas.forEach(tarea => {
            const elemento = document.createElement('div');
            elemento.className = `tarea ${tarea.completada ? 'completada' : ''}`;
            elemento.innerHTML = `
                <div class="tarea-contenido">
                    <input 
                        type="checkbox" 
                        class="checkbox-tarea"
                        ${tarea.completada ? 'checked' : ''}
                        data-id="${tarea.id}"
                    />
                    <div class="tarea-texto">
                        <p>${this.escaparHTML(tarea.texto)}</p>
                        <small class="fecha-tarea">
                             ${tarea.fechaCreacion}
                            ${tarea.fechaEdicion ? `<br> Editado: ${tarea.fechaEdicion}` : ''}
                        </small>
                    </div>
                </div>
                <div class="tarea-acciones">
                    <button class="btn-editar" data-id="${tarea.id}" title="Editar">✏️</button>
                    <button class="btn-eliminar" data-id="${tarea.id}" title="Eliminar">🗑️</button>
                </div>
            `;

            // Event listeners para esta tarea
            const checkbox = elemento.querySelector('.checkbox-tarea');
            const btnEditar = elemento.querySelector('.btn-editar');
            const btnEliminar = elemento.querySelector('.btn-eliminar');

            checkbox.addEventListener('change', () => this.completarTarea(tarea.id));
            btnEditar.addEventListener('click', () => this.iniciarEdicion(tarea.id));
            btnEliminar.addEventListener('click', () => this.eliminarTarea(tarea.id));

            this.listaTareas.appendChild(elemento);
        });
    }

    /**
     * Actualiza el estado visual de los filtros
     */
    actualizarFiltros() {
        this.filtros.forEach(filtro => {
            if (filtro.dataset.filtro === this.filtroActual) {
                filtro.classList.add('activo');
            } else {
                filtro.classList.remove('activo');
            }
        });
    }

    /**
     * Escapa caracteres HTML para evitar inyecciones
     */
    escaparHTML(texto) {
        const div = document.createElement('div');
        div.textContent = texto;
        return div.innerHTML;
    }

    // ==========================================
    // CONFIGURACIÓN DE EVENTOS
    // ==========================================

    /**
     * Configura todos los event listeners
     */
    configurarEventos() {
        // Agregar tarea
        this.btnAgregar.addEventListener('click', () => {
            if (this.editandoId) {
                this.guardarEdicion(this.inputTarea.value);
            } else {
                this.agregarTarea(this.inputTarea.value);
            }
        });

        // Enter para agregar
        this.inputTarea.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                if (this.editandoId) {
                    this.guardarEdicion(this.inputTarea.value);
                } else {
                    this.agregarTarea(this.inputTarea.value);
                }
            }
        });

        // Escape para cancelar edición
        this.inputTarea.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.editandoId) {
                this.cancelarEdicion();
            }
        });

        // Filtros
        this.filtros.forEach(filtro => {
            filtro.addEventListener('click', () => {
                this.cambiarFiltro(filtro.dataset.filtro);
            });
        });

        // Modo oscuro
        this.btnModoOscuro.addEventListener('click', () => {
            this.alternarModoOscuro();
        });
    }
}

// ==========================================
// INICIALIZACIÓN
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
    const workspace = new WorkspaceInteligente();
    console.log('Workspace Inteligente iniciado');
});