
var warecraft          = {};
warecraft.indexedDB    = {};
warecraft.indexedDB.db = null;

var DBNAME    = 'dictionary';
var DBINDEX   = ['by_word', 'word'];
var CONTAINER = 'definitions';

// onReady:

function init() { 
  hideMessages();
  warecraft.indexedDB.open(); 
}
window.addEventListener("DOMContentLoaded", init, false);

// events:

document.getElementById('randomize').onchange = function(e) { warecraft.indexedDB.getAll(); };
document.getElementById('showdefs').onchange  = function(e) { warecraft.indexedDB.getAll(); };
document.getElementById('filter').onkeyup     = function(e) { warecraft.indexedDB.getAll(); };

// db:

warecraft.indexedDB.open = function() {
  var version = 1;
  var request = indexedDB.open(DBNAME, version);
  request.onupgradeneeded = function(e) {
    var db = e.target.result;
    e.target.transaction.onerror = warecraft.indexedDB.onerror;
    if (db.objectStoreNames.contains(DBNAME)) {
      db.deleteObjectStore(DBNAME);
    }
    var store  = db.createObjectStore(DBNAME, {keyPath: "timeStamp"});
    store.createIndex(DBINDEX[0], DBINDEX[1], {unique:true});
  };
  request.onsuccess = function(e) {
    warecraft.indexedDB.db = e.target.result;
    warecraft.indexedDB.getAll();
  };
  request.onerror = warecraft.indexedDB.onerror;
};

warecraft.indexedDB.add = function(word, definition) {
  var db      = warecraft.indexedDB.db;
  var trans   = db.transaction([DBNAME], "readwrite");
  var store   = trans.objectStore(DBNAME);
  var request = store.put({
    "word"       : word,
    "definition" : definition,
    "timeStamp"  : new Date().getTime()
  });
  request.onsuccess = function(e) {
    warecraft.indexedDB.getAll();
  };
  request.onerror = function(e) {
    console.log(e.value);
  };
};

warecraft.indexedDB.getAll = function(onSuccessCallback) {
  document.getElementById(CONTAINER).innerHTML = "";
  var randomize = document.getElementById('randomize');
  var filter    = document.getElementById('filter').value;
  var useFilter = filter=="" ? false : true;
  var regex     = new RegExp("^"+filter);
  var db        = warecraft.indexedDB.db;
  var trans     = db.transaction([DBNAME], "readwrite");
  var store     = trans.objectStore(DBNAME);
  var index     = store.index(DBINDEX[0]);
  var request   = index.openCursor(IDBKeyRange.lowerBound(0));
  var data      = {};
  var keys      = [];

  request.onerror = warecraft.indexedDB.onerror;
  if (onSuccessCallback) {
    request.onsuccess = onSuccessCallback;
  } else {
    request.onsuccess = function(e) {
      var result = e.target.result;
      if (!!result == false) {
        if (randomize.checked) { keys = shuffleArray(keys); }
        for (var i=0; i<keys.length; i++) { render(data[keys[i]]); }
        return;
      }
      var word = result.value.word;
      if (!useFilter || word.match(regex)) {
        data[word] = result.value;
        keys.push(word);
      }
      result.continue();
    };
  }
};

warecraft.indexedDB.delete = function(id) {
  var db      = warecraft.indexedDB.db;
  var trans   = db.transaction([DBNAME], "readwrite");
  var store   = trans.objectStore(DBNAME);
  var request = store.delete(id);
  request.onsuccess = function(e) {
    warecraft.indexedDB.getAll();
  };
  request.onerror = function(e) {
    console.log(e);
  };
};

// helpers:

function render(row) {
  var container = document.getElementById(CONTAINER);
  var tr        = document.createElement("tr");
  var td1       = document.createElement("td");
  var td2       = document.createElement("td");
  var td3       = document.createElement("td");
  var delButton = document.createElement("input");
  var span      = document.createElement("span");
  var showDefs  = document.getElementById('showdefs');
  var t1        = document.createTextNode();
  var t2        = document.createTextNode();
  var delEntry  = function()  {warecraft.indexedDB.delete(row.timeStamp); };
  var toggleDef = function(e) {
    span.style.display = span.style.display=='none' ? 'block' : 'none';
    showDefs.checked = false;
  };

  delButton.setAttribute('type', 'button');
  delButton.setAttribute('value', 'delete');
  delButton.className = "delete_button";
  delButton.onclick   = delEntry;

  t1.data = row.word;
  t2.data = row.definition;

  if (!showDefs.checked) { span.style.display = 'none'; }
  span.appendChild(t2);

  td1.addEventListener("click", toggleDef);
  td2.addEventListener("click", toggleDef);

  td1.className = "word";
  td2.className = "definition";
  td3.className = "button";

  td1.appendChild(t1);
  td2.appendChild(span);
  td3.appendChild(delButton);

  tr.appendChild(td1);
  tr.appendChild(td2);
  tr.appendChild(td3);

  container.appendChild(tr);
}

function addWord() {
  var word       = document.getElementById('word');
  var definition = document.getElementById('definition');
  warecraft.indexedDB.add(word.value, definition.value);
  word.value       = '';
  definition.value = '';
}

function shuffleArray(array) {
  for (var i = array.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var temp = array[i];
    array[i] = array[j];
    array[j] = temp;
  }
  return array;
}

function exportToCSV() {
  hideMessages();
  var data = {};
  var keys = [];
  var csv  = "";
  var definitions  = document.getElementById('definitions');
  var csvElement   = document.getElementById('csv');
  var exportButton = document.getElementById('exportButton');
  var importButton = document.getElementById('importButton');
  warecraft.indexedDB.getAll(function(e) {
    var result = e.target.result;
    var done   = (!!result == false);
    if (done) {
      for (var i=0; i<keys.length; i++) {
        csv += keys[i] +","+ data[keys[i]].definition +"<br />"; 
      }
      // disable the import button:
      importButton.disabled     = true;
      // hide definitions & show the csv:
      csvElement.innerHTML      = csv;
      csvElement.style.display  = 'block';
      definitions.style.display = 'none';
      // change the exportButton to toggle back:
      exportButton.value = "back";
      exportButton.onclick = function() {
        hideMessages();
        csvElement.innerHTML = "";
        csvElement.style.display  = 'none';
        definitions.style.display = 'block';
        exportButton.onclick      = exportToCSV;  //<- toggle back yet again
        exportButton.value        = "export";
        importButton.disabled     = false;
        warecraft.indexedDB.getAll();
      };
      return;
    }
    var word   = result.value.word;
    data[word] = result.value;
    keys.push(word);
    result.continue();
  });  
}

function importCSV() {
  var csv  = "";
  var definitions  = document.getElementById('definitions');
  var csvElement   = document.getElementById('csv');
  var exportButton = document.getElementById('exportButton');
  var importButton = document.getElementById('importButton');
  
  // disable the export button:
  exportButton.disabled     = true;
  // hide definitions & show the csv:
  csvElement.innerHTML      = '<textarea id="importedCSV" />';
  csvElement.style.display  = 'block';
  definitions.style.display = 'none';
  // change the importButton to toggle back:
  importButton.value = "back";
  importButton.onclick = function() {
    hideMessages();
    csv                       = document.getElementById('importedCSV').value;
    csvElement.innerHTML      = "";
    csvElement.style.display  = 'none';
    definitions.style.display = 'block';
    importButton.onclick      = importCSV;  //<- toggle back yet again
    importButton.value        = "import";
    exportButton.disabled     = false;
    addImportedCSVToDB(csv);
    warecraft.indexedDB.getAll();
  };
}

function addImportedCSVToDB(csv) {
  var newData = {};
  var newKeys = [];
  var isValid = true;
  var lines   = csv.split('\n');
  for (var i=0; i<lines.length; i++) {
    var parts = lines[i].split(',');
    if (parts.length != 2) {
      isValid = false;
      break;
    }
    var word      = parts[0].trim();
    var def       = parts[1].trim();
    if (word.length==0 || def.length==0) {
      isValid = false;
      break;
    }
    newData[word] = def;
    newKeys.push(word);
  }
  var messages = document.getElementById('messages');
  hideMessages();
  if (isValid) {
    var numAdded = newKeys.length;
    for (var i=0; i<numAdded; i++) {
      warecraft.indexedDB.add(newKeys[i], newData[newKeys[i]]);
    }
    var msg = 'Info: Imported '+ numAdded +' entries.';
    showMessage(msg, 'info');
  } else {
    var msg = 'Error: Could not parse the CSV. ';
    msg    += 'Each line must have exactly one comma with text on both sides. ';
    msg    += 'Please review your CSV and try again.';
    showMessage(msg, 'error');
  }
}

function hideMessages() {
  var messages           = document.getElementById('messages');
  messages.innerHTML     = '<span class="small right">(click to remove)</span>';
  messages.style.display = 'none';
}  

function showMessage(msg, type) {
  type = type ? type : 'info';
  var messages           = document.getElementById('messages');
  messages.innerHTML     = '<span class="small right">(click to remove)</span>';
  messages.innerHTML    += '<span class="'+ type +'">'+ msg +'</span>';
  messages.style.display = 'block';
}


