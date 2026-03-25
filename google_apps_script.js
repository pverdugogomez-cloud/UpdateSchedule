// --- VERSIÓN DEFINITIVA MULTI-PROYECTO + ACTIVIDADES POR ÁREA ---
const SHEETS = { REGISTROS: 'Registros', MAESTRO: 'Maestro', USUARIOS: 'Usuarios', PROYECTOS: 'Proyectos' };
const REGISTROS_HEADERS = ['timestamp', 'fecha', 'Poza', 'Actividad', 'Porcentaje_Avance', 'Equipos', 'userName', 'userCargo', 'Observaciones'];

function doGet(e) {
  const type = e.parameter.type || 'registros';
  const projId = e.parameter.proyecto_id;
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let name = SHEETS.REGISTROS;

  if (type === 'maestro') name = SHEETS.MAESTRO;
  else if (type === 'usuarios') name = SHEETS.USUARIOS;
  else if (type === 'proyectos') name = SHEETS.PROYECTOS;

  let s = ss.getSheetByName(name) || ss.insertSheet(name);
  const data = s.getDataRange().getValues();
  if (data.length <= 1) return jsonResponse([]);

  const headers = data[0];
  let rows = data.slice(1);

  // Filtrado por proyecto si aplica
  if (projId) {
    const pIdStr = projId.toString().trim();
    if (name === SHEETS.REGISTROS) {
      const pCol = headers.findIndex(h => h.toString().toLowerCase().trim().includes('proyecto_id'));
      if (pCol !== -1) rows = rows.filter(r => {
        const val = r[pCol]?.toString().trim() || "";
        return val === pIdStr || val === "GLOBAL" || val === "";
      });
    } else if (name === SHEETS.MAESTRO) {
      const pCol = headers.findIndex(h => h.toString().toLowerCase().trim() === 'proyecto_id');
      if (pCol !== -1) rows = rows.filter(r => {
        const val = r[pCol]?.toString().trim() || "";
        return val === pIdStr || val === "GLOBAL" || val === "";
      });
    }
  }

  return jsonResponse(rows.map(row => {
    let obj = {};
    headers.forEach((h, i) => {
      let v = row[i];
      let t = h.toString().toLowerCase().trim();
      if ((t === 'equipos' || t === 'permisos' || t === 'permiso' || t === 'proyectos') && typeof v === 'string' && (v.startsWith('{') || v.startsWith('['))) {
        try { v = JSON.parse(v); } catch (e) {}
      }
      obj[h.toString().trim()] = v;
    });
    return obj;
  }));
}

function doPost(e) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let p;
  try {
    if (e.parameter && e.parameter.data) {
      p = JSON.parse(e.parameter.data);
    } else if (e.postData && e.postData.contents) {
      let raw = e.postData.contents;
      if (raw.indexOf('data=') === 0) p = JSON.parse(decodeURIComponent(raw.substring(5)));
      else p = JSON.parse(raw);
    }
  } catch (err) { p = JSON.parse(e.parameter.data); }

  if (!p || !p.action) return jsonResponse({ status: 'error', message: 'No action' });

  // --- GESTIÓN DE PROYECTOS ---
  if (p.action === 'insert_proyecto' || p.action === 'update_proyecto') {
    let s = ss.getSheetByName(SHEETS.PROYECTOS) || ss.insertSheet(SHEETS.PROYECTOS);
    const data = s.getDataRange().getValues();
    if (s.getLastRow() === 0) s.appendRow(['id', 'nombre', 'descripcion']);

    const row = [p.id || new Date().getTime(), p.nombre, p.descripcion || ""];
    const pIdReq = p.id.toString().trim();

    if (p.action === 'update_proyecto') {
      for (let i = 1; i < data.length; i++) {
        if (data[i][0].toString().trim() === pIdReq) {
          s.getRange(i + 1, 1, 1, row.length).setValues([row]);
          return jsonResponse({ status: 'updated' });
        }
      }
      return jsonResponse({ status: 'error', message: 'Project not found for update' });
    }
    s.appendRow(row);
    return jsonResponse({ status: 'ok' });
  }

  if (p.action === 'delete_proyecto') {
    let s = ss.getSheetByName(SHEETS.PROYECTOS);
    if (!s) return jsonResponse({ status: 'error' });
    const d = s.getDataRange().getValues();
    const pIdReq = p.id.toString().trim();
    for (let i = 1; i < d.length; i++) {
      if (d[i][0].toString().trim() === pIdReq) {
        s.deleteRow(i + 1);
        return jsonResponse({ status: 'deleted' });
      }
    }
    return jsonResponse({ status: 'not_found' });
  }

  if (p.action === 'insert_usuario') {
    let s = ss.getSheetByName(SHEETS.USUARIOS) || ss.insertSheet(SHEETS.USUARIOS);
    const data = s.getDataRange().getValues();
    const head = data[0];
    const uCol = head.findIndex(h => {
      const hh = h.toString().toLowerCase().trim();
      return hh === 'user' || hh === 'usuario';
    });
    const newR = head.map(h => {
      let f = h.toString().toLowerCase().trim();
      if (f === 'user' || f === 'usuario') return p.user;
      if (f === 'pass' || f === 'contrasena') return p.pass;
      if (f === 'permisos' || f === 'rol') return typeof p.permisos === 'object' ? JSON.stringify(p.permisos) : p.permisos;
      if (f === 'name' || f === 'nombre') return p.name;
      if (f === 'cargo') return p.cargo;
      if (f === 'proyectos') return JSON.stringify(p.proyectos || []);
      if (f === 'telefono') return p.telefono;
      if (f === 'mail') return p.mail;
      return "";
    });
    if (uCol !== -1) {
      for (let i = 1; i < data.length; i++) {
        if (data[i][uCol].toString().toLowerCase().trim() === p.user.toString().toLowerCase().trim()) {
          s.getRange(i + 1, 1, 1, newR.length).setValues([newR]);
          return jsonResponse({ status: 'updated' });
        }
      }
    }
    s.appendRow(newR);
    return jsonResponse({ status: 'inserted' });
  }

  // --- REGISTROS DE AVANCE ---
  if (p.action === 'insert' || p.action === 'update') {
    let s = ss.getSheetByName(SHEETS.REGISTROS) || ss.insertSheet(SHEETS.REGISTROS);
    const row = REGISTROS_HEADERS.map(h => (h === 'Equipos' || h === 'proyectos') ? JSON.stringify(p[h] || []) : (p[h] || ""));
    if (p.action === 'update') {
      const d = s.getDataRange().getValues();
      for (let i = 1; i < d.length; i++) if (d[i][0].toString() === p.timestamp.toString()) {
        s.getRange(i + 1, 1, 1, row.length).setValues([row]);
        return jsonResponse({ status: 'ok' });
      }
    }
    s.appendRow(row);
    return jsonResponse({ status: 'ok' });
  }

  // --- MAESTRO: insert con area_id ---
  if (p.action === 'insert_maestro') {
    let s = ss.getSheetByName(SHEETS.MAESTRO) || ss.insertSheet(SHEETS.MAESTRO);
    // Inicializar cabeceras si la hoja está vacía
    if (s.getLastRow() === 0) {
      s.appendRow(['tipo', 'valor', 'proyecto_id', 'area_id']);
    } else {
      // Asegurar que exista la columna area_id (4ª columna)
      const headers = s.getRange(1, 1, 1, s.getLastColumn()).getValues()[0];
      if (headers.length < 4 || headers[3].toString().trim() === '') {
        s.getRange(1, 4).setValue('area_id');
      }
    }
    const row = [p.tipo, p.valor, p.proyecto_id || "GLOBAL", p.area_id || ""];
    s.appendRow(row);
    return jsonResponse({ status: 'ok' });
  }

  // --- MAESTRO: delete ---
  if (p.action === 'delete_maestro') {
    let s = ss.getSheetByName(SHEETS.MAESTRO);
    if (!s) return jsonResponse({ status: 'error' });
    const d = s.getDataRange().getValues();
    const pIdReq = (p.proyecto_id || "GLOBAL").toString().trim();
    const tipo = p.tipo.toString().trim();
    const valor = p.valor.toString().trim();
    const areaId = (p.area_id || "").toString().trim();

    for (let i = 1; i < d.length; i++) {
      const rowTipo = d[i][0]?.toString().trim();
      const rowValor = d[i][1]?.toString().trim();
      const rowPidRaw = d[i][2]?.toString().trim() || "";
      const rowPid = (rowPidRaw === "" || rowPidRaw === "undefined") ? "GLOBAL" : rowPidRaw;
      const rowAreaId = d[i][3]?.toString().trim() || "";

      if (rowTipo === tipo && rowValor === valor && rowPid === pIdReq && rowAreaId === areaId) {
        s.deleteRow(i + 1);
        return jsonResponse({ status: 'deleted' });
      }
    }
    return jsonResponse({ status: 'not_found' });
  }

  if (p.action === 'delete') {
    let s = ss.getSheetByName(SHEETS.REGISTROS);
    if (!s) return jsonResponse({ status: 'error' });
    const d = s.getDataRange().getValues();
    for (let i = 1; i < d.length; i++) {
      if (d[i][0].toString() === p.timestamp.toString()) {
        s.deleteRow(i + 1);
        return jsonResponse({ status: 'deleted' });
      }
    }
  }

  if (p.action === 'delete_usuario') {
    let s = ss.getSheetByName(SHEETS.USUARIOS);
    const d = s.getDataRange().getValues();
    const uCol = d[0].findIndex(h => h.toString().toLowerCase().trim() === 'user' || h.toString().toLowerCase().trim() === 'usuario');
    for (let i = 1; i < d.length; i++) if (d[i][uCol].toString().trim().toLowerCase() === p.user.toString().trim().toLowerCase()) {
      s.deleteRow(i + 1);
      return jsonResponse({ status: 'deleted' });
    }
  }

  return jsonResponse({ status: 'error' });
}

function jsonResponse(d) {
  return ContentService.createTextOutput(JSON.stringify(d)).setMimeType(ContentService.MimeType.JSON);
}
