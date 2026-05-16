async function procesarCodigo(codigo) {
    // Confirmación visual rápida en el celular
    alert("Procesando código: " + codigo);

    try {
        // 1. El mesero va a la cocina (Hacemos el fetch al servidor de Alfonso)
        // NOTA: Ajusta el puerto (5000) si Alfonso usa uno distinto en Node.js
        const respuesta = await fetch(`http://localhost:5000/api/productos/${codigo}`);

        // 2. Revisamos si la cocina nos dijo "No existe" (Error 404)
        if (!respuesta.ok) {
            alert("❌ Producto no encontrado en la base de datos.");
            return; // Detenemos la función aquí
        }

        // 3. El mesero trae los datos reales en formato JSON
        const producto = await respuesta.json();

        // 4. Servimos en la mesa (Actualizamos el HTML de tu carrito)
        const lista = document.getElementById('lista-codigos');
        
        // Limpiamos el mensaje de "Esperando..." si es el primer producto
        if (lista.innerText.includes("Esperando")) {
            lista.innerHTML = "";
        }

        // Creamos la nueva fila inyectando los datos reales: producto.nombre y producto.precio
        const nuevaFila = `
            <tr>
                <td>${producto.nombre}</td>
                <td>1</td>
                <td>$${producto.precio.toFixed(2)}</td>
                <td>$${producto.precio.toFixed(2)}</td>
            </tr>
        `;
        
        // Añadimos el producto arriba de la lista
        lista.innerHTML = nuevaFila + lista.innerHTML;

        // 5. Calculamos el nuevo total (Aquí sumaremos el precio real)
        // Por ahora, solo lo mostramos en consola para validar
        console.log(`✅ Se agregó ${producto.nombre} por $${producto.precio}`);

    } catch (error) {
        // Si el servidor de Alfonso está apagado o hay un problema de red
        console.error("Error en la comunicación:", error);
        alert("⚠️ Error de conexión. ¿El backend de Alfonso está encendido?");
    }
}