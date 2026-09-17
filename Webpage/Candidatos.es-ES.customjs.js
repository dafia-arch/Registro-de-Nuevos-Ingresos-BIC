/* =========================================================
   REGISTRO DE CANDIDATOS BIC
   GitHub Pages - JavaScript
   ========================================================= */

"use strict";


/* =========================================================
   CONFIGURACIÓN
   ========================================================= */

const CONFIG = {
    cpFile: "../Codigos Postales/cp_mexico.json",
    maxFileSize: 5 * 1024 * 1024
};


/* =========================================================
   ELEMENTOS
   ========================================================= */

const form = document.getElementById("datosForm");

const codigoPostal = document.getElementById("codigoPostal");
const ciudad = document.getElementById("ciudad");

const coloniaSelect = document.getElementById("colonia-select");
const coloniaInput = document.getElementById("colonia-input");

const containerColoniaSelect =
    document.getElementById("container-colonia-select");

const containerColoniaInput =
    document.getElementById("container-colonia-input");

const cpStatus = document.getElementById("cp-status");

const estadoCivil =
    document.getElementById("estadoCivil");

const seccionPareja =
    document.getElementById("seccionPareja");

const tieneHijos =
    document.getElementById("tieneHijos");

const seccionCantidadHijos =
    document.getElementById("seccionCantidadHijos");

const cantidadHijos =
    document.getElementById("cantidadHijos");

const contenedorHijos =
    document.getElementById("contenedorHijos");

const btnEnviar =
    document.getElementById("btnEnviar");

const status =
    document.getElementById("status");


/* =========================================================
   UTILIDADES
   ========================================================= */

function normalizarTexto(texto) {

    if (texto === null || texto === undefined) {
        return "";
    }

    return String(texto)
        .trim()
        .toUpperCase();

}


function mostrarStatus(mensaje, tipo = "info") {

    status.textContent = mensaje;

    status.className = "status-msg " + tipo;

}


function limpiarStatus() {

    status.textContent = "";
    status.className = "status-msg";

}


function limpiarError(elemento) {

    if (!elemento) {
        return;
    }

    elemento.classList.remove("input-error");

}


function marcarError(elemento) {

    if (!elemento) {
        return;
    }

    elemento.classList.add("input-error");

}


function esTelefonoValido(valor) {

    return /^\d{10}$/.test(
        String(valor).replace(/\D/g, "")
    );

}


function esNssValido(valor) {

    return /^\d{11}$/.test(
        String(valor).trim()
    );

}


function esCurpValida(valor) {

    return /^[A-Z0-9]{18}$/.test(
        normalizarTexto(valor)
    );

}


function esRfcValido(valor) {

    return /^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$/.test(
        normalizarTexto(valor)
    );

}


/* =========================================================
   CONVERSIÓN DE TEXTO A MAYÚSCULAS
   ========================================================= */

const camposMayusculas = [
    "rfc",
    "curp"
];

camposMayusculas.forEach(id => {

    const elemento = document.getElementById(id);

    if (!elemento) {
        return;
    }

    elemento.addEventListener("input", function () {

        this.value = this.value.toUpperCase();

    });

});


/* =========================================================
   SOLO NÚMEROS
   ========================================================= */

const camposNumericos = [
    "codigoPostal",
    "nss",
    "telefonoWhatsapp",
    "telefonoContactoEmergencia",
    "telefonoContactoEmergencia2"
];

camposNumericos.forEach(id => {

    const elemento = document.getElementById(id);

    if (!elemento) {
        return;
    }

    elemento.addEventListener("input", function () {

        this.value = this.value.replace(/\D/g, "");

    });

});


/* =========================================================
   CÓDIGO POSTAL
   ========================================================= */

let catalogoCP = null;


async function cargarCatalogoCP() {

    try {

        const response = await fetch(CONFIG.cpFile);

        if (!response.ok) {
            throw new Error(
                "No fue posible cargar el catálogo de códigos postales."
            );
        }

        catalogoCP = await response.json();

        console.log(
            "Catálogo de códigos postales cargado correctamente."
        );

    } catch (error) {

        console.error(error);

        cpStatus.textContent =
            "No se pudo cargar el catálogo de C.P.";

        cpStatus.className =
            "cp-status-msg error";

    }

}


function obtenerRegistroCP(cp) {

    if (!catalogoCP) {
        return null;
    }


    /* -----------------------------------------------------
       CASO 1:
       JSON como objeto:
       {
           "25000": {...},
           "25010": {...}
       }
       ----------------------------------------------------- */

    if (
        !Array.isArray(catalogoCP) &&
        typeof catalogoCP === "object"
    ) {

        if (catalogoCP[cp]) {
            return catalogoCP[cp];
        }

    }


    /* -----------------------------------------------------
       CASO 2:
       JSON como arreglo
       ----------------------------------------------------- */

    if (Array.isArray(catalogoCP)) {

        const encontrado = catalogoCP.find(item => {

            if (!item || typeof item !== "object") {
                return false;
            }

            const posiblesCP = [
                item.cp,
                item.CP,
                item.codigoPostal,
                item.codigo_postal,
                item.d_codigo
            ];

            return posiblesCP.some(valor =>
                String(valor || "").padStart(5, "0") === cp
            );

        });

        return encontrado || null;

    }


    return null;

}


function obtenerMunicipio(registro) {

    if (!registro) {
        return "";
    }

    return (
        registro.municipio ||
        registro.Municipio ||
        registro.municipioNombre ||
        registro.municipio_nombre ||
        registro.D_mnpio ||
        registro.city ||
        registro.ciudad ||
        ""
    );

}


function obtenerColonias(registro) {

    if (!registro) {
        return [];
    }

    const posibles = [
        registro.colonias,
        registro.Colonias,
        registro.asentamientos,
        registro.Asentamientos,
        registro.colonia,
        registro.Colonia
    ];


    for (const valor of posibles) {

        if (Array.isArray(valor)) {
            return valor;
        }

        if (typeof valor === "string") {
            return [valor];
        }

    }


    return [];

}


function procesarCodigoPostal() {

    const cp = codigoPostal.value.trim();

    ciudad.value = "";

    coloniaSelect.innerHTML =
        '<option value="">Seleccione una colonia...</option>';

    cpStatus.textContent = "";
    cpStatus.className = "cp-status-msg";


    if (cp.length === 0) {
        return;
    }


    if (!/^\d{5}$/.test(cp)) {

        cpStatus.textContent =
            "El C.P. debe contener 5 dígitos.";

        cpStatus.className =
            "cp-status-msg error";

        return;

    }


    if (!catalogoCP) {

        cpStatus.textContent =
            "Cargando catálogo...";

        cpStatus.className =
            "cp-status-msg loading";

        return;

    }


    const registro = obtenerRegistroCP(cp);


    if (!registro) {

        ciudad.value = "";

        containerColoniaSelect.classList.add("hidden");
        containerColoniaInput.classList.remove("hidden");

        coloniaInput.required = true;
        coloniaSelect.required = false;

        cpStatus.textContent =
            "C.P. no encontrado. Ingresa la colonia manualmente.";

        cpStatus.className =
            "cp-status-msg error";

        return;

    }


    const municipio =
        obtenerMunicipio(registro);

    const colonias =
        obtenerColonias(registro);


    ciudad.value = municipio;


    if (colonias.length > 0) {

        containerColoniaSelect.classList.remove("hidden");
        containerColoniaInput.classList.add("hidden");

        coloniaInput.required = false;
        coloniaSelect.required = true;


        colonias.forEach(colonia => {

            let nombre = "";

            if (
                typeof colonia === "string" ||
                typeof colonia === "number"
            ) {

                nombre = String(colonia);

            } else if (
                colonia &&
                typeof colonia === "object"
            ) {

                nombre =
                    colonia.nombre ||
                    colonia.Nombre ||
                    colonia.asentamiento ||
                    colonia.Asentamiento ||
                    colonia.D_asenta ||
                    colonia.colonia ||
                    colonia.Colonia ||
                    "";

            }


            if (!nombre) {
                return;
            }


            const option =
                document.createElement("option");

            option.value = nombre;
            option.textContent = nombre;

            coloniaSelect.appendChild(option);

        });


        cpStatus.textContent =
            colonias.length +
            " colonia(s) encontrada(s).";

        cpStatus.className =
            "cp-status-msg success";

    } else {

        containerColoniaSelect.classList.add("hidden");
        containerColoniaInput.classList.remove("hidden");

        coloniaInput.required = true;
        coloniaSelect.required = false;

        cpStatus.textContent =
            "C.P. encontrado. Ingresa la colonia.";

        cpStatus.className =
            "cp-status-msg success";

    }

}


/* =========================================================
   EVENTO CÓDIGO POSTAL
   ========================================================= */

codigoPostal.addEventListener(
    "input",
    procesarCodigoPostal
);

codigoPostal.addEventListener(
    "blur",
    procesarCodigoPostal
);


/* =========================================================
   ESTADO CIVIL / PAREJA
   ========================================================= */

function actualizarSeccionPareja() {

    const valor =
        normalizarTexto(estadoCivil.value);

    const requierePareja =
        valor === "CASADO(A)" ||
        valor === "UNIÓN LIBRE" ||
        valor === "UNION LIBRE";


    if (requierePareja) {

        seccionPareja.classList.remove("hidden");

    } else {

        seccionPareja.classList.add("hidden");

        document.getElementById("pareja").value = "";
        document.getElementById("fechaNacPareja").value = "";
        document.getElementById("fileActaPareja").value = "";

    }

}


estadoCivil.addEventListener(
    "change",
    actualizarSeccionPareja
);


/* =========================================================
   HIJOS
   ========================================================= */

function actualizarSeccionHijos() {

    const tiene =
        tieneHijos.value === "Si";


    if (tiene) {

        seccionCantidadHijos.classList.remove("hidden");

    } else {

        seccionCantidadHijos.classList.add("hidden");

        cantidadHijos.value = "0";

        contenedorHijos.innerHTML = "";

    }

}


tieneHijos.addEventListener(
    "change",
    actualizarSeccionHijos
);


/* =========================================================
   GENERAR HIJOS
   ========================================================= */

function generarCamposHijos() {

    const cantidad =
        parseInt(cantidadHijos.value, 10) || 0;


    contenedorHijos.innerHTML = "";


    if (cantidad <= 0) {
        return;
    }


    for (
        let i = 1;
        i <= cantidad;
        i++
    ) {

        const card =
            document.createElement("div");

        card.className =
            "child-card";


        card.innerHTML = `

            <h4 class="child-card-title">
                Hijo(a) ${i}
            </h4>

            <div class="form-grid">

                <div class="form-group-custom">

                    <label for="nombreHijo${i}">
                        Nombre completo
                    </label>

                    <input
                        type="text"
                        id="nombreHijo${i}"
                        class="form-control-custom"
                    >

                </div>


                <div class="form-group-custom">

                    <label for="fechaNacHijo${i}">
                        Fecha de nacimiento
                    </label>

                    <input
                        type="date"
                        id="fechaNacHijo${i}"
                        class="form-control-custom"
                    >

                </div>

            </div>

        `;


        contenedorHijos.appendChild(card);

    }

}


cantidadHijos.addEventListener(
    "change",
    generarCamposHijos
);


/* =========================================================
   VALIDACIÓN DE ARCHIVOS
   ========================================================= */

function validarArchivo(input) {

    if (!input.files || input.files.length === 0) {

        if (input.required) {
            return false;
        }

        return true;
    }


    const archivo =
        input.files[0];


    if (
        archivo.size >
        CONFIG.maxFileSize
    ) {

        alert(
            `El archivo "${archivo.name}" supera los 5 MB.`
        );

        input.value = "";

        return false;

    }


    const nombre =
        archivo.name.toLowerCase();


    const extensionesPermitidas = [
        ".pdf",
        ".jpg",
        ".jpeg",
        ".png"
    ];


    const extensionValida =
        extensionesPermitidas.some(
            extension =>
                nombre.endsWith(extension)
        );


    if (!extensionValida) {

        alert(
            "Formato no permitido. Usa PDF, JPG o PNG."
        );

        input.value = "";

        return false;

    }


    return true;

}


document
    .querySelectorAll('input[type="file"]')
    .forEach(input => {

        input.addEventListener(
            "change",
            function () {

                const wrapper =
                    this.closest(
                        ".file-upload-wrapper"
                    );

                const valido =
                    validarArchivo(this);


                if (wrapper) {

                    wrapper.classList.toggle(
                        "file-error",
                        !valido
                    );

                }

            }
        );

    });


/* =========================================================
   VALIDACIÓN PERSONALIZADA
   ========================================================= */

function validarFormulario() {

    limpiarStatus();


    let valido = true;


    /* NSS */

    const nss =
        document.getElementById("nss");

    if (!esNssValido(nss.value)) {

        marcarError(nss);

        valido = false;

    } else {

        limpiarError(nss);

    }


    /* RFC */

    const rfc =
        document.getElementById("rfc");

    if (!esRfcValido(rfc.value)) {

        marcarError(rfc);

        valido = false;

    } else {

        limpiarError(rfc);

    }


    /* CURP */

    const curp =
        document.getElementById("curp");

    if (!esCurpValida(curp.value)) {

        marcarError(curp);

        valido = false;

    } else {

        limpiarError(curp);

    }


    /* TELÉFONO */

    const telefono =
        document.getElementById(
            "telefonoWhatsapp"
        );

    if (!esTelefonoValido(telefono.value)) {

        marcarError(telefono);

        valido = false;

    } else {

        limpiarError(telefono);

    }


    /* TELÉFONO EMERGENCIA 1 */

    const emergencia1 =
        document.getElementById(
            "telefonoContactoEmergencia"
        );

    if (
        !esTelefonoValido(
            emergencia1.value
        )
    ) {

        marcarError(emergencia1);

        valido = false;

    } else {

        limpiarError(emergencia1);

    }


    /* TELÉFONO EMERGENCIA 2 */

    const emergencia2 =
        document.getElementById(
            "telefonoContactoEmergencia2"
        );

    if (
        emergencia2.value.trim() !== "" &&
        !esTelefonoValido(
            emergencia2.value
        )
    ) {

        marcarError(emergencia2);

        valido = false;

    } else {

        limpiarError(emergencia2);

    }


    /* COLONIA */

    let coloniaValida = false;


    if (
        !containerColoniaSelect.classList.contains(
            "hidden"
        )
    ) {

        coloniaValida =
            coloniaSelect.value.trim() !== "";

    } else {

        coloniaValida =
            coloniaInput.value.trim() !== "";

    }


    if (!coloniaValida) {

        marcarError(
            !containerColoniaSelect.classList.contains(
                "hidden"
            )
                ? coloniaSelect
                : coloniaInput
        );

        valido = false;

    }


    /* ARCHIVOS */

    const archivos =
        document.querySelectorAll(
            'input[type="file"][required]'
        );


    archivos.forEach(input => {

        if (
            !input.files ||
            input.files.length === 0
        ) {

            const wrapper =
                input.closest(
                    ".file-upload-wrapper"
                );

            if (wrapper) {
                wrapper.classList.add(
                    "file-error"
                );
            }

            valido = false;

        } else {

            if (!validarArchivo(input)) {
                valido = false;
            }

        }

    });


    /* HTML5 */

    if (!form.checkValidity()) {

        valido = false;

        form.reportValidity();

    }


    return valido;

}


/* =========================================================
   RECOPILAR DATOS
   ========================================================= */

function obtenerDatosFormulario() {

    const datos = {};


    const campos =
        form.querySelectorAll(
            "input, select"
        );


    campos.forEach(campo => {

        if (
            !campo.id ||
            campo.type === "file"
        ) {
            return;
        }


        datos[campo.id] =
            campo.value.trim();

    });


    /* Colonia */

    if (
        !containerColoniaSelect.classList.contains(
            "hidden"
        )
    ) {

        datos.colonia =
            coloniaSelect.value.trim();

    } else {

        datos.colonia =
            coloniaInput.value.trim();

    }


    /* Hijos */

    datos.hijos = [];


    const cantidad =
        parseInt(
            cantidadHijos.value,
            10
        ) || 0;


    for (
        let i = 1;
        i <= cantidad;
        i++
    ) {

        datos.hijos.push({

            numero: i,

            nombre:
                document.getElementById(
                    `nombreHijo${i}`
                )?.value.trim() || "",

            fechaNacimiento:
                document.getElementById(
                    `fechaNacHijo${i}`
                )?.value || ""

        });

    }


    return datos;

}


/* =========================================================
   SUBMIT
   ========================================================= */

form.addEventListener(
    "submit",
    async function (event) {

        event.preventDefault();


        if (!validarFormulario()) {

            mostrarStatus(
                "Revisa los campos marcados antes de continuar.",
                "error"
            );

            window.scrollTo({
                top: 0,
                behavior: "smooth"
            });

            return;

        }


        const datos =
            obtenerDatosFormulario();


        console.log(
            "Datos del candidato:",
            datos
        );


        /*
         * IMPORTANTE:
         *
         * GitHub Pages es estático.
         *
         * En este punto NO se envían todavía
         * los datos a una base de datos.
         *
         * Aquí posteriormente conectaremos:
         *
         * - Power Automate
         * - Google Apps Script
         * - Firebase
         * - Supabase
         * - API propia
         *
         * según la solución que quieras utilizar.
         */


        mostrarStatus(
            "Formulario validado correctamente. Listo para enviar.",
            "success"
        );


        /*
         * Para evitar que el usuario crea que
         * ya quedó guardado en una base de datos,
         * dejamos el botón en estado normal.
         */

        btnEnviar.disabled = false;


        console.log(
            "Registro preparado:",
            datos
        );

    }
);


/* =========================================================
   INICIALIZACIÓN
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    async function () {

        actualizarSeccionPareja();

        actualizarSeccionHijos();

        await cargarCatalogoCP();

    }
);