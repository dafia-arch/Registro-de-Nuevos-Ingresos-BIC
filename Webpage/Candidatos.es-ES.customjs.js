document.addEventListener('DOMContentLoaded', function() {

    // 1. AUTOFORMATO DE TEXTO (Mayúsculas Iniciales)
    document.addEventListener('input', function(e) {
      if (e.target.tagName === 'INPUT' && e.target.type === 'text') {
        const excludedIds = ['rfc', 'curp', 'nss', 'codigoPostal'];
        if (excludedIds.includes(e.target.id)) {
            if(e.target.id === 'rfc' || e.target.id === 'curp') e.target.value = e.target.value.toUpperCase();
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
  
    // 2. FILTRO DE NÚMEROS
    const camposNumericos = ['codigoPostal', 'telefonoWhatsapp', 'nss'];
    camposNumericos.forEach(id => {
      const campo = document.getElementById(id);
      if (campo) {
        campo.addEventListener('input', function() {
          this.value = this.value.replace(/[^0-9]/g, '');
        });
      }
    });
  
    // 3. BÚSQUEDA DE CÓDIGO POSTAL (Usando tu JSON en GitHub)
    const cpInput = document.getElementById('codigoPostal');
    const cpStatus = document.getElementById('cp-status');
    const ciudadInput = document.getElementById('ciudad');
    const coloniaSelect = document.getElementById('colonia-select');
    const containerSelect = document.getElementById('container-colonia-select');
    const containerInput = document.getElementById('container-colonia-input');
  
    // URL DE TU ARCHIVO JSON EN GITHUB
    const urlJSON = "https://raw.githubusercontent.com/dieguithoalvarez-arch/Registro-de-Nuevos-Ingresos-BIC/main/cp_mexico.json";
    let datosCPOffline = [];
  
    // Cargar el JSON al inicio para que esté listo
    fetch(urlJSON).then(r => r.json()).then(data => { datosCPOffline = data; }).catch(e => console.error("Error cargando CP", e));
  
    if (cpInput) {
      cpInput.addEventListener('input', function() {
        let cpValue = this.value.trim();
        if (cpValue.length === 5) {
          buscarCPLocal(cpValue);
        } else {
          ciudadInput.value = '';
          coloniaSelect.innerHTML = '<option value="">Primero ingresa un C.P.</option>';
          cpStatus.innerText = '';
          containerSelect.classList.remove('hidden');
          containerInput.classList.add('hidden');
        }
      });
    }
  
    function buscarCPLocal(cp) {
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
            cpStatus.style.color = 'green';
            cpStatus.innerText = '✅ C.P. Encontrado';
        } else {
            cpStatus.style.color = '#d97706';
            cpStatus.innerText = '⚠️ Ingresa manual';
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
        if (val === 'Casado' || val === 'Unión Libre') {
          seccionPareja.classList.remove('hidden');
          document.getElementById('pareja').required = true;
          document.getElementById('fechaNacPareja').required = true;
          document.getElementById('fileActaPareja').required = true;
        } else {
          seccionPareja.classList.add('hidden');
          document.getElementById('pareja').required = false;
          document.getElementById('fechaNacPareja').required = false;
          document.getElementById('fileActaPareja').required = false;
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
          cantidadHijos.value = "0";
          contenedorHijos.innerHTML = '';
        }
      });
    }
  
    if (cantidadHijos) {
      cantidadHijos.addEventListener('change', function() {
        let cantidad = parseInt(this.value);
        contenedorHijos.innerHTML = '';
        for(let i = 1; i <= cantidad; i++) {
          contenedorHijos.innerHTML += `
            <div class="dynamic-box">
              <h4>Datos del Hijo ${i}</h4>
              <div class="grid-2">
                <div class="form-group"><label>Nombre Completo *</label><input type="text" id="hijo${i}" required></div>
                <div class="form-group"><label>Fecha Nacimiento *</label><input type="date" id="fechaNacHijo${i}" required></div>
              </div>
              <div class="form-group"><label>📄 Acta de Nacimiento (PDF/JPG) *</label><input type="file" id="fileActaHijo${i}" accept=".pdf,image/*" required></div>
            </div>`;
        }
      });
    }
  
    // 6. FUNCIÓN AUXILIAR PARA BASE64
    const getBase64 = (fileInputId, fileNamePrefix) => {
      return new Promise((resolve) => {
        const input = document.getElementById(fileInputId);
        if (!input || !input.files || input.files.length === 0) { resolve(null); return; }
        
        const file = input.files[0];
        const extension = file.name.split('.').pop();
        const reader = new FileReader();
        
        reader.readAsDataURL(file);
        reader.onload = () => resolve({
            nombre: `${fileNamePrefix}.${extension}`,
            contenido: reader.result.split(',')[1] 
        });
        reader.onerror = () => resolve(null);
      });
    };
  
    // 7. ENVÍO DE DATOS A POWER AUTOMATE
    const form = document.getElementById('datosForm');
    if (form) {
      form.addEventListener('submit', async function(e) {
        e.preventDefault();
        const btn = document.getElementById('btnEnviar');
        const status = document.getElementById('status');
  
        // 🔴 AQUÍ ESTÁ TU URL OFICIAL CON LA FIRMA DE SEGURIDAD (SIG)
        const URL_POWER_AUTOMATE = "https://defaultc7901014556049efa6893c215c6092.ee.environment.api.powerplatform.com:443/powerautomate/automations/direct/cu/31/workflows/f2d4f180c12c4b2486349a51d7d4788d/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=0P9T29VKyN3-neFRYyBpxZHl9d2U82n_ImX38AwAfTM";
  
        btn.disabled = true;
        status.style.color = '#0369a1';
        status.innerText = '⏳ Empacando expediente y enviando a Recursos Humanos...';
        
        let coloniaFinal = !document.getElementById('container-colonia-select').classList.contains('hidden') 
                            ? document.getElementById('colonia-select').value 
                            : document.getElementById('colonia-input').value;
  
        try {
            // Empacar Documentos Fijos
            let archivosArray = [];
            
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
  
            // Empacar Documentos Dinámicos (Pareja)
            let filePareja = await getBase64('fileActaPareja', 'Acta_Pareja');
            if(filePareja) archivosArray.push(filePareja);
  
            // Empacar Documentos Dinámicos (Hijos)
            let cantHijos = parseInt(document.getElementById('cantidadHijos')?.value || "0");
            let detallesHijos = "";
            for (let i = 1; i <= cantHijos; i++) {
                let fileHijo = await getBase64(`fileActaHijo${i}`, `Acta_Hijo_${i}`);
                if(fileHijo) archivosArray.push(fileHijo);
                detallesHijos += `Hijo ${i}: ${document.getElementById(`hijo${i}`).value} (${document.getElementById(`fechaNacHijo${i}`).value}) | `;
            }
  
            // Armar Payload (JSON) para Power Automate
            const payload = {
              "datos": {
                  "Nombre": document.getElementById('nombre').value,
                  "ApellidoPaterno": document.getElementById('apellidoPaterno').value,
                  "ApellidoMaterno": document.getElementById('apellidoMaterno').value,
                  "RFC": document.getElementById('rfc').value,
                  "CURP": document.getElementById('curp').value,
                  "NSS": document.getElementById('nss').value,
                  "FechaNacimiento": document.getElementById('fechaNacimiento').value,
                  "EstadoCivil": document.getElementById('estadoCivil').value,
                  "Telefono": document.getElementById('telefonoWhatsapp').value,
                  "CodigoPostal": document.getElementById('codigoPostal').value,
                  "Municipio": document.getElementById('ciudad').value,
                  "Colonia": coloniaFinal,
                  "CalleNumero": document.getElementById('calleNumero').value,
                  "NombrePareja": document.getElementById('pareja')?.value || "",
                  "DetallesHijos": detallesHijos
              },
              "archivos": archivosArray
            };
  
            // Envío HTTP POST
            const response = await fetch(URL_POWER_AUTOMATE, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
  
            if(response.ok) {
                status.style.color = 'green';
                status.innerText = '✅ ¡Expediente enviado exitosamente a Recursos Humanos!';
                form.reset();
                document.getElementById('seccionPareja').classList.add('hidden');
                document.getElementById('seccionCantidadHijos').classList.add('hidden');
                document.getElementById('contenedorHijos').innerHTML = '';
            } else {
                const errText = await response.text();
                throw new Error(errText);
            }
  
        } catch (error) {
            console.error("Error Power Automate:", error);
            status.style.color = 'red';
            status.innerText = '❌ Hubo un problema al enviar. Intenta nuevamente.';
            alert("Detalle del error técnico:\n" + error.message);
        } finally {
            btn.disabled = false;
        }
      });
    }
});