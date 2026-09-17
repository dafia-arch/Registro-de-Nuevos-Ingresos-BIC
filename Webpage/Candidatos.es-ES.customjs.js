document.addEventListener('DOMContentLoaded', function() {
  const urlPowerAutomate = "/api/candidato";

  // 1. Autoformato de mayúsculas / minúsculas en tiempo real
  document.addEventListener('input', function(e) {
    if (e.target.tagName === 'INPUT' && e.target.type === 'text') {
      const uppercaseIds = ['rfc', 'curp'];
      const excludedIds = ['codigoPostal', 'numeroDomicilio', 'correo', 'nss', 'colonia-input', 'calle'];
      const el = e.target;
      const start = el.selectionStart;
      const end = el.selectionEnd;
      const val = el.value;

      if (uppercaseIds.includes(el.id)) {
          el.value = val.toUpperCase();
          el.setSelectionRange(start, end);
          return;
      }
      if (excludedIds.includes(el.id)) return;

      const newVal = val.toLowerCase().replace(/(?:^|[\s\-\'\´\`])\S/g, function(match) { return match.toUpperCase(); });
      if (val !== newVal) { el.value = newVal; el.setSelectionRange(start, end); }
    }
  });

  // 2. Filtro estricto de solo números
  const camposNumericos = ['nss', 'codigoPostal', 'telefonoWhatsapp', 'telefonoContactoEmergencia', 'telefonoContactoEmergencia2'];
  camposNumericos.forEach(id => {
    const campo = document.getElementById(id);
    if (campo) { 
      campo.addEventListener('input', function() { 
        this.value = this.value.replace(/[^0-9]/g, ''); 
      }); 
    }
  });

  // 3. Consulta de código postal y colonias
  const codigoPostal = document.getElementById('codigoPostal');
  const ciudad = document.getElementById('ciudad');
  const colonia = document.getElementById('colonia-input');
  const cpStatus = document.getElementById('cp-status');
  let catalogoCP = [];

  const mostrarEstadoCP = (mensaje, esError = false) => {
    if (!cpStatus) return;
    cpStatus.textContent = mensaje;
    cpStatus.style.color = esError ? '#b42318' : '#005b61';
  };

  if (codigoPostal && ciudad && colonia) {
    const catalogoListo = fetch('Codigos%20Postales/cp_mexico.json')
      .then(response => {
        if (!response.ok) throw new Error('No se pudo cargar el catálogo postal');
        return response.json();
      })
      .then(data => {
        catalogoCP = Array.isArray(data) ? data : [];
        return catalogoCP;
      })
      .catch(() => {
        mostrarEstadoCP('El catálogo postal no está disponible.', true);
        return [];
      });

    const actualizarDomicilio = () => {
      const codigo = codigoPostal.value.trim();
      ciudad.value = '';
      colonia.innerHTML = '<option value="">Ingresa un código postal</option>';
      colonia.disabled = true;

      if (codigo.length < 5) {
        mostrarEstadoCP('Escribe los 5 dígitos del código postal.');
        return;
      }

      if (!catalogoCP.length) {
        mostrarEstadoCP('Cargando catálogo postal...');
        return;
      }

      const resultados = catalogoCP.filter(item => String(item.codigo).trim().padStart(5, '0') === codigo);
      if (!resultados.length) {
        mostrarEstadoCP('Código postal no encontrado. Verifica los datos.', true);
        return;
      }

      ciudad.value = resultados[0].municipio || '';
      colonia.innerHTML = '<option value="">Selecciona una colonia</option>';
      const colonias = resultados.flatMap(item => item.colonias || [item.colonia]).filter(Boolean);
      [...new Set(colonias)].forEach(nombreColonia => {
        const option = document.createElement('option');
        option.value = nombreColonia;
        option.textContent = nombreColonia;
        colonia.appendChild(option);
      });
      colonia.disabled = false;
      mostrarEstadoCP(`${resultados.length} colonia(s) disponible(s).`);
    };

    codigoPostal.addEventListener('input', actualizarDomicilio);
    catalogoListo.then(actualizarDomicilio);
  }

  // 4. Desplegable Dinámico: Estado Civil (Muestra Pareja si es Casado o Unión Libre)
  const estadoCivil = document.getElementById('estadoCivil');
  const seccionPareja = document.getElementById('seccionPareja');
  const inputPareja = document.getElementById('pareja');
  const inputFechaPareja = document.getElementById('fechaNacPareja');
  const inputActaPareja = document.getElementById('fileActaPareja');

  if (estadoCivil && seccionPareja) {
    estadoCivil.addEventListener('change', function() {
      let val = this.value;
      if (val === 'Casado(a)' || val === 'Unión Libre') {
        seccionPareja.classList.remove('hidden');
        inputPareja.setAttribute('required', 'true');
        inputFechaPareja.setAttribute('required', 'true');
        inputActaPareja.setAttribute('required', 'true');
      } else {
        seccionPareja.classList.add('hidden');
        inputPareja.removeAttribute('required');
        inputFechaPareja.removeAttribute('required');
        inputActaPareja.removeAttribute('required');
        inputPareja.value = '';
        inputFechaPareja.value = '';
        inputActaPareja.value = '';
      }
    });
  }

  // 5. Desplegable Dinámico: Hijos (Muestra cantidad y genera formularios hijos)
  const tieneHijos = document.getElementById('tieneHijos');
  const seccionCantidad = document.getElementById('seccionCantidadHijos');
  const cantidadHijos = document.getElementById('cantidadHijos');
  const contenedorHijos = document.getElementById('contenedorHijos');

  if (tieneHijos && seccionCantidad) {
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
      if (cantidad > 0) {
          for(let i = 1; i <= cantidad; i++) {
            contenedorHijos.innerHTML += `
              <div class="dynamic-section">
                <h4 class="dynamic-title">Hijo ${i}</h4>
                <div class="form-grid" style="margin-bottom: 15px;">
                  <div class="form-group-custom-mb0">
                    <label>Nombre Hijo ${i} *</label>
                    <input type="text" id="hijo${i}" required class="form-control-custom">
                  </div>
                  <div class="form-group-custom-mb0">
                    <label>Fecha Nac. Hijo ${i} *</label>
                    <input type="date" id="fechaNacHijo${i}" required class="form-control-custom">
                  </div>
                </div>
                <div class="file-upload-wrapper mb0">
                  <label>🍼 Acta de Nacimiento - Hijo ${i} *</label>
                  <input type="file" id="fileActaHijo${i}" accept=".pdf,image/*" required class="form-control-custom">
                </div>
              </div>
            `;
          }
      }
    });
  }

  const getBase64 = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = error => reject(error);
  });

  // 6. Envío de Datos y Documentos
  const form = document.getElementById('datosForm');
  if (form) {
    form.addEventListener('submit', async function(e) {
      e.preventDefault();
      const btn = document.getElementById('btnEnviar');
      const status = document.getElementById('status');

      btn.disabled = true;
      status.style.color = '#0369a1';
      status.innerText = '⏳ Subiendo documentos a SharePoint... (No cierres la página)';

      let archivosArray = [];
      const procesarInput = async (inputId, prefijoNombre) => {
          const input = document.getElementById(inputId);
          if(input && input.files && input.files.length > 0) {
              const file = input.files[0];
            const maxFileSize = 5 * 1024 * 1024;
            if (file.size > maxFileSize) {
              throw new Error(`El archivo "${file.name}" supera el límite de 5 MB.`);
            }
              const extension = file.name.split('.').pop();
              const base64 = await getBase64(file);
              archivosArray.push({ "nombreArchivo": `${prefijoNombre}.${extension}`, "contenidoBase64": base64 });
          }
      };

      try {
          await procesarInput('fileActaNac', 'Acta_Nacimiento');
          await procesarInput('fileNss', 'NSS');
          await procesarInput('fileCsf', 'CSF');
          await procesarInput('fileCurp', 'CURP');
          await procesarInput('fileDomicilio', 'Comprobante_Domicilio');
          await procesarInput('fileEstudios', 'Estudios');
          await procesarInput('fileIne', 'INE');
          await procesarInput('fileActaPareja', 'Acta_Pareja');
          
          let cantHijos = parseInt(cantidadHijos.value) || 0;
          for (let i = 1; i <= cantHijos; i++) {
              await procesarInput(`fileActaHijo${i}`, `Acta_Hijo_${i}`);
          }

          const rfcCandidato = document.getElementById('rfc').value.toUpperCase();
          const nombreCompleto = `${document.getElementById('nombre').value} ${document.getElementById('apellidoPaterno').value}`.trim();

            const obtenerValor = id => document.getElementById(id)?.value?.trim() || '';
            const obtenerFecha = id => {
              const valor = obtenerValor(id);
              return valor ? `${valor}T00:00:00Z` : null;
            };
            const hijos = Array.from({ length: cantHijos }, (_, index) => ({
              "nombre": obtenerValor(`hijo${index + 1}`),
              "fechaNacimiento": obtenerFecha(`fechaNacHijo${index + 1}`),
              "archivo": `Acta_Hijo_${index + 1}`
            }));
              const datos = {
                "Nombre": obtenerValor('nombre'),
                "SegundoNombre": obtenerValor('segundoNombre'),
                "ApellidoPaterno": obtenerValor('apellidoPaterno'),
                "ApellidoMaterno": obtenerValor('apellidoMaterno'),
                "FechaNacimiento": obtenerFecha('fechaNacimiento'),
                "EstadoCivil": obtenerValor('estadoCivil'),
                "Curp": obtenerValor('curp'),
                "Rfc": rfcCandidato,
                "Nss": obtenerValor('nss'),
                "CodigoPostal": obtenerValor('codigoPostal'),
                "Municipio": obtenerValor('ciudad'),
                "Colonia": obtenerValor('colonia-input'),
                "Calle": obtenerValor('calle'),
                "Numero": obtenerValor('numeroDomicilio'),
                "WhatsApp": obtenerValor('telefonoWhatsapp'),
                "Correo": obtenerValor('correo'),
                "ContactoEmerg1": obtenerValor('nombreContactoEmergencia'),
                "TelEmerg1": obtenerValor('telefonoContactoEmergencia'),
                "ContactoEmerg2": obtenerValor('nombreContactoEmergencia2'),
                "TelEmerg2": obtenerValor('telefonoContactoEmergencia2'),
                "TallaPlayera": obtenerValor('tallaPlayera'),
                "TallaCalzado": obtenerValor('tallaCalzado'),
                "TieneHijos": obtenerValor('tieneHijos'),
                "CantidadHijos": obtenerValor('cantidadHijos'),
                "Pareja": obtenerValor('pareja'),
                "NacPareja": obtenerFecha('fechaNacPareja'),
                ...Object.fromEntries(Array.from({ length: 10 }, (_, index) => {
                  const childNumber = index + 1;
                  return [
                    [`Hijo${childNumber}`, obtenerValor(`hijo${childNumber}`)],
                    [`NacHijo${childNumber}`, obtenerFecha(`fechaNacHijo${childNumber}`)]
                  ];
                }).flat())
              };

              const payload = {
                "datos": datos,
              "archivos": archivosArray
            };

          const paResponse = await fetch(urlPowerAutomate, {
              method: "POST", headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload)
          });

          if (!paResponse.ok) {
            const detalle = await paResponse.text();
            throw new Error(`Power Automate rechazó el registro (${paResponse.status}). ${detalle.slice(0, 180)}`);
          }

          status.style.color = 'green'; 
          status.innerText = '¡Candidato y documentos guardados exitosamente! ✅';
          form.reset();
          seccionPareja.classList.add('hidden');
          seccionCantidad.classList.add('hidden');
          contenedorHijos.innerHTML = '';
          
          setTimeout(() => { status.innerText = ''; }, 7000);

      } catch (err) {
          console.error(err); 
          status.style.color = '#b42318';
          status.innerText = err.message.includes('supera el límite') || err.message.includes('Power Automate')
            ? err.message
            : 'Ocurrió un error al enviar. Revisa tu conexión o los archivos.';
      } finally {
          btn.disabled = false;
      }
    });
  }
});