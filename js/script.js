const encryptionKey = 'your-secret-key';
let sessions = [];

// Cargar datos del localStorage
function loadStoredData() {
    const encryptedData = localStorage.getItem('mqttData');
    if (encryptedData) {
        const bytes = CryptoJS.AES.decrypt(encryptedData, encryptionKey);
        const decryptedData = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
        document.getElementById('brokerUrl').value = decryptedData.brokerUrl;
        document.getElementById('username').value = decryptedData.username;
        document.getElementById('password').value = decryptedData.password;
        document.getElementById('subscribeTopic').value = decryptedData.subscribeTopic;
    }
}

loadStoredData();

let client;

// Conectar al servidor MQTT
function connectMQTT() {
    const brokerUrl = document.getElementById('brokerUrl').value;
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const subscribeTopic = document.getElementById('subscribeTopic').value;

    // Guardar datos en localStorage
    const data = { brokerUrl, username, password, subscribeTopic };
    const encryptedData = CryptoJS.AES.encrypt(JSON.stringify(data), encryptionKey).toString();
    localStorage.setItem('mqttData', encryptedData);

    client = mqtt.connect(brokerUrl, {
        username,
        password
    });

    client.on('connect', () => {
        console.log('Conectado al servidor MQTT');
        client.subscribe(subscribeTopic);
    });

    client.on('message', (topic, message) => {
        const parsedMessage = JSON.parse(message.toString());
        handleIncomingMessage(parsedMessage);
    });
}

// Manejar mensaje entrante
function handleIncomingMessage(message) {
    const { sessionId, buttonId, firstAccessDatetime } = message;
    const sessionIndex = sessions.findIndex(session => session.sessionId === sessionId);

    if (sessionIndex !== -1) {
        // Sesión encontrada
        if (sessions[sessionIndex].status) {
            emulateKey(buttonId);
        }
    } else {
        // Nueva sesión
        sessions.push({
            sessionId,
            firstAccessDatetime,
            status: true
        });
        updateSessionTable();
    }
}

// Emular una tecla
function emulateKey(buttonId) {
    const event = new KeyboardEvent('keydown', {
        key: buttonId,
        code: `Key${buttonId.toUpperCase()}`,
        keyCode: buttonId.charCodeAt(0),
        which: buttonId.charCodeAt(0),
        shiftKey: false,
        ctrlKey: false,
        metaKey: false
    });
    document.dispatchEvent(event);
}

// Actualizar tabla de sesiones
function updateSessionTable() {
    const sessionTableBody = document.getElementById('sessionTableBody');
    sessionTableBody.innerHTML = '';

    sessions.forEach(session => {
        const row = document.createElement('tr');
        
        const sessionIdCell = document.createElement('td');
        sessionIdCell.textContent = session.sessionId;
        row.appendChild(sessionIdCell);
        
        const firstAccessDatetimeCell = document.createElement('td');
        firstAccessDatetimeCell.textContent = session.firstAccessDatetime;
        row.appendChild(firstAccessDatetimeCell);
        
        const statusCell = document.createElement('td');
        const statusCheckbox = document.createElement('input');
        statusCheckbox.type = 'checkbox';
        statusCheckbox.checked = session.status;
        statusCheckbox.addEventListener('change', () => {
            session.status = statusCheckbox.checked;
        });
        statusCell.appendChild(statusCheckbox);
        row.appendChild(statusCell);
        
        sessionTableBody.appendChild(row);
    });
}

// Mostrar mensaje en la página web
function displayMessage(topic, message) {
    const messageList = document.getElementById('messageList');
    const listItem = document.createElement('li');
    listItem.textContent = `Topic: ${topic}, Message: ${message}`;
    messageList.appendChild(listItem);
}

// Enviar mensaje al servidor MQTT
function sendMessage() {
    const publishTopic = document.getElementById('publishTopic').value;
    const message = document.getElementById('message').value;
    client.publish(publishTopic, message);
}

// Limpiar localStorage
function clearLocalStorage() {
    localStorage.removeItem('mqttData');
    alert('Local storage cleared');
    location.reload();
}
