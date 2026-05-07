const barcodeInput = document.getElementById('barcode-input');
const tbody = document.getElementById('cart-tbody');
const totalText = document.getElementById('total-text');
const subtotalText = document.getElementById('subtotal-text');

let totalCarrito = 0;

// 1. Auto-focus (PBI-008)
function keepFocus() {
    barcodeInput.focus();
}
document.addEventListener('click', keepFocus);
keepFocus();

// 2. Función para procesar el código escaneado o escrito (PBI-013)
function procesarCodigo(codigo) {
    console.log("Procesando:", codigo);
    
    // Alerta visual para comprobar en el celular
    alert("¡Producto detectado!\nCódigo: " + codigo); 

    // Precio temporal mientras se conecta con la base de datos de Alfonso (PBI-006)
    const precio = 25.50; 
    totalCarrito += precio;

    // Crear la fila para la tabla del ticket
    const tr = document.createElement('tr');
    tr.innerHTML = `
        <td>1</td>
        <td>Producto (Cód: ${codigo.slice(-6)})</td>
        <td>$${precio.toFixed(2)}</td>
        <td>$${precio.toFixed(2)}</td>
    `;
    tbody.appendChild(tr);

    // Actualizar textos de totales en la interfaz
    totalText.innerText = `$${totalCarrito.toFixed(2)}`;
    subtotalText.innerText = `$${totalCarrito.toFixed(2)}`;
    
    // Limpiar el cuadro de texto para el siguiente producto
    barcodeInput.value = '';
}

// 3. Capturar Enter del input manual/pistola USB
barcodeInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        if (barcodeInput.value.trim() !== '') {
            procesarCodigo(barcodeInput.value);
        }
    }
});

// 4. Iniciar Cámara (PBI-005)
const html5QrCode = new Html5Qrcode("reader");

const qrCodeSuccessCallback = (decodedText, decodedResult) => {
    // Cuando la cámara lee un código, se lo mandamos a la función principal
    procesarCodigo(decodedText);
    
    // Pausamos la cámara medio segundo (500ms) para no escanear duplicados
    html5QrCode.pause();
    setTimeout(() => html5QrCode.resume(), 500);
};

// Arrancar cámara trasera (ideal para el celular)
html5QrCode.start(
    { facingMode: "environment" },
    { fps: 10, qrbox: { width: 250, height: 100 } },
    qrCodeSuccessCallback
).catch(err => {
    console.log("No se pudo iniciar la cámara. Se usará modo manual.", err);
    document.getElementById('reader').innerHTML = "<p style='color:white; text-align:center;'>Cámara no detectada.<br>Use modo manual.</p>";
});