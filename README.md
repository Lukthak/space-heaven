# SpaceHeaven

Este es un prototipo base de un juego espacial para navegador.

## Cómo abrirlo

Para jugar en solitario, puedes abrir directamente `index.html`. Para activar el modo multijugador en la red local, inicia el servidor desde la carpeta `RadioHeaven2.0`:

```bash
python server.py
```

En esta PC abre:

```text
http://localhost:8000
```

Otra persona conectada a la misma red Wi-Fi debe abrir `http://IP-DE-ESTA-PC:8000`. La conexión sincroniza las naves, los jugadores, el chat, los NPC y los recursos del suelo en cada planeta. El inventario, las misiones, los enemigos y la economía siguen siendo locales en esta primera versión.

## Contenido

- Interfaz con fuente pixel art Press Start 2P, incluida localmente bajo licencia SIL Open Font License
- Tamaño general de las fuentes reducido a dos tercios para mantener la interfaz más compacta
- Nave controlable con teclas WASD o flechas
- Universo espacial procedural, generado de forma determinista por chunks
- Estrellas de fondo en capas con parallax y titileo sutil en algunas estrellas
- Sistema central con ocho planetas; los nombres se anuncian al aterrizar
- Órbitas planetarias de hasta 320 chunks y cámara con zoom centrado en el jugador
- Sistemas estelares adicionales y agujeros negros poco frecuentes
- Planetas renderizados en pixel art cuadrado 16×16, sin deformar su proporción; las superficies son lisas y usan verde para Tierra y el color propio de cada otro planeta
- Nave centrada en cámara, con aceleración, inercia, frenado gradual y orientación según el movimiento
- Aterrizaje automático al alcanzar un planeta con el autopiloto; Enter también permite aterrizar manualmente o despegar
- La última ubicación se guarda localmente, incluso si se cierra el juego mientras se está en la superficie de un planeta
- La superficie muestra el suelo liso, la nave modular equipada y el sprite direccional del jugador; cada orientación tiene cuatro cuadros de animación, el cuadro 2 se usa al estar quieto, y para moverse usa la celda azul para arriba, la roja para abajo y la verde para izquierda, que se voltea para mirar a la derecha
- La Tierra tiene una luna, Luna, que orbita a su alrededor y a la que se puede aterrizar como a cualquier planeta; su superficie solo tiene regolito (precio base 8 créditos), que se recoge con `E` y se vende al comerciante de la Tierra
- Cada planeta tiene objetos visibles de metal, cristal y combustible; recógelos acercándote y pulsando `E`
- Las partidas nuevas comienzan en la superficie de Tierra con solo el centro clásico y el propulsor eléctrico equipados (sin alas ni punta); Tierra mantiene hasta 5 objetos recogibles en el suelo y los demás planetas hasta 50; cada planeta repone los que falten cada minuto
- El estado de los objetos del suelo se conserva por planeta y se repone al volver, aunque haya transcurrido el intervalo mientras estabas en otro lugar
- El inventario comienza con capacidad para 20 stacks; cada stack admite hasta 32 unidades y el espacio disponible depende de las piezas equipadas
- Los objetos del mismo tipo se apilan automáticamente en el inventario y el cofre hasta 32 unidades por pila; los recursos con distinto precio de venta conservan pilas separadas
- El propulsor eléctrico añade 1 stack, el propulsor a gasolina resta 2, las alas rápidas añaden 2 por par, los paneles solares añaden 4 por par y la punta sónica resta 1
- Si no hay espacio suficiente para un objeto completo, permanece en el planeta; los recursos se dividen en varios stacks al superar 32 unidades
- Al pasar el cursor por un objeto aparece su descripción y, en las piezas de nave, los efectos sobre las estadísticas
- Modificación de la nave por piezas intercambiables con sprites pixel art
- Si destruyen el centro de la nave se activa la cápsula de escape, que vuelve a la Tierra y tiene 100 puntos de vida; si la destruyen se activa una segunda cápsula, 10 veces más rápida, que elimina todos los stacks del inventario salvo los 3 primeros espacios (las piezas equipadas se conservan)
- Si se agota el recurso del propulsor en el espacio aparece un aviso rojo y la opción ¡Ayuda!: la segunda cápsula puede activarse directamente con su penalización, pedir 3 stacks de combustible o energía por 1.000 créditos, o solicitar un remolque a Tierra por 2.000 créditos. Las opciones se muestran compactas y el inventario se cierra al aceptar una. La nave de ayuda es una entidad real formada con piezas del juego: sale de Tierra, vuela hasta el jugador, entrega los recursos y regresa a Tierra; durante el remolque acompaña a la nave. La cuenta atrás indica la llegada. La entrega espera si falta espacio en el inventario y se cancela al activar una cápsula; las solicitudes pendientes se conservan al guardar la partida
- El taller de nave equipa piezas que deben estar en el inventario; las piezas equipadas permanecen allí y se marcan con borde amarillo y sprite atenuado
- La vista de nave muestra las cantidades de energía y combustible disponibles en el inventario
- Debajo de la vista previa aparecen solo la velocidad máxima, el combustible en el inventario y los stacks ocupados/capacidad; el combustible no tiene un límite de tanque y su espacio depende de la capacidad de stacks, las alas rápidas aumentan la velocidad un 10 %, el propulsor a gasolina triplica la velocidad y consume una unidad cada 4000 unidades recorridas, y el propulsor eléctrico consume una unidad de energía cada 1000 unidades
- El propulsor eléctrico alcanza la mitad de la velocidad base; el propulsor a gasolina conserva su velocidad triple
- En la superficie de Tierra hay un comerciante circular: acércate y pulsa `E` para abrir la tienda; solo vende combustible y energía (su stock vuelve a 99 unidades cada cinco minutos), y puedes vender cualquier objeto desde las pestañas del comercio
- Tierra también tiene un cofre con un camino de mármol; acércate y pulsa `E` para abrirlo, luego arrastra objetos entre tu inventario y el cofre para guardarlos o retirarlos
- Arrastrar un objeto fuera de las interfaces pregunta si quieres eliminarlo; el contenido del cofre se conserva en el guardado local
- El comerciante vende combustible a 30 créditos y energía a 10 por unidad, y paga las materias primas a la mitad de su valor; los precios base de venta son 15 por metal, 28 por cristal, 20 por combustible y 5 por energía; los recursos recogidos en planetas más alejados aumentan un 20 % por cada 100 unidades orbitales más allá de Tierra, y cada pila conserva su precio incluso al guardar, cargar o vender parcialmente
- Los paneles solares ya no dan energía infinita: generan 1 stack (32) de energía cada 2 minutos mientras estén equipados, hasta un máximo de 3 stacks de energía en el inventario (con 3 stacks dejan de generar)
- Las piezas de nave tienen sus propios precios; las piezas equipadas no se pueden vender
- En la Tierra hay una mesa de trabajo (`E` para abrirla): fabrica piezas de nave y el detector de enemigos con los recursos del inventario, gastando primero las unidades más baratas. Incluye las piezas ya existentes y piezas nuevas (centro reforzado, propulsor de amoniaco, alas de titanio y de grafeno, puntas de cobalto y de plasma) que solo se consiguen fabricándolas
- Las piezas equipadas, el inventario, el precio de cada pila de recursos, los créditos y las cantidades de combustible y energía se conservan en el guardado local

## Pantalla y controles

- El canvas se adapta al tamaño y la resolución de la pantalla, incluido el modo de pantalla completa
- La rueda del ratón acerca o aleja la cámara centrada en el jugador tanto en el espacio como en la superficie, con un zoom máximo de 2.5×
- `I`: abrir o cerrar el inventario, Mapa y Nave; los créditos se muestran debajo
- El inventario recuerda la última sección seleccionada; Objetos muestra tus recursos y piezas, que se pueden mover entre ranuras cuadradas arrastrándolos, equipar piezas de nave con doble clic y desplazarse con la rueda del ratón
- La partida conserva los slots y su orden, las piezas equipadas, la posición y el tamaño de la ventana del inventario, la última sección abierta, la pestaña del comercio, los desplazamientos internos, el zoom del mapa y el destino del autopiloto
- Arrastra la barra superior para mover la ventana del inventario y usa su esquina inferior derecha para cambiar el tamaño; ambas posiciones se guardan al cerrar el juego
- En Mapa, usa la rueda del ratón para acercar o alejar los puntos de planetas y soles cercanos
- Al pasar el cursor sobre un punto del mapa aparece el nombre del objeto; al hacer clic en un planeta, la nave lo sigue hasta alcanzarlo, y al hacer clic en otro punto, viaja a esa posición
- El mapa muestra una cuadrícula verde por chunks; al mover el cursor indica las coordenadas de la zona y permite alejar la vista hasta cuatro veces más que antes
- El autopilot sigue activo y la nave continúa su viaje mientras el inventario está abierto
- `Escape`: cerrar el inventario; si no hay nada abierto, abre el menú de pausa (pantalla negra que detiene el juego) con tres opciones: tamaño del HUD (75 %, 100 %, 125 % o 150 %, se recuerda aunque reinicies), reiniciar la partida desde cero (pide confirmación y borra el guardado) y salir (guarda la partida y cierra la pestaña si el navegador lo permite). Se navega con el ratón o con las flechas; la opción seleccionada se resalta en amarillo y `Esc` vuelve al juego
- Clic en el mundo: navegar la nave; mantener pulsado dirige continuamente hacia el cursor
- WASD o flechas: acelerar y dirigir la nave
- En la superficie, WASD o flechas también orientan al jugador; al moverse con el ratón, el sprite mira hacia el destino
- En el espacio, al soltar el movimiento la nave desacelera hasta una deriva muy suave y sigue avanzando para siempre hacia donde iba, sin gastar combustible ni energía; mantén `Espacio` para frenarla del todo
- Enter: aterrizar cerca de un planeta; cerca de la nave, despegar
- `E`: recoger el objeto cercano; junto al comerciante abre la tienda y junto al cofre de Tierra abre el almacenamiento
- En la tienda solo se muestran los créditos y el combustible en el resumen; haz doble clic sobre un objeto para elegir rápidamente la cantidad que quieres comprar o vender
- En Nave, equipa el centro, el propulsor, el par de alas y la punta; sin propulsor no se puede acelerar

El menú del jugador muestra las opciones de Objetos, Mapa y Nave, junto al contador de créditos.

## Siguiente paso

Se puede expandir con:

- login y guardado de progreso
- sistema de comercio entre jugadores
- más planetas y misiones
- backend con Python + Flask/FastAPI
- comercio y progreso compartidos entre jugadores

## Publicar el multijugador gratis en Render

1. Sube el contenido de esta carpeta a un repositorio de GitHub.
2. En Render, elige **New + → Blueprint** y conecta ese repositorio.
3. Render encontrará `render.yaml`; confirma la creación del servicio gratuito `spaceheaven`.
4. Al terminar, abre la URL `https://spaceheaven.onrender.com` que Render asigne (el nombre puede cambiar si ya está ocupado).

El servidor y el juego se publican juntos para que la API multijugador use el mismo dominio. En el plan gratuito el servidor puede tardar en despertar tras un periodo sin visitas y el estado temporal del multijugador se reinicia al dormir o reiniciarse el servicio.
