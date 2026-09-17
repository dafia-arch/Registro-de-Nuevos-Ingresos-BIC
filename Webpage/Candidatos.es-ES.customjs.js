document.addEventListener('DOMContentLoaded', function() {
  const urlPowerAutomate = "https://defaultc7901014556049efa6893c215c6092.ee.environment.api.powerplatform.com:443/powerautomate/automations/direct/cu/03/workflows/445c8d2ec59e4c12b2ef5c68dcc78b6d/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=RPhkm2oBXM0qHwTctGwZRfv72LRWCOAiVIvR0tRQa7w";

  // Autoformato
  document.addEventListener('input', function(e) {
    if (e.target.tagName === 'INPUT' && e.target.type === 'text') {
      const uppercaseIds = ['rfc', 'curp'];
      const excludedIds = ['codigoPostal', 'numeroDomicilio', 'correo', 'nss'];
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

  // Filtro numérico
  const camposNumericos = ['nss', 'codigoPostal', 'telefonoWhatsapp', 'telefonoContactoEmergencia', 'telefonoContactoEmergencia2'];
  camposNumericos.forEach(id => {
    const campo = document.getElementById(id);
    if (campo) { campo.addEventListener('input', function() { this.value = this.value.replace(/[^0-9]/g, ''); }); }
  });

  // Búsqueda Código Postal (Nota: Como en GitHub no tenemos el endpoint directo de Power Pages `/_api`, si usabas el API interna de Dataverse directo desde GitHub ocupará autenticación OAuth o pasar por Power Automate. Te dejo configurado el disparador estándar por si lo conectas a Power Automate o manejas tu API).
  const cpInput = document.getElementById('codigoPostal');
  const cpStatus = document.getElementById('cp-status');
  const ciudadInput = document.getElementById('ciudad');
  const coloniaSelect = document.getElementById('colonia-select');
  const containerSelect = document.getElementById('container-colonia-select');
  const containerInput = document.getElementById('container-colonia-input');

  if (cpInput) {
    cpInput.addEventListener('input', function() {
      let cpValue = this.value.trim();
      if (cpValue.length === 5) {
        // Simulación o respaldo si estás en GitHub puro
        ciudadInput.value = "Ramos Arizpe / Saltillo";
        containerSelect.classList.add('hidden');
        containerInput.classList.remove('hidden');
        cpStatus.style.color = 'green';
        cpStatus.innerText = 'Ingresa tu colonia manual';
      } else {
        ciudadInput.value = '';
        coloniaSelect.innerHTML = '<option value="">Primero ingresa un C.P.</option>';
        cpStatus.innerText = '';
        containerSelect.classList.remove('hidden');
        containerInput.classList.add('hidden');
      }
    });
  }

  // Desplegable Estado Civil (Casado / Unión Libre)
  const estadoCivil = document.getElementById('estadoCivil');
  const seccionPareja = document.getElementById('seccionPareja');
  if (estadoCivil) {
    estadoCivil.addEventListener('change', function() {
      let val = this.value;
      if (val === 'Casado' || val === 'Casado(a)' || val === 'Unión Libre') {
        seccionPareja.classList.remove('hidden');
      } else {
        seccionPareja.classList.add('hidden');
        document.getElementById('pareja').value = '';
        document.getElementById('fechaNacPareja').value = '';
        document.getElementById('fileActaPareja').value = '';
      }
    });
  }

  // Desplegable Hijos
  const tieneHijos = document.getElementById('tieneHijos');
  const seccionCantidad = document.getElementById('seccionCantidadHijos');
  const cantidadHijos = document.getElementById('cantidadHijos');
  const contenedorHijos = document.getElementById('contenedorHijos');

  if (tieneHijos && seccionCantidad) {
    tieneHijos.addEventListener('change', function() {
      if (this.value === 'Si' || this.value === 'Sí') {
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

  // Envío Formulario a Power Automate
  const form = document.getElementById('datosForm');
  if (form) {
    form.addEventListener('submit', async function(e) {
      e.preventDefault();
      const btn = document.getElementById('btnEnviar');
      const status = document.getElementById('status');

      btn.disabled = true;
      let coloniaFinal = document.getElementById('colonia-input').value;

      if (coloniaFinal.trim() === "") {
          status.style.color = 'red';
          status.innerText = '⚠️ Escribe tu colonia.';
          btn.disabled = false; return; 
      }

      status.style.color = '#0369a1';
      status.innerText = '⏳ Subiendo documentos a SharePoint... (No cierres la página)';

      let archivosArray = [];
      const procesarInput = async (inputId, prefijoNombre) => {
          const input = document.getElementById(inputId);
          if(input && input.files && input.files.length > 0) {
              const file = input.files[0];
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
          
          let cantHijos = parseInt(document.getElementById('cantidadHijos').value) || 0;
          for (let i = 1; i <= cantHijos; i++) {
              await procesarInput(`fileActaHijo${i}`, `Acta_Hijo_${i}`);
          }

          const rfcCandidato = document.getElementById('rfc').value.toUpperCase();
          const nombreCompleto = `${document.getElementById('nombre').value} ${document.getElementById('apellidoPaterno').value}`.trim();

          const payload = {
              "rfc": rfcCandidato,
              "nombreCompleto": nombreCompleto,
              "nss": document.getElementById('nss').value,
              "curp": document.getElementById('curp').value,
              "correo": document.getElementById('correo').value,
              "telefono": document.getElementById('telefonoWhatsapp').value,
              "archivostotales": archivosArray
          };

          const paResponse = await fetch(urlPowerAutomate, {
              method: "POST", headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload)
          });

          if (!paResponse.ok) throw new Error('Fallo al enviar a Power Automate');

          status.style.color = 'green'; 
          status.innerText = '¡Candidato y documentos enviados exitosamente! ✅';
          document.getElementById('datosForm').reset();
          setTimeout(() => { status.innerText = ''; }, 7000);

      } catch (err) {
          console.error(err); 
          status.style.color = 'red'; 
          status.innerText = '⚠️ Ocurrió un error al enviar. Revisa tu conexión.';
      } finally {
          btn.disabled = false;
      }
    });
  }
});