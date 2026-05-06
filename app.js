const pinInput = document.getElementById('pin-input');
const btnBorrar = document.getElementById('btn-borrar');
const btnCancelar = document.getElementById('btn-cancelar');
const btnEntrar = document.getElementById('btn-entrar');
const numKeys = document.querySelectorAll('.btn-num');

// Llenar el input al presionar números
numKeys.forEach(key => {
    key.addEventListener('click', () => {
        // Límite de 6 dígitos
        if (pinInput.value.length < 6) {
            pinInput.value += key.innerText;
        }
    });
});

// Botón BORRAR (Borra de uno en uno)
btnBorrar.addEventListener('click', () => {
    pinInput.value = pinInput.value.slice(0, -1);
});

// Botón X (Limpia todo)
btnCancelar.addEventListener('click', () => {
    pinInput.value = '';
});

// Botón ENTRAR
btnEntrar.addEventListener('click', () => {
    const pin = pinInput.value;
    if (pin === '') {
        alert("Por favor, ingrese su PIN.");
        return;
    }
    
    console.log("Validando PIN:", pin);
    
    // Simulación de acceso
    if (pin === '1234') { 
        alert("¡Acceso concedido Admin!");
        // Aquí conectaremos con la pantalla de ventas
    } else {
        alert("PIN incorrecto.");
        pinInput.value = ''; // Limpiar tras error
    }
});