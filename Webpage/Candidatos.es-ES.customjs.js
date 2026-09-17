document.addEventListener('DOMContentLoaded', function() {

    // 1. AUTOFORMATO DE TEXTO (Mayúsculas y Tipo Título)
    document.addEventListener('input', function(e) {
      if (e.target.tagName === 'INPUT' && e.target.type === 'text') {
        const excludedIds = ['rfc', 'curp', 'nss', 'codigoPostal', 'numeroDomicilio'];
        if (excludedIds.includes(e.target.id)) {
            if(e.target.id === 'rfc' || e.target.id === 'curp') {
                const start = e.target.selectionStart;
                e.target.value = e.target.value.toUpperCase();
                e.target.setSelectionRange(start, start);
            }
            return;
        }
        const el = e.target;
        const start = el.selectionStart;
        const val = el.value;
        const newVal = val.toLowerCase().replace(/(?:^|[\s\-\'\´\`])\S/g, match => match.toUpperCase());
        if (val !== newVal) {
          el.value = newVal;
          el.setSelectionRange(start, start);
        }
      }
    });
  
    // 2. FILTRO DE NÚMEROS ESTRICTO
    const camposNumericos = ['codigoPostal', 'telefonoWhatsapp', 'nss', 'telefonoContactoEmergencia', 'telefonoContactoEmergencia2'];
    camposNumericos.forEach(id => {
      const campo = document.getElementById(id);
      if (campo) {
        campo.addEventListener('input', function() {
          this.value = this.value.replace(/[^0-9]/g, '');
        });
      }
    });
  
    // 3. BÚSQUEDA DE CÓDIGO POSTAL DESDE GITHUB
    const cpInput = document.getElementById('codigoPostal');
    const cpStatus = document.getElementById('cp-status');
    const ciudadInput = document.getElementById('ciudad');
    const coloniaSelect = document.getElementById('colonia-select');
    const containerSelect = document.getElementById('container-colonia-select');
    const containerInput = document.getElementById('container-colonia-input');
  
    const urlJSON = "https://raw.githubusercontent.com/dieguithoalvarez-arch/Registro-de-Nuevos-Ingresos-BIC/main/Codigos%20Postales/cp_mexico.json";
    let datosCPOffline = [];
  
    fetch(urlJSON)
        .then(r => r.json())
        .then(data => { datosCPOffline = data; })
        .catch(e => console.error("Error cargando CP:", e));
  
    if (cpInput) {
      cpInput.addEventListener('input', function() {
        let cpValue = this.value.trim();
        if (cpValue.length === 5) {
          buscarCPLocal(cpValue);
        } else {
            ciudadInput.value = '';
            coloniaSelect.innerHTML = '<option value="">Primero ingresa un C.P.</option>';
            if(cpStatus) cpStatus.innerText = '';
            containerSelect.classList.remove('hidden');
            containerInput.classList.add('hidden');
        }
      });
    }
  
    function buscarCPLocal(cp) {
        if(datosCPOffline.length === 0) {
            if(cpStatus) { cpStatus.style.color = '#d97706'; cpStatus.innerText = 'Cargando base de datos, intenta en un segundo...'; }
            return;
        }
        const resultados = datosCPOffline.filter(item => item.codigo === cp);
        if (resultados.length > 0) {
            ciudadInput.value = resultados[0].municipio || '';
            coloniaSelect.innerHTML = '<option value="">Selecciona tu colonia</option>';
            resultados.forEach(registro => {
                let opt = document.createElement('option');
                opt.value = registro.colonia;
                opt.innerText = registro.colonia;
                coloniaSelect.appendChild(opt);
            });
            containerSelect.classList.remove('hidden');
            containerInput.classList.add('hidden');
            if(cpStatus) { cpStatus.style.color = 'green'; cpStatus.innerText = '✅ C.P. Encontrado'; }
        } else {
            if(cpStatus) { cpStatus.style.color = '#d97706'; cpStatus.innerText = '⚠️ C.P. no encontrado. Ingresa manual.'; }
            ciudadInput.value = '';
            containerSelect.classList.add('hidden');
            containerInput.classList.remove('hidden');
        }
    }
  
    // 4. LÓGICA DINÁMICA: ESTADO CIVIL Y PAREJA
    const estadoCivil = document.getElementById('estadoCivil');
    const seccionPareja = document.getElementById('seccionPareja');
    if (estadoCivil) {
      estadoCivil.addEventListener('change', function() {
        let val = this.value;
        const inputPareja = document.getElementById('pareja');
        const inputFechaPareja = document.getElementById('fechaNacPareja');
        const inputFilePareja = document.getElementById('fileActaPareja');

        if (val === 'Casado(a)' || val === 'Unión Libre') {
          seccionPareja.classList.remove('hidden');
          if(inputPareja) inputPareja.required = true;
          if(inputFechaPareja) inputFechaPareja.required = true;
          if(inputFilePareja) inputFilePareja.required = true;
        } else {
          seccionPareja.classList.add('hidden');
          // Limpiamos los datos si se oculta la sección para no enviarlos por error
          if(inputPareja) { inputPareja.required = false; inputPareja.value = ''; }
          if(inputFechaPareja) { inputFechaPareja.required = false; inputFechaPareja.value = ''; }
          if(inputFilePareja) { inputFilePareja.required = false; inputFilePareja.value = ''; }
        }
      });
    }
  
    // 5. LÓGICA DINÁMICA: HIJOS
    const tieneHijos = document.getElementById('tieneHijos');
    const seccionCantidad = document.getElementById('seccionCantidadHijos');
    const cantidadHijos = document.getElementById('cantidadHijos');
    const contenedorHijos = document.getElementById('contenedorHijos');
  
    if (tieneHijos) {
      tieneHijos.addEventListener('change', function() {
        if (this.value === 'Si') {
          seccionCantidad.classList.remove('hidden');
        } else {
          seccionCantidad.classList.add('hidden');
          if(cantidadHijos) cantidadHijos.value = "0";
          if(contenedorHijos) contenedorHijos.innerHTML = '';
        }
      });
    }
  
    if (cantidadHijos) {
      cantidadHijos.addEventListener('change', function() {
        let cantidad = parseInt(this.value);
        if(contenedorHijos) contenedorHijos.innerHTML = '';
        if(cantidad > 0 && contenedorHijos) {
            for(let i = 1; i <= cantidad; i++) {
            contenedorHijos.innerHTML += `
                <div class="dynamic-section">
                <h4 class="dynamic-title">Hijo ${i}</h4>
                <div class="form-grid" style="margin-bottom: 15px;">
                    <div class="form-group-custom-mb0">
                        <label>Nombre Completo Hijo ${i} *</label>
                        <input type="text" id="hijo${i}" class="form-control-custom" required>
                    </div>
                    <div class="form-group-custom-mb0">
                        <label>Fecha Nacimiento Hijo ${i} *</label>
                        <input type="date" id="fechaNacHijo${i}" class="form-control-custom" required>
                    </div>
                </div>
                <div class="file-upload-wrapper mb0">
                    <label>🍼 Acta de Nacimiento (PDF/JPG) *</label>
                    <input type="file" id="fileActaHijo${i}" accept=".pdf,image/*" class="form-control-custom" required>
                </div>
                </div>`;
            }
        }
      });
    }
  
    // 6. FUNCIÓN AUXILIAR PARA OBTENER BASE64 DEL ARCHIVO
    const getBase64 = (fileInputId, fileNamePrefix) => {
      return new Promise((resolve) => {
        const input = document.getElementById(fileInputId);
        if (!input || !input.files || input.files.length === 0) { resolve(null); return; }
        
        const file = input.files[0];
        const extension = file.name.split('.').pop();
        const reader = new FileReader();
        
        reader.readAsDataURL(file);
        reader.onload = () => resolve({
            nombreArchivo: `${fileNamePrefix}.${extension}`,
            contenidoBase64: reader.result.split(',')[1] 
        });
        reader.onerror = () => resolve(null);
      });
    };
  
    // 7. ENVÍO MAESTRO A POWER AUTOMATE
    const form = document.getElementById('datosForm');
    if (form) {
      form.addEventListener('submit', async function(e) {
        e.preventDefault();
        const btn = document.getElementById('btnEnviar');
        const status = document.getElementById('status');
  
        // URL DE TU FLUJO DE POWER AUTOMATE
        const URL_POWER_AUTOMATE = "https://defaultc7901014556049efa6893c215c6092.ee.environment.api.powerplatform.com:443/powerautomate/automations/direct/cu/31/workflows/f2d4f180c12c4b2486349a51d7d4788d/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=0P9T29VKyN3-neFRYyBpxZHl9d2U82n_ImX38AwAfTM";
  
        btn.disabled = true;
        if(status) {
            status.style.color = '#0369a1';
            status.style.backgroundColor = '#e0f2fe';
            status.style.padding = '10px';
            status.style.borderRadius = '5px';
            status.innerText = '⏳ Procesando documentos y guardando expediente en SharePoint... (No cierres la página)';
        }
        
        try {
            let archivosArray = [];
            
            // Recolectar archivos obligatorios
            const docsFijos = [
                { id: 'fileActaNac', prefijo: 'Acta_Nacimiento' },
                { id: 'fileIne', prefijo: 'INE' },
                { id: 'fileCurp', prefijo: 'CURP' },
                { id: 'fileCsf', prefijo: 'CSF' },
                { id: 'fileNss', prefijo: 'NSS' },
                { id: 'fileDomicilio', prefijo: 'Comprobante_Domicilio' },
                { id: 'fileEstudios', prefijo: 'Comprobante_Estudios' }
            ];
            for (let doc of docsFijos) {
                let fileData = await getBase64(doc.id, doc.prefijo);
                if(fileData) archivosArray.push(fileData);
            }
  
            // Recolectar archivo de pareja (si existe)
            let filePareja = await getBase64('fileActaPareja', 'Acta_Pareja');
            if(filePareja) archivosArray.push(filePareja);
  
            // Recolectar archivos de hijos (si existen)
            let cantHijos = parseInt(document.getElementById('cantidadHijos')?.value || "0");
            for (let i = 1; i <= cantHijos; i++) {
                let fileHijo = await getBase64(`fileActaHijo${i}`, `Acta_Hijo_${i}`);
                if(fileHijo) archivosArray.push(fileHijo);
            }
  
            // Resolver origen de la colonia
            let coloniaFinal = "";
            const containerSelect = document.getElementById('container-colonia-select');
            if(containerSelect && !containerSelect.classList.contains('hidden')) {
                coloniaFinal = document.getElementById('colonia-select')?.value || "";
            } else {
                coloniaFinal = document.getElementById('colonia-input')?.value || "";
            }
  
            // PAYLOAD BLINDADO CON NULL PARA SHAREPOINT
            const payload = {
                "datos": {
                    "Nombre": document.getElementById('nombre')?.value || "",
                    "SegundoNombre": document.getElementById('segundoNombre')?.value || "",
                    "ApellidoPaterno": document.getElementById('apellidoPaterno')?.value || "",
                    "ApellidoMaterno": document.getElementById('apellidoMaterno')?.value || "",
                    "EstadoCivil": document.getElementById('estadoCivil')?.value || "",
                    "Curp": document.getElementById('curp')?.value || "",
                    "Rfc": document.getElementById('rfc')?.value || "",
                    "Nss": document.getElementById('nss')?.value || "",
                    "CodigoPostal": document.getElementById('codigoPostal')?.value || "",
                    "Municipio": document.getElementById('ciudad')?.value || "",
                    "Colonia": coloniaFinal,
                    "Calle": document.getElementById('calle')?.value || "",
                    "Numero": document.getElementById('numeroDomicilio')?.value || "",
                    "WhatsApp": document.getElementById('telefonoWhatsapp')?.value || "",
                    "Correo": document.getElementById('correo')?.value || "",
                    "ContactoEmerg1": document.getElementById('nombreContactoEmergencia')?.value || "",
                    "TelEmerg1": document.getElementById('telefonoContactoEmergencia')?.value || "",
                    "ContactoEmerg2": document.getElementById('nombreContactoEmergencia2')?.value || "",
                    "TelEmerg2": document.getElementById('telefonoContactoEmergencia2')?.value || "",
                    "TallaPlayera": document.getElementById('tallaPlayera')?.value || "",
                    "TallaCalzado": document.getElementById('tallaCalzado')?.value || null,
                    "TieneHijos": document.getElementById('tieneHijos')?.value || "",
                    "CantidadHijos": document.getElementById('cantidadHijos')?.value || null,
                    "Pareja": document.getElementById('pareja')?.value || "",
                    "NacPareja": document.getElementById('fechaNacPareja')?.value || null,
                    "Hijo1": document.getElementById('hijo1')?.value || "",
                    "NacHijo1": document.getElementById('fechaNacHijo1')?.value || null,
                    "Hijo2": document.getElementById('hijo2')?.value || "",
                    "NacHijo2": document.getElementById('fechaNacHijo2')?.value || null,
                    "Hijo3": document.getElementById('hijo3')?.value || "",
                    "NacHijo3": document.getElementById('fechaNacHijo3')?.value || null,
                    "Hijo4": document.getElementById('hijo4')?.value || "",
                    "NacHijo4": document.getElementById('fechaNacHijo4')?.value || null,
                    "Hijo5": document.getElementById('hijo5')?.value || "",
                    "NacHijo5": document.getElementById('fechaNacHijo5')?.value || null,
                    "Hijo6": document.getElementById('hijo6')?.value || "",
                    "NacHijo6": document.getElementById('fechaNacHijo6')?.value || null,
                    "Hijo7": document.getElementById('hijo7')?.value || "",
                    "NacHijo7": document.getElementById('fechaNacHijo7')?.value || null,
                    "Hijo8": document.getElementById('hijo8')?.value || "",
                    "NacHijo8": document.getElementById('fechaNacHijo8')?.value || null,
                    "Hijo9": document.getElementById('hijo9')?.value || "",
                    "NacHijo9": document.getElementById('fechaNacHijo9')?.value || null,
                    "Hijo10": document.getElementById('hijo10')?.value || "",
                    "NacHijo10": document.getElementById('fechaNacHijo10')?.value || null
                },
                "archivos": archivosArray
            };
  
            // POST HACIA POWER AUTOMATE
            const response = await fetch(URL_POWER_AUTOMATE, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
  
            if(response.ok) {
                if(status) {
                    status.style.color = '#15803d';
                    status.style.backgroundColor = '#dcfce3';
                    status.innerText = '✅ ¡Expediente y documentos guardados exitosamente en SharePoint!';
                }
                form.reset();
                if(seccionPareja) seccionPareja.classList.add('hidden');
                const seccionCantidadHijos = document.getElementById('seccionCantidadHijos');
                if(seccionCantidadHijos) seccionCantidadHijos.classList.add('hidden');
                if(contenedorHijos) contenedorHijos.innerHTML = '';
            } else {
                const errText = await response.text();
                throw new Error(errText);
            }
  
        } catch (error) {
            console.error("Error Power Automate:", error);
            if(status) {
                status.style.color = '#b91c1c';
                status.style.backgroundColor = '#fee2e2';
                status.innerText = '❌ Hubo un problema al enviar la información. Intenta nuevamente.';
            }
            alert("Error técnico de Power Automate:\n" + error.message);
        } finally {
            btn.disabled = false;
        }
      });
    }
});