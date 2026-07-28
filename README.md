# 🧱 Tetris JS (Vanilla JavaScript)

Un clon clásico del juego Tetris construido enteramente con **Vanilla JavaScript** y **HTML5 Canvas**. Este proyecto destaca por su arquitectura modular, orientada a objetos y su código limpio.

## ✨ Características

*   **Lógica Clásica:** Implementación fiel de los 7 tetrominós clásicos, sistema de puntuación, gravedad y limpieza de líneas completas.
*   **Rotación Matemática:** Sistema de rotación de piezas a 90° basado en transposición y reversión de matrices bidimensionales.
*   **Gestor de Menús:** Interfaz de usuario dinámica con pantallas separadas para Inicio, Pausa y Game Over (superpuestas al Canvas).
*   **Control de Audio Sincronizado:** Música de fondo con soporte para mutear desde múltiples menús (Inicio y Pausa) manteniendo los botones sincronizados.
*   **Arquitectura Modular:** Separación estricta de responsabilidades (Lógica de tablero, Renderizado, Inputs y Audio).

## 🎮 Controles

| Tecla | Acción |
| :--- | :--- |
| `Flecha Izquierda` | Mover pieza a la izquierda |
| `Flecha Derecha` | Mover pieza a la derecha |
| `Flecha Abajo` | Acelerar la caída de la pieza |
| `Flecha Arriba` | Rotar pieza 90° (sentido horario) |
| `Esc` | Pausar / Reanudar juego |
| `Enter` | Reiniciar juego (Solo en pantalla Game Over) |

## 🚀 Cómo ejecutar el proyecto

Al estar construido sin frameworks ni dependencias externas, ejecutar el juego es muy sencillo:

1.  **Clona este repositorio:**
    ```bash
    git clone [https://github.com/AGUST1N18/Tetris.git](https://github.com/AGUST1N18/Tetris.git)
    ```
2.  **Estructura de archivos requerida:** Asegúrate de que las imágenes de los bloques y el audio existan en tu directorio de trabajo (según las rutas del código original).
    *   Imágenes: `<img id="red-block" src="...">` (etc.)
    *   Audio: `assets/music/audio.mp3`
3.  **Inicia el juego:** Simplemente abre el archivo `index.html` en tu navegador web. Si usas VS Code, la extensión **Live Server** es altamente recomendada.

## 🏗️ Arquitectura del Código

El juego está estructurado en clases de un solo propósito para facilitar el mantenimiento:

*   `Game`: El controlador principal. Maneja el bucle a 60FPS (`requestAnimationFrame`), gestiona el estado (pausa, game over) y une los inputs del jugador.
*   `Board`: El cerebro lógico. Almacena la matriz del tablero, detecta colisiones (`isValidPosition`) y limpia líneas completas.
*   `Piece`: Representa el tetrominó activo. Conoce sus coordenadas y genera nuevas matrices cuando el jugador solicita una rotación.
*   `Renderer`: Se encarga exclusivamente de la capa visual (dibujar en el `<canvas>`), aislando la lógica gráfica del resto del sistema.
*   `AudioController`: Gestiona la reproducción de música y sincroniza el estado de los botones (Play/Pause) a través del DOM.
*   `MenuManager`: Controla la visibilidad de los elementos UI en HTML que se superponen al Canvas.

## 🛠️ Tecnologías utilizadas

*   **HTML5** (Canvas y manipulación del DOM)
*   **CSS3** (Estilizado de los menús superpuestos)
*   **JavaScript ES6+** (Clases, Arrow Functions, Métodos de Array)