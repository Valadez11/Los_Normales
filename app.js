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
btnEntrar.addEventListener('click', async () => {
    const pin = pinInput.value;
    
    // En lugar de comparar pin === '1234', hacemos la petición al backend
    try {
        const response = await fetch('http://localhost:3000/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pin: pin })
        });

        const data = await response.json();

        if (response.ok) {
            alert(`¡Bienvenido ${data.usuario}!`);
            // Aquí Diego lo redirigiría a la pantalla de ventas
        } else {
            alert(data.error || "PIN incorrecto");
            pinInput.value = '';
        }
    } catch (error) {
        alert("Error de conexión con el servidor");
    }
});