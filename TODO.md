# TODO

## Pendientes

### Backend
- #1 [ ] Deployar matches-service en Railway para que tome el campo `complexName` (railway.toml ya tiene `prisma db push` en startCommand)
- #2 [ ] Endpoint `GET /api/v1/matches/mine` requiere deploy del matches-service actualizado
- #3 [ ] Verificar que OAuth de Google funciona en produccion con las URIs correctas en Google Cloud Console

### Frontend
- #4 [x] Pagina de perfil: mejorar diseño general (dark theme, campos pais/ciudad/telefono/nacimiento, combobox de pais, date picker por selects)
- #5 [x] Pagina de perfil: mostrar avatar del usuario
- #6 [x] Pagina de perfil: mostrar username ademas del nombre
- #7 [x] Mis partidos: link a la pagina de detalle del partido desde cada tarjeta
- #8 [x] Mis partidos: separar seccion en "Proximos" y "Jugados"
- #9 [x] Match detail: mostrar resultado grabado visualmente cuando el partido esta COMPLETED
- #10 [x] Match detail: el formulario de resultado solo aparece para IN_PROGRESS y FULL — evaluar si tambien mostrarlo para OPEN (partidos sin suficientes jugadores que igual se jugaron)
- #11 [x] Look & Feel de cards internas se siente sin vida (teams, teams/[id], crear partido rediseñados a dark slate)
- #45 [x] Modo parejas (Team vs Team): creacion con compañero preseleccionado, desafio de equipo B, aprobacion/rechazo de pareja, filtro de modo en lista de partidos

### UX / Diseño
- #12 [x] Notificaciones: avisar al usuario cuando lo aprueban/rechazan en un partido
- #13 [x] Notificaciones: avisar al admin cuando alguien solicita unirse
- #14 [ ] Pagina de ranking de jugadores por deporte
- #15 [ ] Busqueda de usuarios por username para invitar a partidos (hoy hay que poner el ID)

### Monetizacion
- #16 [ ] Publicidad: agregar sponsored cards nativas (mismo estilo dark slate-800) inyectadas cada N elementos en listas de partidos y torneos

### Plan Pro (suscripcion paga)
Limites del plan gratuito que se desbloquean con Pro:

**Equipos**
- #17 [ ] Free: 1 equipo por deporte. Pro: equipos ilimitados por deporte
- #18 [ ] Free: hasta 6 miembros por equipo. Pro: equipos ilimitados en miembros
- #19 [ ] Pro: estadisticas avanzadas del equipo (racha, historial vs oponentes, heatmap de rendimiento por mes)

**Partidos**
- #20 [ ] Free: 1 partido creado por dia. Pro: partidos ilimitados
- #21 [ ] Free: partidos publicos solamente. Pro: partidos privados con codigo de invitacion
- #22 [ ] Pro: partido recurrente (crear una serie semanal con un solo click)

**Torneos**
- #23 [ ] Free: 1 torneo activo a la vez, maximo 8 participantes. Pro: torneos ilimitados, hasta 64 participantes
- #24 [ ] Pro: bracket personalizable y fase de grupos antes de eliminacion directa

**Perfil**
- #25 [ ] Pro: insignia verificada visible en el perfil y en los partidos
- #26 [ ] Pro: estadisticas extendidas (historial completo, evolucion de ranking con grafico)
- #27 [ ] Pro: perfil publico con URL personalizada (ej. pivoo.app/u/german)

**Complejos (plan separado para role COMPLEX)**
- #28 [ ] Free: 1 complejo, hasta 3 canchas. Pro: complejos ilimitados, canchas ilimitadas
- #29 [ ] Pro: panel de analiticas (partidos jugados, canchas mas reservadas, pico de actividad)
- #30 [ ] Pro: publicar stories efimeras (24h) en el feed social

### Ideas
- #31 [ ] Campeonato tipo americano de tenis/padel
- #32 [ ] Partidos privados con codigo de invitacion
- #33 [ ] Chat dentro del partido
- #34 [ ] Integracion con Google Calendar al unirse a un partido
- #35 [ ] Estadisticas avanzadas de jugador (racha, historial por oponente)
- #36 [ ] Pagina publica de perfil de jugador accesible por username
- #37 [ ] Mostrar modificador de nivel/categoria

## Ideas long-term
- #38 [ ] Feed social como pagina principal: publicaciones de jugadores y complejos que el usuario sigue (texto + imagenes), mezcladas con 2-3 partidos recomendados segun deporte, nivel y ubicacion
- #39 [x] Sistema de seguimiento: seguir jugadores y complejos, con contadores de seguidores/seguidos en el perfil
- #40 [ ] Publicacion automatica al registrar resultado de un partido ("X gano contra Y en Padel - Club Z")
- #41 [ ] Stories de complejos: contenido efimero (24h) para que los complejos publiquen disponibilidad, ofertas, fotos de pistas
- #42 [ ] Sugerencias de conexion post-partido: "jugaste con estos jugadores, seguirlos?"
- #43 [ ] Trending local: seccion en el feed con los torneos y partidos mas populares de tu zona esta semana
- #44 [ ] Reacciones a publicaciones: emojis de reaccion rapida (fuego, raqueta, etc.) sin necesidad de comentar
